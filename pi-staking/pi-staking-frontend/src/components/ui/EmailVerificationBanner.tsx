import * as React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Mail, RefreshCw } from 'lucide-react';
import { emailVerificationService } from '@/services/emailVerificationService';
import { toast } from 'sonner';

interface EmailVerificationBannerProps {
  email?: string;
}

export function EmailVerificationBanner({ email }: EmailVerificationBannerProps) {
  const [loading, setLoading] = React.useState(false);
  const [cooldown, setCooldown] = React.useState(0);

  React.useEffect(() => {
    if (cooldown > 0) {
      const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [cooldown]);

  const resend = async () => {
    if (!email || cooldown > 0) return;
    try {
      setLoading(true);
      const res = await emailVerificationService.resendVerification({ email, type: 'registration' });
      if (res.success) {
        toast.success("Email de vérification renvoyé");
        setCooldown(60);
      } else {
        toast.error(res.message || "Échec de l'envoi de l'email");
      }
    } catch (e) {
      toast.error("Erreur réseau. Réessayez.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Alert className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20">
      <Mail className="h-4 w-4" />
      <AlertDescription className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <span>
          Votre email n'est pas encore vérifié. Certaines fonctionnalités sont limitées. Vérifiez votre boîte de réception ou renvoyez l'email de vérification.
        </span>
        <Button onClick={resend} disabled={loading || cooldown > 0} variant="outline" className="border-yellow-500 text-yellow-700 dark:text-yellow-300">
          {loading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Mail className="h-4 w-4 mr-2" />}
          {cooldown > 0 ? `Renvoyer dans ${cooldown}s` : "Renvoyer l'email"}
        </Button>
      </AlertDescription>
    </Alert>
  );
}
