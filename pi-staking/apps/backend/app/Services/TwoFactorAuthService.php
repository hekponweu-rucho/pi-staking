<?php

namespace App\Services;

use BaconQrCode\Renderer\ImageRenderer;
use BaconQrCode\Renderer\Image\SvgImageBackEnd;
use BaconQrCode\Renderer\RendererStyle\RendererStyle;
use BaconQrCode\Writer;
use PragmaRX\Google2FA\Google2FA;

class TwoFactorAuthService
{
    protected $google2fa;

    public function __construct()
    {
        $this->google2fa = new Google2FA();
    }

    /**
     * Générer une clé secrète pour 2FA
     */
    public function generateSecretKey(): string
    {
        return $this->google2fa->generateSecretKey();
    }

    /**
     * Générer l'URL du QR Code pour Google Authenticator
     */
    public function getQRCodeUrl(string $email, string $secret): string
    {
        $appName = config('app.name', 'Pi Staking');
        
        return $this->google2fa->getQRCodeUrl(
            $appName,
            $email,
            $secret
        );
    }

    /**
     * Générer le QR Code en format SVG
     */
    public function getQRCodeSVG(string $email, string $secret): string
    {
        $qrCodeUrl = $this->getQRCodeUrl($email, $secret);
        
        $renderer = new ImageRenderer(
            new RendererStyle(200),
            new SvgImageBackEnd()
        );
        
        $writer = new Writer($renderer);
        
        return $writer->writeString($qrCodeUrl);
    }

    /**
     * Vérifier un code TOTP
     */
    public function verifyCode(string $secret, string $code): bool
    {
        return $this->google2fa->verifyKey($secret, $code, 2); // 2 = fenêtre de tolérance (±60 secondes)
    }

    /**
     * Générer des codes de récupération
     */
    public function generateBackupCodes(int $count = 8): array
    {
        $codes = [];
        for ($i = 0; $i < $count; $i++) {
            $codes[] = strtoupper(substr(bin2hex(random_bytes(4)), 0, 8));
        }
        return $codes;
    }

    /**
     * Vérifier si le 2FA est requis pour une action donnée
     */
    public function is2FARequired(string $action, float $amount = null): bool
    {
        $config = config('security.2fa_required', []);
        
        // Actions toujours protégées par 2FA
        $alwaysRequired = [
            'disable_2fa',
            'change_password',
            'change_email',
            'export_data'
        ];
        
        if (in_array($action, $alwaysRequired)) {
            return true;
        }
        
        // Vérification par montant pour les transactions
        if ($action === 'withdrawal' && $amount !== null) {
            $threshold = $config['withdrawal_threshold'] ?? 100;
            return $amount >= $threshold;
        }
        
        if ($action === 'investment' && $amount !== null) {
            $threshold = $config['investment_threshold'] ?? 1000;
            return $amount >= $threshold;
        }
        
        return false;
    }

    /**
     * Obtenir les statistiques d'utilisation 2FA
     */
    public function get2FAStats(): array
    {
        return [
            'total_users_with_2fa' => \App\Models\User::where('two_factor_enabled', true)->count(),
            'total_users' => \App\Models\User::count(),
            'adoption_rate' => $this->calculate2FAAdoptionRate(),
            'daily_verifications' => $this->getDailyVerificationCount(),
            'failed_attempts_today' => $this->getFailedAttemptsToday()
        ];
    }

    private function calculate2FAAdoptionRate(): float
    {
        $totalUsers = \App\Models\User::count();
        if ($totalUsers === 0) return 0;
        
        $usersWithTwoFA = \App\Models\User::where('two_factor_enabled', true)->count();
        return round(($usersWithTwoFA / $totalUsers) * 100, 2);
    }

    private function getDailyVerificationCount(): int
    {
        return \App\Models\UserSecurityLog::where('action', 'successful_2fa_verification')
            ->whereDate('created_at', today())
            ->count();
    }

    private function getFailedAttemptsToday(): int
    {
        return \App\Models\UserSecurityLog::where('action', 'failed_2fa_verification')
            ->whereDate('created_at', today())
            ->count();
    }
}