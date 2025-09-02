<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\UserLevelService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function __construct(
        private UserLevelService $userLevelService
    ) {}

    /**
     * Obtenir le profil utilisateur complet
     */
    public function profile(Request $request): JsonResponse
    {
        $user = $request->user()->load([
            'activeInvestments.stakingPackage',
            'completedInvestments',
            'bonusGrants' => function ($query) {
                $query->where('expires_at', '>', now());
            },
            'referrals.referred',
            'referrer',
            'transactions' => function ($query) {
                $query->latest()->limit(10);
            }
        ]);

        return response()->json([
            'success' => true,
            'data' => [
                'user' => $user,
                'level_info' => $this->userLevelService->getLevelProgress($user),
                'next_level_info' => $this->userLevelService->getNextLevelInfo($user),
                'all_levels' => $this->userLevelService->getAllLevelsInfo(),
            ]
        ]);
    }

    /**
     * Mettre à jour le profil utilisateur
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'username' => 'sometimes|string|max:255|unique:users,username,' . $user->id,
            'email' => 'sometimes|string|email|max:255|unique:users,email,' . $user->id,
            'first_name' => 'nullable|string|max:255',
            'last_name' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:20',
            'date_of_birth' => 'nullable|date|before:today',
            'country' => 'nullable|string|max:2',
            'timezone' => 'nullable|string|max:50',
        ], [
            'username.unique' => 'Ce nom d\'utilisateur est déjà pris.',
            'email.unique' => 'Cette adresse email est déjà utilisée.',
            'date_of_birth.before' => 'La date de naissance doit être antérieure à aujourd\'hui.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Erreurs de validation',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $user->update($validator->validated());

            return response()->json([
                'success' => true,
                'message' => 'Profil mis à jour avec succès.',
                'data' => [
                    'user' => $user->fresh()
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour : ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Changer le mot de passe
     */
    public function changePassword(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:8|confirmed',
        ], [
            'current_password.required' => 'Le mot de passe actuel est requis.',
            'new_password.required' => 'Le nouveau mot de passe est requis.',
            'new_password.min' => 'Le nouveau mot de passe doit contenir au moins 8 caractères.',
            'new_password.confirmed' => 'Les mots de passe ne correspondent pas.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Erreurs de validation',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Le mot de passe actuel est incorrect.'
            ], 422);
        }

        $user->update([
            'password' => Hash::make($request->new_password)
        ]);

        // Révoquer tous les autres tokens pour forcer une nouvelle connexion
        $user->tokens()->where('id', '!=', $user->currentAccessToken()->id)->delete();

        return response()->json([
            'success' => true,
            'message' => 'Mot de passe modifié avec succès.'
        ]);
    }

    /**
     * Obtenir les informations de niveau et progression
     */
    public function levelInfo(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'success' => true,
            'data' => [
                'current_level' => $this->userLevelService->getLevelProgress($user),
                'next_level' => $this->userLevelService->getNextLevelInfo($user),
                'all_levels' => $this->userLevelService->getAllLevelsInfo(),
                'level_history' => $user->levelHistory()->latest()->get(),
            ]
        ]);
    }

    /**
     * Obtenir les statistiques utilisateur
     */
    public function statistics(Request $request): JsonResponse
    {
        $user = $request->user();
        
        $stats = [
            // Statistiques d'investissement
            'investments' => [
                'total_count' => $user->investments()->count(),
                'active_count' => $user->investments()->active()->count(),
                'completed_count' => $user->investments()->completed()->count(),
                'total_amount' => $user->total_invested,
                'active_amount' => $user->activeInvestments->sum('amount'),
            ],
            
            // Statistiques de gains
            'earnings' => [
                'total_claimed' => $user->total_claimed,
                'claims_count' => $user->claims()->count(),
                'average_daily_claim' => $user->claims()->avg('amount') ?? 0,
                'last_claim_date' => $user->claims()->latest()->value('created_at'),
            ],
            
            // Statistiques de parrainage
            'referrals' => [
                'total_referred' => $user->referrals()->count(),
                'active_referrals' => $user->referrals()->whereHas('referred', function ($q) {
                    $q->where('is_active', true);
                })->count(),
                'total_bonus_earned' => $user->referrals()->sum('bonus_amount'),
            ],
            
            // Activité récente
            'activity' => [
                'days_since_registration' => $user->created_at->diffInDays(now()),
                'last_investment_date' => $user->investments()->latest()->value('created_at'),
                'last_claim_date' => $user->claims()->latest()->value('created_at'),
                'current_streak' => $user->currentStreak?->current_streak ?? 0,
            ]
        ];

        return response()->json([
            'success' => true,
            'data' => $stats
        ]);
    }

    /**
     * Obtenir l'historique des transactions
     */
    public function transactionHistory(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'type' => 'nullable|in:deposit,withdrawal,investment,claim,bonus,referral',
            'per_page' => 'nullable|integer|min:5|max:100',
            'page' => 'nullable|integer|min:1',
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
        
        $query = $user->transactions()->with(['investment.stakingPackage']);
        
        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        $transactions = $query->latest()->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $transactions
        ]);
    }

    /**
     * Obtenir les informations de parrainage
     */
    public function referralInfo(Request $request): JsonResponse
    {
        $user = $request->user()->load([
            'referrals.referred',
            'referrer'
        ]);

        $referralStats = [
            'referral_code' => $user->referral_code,
            'referral_link' => config('app.frontend_url') . '/register?ref=' . $user->referral_code,
            'total_referred' => $user->referrals()->count(),
            'active_referrals' => $user->referrals()->whereHas('referred', function ($q) {
                $q->where('is_active', true);
            })->count(),
            'total_bonus_earned' => $user->referrals()->sum('bonus_amount'),
            'pending_bonus' => $user->referrals()->where('status', 'pending')->sum('bonus_amount'),
            'referred_by' => $user->referrer ? [
                'username' => $user->referrer->username,
                'referral_code' => $user->referrer->referral_code,
            ] : null,
        ];

        return response()->json([
            'success' => true,
            'data' => [
                'stats' => $referralStats,
                'referrals' => $user->referrals,
            ]
        ]);
    }
}