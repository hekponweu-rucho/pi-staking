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

        $user = User::where('email', $request->email)->first();
        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Identifiants invalides.'
            ], 401);
        }

        if (method_exists($user, 'tokens')) {
            $token = $user->createToken('auth_token')->plainTextToken;
        } else {
            $token = null;
        }

        return response()->json([
            'success' => true,
            'message' => 'Connexion réussie.',
            'data' => [
                'user' => $user,
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
            'name'  => 'nullable|string|max:255',
            'email' => 'nullable|email|unique:users,email,' . $user->id,
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
}
