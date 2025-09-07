import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { ParticleBackground } from '@/components/ParticleBackground';
import { 
  Mail, 
  CheckCircle, 
  Clock, 
  RefreshCw, 
  AlertCircle,
  ArrowLeft 
} from 'lucide-react';
import { emailVerificationService } from '../services/emailVerificationService';
import { useAuth } from '../contexts/AuthContext';

interface EmailVerificationPageProps {
  email?: string;
  type: 'registration' | 'withdrawal';
  onBack?: () => void;
  onVerified?: () => void;
}

export function EmailVerificationPage({ 
  email = '', 
  type, 
  onBack, 
  onVerified 
}: EmailVerificationPageProps) {
  const { state, refreshUser } = useAuth();
  const user = state.user;
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [userEmail, setUserEmail] = useState(email || user?.email || '');

  // Countdown pour resend
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Vérifier l'URL pour un token de vérification
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const hash = urlParams.get('hash');
    
    if (token && hash && type === 'registration') {
      handleVerifyEmail(token, hash);
    }
  }, []);

  const handleVerifyEmail = async (token: string, hash: string) => {
    setIsLoading(true);
    setError('');
    
    try {
      const result = await emailVerificationService.verifyEmail(token, hash);
      
      if (result.success) {
        setMessage('Email vérifié avec succès ! Vous pouvez maintenant accéder à toutes les fonctionnalités.');
        
        // Actualiser les données utilisateur
        if (refreshUser) {
          await refreshUser();
        }
        
        // Rediriger après 2 secondes
        setTimeout(() => {
          if (onVerified) {
            onVerified();
          }
        }, 2000);
        
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError('Erreur lors de la vérification. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!userEmail || resendCooldown > 0) return;
    
    setIsLoading(true);
    setError('');
    setMessage('');
    
    try {
      const result = await emailVerificationService.resendVerification({
        email: userEmail,
        type
      });
      
      if (result.success) {
        setMessage('Email de vérification renvoyé avec succès ! Vérifiez votre boîte de réception.');
        setResendCooldown(60); // 60 secondes de cooldown
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError('Erreur lors de l\'envoi. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  const isRegistrationType = type === 'registration';
  const title = isRegistrationType ? 'Vérification Email' : 'Confirmation de Retrait';
  const description = emailVerificationService.getVerificationInstructions(type);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4 relative">
      <ParticleBackground />
      
      {/* Bouton retour */}
      {onBack && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="absolute top-4 left-4 z-20 backdrop-blur-sm bg-card/80 hover:bg-card/90"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
      )}
      
      <div className="relative z-10 w-full max-w-md">
        <Card className="backdrop-blur-sm bg-card/80 border border-border/50">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-4 rounded-full bg-pi-primary/20">
                <Mail className="h-8 w-8 text-pi-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl">{title}</CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Message d'instructions */}
            <div className="text-center">
              <p className="text-muted-foreground mb-4">{description}</p>
              {userEmail && (
                <p className="text-sm font-medium">Email: <span className="text-pi-primary">{userEmail}</span></p>
              )}
            </div>

            {/* Messages de succès/erreur */}
            {message && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}
            
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Formulaire pour changer d'email si nécessaire */}
            {isRegistrationType && !user?.email_verified_at && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Adresse email</label>
                  <Input
                    type="email"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    placeholder="votre@email.com"
                    disabled={isLoading}
                  />
                </div>
                
                <Button
                  onClick={handleResendVerification}
                  disabled={isLoading || resendCooldown > 0 || !userEmail}
                  className="w-full pi-gradient text-white hover:pi-gradient-hover"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Envoi en cours...
                    </>
                  ) : resendCooldown > 0 ? (
                    <>
                      <Clock className="h-4 w-4 mr-2" />
                      Renvoyer dans {resendCooldown}s
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-2" />
                      Renvoyer l'email
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Instructions supplémentaires */}
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-4 w-4 mt-0.5 text-green-500" />
                <span>Vérifiez votre boîte de réception et les spams</span>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="h-4 w-4 mt-0.5 text-yellow-500" />
                <span>Le lien expire après 24 heures</span>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="h-4 w-4 mt-0.5 text-blue-500" />
                <span>Un seul clic suffit pour vérifier</span>
              </div>
            </div>

            {/* Aide */}
            <div className="text-center pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                Vous ne recevez pas l'email ? Vérifiez vos spams ou{' '}
                <button
                  onClick={() => resendCooldown === 0 && handleResendVerification()}
                  className="text-pi-primary hover:underline"
                  disabled={resendCooldown > 0}
                >
                  renvoyez-le
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}