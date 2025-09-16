<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use App\Models\WithdrawalRequest;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class TransactionController extends Controller
{
    /**
     * Créer une demande de retrait
     */
    public function createWithdrawal(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'amount' => 'required|numeric|min:2',
            'withdrawal_address' => 'nullable|string|max:255',
            'note' => 'nullable|string|max:500',
        ], [
            'amount.required' => 'Le montant est requis.',
            'amount.min' => 'Le montant minimum de retrait est de 2 Pi.',
            'withdrawal_address.max' => 'L\'adresse de retrait ne peut pas dépasser 255 caractères.',
            'note.max' => 'La note ne peut pas dépasser 500 caractères.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Erreurs de validation',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = $request->user();
        $amount = $request->amount;

        // Vérifications de sécurité: disponibilité = balance - pending_withdrawal
        $available = (float) $user->balance_pi - (float) $user->pending_withdrawal;
        if ($available < $amount) {
            return response()->json([
                'success' => false,
                'message' => 'Solde disponible insuffisant (fonds réservés pour d\'autres retraits).'
            ], 422);
        }

        // Vérifier le KYC si requis
        if (config('staking.kyc.required_for_withdrawal') && $user->kyc_status !== 'approved') {
            return response()->json([
                'success' => false,
                'message' => 'Votre KYC doit être approuvé avant de pouvoir effectuer un retrait.'
            ], 422);
        }

        // Vérifier la limite quotidienne selon le niveau utilisateur
        $level = $user->current_level ?: 'bronze';
        $caps = config('staking.withdrawals.daily_caps', []);
        $dailyLimit = (float) ($caps[$level] ?? ($caps['bronze'] ?? 20));
        
        $todayApproved = $user->withdrawalRequests()
            ->where('status', 'approved')
            ->whereDate('processed_at', today())
            ->sum('amount');

        if ($todayApproved + $amount > $dailyLimit) {
            return response()->json([
                'success' => false,
                'message' => 'Limite quotidienne de retrait dépassée. Limite : ' . $dailyLimit . ' Pi.'
            ], 422);
        }

        try {
            DB::transaction(function () use ($user, $amount, $request, &$withdrawalRequest) {
                // Réserver les fonds
                $beforePending = (float) $user->pending_withdrawal;
                $user->increment('pending_withdrawal', $amount);
                
                // Créer la demande de retrait
                $withdrawalRequest = WithdrawalRequest::create([
                    'user_id' => $user->id,
                    'amount' => $amount,
                    'status' => 'pending',
                    'withdrawal_address' => $request->withdrawal_address,
                    'note' => $request->note,
                    'requested_at' => now(),
                ]);

                // Créer la transaction de réservation (montant 0, statut pending)
                Transaction::create([
                    'user_id' => $user->id,
                    'type' => 'withdrawal',
                    'category' => 'withdrawal',
                    'amount' => 0,
                    'balance_before' => $user->balance_pi,
                    'balance_after' => $user->balance_pi,
                    'status' => 'pending',
                    'withdrawal_request_id' => $withdrawalRequest->id,
                    'description' => 'Demande de retrait (réservation) - ' . $amount . ' Pi',
                    'metadata' => [
                        'reserved_amount' => $amount,
                        'pending_before' => $beforePending,
                        'pending_after' => $beforePending + $amount,
                    ],
                ]);
            });

            return response()->json([
                'success' => true,
                'message' => 'Demande de retrait créée avec succès. Elle sera traitée sous 24-48h.',
                'data' => [
                    'withdrawal_request' => $withdrawalRequest,
                    'user' => $user->fresh(),
                ]
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création de la demande : ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtenir l'historique des transactions
     */
    public function getTransactionHistory(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'type' => 'nullable|in:deposit,withdrawal,investment,claim,bonus,referral',
            'status' => 'nullable|in:pending,completed,rejected,cancelled',
            'per_page' => 'nullable|integer|min:5|max:100',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Paramètres invalides',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = $request->user();
        $perPage = $request->get('per_page', 20);
        
        $query = $user->transactions()->with([
            'investment.stakingPackage',
            'withdrawalRequest'
        ]);

        // Appliquer les filtres
        if ($request->has('type')) {
            $query->where('type', $request->type);
        }
        
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }
        
        if ($request->has('start_date')) {
            $query->whereDate('created_at', '>=', $request->start_date);
        }
        
        if ($request->has('end_date')) {
            $query->whereDate('created_at', '<=', $request->end_date);
        }

        $transactions = $query->latest()->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => [
                'transactions' => $transactions->items(),
                'summary' => $this->getTransactionSummary($user),
            ]
        ]);
    }

    /**
     * Obtenir les demandes de retrait de l'utilisateur
     */
    public function getWithdrawalRequests(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'status' => 'nullable|in:pending,approved,rejected,cancelled',
            'per_page' => 'nullable|integer|min:5|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Paramètres invalides',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = $request->user();
        $perPage = $request->get('per_page', 20);
        
        $query = $user->withdrawalRequests();
        
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $withdrawals = $query->latest()->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => [
                'withdrawals' => $withdrawals,
                'limits' => [
                    'daily_limit' => (float) (($caps = config('staking.withdrawals.daily_caps', []))[$user->current_level ?: 'bronze'] ?? ($caps['bronze'] ?? 20)),
                    'monthly_limit' => config('staking.limits.monthly_withdrawal', 10000),
                    'daily_used' => $user->withdrawalRequests()
                        ->where('status', 'approved')
                        ->whereDate('processed_at', today())
                        ->sum('amount'),
                    'monthly_used' => $user->withdrawalRequests()
                        ->where('status', 'approved')
                        ->where('processed_at', '>=', now()->startOfMonth())
                        ->sum('amount'),
                ],
            ]
        ]);
    }

    /**
     * Annuler une demande de retrait en attente
     */
    public function cancelWithdrawal(Request $request, int $withdrawalId): JsonResponse
    {
        $user = $request->user();
        
        $withdrawal = $user->withdrawalRequests()->find($withdrawalId);
        
        if (!$withdrawal) {
            return response()->json([
                'success' => false,
                'message' => 'Demande de retrait introuvable.'
            ], 404);
        }
        
        if ($withdrawal->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'Cette demande ne peut plus être annulée.'
            ], 422);
        }

        try {
            DB::transaction(function () use ($withdrawal, $user) {
                // Libérer la réservation
                $user->decrement('pending_withdrawal', $withdrawal->amount);
                
                // Marquer comme annulée
                $withdrawal->update([
                    'status' => 'cancelled',
                    'cancelled_at' => now(),
                ]);

                // Mettre à jour la transaction associée
                Transaction::where('withdrawal_request_id', $withdrawal->id)
                    ->update([
                        'status' => 'cancelled',
                        'processed_at' => now(),
                    ]);
            });

            return response()->json([
                'success' => true,
                'message' => 'Demande de retrait annulée. Les fonds ont été remboursés.',
                'data' => [
                    'withdrawal' => $withdrawal->fresh(),
                    'user' => $user->fresh(),
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'annulation : ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtenir les limites et statistiques de transaction
     */
    public function getLimitsAndStats(Request $request): JsonResponse
    {
        $user = $request->user();
        
        $stats = [
            'balances' => [
                'available_balance' => (float) $user->balance_pi - (float) $user->pending_withdrawal,
                'bonus_balance' => $user->bonus_balance,
                'staked_amount' => $user->activeInvestments->sum('amount'),
                'total_claimed' => $user->total_claimed,
            ],
            'limits' => [
                'min_withdrawal' => config('staking.limits.min_withdrawal', 20),
                'daily_withdrawal_limit' => config('staking.limits.daily_withdrawal', 1000),
                'monthly_withdrawal_limit' => config('staking.limits.monthly_withdrawal', 10000),
            ],
            'usage' => [
                'daily_withdrawals_used' => $user->withdrawalRequests()
                    ->where('status', 'approved')
                    ->whereDate('processed_at', today())
                    ->sum('amount'),
                'monthly_withdrawals_used' => $user->withdrawalRequests()
                    ->where('status', 'approved')
                    ->where('processed_at', '>=', now()->startOfMonth())
                    ->sum('amount'),
                'pending_withdrawals' => (float) $user->pending_withdrawal,
            ],
            'kyc' => [
                'status' => $user->kyc_status,
                'required_for_withdrawal' => config('staking.kyc.required_for_withdrawal', false),
                'can_withdraw' => !config('staking.kyc.required_for_withdrawal') || $user->kyc_status === 'approved',
            ],
        ];

        return response()->json([
            'success' => true,
            'data' => $stats
        ]);
    }

    /**
     * Obtenir les statistiques détaillées des transactions
     */
    public function getTransactionStats(Request $request): JsonResponse
    {
        $user = $request->user();
        $period = $request->query('period', 'month');

        // Définir la période
        $startDate = match($period) {
            'week' => now()->subWeek(),
            'month' => now()->subMonth(),
            'year' => now()->subYear(),
            default => now()->subMonth()
        };

        $transactions = $user->transactions()->where('created_at', '>=', $startDate);

        $stats = [
            'period_stats' => [
                'total_volume' => $transactions->sum('amount'),
                'total_count' => $transactions->count(),
                'successful_rate' => $transactions->count() > 0 ? 
                    ($transactions->where('status', 'completed')->count() / $transactions->count()) * 100 : 0,
                'average_amount' => $transactions->count() > 0 ? 
                    $transactions->sum('amount') / $transactions->count() : 0,
            ],
            'daily_breakdown' => $this->getDailyBreakdown($user, $startDate),
            'type_distribution' => $this->getTypeDistribution($user, $startDate),
            'status_distribution' => $this->getStatusDistribution($user, $startDate),
        ];

        return response()->json([
            'success' => true,
            'data' => $stats
        ]);
    }

    /**
     * Obtenir les détails d'une transaction spécifique
     */
    public function getTransactionById(Request $request, int $transactionId): JsonResponse
    {
        $user = $request->user();
        
        $transaction = Transaction::where('user_id', $user->id)
            ->where('id', $transactionId)
            ->first();

        if (!$transaction) {
            return response()->json([
                'success' => false,
                'message' => 'Transaction non trouvée.'
            ], 404);
        }

        // Ajouter des détails supplémentaires
        $details = [
            'transaction' => $transaction,
            'related_transactions' => $this->getRelatedTransactions($transaction),
            'verification_details' => $this->getVerificationDetails($transaction),
            'processing_timeline' => $this->getProcessingTimeline($transaction),
        ];

        return response()->json([
            'success' => true,
            'data' => $details
        ]);
    }

    /**
     * Rechercher des transactions
     */
    public function searchTransactions(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = $request->query('q', '');
        
        $transactions = Transaction::where('user_id', $user->id)
            ->when($query, function ($q) use ($query) {
                $q->where(function ($subQ) use ($query) {
                    $subQ->where('description', 'like', "%{$query}%")
                        ->orWhere('reference', 'like', "%{$query}%")
                        ->orWhere('amount', 'like', "%{$query}%");
                });
            })
            ->when($request->query('type'), function ($q, $type) {
                $q->where('type', $type);
            })
            ->when($request->query('status'), function ($q, $status) {
                $q->where('status', $status);
            })
            ->when($request->query('amount_min'), function ($q, $min) {
                $q->where('amount', '>=', $min);
            })
            ->when($request->query('amount_max'), function ($q, $max) {
                $q->where('amount', '<=', $max);
            })
            ->when($request->query('date_from'), function ($q, $date) {
                $q->whereDate('created_at', '>=', $date);
            })
            ->when($request->query('date_to'), function ($q, $date) {
                $q->whereDate('created_at', '<=', $date);
            })
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json([
            'success' => true,
            'data' => [
                'transactions' => $transactions->items(),
                'total_results' => $transactions->total(),
                'search_summary' => [
                    'query' => $query,
                    'filters_applied' => array_filter([
                        'type' => $request->query('type'),
                        'status' => $request->query('status'),
                        'amount_range' => $request->query('amount_min') || $request->query('amount_max'),
                        'date_range' => $request->query('date_from') || $request->query('date_to'),
                    ])
                ]
            ]
        ]);
    }

    /**
     * Exporter les transactions
     */
    public function exportTransactions(Request $request): JsonResponse
    {
        $user = $request->user();
        $format = $request->query('format', 'csv');
        
        $transactions = Transaction::where('user_id', $user->id)
            ->when($request->query('start_date'), function ($q, $date) {
                $q->whereDate('created_at', '>=', $date);
            })
            ->when($request->query('end_date'), function ($q, $date) {
                $q->whereDate('created_at', '<=', $date);
            })
            ->when($request->query('type'), function ($q, $type) {
                $q->where('type', $type);
            })
            ->orderBy('created_at', 'desc')
            ->get();

        // Générer le fichier d'export
        $filename = "transactions_{$user->id}_" . now()->format('Y-m-d_H-i-s') . ".{$format}";
        $filePath = storage_path("app/exports/{$filename}");
        
        // S'assurer que le répertoire existe
        if (!file_exists(dirname($filePath))) {
            mkdir(dirname($filePath), 0755, true);
        }

        if ($format === 'csv') {
            $this->generateCSV($transactions, $filePath);
        } elseif ($format === 'excel') {
            $this->generateExcel($transactions, $filePath);
        } elseif ($format === 'pdf') {
            $this->generatePDF($transactions, $filePath);
        }

        // Générer une URL de téléchargement temporaire
        $downloadUrl = url("api/downloads/{$filename}");

        return response()->json([
            'success' => true,
            'data' => [
                'download_url' => $downloadUrl,
                'filename' => $filename,
                'expires_at' => now()->addHours(24)->toISOString()
            ],
            'message' => 'Export généré avec succès.'
        ]);
    }

    /**
     * Obtenir le résumé des transactions
     */
    private function getTransactionSummary($user): array
    {
        $transactions = $user->transactions();
        
        return [
            'total_transactions' => $transactions->count(),
            'total_deposits' => $transactions->where('type', 'deposit')->where('status', 'completed')->sum('amount'),
            'total_withdrawals' => abs($transactions->where('type', 'withdrawal')->where('status', 'completed')->sum('amount')),
            'total_investments' => abs($transactions->where('type', 'investment')->sum('amount')),
            'total_claims' => $transactions->where('type', 'claim')->sum('amount'),
            'total_bonuses' => $transactions->where('type', 'bonus')->sum('amount'),
            'pending_count' => $transactions->where('status', 'pending')->count(),
            'this_month' => [
                'total' => $transactions->whereMonth('created_at', now()->month)->count(),
                'volume' => $transactions->whereMonth('created_at', now()->month)->sum('amount'),
            ],
        ];
    }

    /**
     * Méthodes d'aide privées
     */
    private function getDailyBreakdown($user, $startDate): array
    {
        return Transaction::where('user_id', $user->id)
            ->where('created_at', '>=', $startDate)
            ->selectRaw('DATE(created_at) as date, COUNT(*) as count, SUM(amount) as volume')
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->toArray();
    }

    private function getTypeDistribution($user, $startDate): array
    {
        return Transaction::where('user_id', $user->id)
            ->where('created_at', '>=', $startDate)
            ->selectRaw('type, COUNT(*) as count, SUM(amount) as volume')
            ->groupBy('type')
            ->get()
            ->toArray();
    }

    private function getStatusDistribution($user, $startDate): array
    {
        return Transaction::where('user_id', $user->id)
            ->where('created_at', '>=', $startDate)
            ->selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->get()
            ->toArray();
    }

    private function getRelatedTransactions($transaction): array
    {
        // Rechercher les transactions liées par reference
        return Transaction::where('user_id', $transaction->user_id)
            ->where('reference_type', $transaction->reference_type)
            ->where('related_id', $transaction->related_id)
            ->where('id', '!=', $transaction->id)
            ->get()
            ->toArray();
    }

    private function getVerificationDetails($transaction): array
    {
        // Retourner les détails de vérification s'ils existent
        return [
            'requires_verification' => in_array($transaction->type, ['withdrawal']),
            'verification_status' => $transaction->status === 'pending' ? 'pending' : 'verified',
            'verification_method' => $transaction->type === 'withdrawal' ? '2FA' : null,
        ];
    }

    private function getProcessingTimeline($transaction): array
    {
        return [
            'created_at' => $transaction->created_at,
            'processed_at' => $transaction->processed_at,
            'updated_at' => $transaction->updated_at,
            'estimated_completion' => $transaction->type === 'withdrawal' && $transaction->status === 'pending' ? 
                now()->addMinutes(30) : null,
        ];
    }

    private function generateCSV($transactions, $filePath): void
    {
        $file = fopen($filePath, 'w');
        
        // En-têtes
        fputcsv($file, [
            'ID', 'Date', 'Type', 'Montant', 'Frais', 'Net', 'Statut', 'Description', 'Référence'
        ]);
        
        // Données
        foreach ($transactions as $transaction) {
            fputcsv($file, [
                $transaction->id,
                $transaction->created_at->format('Y-m-d H:i:s'),
                $transaction->type,
                $transaction->amount,
                $transaction->fee_amount,
                $transaction->net_amount,
                $transaction->status,
                $transaction->description,
                $transaction->reference,
            ]);
        }
        
        fclose($file);
    }

    private function generateExcel($transactions, $filePath): void
    {
        // TODO: Implémenter l'export Excel avec PhpSpreadsheet
        // Pour le moment, générer un CSV
        $this->generateCSV($transactions, $filePath);
    }

    private function generatePDF($transactions, $filePath): void
    {
        // TODO: Implémenter l'export PDF avec DomPDF
        // Pour le moment, générer un CSV
        $this->generateCSV($transactions, $filePath);
    }
}