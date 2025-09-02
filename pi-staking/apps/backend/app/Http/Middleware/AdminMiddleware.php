<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AdminMiddleware
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        // Vérifier que l'utilisateur est connecté
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Authentification requise'
            ], 401);
        }

        // Vérifier les droits admin
        // Vous pouvez adapter cette logique selon votre système de rôles
        if (!$this->isAdmin($user)) {
            return response()->json([
                'success' => false,
                'message' => 'Accès administrateur requis'
            ], 403);
        }

        return $next($request);
    }

    /**
     * Vérifier si l'utilisateur est administrateur
     */
    private function isAdmin($user): bool
    {
        // Option 1: Basé sur l'email
        $adminEmails = [
            'admin@pistaking.com',
            'superadmin@pistaking.com'
        ];
        
        if (in_array($user->email, $adminEmails)) {
            return true;
        }

        // Option 2: Basé sur un champ role (si vous avez ce champ)
        if (isset($user->role) && $user->role === 'admin') {
            return true;
        }

        // Option 3: Basé sur un champ is_admin (si vous avez ce champ)
        if (isset($user->is_admin) && $user->is_admin) {
            return true;
        }

        // Option 4: Utiliser Spatie Permission (si installé)
        // if ($user->hasRole('admin')) {
        //     return true;
        // }

        return false;
    }
}