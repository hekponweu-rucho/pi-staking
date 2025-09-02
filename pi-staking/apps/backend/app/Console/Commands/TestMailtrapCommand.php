<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class TestMailtrapCommand extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'mailtrap:test {--email=test@example.com} {--type=all}';

    /**
     * The console command description.
     */
    protected $description = 'Tester la configuration Mailtrap avec différents types d\'emails';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $email = $this->option('email');
        $type = $this->option('type');
        
        $this->info("🧪 Test de la configuration Mailtrap");
        $this->info("📧 Email de test: {$email}");
        $this->info("📋 Type de test: {$type}");
        $this->newLine();
        
        // Créer un utilisateur de test temporaire
        $testUser = new User([
            'name' => 'Utilisateur Test',
            'email' => $email,
            'email_verified_at' => now(),
            'two_factor_enabled' => false,
            'created_at' => now(),
            'password_changed_at' => now()->subDays(10)
        ]);
        
        $notificationService = new NotificationService();
        
        try {
            $this->info("🔧 Vérification de la configuration mail...");
            
            // Test de la configuration de base
            $this->table(
                ['Configuration', 'Valeur'],
                [
                    ['MAIL_MAILER', config('mail.default')],
                    ['MAIL_HOST', config('mail.mailers.smtp.host')],
                    ['MAIL_PORT', config('mail.mailers.smtp.port')],
                    ['MAIL_USERNAME', config('mail.mailers.smtp.username')],
                    ['MAIL_FROM_ADDRESS', config('mail.from.address')],
                    ['MAIL_FROM_NAME', config('mail.from.name')]
                ]
            );
            
            $this->newLine();
            
            if ($type === 'all' || $type === 'simple') {
                $this->testSimpleEmail($testUser);
            }
            
            if ($type === 'all' || $type === 'security') {
                $this->testSecurityNotification($testUser, $notificationService);
            }
            
            if ($type === 'all' || $type === 'withdrawal') {
                $this->testWithdrawalVerification($testUser, $notificationService);
            }
            
            if ($type === 'all' || $type === 'suspicious') {
                $this->testSuspiciousLogin($testUser, $notificationService);
            }
            
            if ($type === 'all' || $type === 'large-withdrawal') {
                $this->testLargeWithdrawal($testUser, $notificationService);
            }
            
            if ($type === 'all' || $type === '2fa') {
                $this->test2FAStatusChange($testUser, $notificationService);
            }
            
            if ($type === 'all' || $type === 'summary') {
                $this->testWeeklySummary($testUser, $notificationService);
            }
            
            $this->newLine();
            $this->info("✅ Tests terminés avec succès!");
            $this->info("📧 Vérifiez votre boîte mail Mailtrap pour voir les emails envoyés.");
            
        } catch (\Exception $e) {
            $this->error("❌ Erreur lors du test: " . $e->getMessage());
            $this->error("Détails: " . $e->getFile() . ':' . $e->getLine());
            Log::error('Erreur test Mailtrap: ' . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
        }
    }
    
    private function testSimpleEmail($testUser)
    {
        $this->info("📨 Test 1: Email simple...");
        
        Mail::send('emails.security-notification', [
            'user' => $testUser,
            'message' => 'Ceci est un test de configuration Mailtrap pour Pi Staking.',
            'details' => [
                'type' => 'Test de configuration',
                'status' => 'Succès',
                'timestamp' => now()->format('d/m/Y H:i:s')
            ]
        ], function ($message) use ($testUser) {
            $message->to($testUser->email)
                    ->subject('[TEST] Configuration Mailtrap Pi Staking');
        });
        
        $this->info("   ✅ Email simple envoyé");
    }
    
    private function testSecurityNotification($testUser, $notificationService)
    {
        $this->info("📨 Test 2: Notification de sécurité...");
        
        $result = $notificationService->sendSecurityNotification(
            $testUser,
            'Test de notification de sécurité',
            [
                'message' => 'Test de notification de sécurité depuis la commande Mailtrap.',
                'details' => [
                    'type' => 'Test automatique',
                    'origine' => 'Commande Artisan'
                ]
            ]
        );
        
        $this->info("   " . ($result ? "✅" : "❌") . " Notification de sécurité " . ($result ? "envoyée" : "échouée"));
    }
    
    private function testWithdrawalVerification($testUser, $notificationService)
    {
        $this->info("📨 Test 3: Vérification de retrait...");
        
        $result = $notificationService->sendWithdrawalVerificationEmail(
            $testUser,
            '123456',
            100.5432
        );
        
        $this->info("   " . ($result ? "✅" : "❌") . " Email de vérification retrait " . ($result ? "envoyé" : "échoué"));
    }
    
    private function testSuspiciousLogin($testUser, $notificationService)
    {
        $this->info("📨 Test 4: Connexion suspecte...");
        
        $result = $notificationService->sendSuspiciousLoginAlert($testUser, [
            'ip' => '192.168.1.100',
            'location' => 'Paris, France',
            'device' => 'Chrome sur Windows 10',
        ]);
        
        $this->info("   " . ($result ? "✅" : "❌") . " Alerte connexion suspecte " . ($result ? "envoyée" : "échouée"));
    }
    
    private function testLargeWithdrawal($testUser, $notificationService)
    {
        $this->info("📨 Test 5: Gros retrait...");
        
        $result = $notificationService->sendLargeWithdrawalNotification($testUser, 1000.0);
        
        $this->info("   " . ($result ? "✅" : "❌") . " Notification gros retrait " . ($result ? "envoyée" : "échouée"));
    }
    
    private function test2FAStatusChange($testUser, $notificationService)
    {
        $this->info("📨 Test 6: Changement statut 2FA...");
        
        $result = $notificationService->send2FAStatusNotification($testUser, true);
        
        $this->info("   " . ($result ? "✅" : "❌") . " Notification 2FA " . ($result ? "envoyée" : "échouée"));
    }
    
    private function testWeeklySummary($testUser, $notificationService)
    {
        $this->info("📨 Test 7: Résumé hebdomadaire...");
        
        // Simuler les données pour le test
        $testUser->two_factor_enabled = true;
        
        $result = $notificationService->sendWeeklySecuritySummary($testUser);
        
        $this->info("   " . ($result ? "✅" : "❌") . " Résumé hebdomadaire " . ($result ? "envoyé" : "échoué"));
    }
}