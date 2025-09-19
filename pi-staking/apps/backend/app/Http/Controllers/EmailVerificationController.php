<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\URL;

class EmailVerificationController extends Controller
{
    public function resend(Request $request, NotificationService $notifications): JsonResponse
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Non authentifié.'
            ], 401);
        }

        if ($user->hasVerifiedEmail()) {
            return response()->json([
                'success' => true,
                'message' => 'Email déjà vérifié.'
            ]);
        }

        $minutes = (int) (config('auth.verification.expire', 60 * 24));
        $verifyUrl = URL::temporarySignedRoute(
            'api.auth.email.verify',
            now()->addMinutes($minutes),
            [
                'id' => $user->id,
                'hash' => sha1($user->email),
            ]
        );

        $sent = $notifications->sendEmailVerification($user, $verifyUrl);

        Log::info('Email de vérification envoyé', [
            'user_id' => $user->id,
            'email' => $user->email,
            'success' => $sent,
        ]);

        return response()->json([
            'success' => $sent,
            'message' => $sent ? 'Email de vérification envoyé.' : "Échec de l'envoi de l'email."
        ], $sent ? 200 : 500);
    }

    public function verify(Request $request, NotificationService $notifications): JsonResponse
    {
        $id = $request->query('id');
        $hash = $request->query('hash');

        if (!$id || !$hash) {
            return response()->json([
                'success' => false,
                'message' => 'Paramètres manquants.'
            ], 422);
        }

        if (!URL::hasValidSignature($request)) {
            return response()->json([
                'success' => false,
                'message' => 'Lien de vérification invalide ou expiré.'
            ], 403);
        }

        $user = User::findOrFail((int) $id);

        if ($user->hasVerifiedEmail()) {
            return response()->json([
                'success' => true,
                'message' => 'Email déjà vérifié.'
            ]);
        }

        if (! hash_equals((string) $hash, sha1($user->email))) {
            return response()->json([
                'success' => false,
                'message' => 'Hash invalide.'
            ], 403);
        }

        $user->forceFill(['email_verified_at' => now()])->save();

        $notifications->sendWelcomeEmail($user);

        Log::info('Email vérifié', [
            'user_id' => $user->id,
            'email' => $user->email,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Votre email a été vérifié avec succès.'
        ]);
    }

    public function status(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Non authentifié.'
            ], 401);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'email' => $user->email,
                'email_verified_at' => $user->email_verified_at,
            ]
        ]);
    }
}
