<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response;

class AntiAbuseMiddleware
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next, string $action = 'default'): Response
    {
        $user = $request->user();
        
        if (!$user) {
            return $next($request);
        }

        $userId = $user->id;
        $ip = $request->ip();
        $userAgent = $request->userAgent();
        
        // Différentes règles selon l'action
        $limits = $this->getLimitsForAction($action);
        
        // Vérifier les limites par utilisateur
        if ($this->isUserRateLimited($userId, $action, $limits['user'])) {
            return response()->json([
                'success' => false,
                'message' => 'Trop de tentatives. Veuillez patienter avant de réessayer.',
                'retry_after' => $limits['user']['window']
            ], 429);
        }
        
        // Vérifier les limites par IP
        if ($this->isIpRateLimited($ip, $action, $limits['ip'])) {
            return response()->json([
                'success' => false,
                'message' => 'Trop de tentatives depuis cette adresse IP.',
                'retry_after' => $limits['ip']['window']
            ], 429);
        }
        
        // Détecter les comportements suspects
        if ($this->detectSuspiciousBehavior($userId, $ip, $userAgent, $action)) {
            // Log pour investigation
            \Log::warning('Suspicious behavior detected', [
                'user_id' => $userId,
                'ip' => $ip,
                'user_agent' => $userAgent,
                'action' => $action,
                'timestamp' => now()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Activité suspecte détectée. Contactez le support si vous pensez qu\'il s\'agit d\'une erreur.'
            ], 429);
        }
        
        // Enregistrer l'activité
        $this->recordActivity($userId, $ip, $action);
        
        return $next($request);
    }
    
    private function getLimitsForAction(string $action): array
    {
        return match ($action) {
            'claim' => [
                'user' => ['max' => 50, 'window' => 3600], // 50 claims par heure max
                'ip' => ['max' => 100, 'window' => 3600], // 100 par IP par heure
            ],
            'investment' => [
                'user' => ['max' => 10, 'window' => 3600], // 10 investissements par heure
                'ip' => ['max' => 20, 'window' => 3600],
            ],
            'withdrawal' => [
                'user' => ['max' => 3, 'window' => 86400], // 3 retraits par jour
                'ip' => ['max' => 5, 'window' => 86400],
            ],
            'login' => [
                'user' => ['max' => 10, 'window' => 3600], // 10 tentatives de login par heure
                'ip' => ['max' => 50, 'window' => 3600],
            ],
            default => [
                'user' => ['max' => 100, 'window' => 3600],
                'ip' => ['max' => 200, 'window' => 3600],
            ],
        };
    }
    
    private function isUserRateLimited(int $userId, string $action, array $limits): bool
    {
        $key = "rate_limit:user:{$userId}:{$action}";
        $current = Cache::get($key, 0);
        
        if ($current >= $limits['max']) {
            return true;
        }
        
        Cache::put($key, $current + 1, $limits['window']);
        return false;
    }
    
    private function isIpRateLimited(string $ip, string $action, array $limits): bool
    {
        $key = "rate_limit:ip:{$ip}:{$action}";
        $current = Cache::get($key, 0);
        
        if ($current >= $limits['max']) {
            return true;
        }
        
        Cache::put($key, $current + 1, $limits['window']);
        return false;
    }
    
    private function detectSuspiciousBehavior(int $userId, string $ip, string $userAgent, string $action): bool
    {
        // Détecter les changements rapides d'IP pour le même utilisateur
        $userIpKey = "user_ip:{$userId}";
        $lastIp = Cache::get($userIpKey);
        
        if ($lastIp && $lastIp !== $ip) {
            $ipChangeKey = "ip_changes:{$userId}";
            $changes = Cache::get($ipChangeKey, 0);
            
            if ($changes >= 5) { // Plus de 5 changements d'IP en 1 heure
                return true;
            }
            
            Cache::put($ipChangeKey, $changes + 1, 3600);
        }
        
        Cache::put($userIpKey, $ip, 3600);
        
        // Détecter les User-Agent suspects
        if ($this->isSuspiciousUserAgent($userAgent)) {
            return true;
        }
        
        // Détecter les patterns de timing suspects (actions trop rapides)
        if ($this->isSuspiciousTiming($userId, $action)) {
            return true;
        }
        
        return false;
    }
    
    private function isSuspiciousUserAgent(string $userAgent): bool
    {
        $suspiciousPatterns = [
            'bot', 'crawler', 'spider', 'scraper', 'curl', 'wget',
            'python-requests', 'automated', 'selenium', 'phantom'
        ];
        
        $userAgentLower = strtolower($userAgent);
        
        foreach ($suspiciousPatterns as $pattern) {
            if (strpos($userAgentLower, $pattern) !== false) {
                return true;
            }
        }
        
        return false;
    }
    
    private function isSuspiciousTiming(int $userId, string $action): bool
    {
        $timingKey = "timing:{$userId}:{$action}";
        $lastAction = Cache::get($timingKey);
        $now = microtime(true);
        
        if ($lastAction) {
            $timeDiff = $now - $lastAction;
            
            // Actions trop rapides (moins de 2 secondes pour les claims)
            $minInterval = match ($action) {
                'claim' => 2.0,
                'investment' => 5.0,
                'withdrawal' => 10.0,
                default => 1.0,
            };
            
            if ($timeDiff < $minInterval) {
                return true;
            }
        }
        
        Cache::put($timingKey, $now, 300); // Garder pendant 5 minutes
        return false;
    }
    
    private function recordActivity(int $userId, string $ip, string $action): void
    {
        // Enregistrer l'activité pour analyse ultérieure
        $activityKey = "activity:{$userId}:" . date('Y-m-d-H');
        $activities = Cache::get($activityKey, []);
        
        $activities[] = [
            'action' => $action,
            'ip' => $ip,
            'timestamp' => now()->toISOString(),
        ];
        
        // Garder seulement les 100 dernières activités
        if (count($activities) > 100) {
            $activities = array_slice($activities, -100);
        }
        
        Cache::put($activityKey, $activities, 86400); // Garder 24h
    }
}