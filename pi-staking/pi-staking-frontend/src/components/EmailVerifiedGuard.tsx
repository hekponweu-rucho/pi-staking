import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Mail, 
  Shield, 
  AlertTriangle, 
  RefreshCw, 
  CheckCircle 
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface EmailVerifiedGuardProps {
  children: React.ReactNode;
  feature?: string;
  message?: string;
  showAlternative?: boolean;
}

export function EmailVerifiedGuard({ 
  children, 
  feature = 'cette fonctionnalité',
  message,
  showAlternative = true 
}: EmailVerifiedGuardProps) {
  const { state, checkEmailVerified, sendEmailVerification } = useAuth();
  const { user, isLoading } = state;
  const [isResending, setIsResending] = React.useState(false);
  const [resendCooldown, setResendCooldown] = React.useState(0);

  // Countdown pour resend
  React.useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleResendEmail = async () => {
    if (!user?.email || resendCooldown > 0) return;
    
    setIsResending(true);
    
    try {
      const result = await sendEmailVerification(user.email);
      if (result.success) {
        setResendCooldown(60); // 60 secondes de cooldown
      }
    } catch (error) {
      console.error('Erreur lors du renvoi de l\'email:', error);
    } finally {
      setIsResending(false);
    }
  };

  // Si l'utilisateur n'est pas connecté ou en cours de chargement
  if (!user || isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-2 pi-gradient border-t-transparent"></div>
      </div>
    );
  }

  // Si l'email est vérifié, afficher le contenu
  if (checkEmailVerified()) {
    return <>{children}</>;
  }

  // Si l'email n'est pas vérifié, afficher la protection
  return (
    <Card className="border-2 border-yellow-200 dark:border-yellow-800 bg-yellow-50/50 dark:bg-yellow-900/10">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900/20">
            <Shield className="h-8 w-8 text-yellow-600" />
          </div>
        </div>
        <CardTitle className="flex items-center justify-center gap-2 text-yellow-800 dark:text-yellow-200">
          <AlertTriangle className="h-5 w-5" />
          Vérification Email Requise
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6 text-center">
        <Alert className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20">
          <Mail className="h-4 w-4" />
          <AlertDescription className="text-yellow-800 dark:text-yellow-200">
            {message || `Pour accéder à ${feature}, vous devez vérifier votre adresse email.`}
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Badge variant="outline" className="border-yellow-500 text-yellow-700 dark:text-yellow-300">
              Email: {user.email}
            </Badge>
          </div>
          
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-center justify-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Un email de vérification a été envoyé</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Mail className="h-4 w-4 text-blue-500" />
              <span>Cliquez sur le lien dans l'email</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <RefreshCw className="h-4 w-4 text-purple-500" />
              <span>Rechargez la page après vérification</span>
            </div>
          </div>

          <Button
            onClick={handleResendEmail}
            disabled={isResending || resendCooldown > 0}
            variant="outline"
            className="border-yellow-500 text-yellow-700 hover:bg-yellow-50 dark:text-yellow-300 dark:hover:bg-yellow-900/20"
          >
            {isResending ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Envoi en cours...
              </>
            ) : resendCooldown > 0 ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
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

        {/* Instructions supplémentaires */}
        <div className="pt-4 border-t border-yellow-200 dark:border-yellow-800">
          <p className="text-xs text-muted-foreground">
            Vous ne recevez pas l'email ? Vérifiez vos spams ou contactez le support.
          </p>
        </div>

        {/* Contenu alternatif si demandé */}
        {showAlternative && (
          <div className="pt-4 border-t border-yellow-200 dark:border-yellow-800">
            <p className="text-sm text-muted-foreground mb-3">
              En attendant, vous pouvez :
            </p>
            <div className="grid grid-cols-1 gap-2 text-sm">
              <div className="p-3 rounded-lg bg-background/50 border">
                ✅ Consulter votre tableau de bord
              </div>
              <div className="p-3 rounded-lg bg-background/50 border">
                ✅ Voir l'historique de vos transactions
              </div>
              <div className="p-3 rounded-lg bg-background/50 border">
                ✅ Configurer votre profil
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}