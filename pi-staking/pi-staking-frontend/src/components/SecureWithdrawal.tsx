import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  Smartphone, 
  Mail, 
  Clock, 
  AlertTriangle, 
  CheckCircle,
  ArrowLeft,
  Send
} from 'lucide-react';
import api from '@/lib/api';
import { emailVerificationService } from '../services/emailVerificationService';
import { useAuth } from '../contexts/AuthContext';
import { EmailVerifiedGuard } from './EmailVerifiedGuard';

// Types pour la vérification
interface VerificationStep {
  step: 'amount' | '2fa' | 'verification' | 'success';
  data?: any;
}

interface WithdrawalLimits {
  daily_limit: number;
  used_today: number;
  remaining: number;
  level: string;
}

interface VerificationMethod {
  method: 'email' | 'sms' | 'both';
  display: string;
  available: boolean;
}

// Composant principal pour les retraits sécurisés
export function SecureWithdrawal() {
  const { state } = useAuth();
  const { user } = state;
  const [currentStep, setCurrentStep] = useState<VerificationStep>({ step: 'amount' });
  const [amount, setAmount] = useState('');
  const [limits, setLimits] = useState<WithdrawalLimits | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // États pour 2FA
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [twoFactorToken, setTwoFactorToken] = useState('');
  
  // États pour vérification email/SMS
  const [verificationMethod, setVerificationMethod] = useState<'email' | 'sms' | 'both'>('email');
  const [emailCode, setEmailCode] = useState('');
  const [smsCode, setSmsCode] = useState('');
  const [verificationId, setVerificationId] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(0);
  
  useEffect(() => {
    loadWithdrawalLimits();
  }, []);

  // Timer pour les codes de vérification
  useEffect(() => {
    if (timeRemaining > 0) {
      const timer = setTimeout(() => {
        setTimeRemaining(timeRemaining - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [timeRemaining]);

  const loadWithdrawalLimits = async () => {
    try {
      const response = await api.get('/security/withdrawal/limits');
      setLimits(response.data.data);
    } catch (error) {
      console.error('Erreur chargement limites:', error);
    }
  };

  const validateAmount = () => {
    const amountNum = parseFloat(amount);
    
    if (!amount || amountNum <= 0) {
      setError('Veuillez entrer un montant valide');
      return false;
    }

    if (limits && amountNum > limits.remaining) {
      setError(`Montant supérieur à votre limite journalière restante (${limits.remaining.toFixed(2)} π)`);
      return false;
    }

    setError('');
    return true;
  };

  const handleAmountNext = () => {
    if (!validateAmount()) return;
    
    const amountNum = parseFloat(amount);
    
    // Vérifier si 2FA est requis (seuil par défaut: 100π)
    const requires2FA = amountNum >= 100;
    
    if (requires2FA) {
      setCurrentStep({ step: '2fa', data: { amount: amountNum } });
    } else {
      setCurrentStep({ step: 'verification', data: { amount: amountNum } });
    }
  };

  const handle2FAVerification = async () => {
    if (!twoFactorCode) {
      setError('Veuillez entrer votre code 2FA');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await api.post('/security/2fa/verify', {
        code: twoFactorCode,
        action: 'withdrawal'
      });

      setTwoFactorToken(response.data.data.verification_token);
      setCurrentStep({ 
        step: 'verification', 
        data: { 
          amount: currentStep.data.amount,
          twoFactorVerified: true 
        } 
      });
      setSuccess('Vérification 2FA réussie !');
    } catch (error: any) {
      setError(error.response?.data?.message || 'Code 2FA invalide');
    } finally {
      setLoading(false);
    }
  };

  const initializeVerification = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await api.post('/security/withdrawal/initiate-verification', {
        amount: currentStep.data.amount,
        method: verificationMethod
      });

      setVerificationId(response.data.data.verification_id);
      setTimeRemaining(300); // 5 minutes
      setSuccess(`Code(s) de vérification envoyé(s) par ${verificationMethod === 'both' ? 'email et SMS' : verificationMethod}`);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Erreur lors de l\'envoi des codes');
    } finally {
      setLoading(false);
    }
  };

  const confirmVerification = async () => {
    if (verificationMethod === 'email' && !emailCode) {
      setError('Veuillez entrer le code reçu par email');
      return;
    }
    
    if (verificationMethod === 'sms' && !smsCode) {
      setError('Veuillez entrer le code reçu par SMS');
      return;
    }
    
    if (verificationMethod === 'both' && (!emailCode || !smsCode)) {
      setError('Veuillez entrer les deux codes de vérification');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await api.post('/security/withdrawal/confirm-verification', {
        amount: currentStep.data.amount,
        email_code: emailCode || undefined,
        sms_code: smsCode || undefined
      });

      // Processus de retrait maintenant autorisé
      await processWithdrawal(response.data.data.withdrawal_token);
      
      setCurrentStep({ step: 'success', data: { amount: currentStep.data.amount } });
    } catch (error: any) {
      setError(error.response?.data?.message || 'Codes de vérification invalides');
    } finally {
      setLoading(false);
    }
  };

  const processWithdrawal = async (withdrawalToken: string) => {
    try {
      // Au lieu d'exécuter directement le retrait, on crée une demande de retrait en attente
      const response = await api.post('/withdrawals/create-pending', {
        amount: currentStep.data.amount,
        verification_token: withdrawalToken
      });
      
      const { withdrawal_id, pi_address } = response.data.data;
      
      // Envoyer l'email de vérification pour ce retrait
      const emailResult = await emailVerificationService.sendWithdrawalVerification({
        withdrawal_id,
        email: user?.email || '',
        amount: currentStep.data.amount,
        pi_address
      });
      
      if (!emailResult.success) {
        throw new Error(emailResult.message || 'Erreur lors de l\'envoi de l\'email de vérification');
      }
      
      setSuccess('Email de confirmation envoyé ! Vérifiez votre boîte de réception pour confirmer le retrait.');
      
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erreur lors de la création du retrait');
    }
  };

  const resetProcess = () => {
    setCurrentStep({ step: 'amount' });
    setAmount('');
    setTwoFactorCode('');
    setEmailCode('');
    setSmsCode('');
    setError('');
    setSuccess('');
    setTimeRemaining(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const verificationMethods: VerificationMethod[] = [
    { method: 'email', display: 'Email uniquement', available: true },
    { method: 'sms', display: 'SMS uniquement', available: true }, // À ajuster selon le statut du téléphone
    { method: 'both', display: 'Email et SMS', available: true }
  ];

  return (
    <EmailVerifiedGuard 
      feature="les retraits sécurisés"
      message="Pour votre sécurité, vous devez vérifier votre adresse email avant d'effectuer des retraits."
    >
      <div className="max-w-2xl mx-auto space-y-6">
      {/* Progress bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium">Étape {getCurrentStepNumber()}/4</span>
            <span className="text-sm text-muted-foreground">Retrait sécurisé</span>
          </div>
          <Progress value={getProgressPercentage()} className="h-2" />
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>Montant</span>
            <span>2FA</span>
            <span>Vérification</span>
            <span>Confirmé</span>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Étape 1: Montant */}
      {currentStep.step === 'amount' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-pi-gold" />
              Retrait Sécurisé - Montant
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {limits && (
              <div className="p-4 bg-muted/50 rounded-lg">
                <h3 className="font-medium mb-3">Limites de retrait</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Limite journalière ({limits.level}):</span>
                    <span className="font-mono">{limits.daily_limit.toFixed(2)} π</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Déjà utilisé aujourd'hui:</span>
                    <span className="font-mono">{limits.used_today.toFixed(2)} π</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>Restant:</span>
                    <span className="font-mono text-green-600">{limits.remaining.toFixed(2)} π</span>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <Label htmlFor="amount">Montant à retirer (π)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="text-lg"
              />
              <p className="text-sm text-muted-foreground">
                {parseFloat(amount) >= 100 && (
                  <span className="flex items-center gap-1 text-yellow-600">
                    <AlertTriangle className="h-4 w-4" />
                    Montant élevé - Vérification 2FA requise
                  </span>
                )}
              </p>
            </div>

            <Button 
              onClick={handleAmountNext}
              disabled={!amount || parseFloat(amount) <= 0}
              className="w-full pi-gradient text-white"
            >
              Continuer
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Étape 2: Vérification 2FA */}
      {currentStep.step === '2fa' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-pi-gold" />
              Vérification 2FA Requise
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                <div>
                  <p className="font-medium">Montant élevé détecté</p>
                  <p className="text-sm text-muted-foreground">
                    Le retrait de {currentStep.data?.amount.toFixed(2)} π nécessite une vérification 2FA
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="2fa-code">Code 2FA</Label>
              <Input
                id="2fa-code"
                type="text"
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                maxLength={6}
                className="text-center text-lg tracking-wider"
              />
              <p className="text-sm text-muted-foreground">
                Entrez le code à 6 chiffres généré par votre app d'authentification
              </p>
            </div>

            <div className="flex gap-3">
              <Button 
                variant="outline"
                onClick={() => setCurrentStep({ step: 'amount' })}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
              <Button 
                onClick={handle2FAVerification}
                disabled={loading || twoFactorCode.length !== 6}
                className="flex-1 pi-gradient text-white"
              >
                {loading ? 'Vérification...' : 'Vérifier 2FA'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Étape 3: Vérification Email/SMS */}
      {currentStep.step === 'verification' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-pi-gold" />
              Vérification Supplémentaire
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {!verificationId ? (
              <>
                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <p className="font-medium mb-2">Dernière étape de sécurité</p>
                  <p className="text-sm text-muted-foreground">
                    Pour finaliser le retrait de {currentStep.data?.amount.toFixed(2)} π, 
                    nous devons vérifier votre identité par email et/ou SMS.
                  </p>
                </div>

                <div className="space-y-3">
                  <Label>Méthode de vérification</Label>
                  <RadioGroup 
                    value={verificationMethod} 
                    onValueChange={(value: any) => setVerificationMethod(value)}
                  >
                    {verificationMethods.map((method) => (
                      <div key={method.method} className="flex items-center space-x-2">
                        <RadioGroupItem 
                          value={method.method} 
                          id={method.method}
                          disabled={!method.available}
                        />
                        <Label htmlFor={method.method} className={!method.available ? 'text-muted-foreground' : ''}>
                          {method.display}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div className="flex gap-3">
                  <Button 
                    variant="outline"
                    onClick={() => setCurrentStep({ step: currentStep.data?.twoFactorVerified ? '2fa' : 'amount' })}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Retour
                  </Button>
                  <Button 
                    onClick={initializeVerification}
                    disabled={loading}
                    className="flex-1 pi-gradient text-white"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {loading ? 'Envoi...' : 'Envoyer les codes'}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Codes envoyés !</p>
                      <p className="text-sm text-muted-foreground">
                        Vérifiez vos messages
                      </p>
                    </div>
                    {timeRemaining > 0 && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-green-500" />
                        <span className="font-mono text-sm">{formatTime(timeRemaining)}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  {(verificationMethod === 'email' || verificationMethod === 'both') && (
                    <div className="space-y-2">
                      <Label htmlFor="email-code">Code reçu par email</Label>
                      <Input
                        id="email-code"
                        type="text"
                        value={emailCode}
                        onChange={(e) => setEmailCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="123456"
                        maxLength={6}
                        className="text-center text-lg tracking-wider"
                      />
                    </div>
                  )}

                  {(verificationMethod === 'sms' || verificationMethod === 'both') && (
                    <div className="space-y-2">
                      <Label htmlFor="sms-code">Code reçu par SMS</Label>
                      <Input
                        id="sms-code"
                        type="text"
                        value={smsCode}
                        onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="123456"
                        maxLength={6}
                        className="text-center text-lg tracking-wider"
                      />
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <Button 
                    variant="outline"
                    onClick={() => setVerificationId('')}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Modifier méthode
                  </Button>
                  <Button 
                    onClick={confirmVerification}
                    disabled={loading || timeRemaining === 0}
                    className="flex-1 pi-gradient text-white"
                  >
                    {loading ? 'Vérification...' : 'Confirmer le retrait'}
                  </Button>
                </div>

                {timeRemaining === 0 && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Les codes ont expiré. Veuillez recommencer le processus.
                    </AlertDescription>
                  </Alert>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Étape 4: Succès */}
      {currentStep.step === 'success' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Retrait Confirmé
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 mx-auto rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-green-500" />
              </div>
              
              <div>
                <h3 className="text-lg font-semibold">Retrait traité avec succès !</h3>
                <p className="text-muted-foreground">
                  Votre demande de retrait de {currentStep.data?.amount.toFixed(2)} π a été confirmée
                </p>
              </div>

              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <p className="text-sm">
                  Le retrait sera traité dans les prochaines heures. 
                  Vous pouvez suivre le statut dans votre historique de transactions.
                </p>
              </div>
            </div>

            <Button 
              onClick={resetProcess}
              className="w-full"
              variant="outline"
            >
              Effectuer un nouveau retrait
            </Button>
          </CardContent>
        </Card>
      )}
      </div>
    </EmailVerifiedGuard>
  );

  function getCurrentStepNumber(): number {
    switch (currentStep.step) {
      case 'amount': return 1;
      case '2fa': return 2;
      case 'verification': return 3;
      case 'success': return 4;
      default: return 1;
    }
  }

  function getProgressPercentage(): number {
    switch (currentStep.step) {
      case 'amount': return 25;
      case '2fa': return 50;
      case 'verification': return 75;
      case 'success': return 100;
      default: return 0;
    }
  }
}