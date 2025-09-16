import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ParticleBackground } from '@/components/ParticleBackground';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Mail, 
  AlertCircle,
  ArrowLeft,
  Wallet,
  Timer
} from 'lucide-react';
import { emailVerificationService } from '../services/emailVerificationService';

interface WithdrawalVerificationPageProps {
  token?: string;
  onBack?: () => void;
  onConfirmed?: () => void;
  onCancelled?: () => void;
}

export function WithdrawalVerificationPage({ 
  token: initialToken,
  onBack, 
  onConfirmed, 
  onCancelled 
}: WithdrawalVerificationPageProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [withdrawalDetails, setWithdrawalDetails] = useState<any>(null);
  const [token, setToken] = useState(initialToken || '');
  const [actionCompleted, setActionCompleted] = useState(false);

  // Extraire le token depuis l'URL au montage
  useEffect(() => {
    if (!token) {
      const urlParams = new URLSearchParams(window.location.search);
      const urlToken = urlParams.get('token');
      if (urlToken) {
        setToken(urlToken);
      }
    }
  }, [token]);

  // Charger les détails du retrait quand on a un token
  useEffect(() => {
    if (token && !withdrawalDetails && !actionCompleted) {
      loadWithdrawalDetails();
    }
  }, [token, withdrawalDetails, actionCompleted]);

  const loadWithdrawalDetails = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const result = await emailVerificationService.getWithdrawalDetails(token);
      
      if (result.success && result.data) {
        setWithdrawalDetails(result.data);
      } else {
        setError(result.message || 'Retrait non trouvé ou token expiré');
      }
    } catch (error) {
      setError('Erreur lors du chargement des détails du retrait');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmWithdrawal = async () => {
    if (!token) return;
    
    setIsLoading(true);
    setError('');
    setMessage('');
    
    try {
      const result = await emailVerificationService.confirmWithdrawal(token);
      
      if (result.success) {
        setMessage('Retrait confirmé avec succès ! Le traitement va commencer.');
        setActionCompleted(true);
        
        // Rediriger après 3 secondes
        setTimeout(() => {
          if (onConfirmed) {
            onConfirmed();
          }
        }, 3000);
        
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError('Erreur lors de la confirmation du retrait');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelWithdrawal = async () => {
    if (!token) return;
    
    setIsLoading(true);
    setError('');
    setMessage('');
    
    try {
      const result = await emailVerificationService.cancelWithdrawal(token);
      
      if (result.success) {
        setMessage('Retrait annulé avec succès. Vos fonds restent sur votre compte.');
        setActionCompleted(true);
        
        // Rediriger après 3 secondes
        setTimeout(() => {
          if (onCancelled) {
            onCancelled();
          }
        }, 3000);
        
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError('Erreur lors de l\'annulation du retrait');
    } finally {
      setIsLoading(false);
    }
  };

  const formatPiAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 8,
      maximumFractionDigits: 8
    }).format(amount);
  };

  const getTimeRemaining = () => {
    if (!withdrawalDetails?.expires_at) return null;
    
    const expiry = new Date(withdrawalDetails.expires_at);
    const now = new Date();
    const diffMs = expiry.getTime() - now.getTime();
    
    if (diffMs <= 0) return 'Expiré';
    
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}min`;
  };

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
      
      <div className="relative z-10 w-full max-w-lg">
        <Card className="backdrop-blur-sm bg-card/80 border border-border/50">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-4 rounded-full bg-pi-primary/20">
                <Wallet className="h-8 w-8 text-pi-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl">Confirmation de Retrait</CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6">
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

            {/* Chargement */}
            {isLoading && !withdrawalDetails && (
              <div className="text-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-2 pi-gradient border-t-transparent mx-auto mb-4"></div>
                <p className="text-muted-foreground">Chargement des détails...</p>
              </div>
            )}

            {/* Détails du retrait */}
            {withdrawalDetails && !actionCompleted && (
              <div className="space-y-4">
                <div className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Montant</span>
                    <div className="text-right">
                      <div className="font-bold text-lg pi-purple">
                        {formatPiAmount(withdrawalDetails.amount)} Pi
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Adresse de destination</span>
                    <div className="text-right">
                      <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                        {withdrawalDetails.pi_address}
                      </code>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Date de demande</span>
                    <span className="text-sm">
                      {new Date(withdrawalDetails.created_at).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Expire dans</span>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Timer className="h-3 w-3" />
                      {getTimeRemaining()}
                    </Badge>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                  <p className="text-center text-sm text-muted-foreground">
                    Confirmez-vous ce retrait vers votre adresse Pi Network ?
                  </p>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      onClick={handleCancelWithdrawal}
                      variant="outline"
                      disabled={isLoading}
                      className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    >
                      {isLoading ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 mr-2" />
                          Annuler
                        </>
                      )}
                    </Button>
                    
                    <Button
                      onClick={handleConfirmWithdrawal}
                      disabled={isLoading}
                      className="pi-gradient text-white hover:pi-gradient-hover"
                    >
                      {isLoading ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Confirmer
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Action terminée */}
            {actionCompleted && (
              <div className="text-center py-8">
                <div className="flex justify-center mb-4">
                  <div className="p-3 rounded-full bg-green-100">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                </div>
                <p className="text-muted-foreground">
                  Action terminée. Redirection en cours...
                </p>
              </div>
            )}

            {/* Instructions de sécurité */}
            {!actionCompleted && (
              <div className="space-y-3 text-sm text-muted-foreground border-t pt-4">
                <div className="flex items-start gap-3">
                  <Mail className="h-4 w-4 mt-0.5 text-blue-500" />
                  <span>Cet email provient de votre demande de retrait</span>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="h-4 w-4 mt-0.5 text-yellow-500" />
                  <span>Ce lien expire dans 24 heures</span>
                </div>
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-4 w-4 mt-0.5 text-red-500" />
                  <span>Vérifiez bien l'adresse de destination avant de confirmer</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}