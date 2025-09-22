<?php

namespace App\Http\Controllers;

use App\Models\Investment;
use App\Models\Claim;
use App\Services\ClaimService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class ClaimController extends Controller
{
    public function __construct(
        private ClaimService $claimService
    ) {}

    /**
     * Effectuer un claim pour un investissement spécifique
     */
    public function claimInvestment(Request $request, int $investmentId): JsonResponse
    {
        $user = $request->user();
        
        $investment = $user->investments()->find($investmentId);
        
        if (!$investment) {
            return response()->json([
                'success' => false,
                'message' => 'Investissement introuvable.'
            ], 404);
        }

        try {
            $claim = $this->claimService->processClaim($user, $investment);

            return response()->json([
                'success' => true,
                'message' => 'Réclamation effectuée avec succès !',
                'data' => [
                    'claim' => $claim,
                    'investment' => $investment->fresh(),
                    'user' => $user->fresh(),
                    'next_claim_at' => $investment->next_claim_at,
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 422);
        }
    }

    /**
     * Effectuer un claim pour tous les investissements éligibles
     */
    public function claimAll(Request $request): JsonResponse
    {
        $user = $request->user();
        
        try {
            $results = $this->claimService->claimAll($user);

            if (empty($results['successful_claims'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Aucun investissement éligible pour le moment.',
                    'data' => [
                        'claimable_investments' => $this->getClaimableInvestments($user),
                    ]
                ], 422);
            }

            return response()->json([
                'success' => true,
                'message' => sprintf(
                    '%d réclamation(s) effectuée(s) avec succès ! Total réclamé : %.4f Pi',
                    count($results['successful_claims']),
                    $results['total_claimed']
                ),
                'data' => [
                    'successful_claims' => $results['successful_claims'],
                    'failed_claims' => $results['failed_claims'],
                    'total_claimed' => $results['total_claimed'],
                    'user' => $user->fresh(),
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du traitement : ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Claim groupé atomique et idempotent
     * Body: { investment_ids: number[], idempotency_key: string }
     */
    public function bulkClaim(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'investment_ids' => 'required|array|min:1',
            'investment_ids.*' => 'integer',
            'idempotency_key' => 'required|string|min:6|max:100',
        ], [
            'investment_ids.required' => 'La liste des investissements est requise.',
            'investment_ids.min' => 'Au moins un investissement est requis.',
            'idempotency_key.required' => "La clé d'idempotence est requise.",
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Erreurs de validation',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = $request->user();
        $ids = array_unique(array_map('intval', $request->input('investment_ids', [])));
        sort($ids);
        $idempotencyKey = (string) $request->input('idempotency_key');

        // Retour idempotent si déjà traité
        $cacheKey = 'idempo:bulk_claim:' . $user->id . ':' . $idempotencyKey;
        if (Cache::has($cacheKey)) {
            $cached = Cache::get($cacheKey);
            return response()->json($cached);
        }

        // Prévalidation: appartenances + éligibilité
        $investments = $user->investments()->whereIn('id', $ids)->get();
        $notFound = array_values(array_diff($ids, $investments->pluck('id')->toArray()));
        if (!empty($notFound)) {
            $resp = [
                'success' => false,
                'message' => 'Certains investissements sont introuvables.',
                'data' => [
                    'missing_investment_ids' => $notFound,
                ],
            ];
            // Ne pas mettre en cache les erreurs de validation d’entrée
            return response()->json($resp, 404);
        }

        // Vérifier qu'ils sont tous claimables maintenant pour éviter demi-traitements
        $precheckErrors = [];
        foreach ($investments as $inv) {
            if (!$inv->canClaim()) {
                $precheckErrors[] = [
                    'investment_id' => $inv->id,
                    'error' => "Non éligible au claim pour le moment",
                ];
            }
        }
        if (!empty($precheckErrors)) {
            $resp = [
                'success' => false,
                'message' => 'Aucun changement effectué: des investissements ne sont pas éligibles.',
                'data' => [
                    'errors' => $precheckErrors,
                    'eligible_count' => count($investments) - count($precheckErrors),
                ],
            ];
            // Idempotence: on peut mettre en cache un résultat d’échec logique court
            Cache::put($cacheKey, $resp, now()->addMinutes(30));
            return response()->json($resp, 422);
        }

        // Traitement atomique sous transaction
        try {
            $result = DB::transaction(function () use ($user, $investments) {
                $details = [];
                $total = 0.0;

                foreach ($investments as $inv) {
                    // L’idempotence par jour est aussi assurée au niveau du service
                    $claim = $this->claimService->processClaim($user, $inv);
                    $amount = (float) $claim->final_amount;
                    $details[] = [
                        'investment_id' => $inv->id,
                        'status' => 'success',
                        'amount' => $amount,
                        'claim_id' => $claim->id,
                        'claimed_for_day' => $claim->claimed_for_day?->toDateString(),
                    ];
                    $total += $amount;
                }

                return [
                    'details' => $details,
                    'total' => round($total, 8),
                ];
            });

            $response = [
                'success' => true,
                'message' => sprintf('Réclamation groupée réussie: %d élément(s), total %.8f Pi', count($result['details']), $result['total']),
                'data' => [
                    'total_claimed' => $result['total'],
                    'claims' => $result['details'],
                    'idempotency_key' => $idempotencyKey,
                    'user' => $user->fresh(),
                ],
            ];
            // Mettre en cache le résultat pour idempotence (TTL 6h)
            Cache::put($cacheKey, $response, now()->addHours(6));

            return response()->json($response);
        } catch (\Throwable $e) {
            $resp = [
                'success' => false,
                'message' => 'Échec de la réclamation groupée: ' . $e->getMessage(),
                'data' => [
                    'idempotency_key' => $idempotencyKey,
                ],
            ];
            // Mettre un cache court pour éviter retry flood immédiat
            Cache::put($cacheKey, $resp, now()->addMinutes(5));
            return response()->json($resp, 422);
        }
    }

    /**
     * Obtenir la liste des investissements réclamables
     */
    public function getClaimableInvestments(Request $request): JsonResponse
    {
        $user = $request->user();
    $claimableInvestments = $this->computeClaimableInvestments($user);

        return response()->json([
            'success' => true,
            'data' => [
                'claimable_investments' => $claimableInvestments,
                'total_claimable_amount' => $claimableInvestments->sum('next_claim_amount'),
                'claimable_count' => $claimableInvestments->count(),
            ]
        ]);
    }

    /**
     * Obtenir l'historique des claims de l'utilisateur
     */
    public function getClaimHistory(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'investment_id' => 'nullable|integer|exists:investments,id',
            'per_page' => 'nullable|integer|min:1|max:100',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'sort' => 'nullable|string',
            'order' => 'nullable|in:asc,desc',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Paramètres invalides',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = $request->user();
        $perPage = \App\Support\Pagination::perPage($request);
        [$sortCol, $sortDir] = \App\Support\Pagination::sort($request, [
            'created_at' => 'created_at',
            'final_amount' => 'final_amount',
        ], 'created_at', 'desc');
        
        $query = $user->claims()->with(['investment.stakingPackage']);

        if ($request->filled('investment_id')) {
            $investmentId = (int) $request->input('investment_id');
            
            // Vérifier que l'investissement appartient à l'utilisateur
            if (!$user->investments()->where('id', $investmentId)->exists()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Investissement introuvable.'
                ], 404);
            }
            
            $query->where('investment_id', $investmentId);
        }

        // Filtrer par dates si spécifiées
        if ($request->filled('start_date')) {
            $query->whereDate('created_at', '>=', $request->input('start_date'));
        }
        
        if ($request->filled('end_date')) {
            $query->whereDate('created_at', '<=', $request->input('end_date'));
        }

        $paginator = $query->orderBy($sortCol, $sortDir)
            ->paginate($perPage)
            ->withQueryString();

        return response()->json(\App\Support\Pagination::envelope($paginator, \App\Http\Resources\ClaimResource::class, $request));
    }

    public function getClaimStatistics(Request $request): JsonResponse
    {
        return response()->json(['success' => true, 'data' => []]);
    }

    /**
     * Obtenir les statistiques de claims
     */
    public function getClaimStats(Request $request): JsonResponse
    {
        $user = $request->user();
    $stats = $this->computeClaimStats($user);

        return response()->json([
            'success' => true,
            'data' => $stats
        ]);
    }

    /**
     * Simuler les gains potentiels
     */
    public function simulateEarnings(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'days' => 'required|integer|min:1|max:365',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Paramètres invalides',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = $request->user();
        $days = $request->days;
        
        $activeInvestments = $user->activeInvestments;
        
        if ($activeInvestments->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'Aucun investissement actif pour simuler les gains.'
            ], 422);
        }

        $dailyTotal = $activeInvestments->sum(function ($investment) {
            return $investment->calculateDailyReturn();
        });

        $projectedEarnings = $dailyTotal * $days;
        
        return response()->json([
            'success' => true,
            'data' => [
                'simulation' => [
                    'days' => $days,
                    'daily_total' => round($dailyTotal, 4),
                    'projected_earnings' => round($projectedEarnings, 4),
                    'current_balance' => $user->balance_pi,
                    'projected_balance' => round($user->balance_pi + $projectedEarnings, 4),
                ],
                'breakdown_by_investment' => $activeInvestments->map(function ($investment) use ($days) {
                    $dailyReturn = $investment->calculateDailyReturn();
                    return [
                        'investment_id' => $investment->id,
                        'package_name' => $investment->stakingPackage->name,
                        'amount' => $investment->amount,
                        'daily_rate' => $investment->daily_rate,
                        'daily_return' => round($dailyReturn, 4),
                        'projected_return' => round($dailyReturn * $days, 4),
                    ];
                }),
            ]
        ]);
    }

    /**
     * Obtenir le statut des claims aujourd'hui
     */
    public function getTodayStatus(Request $request): JsonResponse
    {
        $user = $request->user();
        $today = now()->toDateString();
        
        $todayClaims = $user->claims()
            ->whereDate('created_at', $today)
            ->with('investment.stakingPackage')
            ->get();

        $claimableInvestments = $this->getClaimableInvestments($user);
        
        return response()->json([
            'success' => true,
            'data' => [
                'today' => [
                    'date' => $today,
                    'claims_made' => $todayClaims->count(),
                    'total_claimed_today' => $todayClaims->sum('final_amount'),
                    'claims_detail' => $todayClaims,
                ],
                'available_now' => [
                    'claimable_count' => $claimableInvestments->count(),
                    'total_claimable_amount' => $claimableInvestments->sum('next_claim_amount'),
                    'investments' => $claimableInvestments,
                ],
            ]
        ]);
    }

    /**
     * Méthode helper pour obtenir les investissements réclamables
     */
    private function computeClaimableInvestments($user)
    {
        return $user->activeInvestments
            ->filter(fn($inv) => $inv->canClaim())
            ->map(function ($investment) {
                return [
                    'investment_id' => $investment->id,
                    'package_name' => $investment->stakingPackage->name,
                    'amount' => $investment->amount,
                    'next_claim_amount' => $investment->calculateNextClaimAmount(),
                    'next_claim_at' => $investment->next_claim_at,
                    'can_claim_now' => true,
                ];
            })->values();
    }

    /**
     * Méthode helper pour obtenir les statistiques de claims
     */
    private function computeClaimStats($user): array
    {
        $claims = $user->claims();
        
        return [
            'total_claims' => $claims->count(),
            'total_claimed' => $user->total_claimed,
            'claims_this_week' => $claims->where('created_at', '>=', now()->startOfWeek())->count(),
            'claimed_this_week' => $claims->where('created_at', '>=', now()->startOfWeek())->sum('final_amount'),
            'claims_this_month' => $claims->where('created_at', '>=', now()->startOfMonth())->count(),
            'claimed_this_month' => $claims->where('created_at', '>=', now()->startOfMonth())->sum('final_amount'),
            'average_claim_amount' => round($claims->avg('final_amount') ?? 0, 4),
            'largest_single_claim' => round($claims->max('amount') ?? 0, 4),
            'last_claim_date' => $claims->latest()->value('created_at'),
            'current_streak' => $user->currentStreak?->current_streak ?? 0,
        ];
    }
}
