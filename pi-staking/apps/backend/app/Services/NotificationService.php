<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Twilio\Rest\Client as TwilioClient;

class NotificationService
{
    protected $twilioClient;

    public function __construct()
    {
        if (config('services.twilio.enabled')) {
            $this->twilioClient = new TwilioClient(
                config('services.twilio.sid'),
                config('services.twilio.token')
            );
        }
    }

    /**
     * Envoyer une notification de sécurité par email
     */
    public function sendSecurityNotification(User $user, string $subject, array $data): bool
    {
        try {
            Mail::send('emails.security-notification', $data, function ($message) use ($user, $subject) {
                $message->to($user->email)
                        ->subject('[Pi Staking] ' . $subject);
            });
            
            return true;
        } catch (\Exception $e) {
            Log::error('Erreur envoi email sécurité: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Envoyer le code de vérification par email pour retrait
     */
    public function sendWithdrawalVerificationEmail(User $user, string $code, float $amount): bool
    {
        try {
            $data = [
                'user' => $user,
                'code' => $code,
                'amount' => $amount,
                'expires_in' => 5,
                'ip' => request()->ip(),
                'timestamp' => now()->format('d/m/Y H:i:s')
            ];

            Mail::send('emails.withdrawal-verification', $data, function ($message) use ($user) {
                $message->to($user->email)
                        ->subject('[Pi Staking] Code de vérification pour retrait');
            });
            
            return true;
        } catch (\Exception $e) {
            Log::error('Erreur envoi email vérification retrait: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Envoyer le code de vérification par SMS pour retrait
     */
    public function sendWithdrawalVerificationSMS(User $user, string $code, float $amount): bool
    {
        if (!$this->twilioClient || !$user->phone_verified) {
            return false;
        }

        try {
            $message = "Pi Staking - Code de vérification pour retrait de {$amount} π: {$code}. Expire dans 5 min. Si ce n'est pas vous, ignorez ce message.";
            
            $this->twilioClient->messages->create(
                $user->phone_number,
                [
                    'from' => config('services.twilio.from'),
                    'body' => $message
                ]
            );
            
            return true;
        } catch (\Exception $e) {
            Log::error('Erreur envoi SMS vérification retrait: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Envoyer alerte de connexion suspecte
     */
    public function sendSuspiciousLoginAlert(User $user, array $loginData): bool
    {
        try {
            $data = [
                'user' => $user,
                'ip' => $loginData['ip'],
                'location' => $loginData['location'] ?? 'Inconnue',
                'device' => $loginData['device'] ?? 'Appareil inconnu',
                'timestamp' => now()->format('d/m/Y H:i:s'),
                'action_url' => url('/security/review-login')
            ];

            Mail::send('emails.suspicious-login', $data, function ($message) use ($user) {
                $message->to($user->email)
                        ->subject('[ALERTE Pi Staking] Connexion suspecte détectée');
            });
            
            // Envoyer aussi par SMS si disponible
            if ($this->twilioClient && $user->phone_verified) {
                $smsMessage = "ALERTE Pi Staking: Connexion suspecte depuis {$loginData['ip']} le " . now()->format('d/m H:i') . ". Si ce n'est pas vous, sécurisez votre compte immédiatement.";
                
                $this->twilioClient->messages->create(
                    $user->phone_number,
                    [
                        'from' => config('services.twilio.from'),
                        'body' => $smsMessage
                    ]
                );
            }
            
            return true;
        } catch (\Exception $e) {
            Log::error('Erreur envoi alerte connexion suspecte: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Envoyer notification de gros retrait
     */
    public function sendLargeWithdrawalNotification(User $user, float $amount): bool
    {
        try {
            $data = [
                'user' => $user,
                'amount' => $amount,
                'timestamp' => now()->format('d/m/Y H:i:s'),
                'ip' => request()->ip()
            ];

            Mail::send('emails.large-withdrawal', $data, function ($message) use ($user, $amount) {
                $message->to($user->email)
                        ->subject("[Pi Staking] Retrait important de {$amount} π effectué");
            });
            
            return true;
        } catch (\Exception $e) {
            Log::error('Erreur notification gros retrait: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Envoyer notification de changement de paramètres de sécurité
     */
    public function sendSecuritySettingsChangeNotification(User $user, string $change): bool
    {
        try {
            $data = [
                'user' => $user,
                'change' => $change,
                'timestamp' => now()->format('d/m/Y H:i:s'),
                'ip' => request()->ip()
            ];

            Mail::send('emails.security-settings-change', $data, function ($message) use ($user) {
                $message->to($user->email)
                        ->subject('[Pi Staking] Modification des paramètres de sécurité');
            });
            
            return true;
        } catch (\Exception $e) {
            Log::error('Erreur notification changement sécurité: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Envoyer résumé hebdomadaire de sécurité
     */
    public function sendWeeklySecuritySummary(User $user): bool
    {
        try {
            $weeklyStats = $this->getWeeklySecurityStats($user);
            
            $data = [
                'user' => $user,
                'stats' => $weeklyStats,
                'week_start' => now()->startOfWeek()->format('d/m/Y'),
                'week_end' => now()->endOfWeek()->format('d/m/Y')
            ];

            Mail::send('emails.weekly-security-summary', $data, function ($message) use ($user) {
                $message->to($user->email)
                        ->subject('[Pi Staking] Résumé hebdomadaire de sécurité');
            });
            
            return true;
        } catch (\Exception $e) {
            Log::error('Erreur résumé hebdomadaire: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Envoyer notification d'activation/désactivation 2FA
     */
    public function send2FAStatusNotification(User $user, bool $enabled): bool
    {
        try {
            $action = $enabled ? 'activé' : 'désactivé';
            
            $data = [
                'user' => $user,
                'action' => $action,
                'enabled' => $enabled,
                'timestamp' => now()->format('d/m/Y H:i:s'),
                'ip' => request()->ip()
            ];

            Mail::send('emails.2fa-status-change', $data, function ($message) use ($user, $action) {
                $message->to($user->email)
                        ->subject("[Pi Staking] Authentification 2FA {$action}");
            });
            
            return true;
        } catch (\Exception $e) {
            Log::error('Erreur notification 2FA: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Obtenir les statistiques de sécurité de la semaine
     */
    private function getWeeklySecurityStats(User $user): array
    {
        $startOfWeek = now()->startOfWeek();
        $endOfWeek = now()->endOfWeek();

        return [
            'logins' => \App\Models\UserSecurityLog::where('user_id', $user->id)
                ->where('action', 'login')
                ->whereBetween('created_at', [$startOfWeek, $endOfWeek])
                ->count(),
            
            'failed_logins' => \App\Models\UserSecurityLog::where('user_id', $user->id)
                ->where('action', 'failed_login')
                ->whereBetween('created_at', [$startOfWeek, $endOfWeek])
                ->count(),
                
            'withdrawals' => \App\Models\UserSecurityLog::where('user_id', $user->id)
                ->where('action', 'like', '%withdrawal%')
                ->whereBetween('created_at', [$startOfWeek, $endOfWeek])
                ->count(),
                
            'security_changes' => \App\Models\UserSecurityLog::where('user_id', $user->id)
                ->whereIn('action', ['setup_2fa_completed', 'disable_2fa_completed', 'password_changed'])
                ->whereBetween('created_at', [$startOfWeek, $endOfWeek])
                ->count(),
                
            'unique_ips' => \App\Models\UserSecurityLog::where('user_id', $user->id)
                ->whereBetween('created_at', [$startOfWeek, $endOfWeek])
                ->distinct('ip_address')
                ->count('ip_address')
        ];
    }

    /**
     * Vérifier si une notification peut être envoyée (rate limiting)
     */
    public function canSendNotification(User $user, string $type): bool
    {
        $rateLimits = [
            'security_alert' => ['count' => 5, 'period' => 'hour'],
            'verification_code' => ['count' => 10, 'period' => 'hour'],
            'login_alert' => ['count' => 3, 'period' => 'hour']
        ];

        if (!isset($rateLimits[$type])) {
            return true;
        }

        $limit = $rateLimits[$type];
        $since = now()->sub($limit['period'], 1);

        $count = \App\Models\UserSecurityLog::where('user_id', $user->id)
            ->where('action', 'like', "%{$type}%")
            ->where('created_at', '>=', $since)
            ->count();

        return $count < $limit['count'];
    }
}