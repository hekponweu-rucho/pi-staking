<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\BonusGrant;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\URL;
use App\Services\NotificationService;
use App\Services\ReferralService;

class AuthController extends Controller
{
    /**
     * Connexion utilisateur (email + mot de passe)
     */
   public function login(Request $request): JsonResponse
{
    $request->validate([
        'email' => 'required|email',
        'password' => 'required|string',
    ]);

    // Normaliser l'email
    $email = strtolower($request->email);

    $user = User::where('email', $email)->first();

    // Vérification utilisateur + mot de passe
    if (!$user || !Hash::check($request->password, $user->password)) {
        return response()->json([
            'success' => false,
            'message' => 'Identifiants invalides.'
        ], 401);
    }

    // Vérifier si le compte est actif
    if (!$user->is_active) {
        return response()->json([
            'success' => false,
            'message' => 'Votre compte est désactivé. Contactez le support.'
        ], 403);
    }

    // Génération du token Sanctum
    $token = $user->createToken('auth_token')->plainTextToken;

    return response()->json([
        'success' => true,
        'message' => 'Connexion réussie.',
        'data' => [
            'user' => [
                'id'            => $user->id,
                'first_name'    => $user->first_name,
                'last_name'     => $user->last_name,
                'username'      => $user->username,
                'email'         => $user->email,
                'current_level' => $user->current_level,
                'balance_pi'    => $user->balance_pi,
                'bonus_balance' => $user->bonus_balance,
                'total_invested'=> $user->total_invested,
                'total_claimed' => $user->total_claimed,
                'total_withdrawn'=> $user->total_withdrawn,
                'kyc_status'    => $user->kyc_status,
                'is_active'     => $user->is_active,
                'created_at'    => $user->created_at,
            ],
            'token' => $token,
        ]
    ]);
}

