import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Gift, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { AnimatedCounter } from './AnimatedCounter';
import { claimsService } from '@/services/claimsService';
import { useAuth } from '@/contexts/AuthContext';

interface ClaimButtonProps {
  investmentId: number;
  canClaim: boolean;
  expectedAmount: number;
  className?: string;
  onClaimSuccess?: () => void;
}

export function ClaimButton({ 
  investmentId, 
  canClaim, 
  expectedAmount, 
  className = '',
  onClaimSuccess 
}: ClaimButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'ready' | 'success' | 'error'>('ready');
  const [errorMessage, setErrorMessage] = useState('');
  const { refreshUser } = useAuth();

  const handleClaim = async () => {
    if (!canClaim || isLoading) return;

    setIsLoading(true);
    setStatus('ready');
    setErrorMessage('');

    try {
      const response = await claimsService.claimInvestment(investmentId);
      
      if (response.success) {
        setStatus('success');
        await refreshUser();
        onClaimSuccess?.();
        
        // Reset status after 3 seconds
        setTimeout(() => setStatus('ready'), 3000);
      } else {
        setStatus('error');
        setErrorMessage(response.message || 'Erreur lors de la réclamation');
        setTimeout(() => setStatus('ready'), 3000);
      }
    } catch (error) {
      setStatus('error');
      setErrorMessage('Erreur de connexion');
      setTimeout(() => setStatus('ready'), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  if (!canClaim && status === 'ready') {
    return (
      <Badge variant="outline" className={`opacity-50 ${className}`}>
        <Gift className="h-3 w-3 mr-1" />
        Pas encore disponible
      </Badge>
    );
  }

  if (status === 'success') {
    return (
      <Badge className={`bg-green-500 text-white ${className}`}>
        <CheckCircle className="h-3 w-3 mr-1" />
        Réclamé avec succès !
      </Badge>
    );
  }

  if (status === 'error') {
    return (
      <Badge variant="destructive" className={className}>
        <AlertCircle className="h-3 w-3 mr-1" />
        {errorMessage}
      </Badge>
    );
  }

  return (
    <Button
      onClick={handleClaim}
      disabled={!canClaim || isLoading}
      size="sm"
      className={`pi-gradient text-white hover:pi-gradient-hover ${className}`}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          Réclamation...
        </>
      ) : (
        <>
          <Gift className="h-3 w-3 mr-1" />
          Réclamer <AnimatedCounter value={expectedAmount} decimals={2} suffix=" Pi" />
        </>
      )}
    </Button>
  );
}