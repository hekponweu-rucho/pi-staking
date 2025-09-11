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

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Authentification requise'
            ], 401);
        }

        if (!$this->hasAdminAccess($user)) {
            return response()->json([
                'success' => false,
                'message' => 'Accès administrateur requis'
            ], 403);
        }

        return $next($request);
    }

    /**
     * Determine if the user has admin access via role or allowlisted email.
     */
    private function hasAdminAccess($user): bool
    {
        // Primary: Spatie role:admin
        if (method_exists($user, 'hasRole') && $user->hasRole('admin')) {
            return true;
        }

        // Fallback: Allowlist of emails from ENV (comma-separated)
        $allowlist = env('ADMIN_EMAILS', '');
        if (!empty($allowlist)) {
            $emails = collect(explode(',', $allowlist))
                ->map(fn ($e) => strtolower(trim($e)))
                ->filter()
                ->all();
            if (in_array(strtolower($user->email), $emails, true)) {
                return true;
            }
        }

        // Optional legacy flags
        if (isset($user->role) && $user->role === 'admin') {
            return true;
        }
        if (isset($user->is_admin) && (bool) $user->is_admin) {
            return true;
        }

        return false;
    }
}