    /**
     * Mot de passe oublié : envoi du lien de réinitialisation
     */
    public function forgotPassword(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email|exists:users,email',
        ]);

        $status = Password::sendResetLink(
            $request->only('email')
        );

        return response()->json([
            'success' => $status === Password::RESET_LINK_SENT,
            'message' => __($status),
        ]);
    }

    /**
     * Retourner l'utilisateur courant
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load(['activeInvestments', 'bonusGrants']);

        return response()->json([
            'success' => true,
            'data' => $user,
        ]);
    }

    /**
     * Réinitialisation du mot de passe avec token
     */
    public function resetPassword(Request $request): JsonResponse
    {
        $request->validate([
            'token'    => 'required',
            'email'    => 'required|email|exists:users,email',
            'password' => 'required|min:8|confirmed',
        ]);

        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (User $user, string $password) {
                $user->forceFill([
                    'password' => Hash::make($password),
                    'remember_token' => Str::random(60),
                ])->save();
            }
        );

        return response()->json([
            'success' => $status === Password::PASSWORD_RESET,
            'message' => __($status),
        ]);
    }

    /**
     * Mise à jour du profil utilisateur (nom, email, etc.)
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $user = Auth::user();

        $validator = Validator::make($request->all(), [
            'first_name' => 'nullable|string|max:255',
            'last_name' => 'nullable|string|max:255',
            'email' => 'nullable|email|unique:users,email,' . $user->id,
            'username' => 'nullable|string|max:255|unique:users,username,' . $user->id,
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors'  => $validator->errors(),
            ], 422);
        }

        $user->update($validator->validated());

        return response()->json([
            'success' => true,
            'message' => 'Profil mis à jour avec succès.',
            'data'    => $user,
        ]);
    }

    /**
     * Changement de mot de passe (par l’utilisateur connecté)
     */
    public function changePassword(Request $request): JsonResponse
    {
        $user = Auth::user();

        $request->validate([
            'current_password' => 'required',
            'new_password'     => 'required|min:8|confirmed',
        ]);

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Le mot de passe actuel est incorrect.',
            ], 403);
        }

        $user->update([
            'password' => Hash::make($request->new_password),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Mot de passe mis à jour avec succès.',
        ]);
    }

    /**
     * Réclamer le bonus de bienvenue
     */
    public function claimWelcomeBonus(Request $request): JsonResponse
    {
        $user = Auth::user();

        $alreadyClaimed = (bool) $user->welcome_bonus_claimed
            || BonusGrant::where('user_id', $user->id)
                ->whereIn('type', ['welcome', 'welcome_bonus'])
                ->exists();

        if ($alreadyClaimed) {
            return response()->json([
                'success' => false,
                'message' => 'Bonus de bienvenue déjà réclamé.',
            ], 409);
        }

        $amount = (float) config('staking.bonus.discovery_amount', 50);
        $expiresAt = now()->addDays((int) config('staking.bonus.expiration_days', 90));

        BonusGrant::create([
            'user_id' => $user->id,
            'type' => 'welcome',
            'amount' => $amount,
            'expires_at' => $expiresAt,
            'is_used' => false,
            'description' => 'Bonus de bienvenue',
        ]);

        $user->increment('bonus_balance', $amount);
        $user->update(['welcome_bonus_claimed' => true]);

        return response()->json([
            'success' => true,
            'message' => 'Bonus de bienvenue réclamé avec succès.',
            'data' => [
                'amount' => $amount,
                'bonus_balance' => (float) $user->fresh()->bonus_balance,
                'user' => $user->fresh(),
            ],
        ]);
    }

    public function register(Request $request, NotificationService $notifications): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'username' => 'required|string|max:255|unique:users,username',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|min:8|confirmed',
            'referral_code' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Erreurs de validation',
                'errors' => $validator->errors(),
            ], 422);
        }

        $data = $validator->validated();

        $referrer = null;
        if (!empty($data['referral_code'] ?? null)) {
            $referrer = app(ReferralService::class)->validateReferralCode($data['referral_code']);
            if (!$referrer) {
                return response()->json([
                    'success' => false,
                    'message' => 'Code de parrainage invalide',
                    'errors' => [
                        'referral_code' => ['Code de parrainage invalide']
                    ]
                ], 422);
            }
        }

        $user = User::create([
            'first_name' => $data['first_name'],
            'last_name' => $data['last_name'],
            'username' => $data['username'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'current_level' => 'bronze',
            'referred_by' => $referrer?->id,
            'referral_code' => app(ReferralService::class)->generateUniqueReferralCode(),
        ]);

        if (method_exists($user, 'assignRole')) {
            $user->assignRole('user');
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        $bonusGrant = null;
        $bonusAmount = (float) config('staking.bonus.discovery_amount', 50);
        $bonusExpires = now()->addDays((int) config('staking.bonus.expiration_days', 90));
        $bonusGrant = BonusGrant::create([
            'user_id' => $user->id,
            'type' => 'welcome',
            'amount' => $bonusAmount,
            'expires_at' => $bonusExpires,
            'is_used' => false,
            'description' => 'Bonus de bienvenue',
        ]);

        $shouldVerify = filter_var(env('ENABLE_EMAIL_VERIFICATION', true), FILTER_VALIDATE_BOOL);
        if ($shouldVerify) {
            $minutes = (int) (config('auth.verification.expire', 60 * 24));
            $verifyUrl = URL::temporarySignedRoute(
                'api.auth.email.verify',
                now()->addMinutes($minutes),
                [
                    'id' => $user->id,
                    'hash' => sha1($user->email),
                ]
            );
            $notifications->sendEmailVerification($user, $verifyUrl);
        } else {
            $user->forceFill(['email_verified_at' => now()])->save();
            $notifications->sendWelcomeEmail($user);
        }

        return response()->json([
            'success' => true,
            'message' => 'Inscription réussie.',
            'data' => [
                'user' => $user,
                'token' => $token,
                'bonus_grant' => $bonusGrant,
            ]
        ], 201);
    }

    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();
        if ($user && $user->currentAccessToken()) {
            $user->currentAccessToken()->delete();
        }

        return response()->json([
            'success' => true,
            'message' => 'Déconnexion réussie.'
        ]);
    }

    public function refresh(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Non authentifié.'
            ], 401);
        }

        if ($user->currentAccessToken()) {
            $user->currentAccessToken()->delete();
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Token renouvelé.',
            'data' => [
                'user' => $user->fresh(),
                'token' => $token,
            ]
        ]);
    }
}
