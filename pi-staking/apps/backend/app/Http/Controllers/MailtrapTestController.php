<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class MailtrapTestController extends Controller
{
    private $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    /**
     * Page de test de Mailtrap
     */
    public function index()
    {
        $config = [
            'mailer' => config('mail.default'),
            'host' => config('mail.mailers.smtp.host'),
            'port' => config('mail.mailers.smtp.port'),
            'username' => config('mail.mailers.smtp.username'),
            'from_address' => config('mail.from.address'),
            'from_name' => config('mail.from.name'),
        ];

        return response()->json([
            'message' => 'Interface de test Mailtrap pour Pi Staking',
            'configuration' => $config,
            'endpoints' => [
                'POST /test-mailtrap/simple' => 'Test email simple',
                'POST /test-mailtrap/security' => 'Test notification sécurité',
                'POST /test-mailtrap/withdrawal' => 'Test code vérification retrait',
                'POST /test-mailtrap/suspicious' => 'Test connexion suspecte',
                'POST /test-mailtrap/large-withdrawal' => 'Test gros retrait',
                'POST /test-mailtrap/2fa' => 'Test changement 2FA',
                'POST /test-mailtrap/summary' => 'Test résumé hebdomadaire',
                'POST /test-mailtrap/all' => 'Test tous les emails'
            ]
        ]);
    }

    /**
     * Test email simple
     */
    public function testSimple(Request $request)
    {
        $email = $request->input('email', 'test@example.com');
        
        try {
            $testUser = $this->createTestUser($email);
            
            Mail::send('emails.security-notification', [
                'user' => $testUser,
                'message' => 'Test simple de configuration Mailtrap pour Pi Staking.',
                'details' => [
                    'type' => 'Test API simple',
                    'status' => 'Succès',
                    'timestamp' => now()->format('d/m/Y H:i:s'),
                    'ip' => $request->ip()
                ]
            ], function ($message) use ($testUser) {
                $message->to($testUser->email)
                        ->subject('[TEST API] Configuration Mailtrap Pi Staking');
            });

            return response()->json([
                'success' => true,
                'message' => 'Email simple envoyé avec succès',
                'email' => $email
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur test email simple: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'envoi: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Test notification de sécurité
     */
    public function testSecurity(Request $request)
    {
        $email = $request->input('email', 'test@example.com');
        
        try {
            $testUser = $this->createTestUser($email);
            
            $result = $this->notificationService->sendSecurityNotification(
                $testUser,
                'Test API - Notification de sécurité',
                [
                    'message' => 'Test de notification de sécurité depuis l\'API Mailtrap.',
                    'details' => [
                        'type' => 'Test API automatique',
                        'origine' => 'Interface web',
                        'user_agent' => $request->header('User-Agent')
                    ]
                ]
            );

            return response()->json([
                'success' => $result,
                'message' => $result ? 'Notification de sécurité envoyée' : 'Échec de l\'envoi',
                'email' => $email
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur test notification sécurité: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'envoi: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Test vérification retrait
     */
    public function testWithdrawal(Request $request)
    {
        $email = $request->input('email', 'test@example.com');
        $amount = $request->input('amount', 100.5432);
        
        try {
            $testUser = $this->createTestUser($email);
            
            $result = $this->notificationService->sendWithdrawalVerificationEmail(
                $testUser,
                $this->generateTestCode(),
                $amount
            );

            return response()->json([
                'success' => $result,
                'message' => $result ? 'Code de vérification envoyé' : 'Échec de l\'envoi',
                'email' => $email,
                'amount' => $amount
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur test vérification retrait: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'envoi: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Test connexion suspecte
     */
    public function testSuspicious(Request $request)
    {
        $email = $request->input('email', 'test@example.com');
        
        try {
            $testUser = $this->createTestUser($email);
            
            $result = $this->notificationService->sendSuspiciousLoginAlert($testUser, [
                'ip' => $request->input('ip', $request->ip()),
                'location' => $request->input('location', 'Paris, France'),
                'device' => $request->input('device', 'Test Device - Chrome'),
            ]);

            return response()->json([
                'success' => $result,
                'message' => $result ? 'Alerte connexion suspecte envoyée' : 'Échec de l\'envoi',
                'email' => $email
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur test connexion suspecte: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'envoi: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Test tous les emails
     */
    public function testAll(Request $request)
    {
        $email = $request->input('email', 'test@example.com');
        $results = [];
        
        try {
            $testUser = $this->createTestUser($email);
            
            // Test simple
            try {
                Mail::send('emails.security-notification', [
                    'user' => $testUser,
                    'message' => 'Test complet - Email simple'
                ], function ($message) use ($testUser) {
                    $message->to($testUser->email)->subject('[TEST] Email simple');
                });
                $results['simple'] = true;
            } catch (\Exception $e) {
                $results['simple'] = false;
            }

            // Test notifications
            $results['security'] = $this->notificationService->sendSecurityNotification(
                $testUser, 'Test complet - Sécurité', ['message' => 'Test automatique']
            );
            
            $results['withdrawal'] = $this->notificationService->sendWithdrawalVerificationEmail(
                $testUser, $this->generateTestCode(), 250.0
            );
            
            $results['suspicious'] = $this->notificationService->sendSuspiciousLoginAlert($testUser, [
                'ip' => $request->ip(),
                'location' => 'Test Location',
                'device' => 'Test Device'
            ]);
            
            $results['large_withdrawal'] = $this->notificationService->sendLargeWithdrawalNotification(
                $testUser, 1000.0
            );
            
            $results['2fa'] = $this->notificationService->send2FAStatusNotification($testUser, true);
            
            // Le résumé hebdomadaire nécessite des données simulées
            $testUser->two_factor_enabled = true;
            $results['summary'] = $this->notificationService->sendWeeklySecuritySummary($testUser);

            $successCount = count(array_filter($results));
            $totalCount = count($results);

            return response()->json([
                'success' => $successCount > 0,
                'message' => "Tests terminés: {$successCount}/{$totalCount} réussis",
                'email' => $email,
                'results' => $results,
                'summary' => [
                    'total' => $totalCount,
                    'success' => $successCount,
                    'failed' => $totalCount - $successCount
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur test complet: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors des tests: ' . $e->getMessage(),
                'results' => $results
            ], 500);
        }
    }

    /**
     * Créer un utilisateur de test temporaire
     */
    private function createTestUser($email)
    {
        return new User([
            'name' => 'Test User - Mailtrap',
            'email' => $email,
            'email_verified_at' => now(),
            'two_factor_enabled' => false,
            'created_at' => now(),
            'password_changed_at' => now()->subDays(15)
        ]);
    }

    /**
     * Générer un code de test
     */
    private function generateTestCode()
    {
        return str_pad(rand(0, 999999), 6, '0', STR_PAD_LEFT);
    }
}