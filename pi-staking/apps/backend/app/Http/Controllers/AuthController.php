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
     * Réclamer le bonus de bienvenue (exemple : 50 Pi)
     */
    public function claimWelcomeBonus(Request $request): JsonResponse
    {
        $user = Auth::user();

        // Vérifier si déjà attribué
        if (BonusGrant::where('user_id', $user->id)->where('type', 'welcome')->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Bonus de bienvenue déjà réclamé.',
            ], 409);
        }

        // Créer un enregistrement du bonus
        BonusGrant::create([
            'user_id' => $user->id,
            'amount'  => 50, // Bonus fixe de 50 Pi
            'type'    => 'welcome',
        ]);

        // Exemple : incrémenter le solde utilisateur
        $user->increment('balance', 50);

        return response()->json([
            'success' => true,
            'message' => 'Bonus de bienvenue réclamé avec succès.',
            'amount'  => 50,
            'balance' => $user->balance,
        ]);
    }
}
