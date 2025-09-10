import { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ClaimTimer } from './ClaimTimer';
import { ClaimButton } from './ClaimButton';
import { GlowCard } from './GlowCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { stakingService, Investment } from '@/services/stakingService';
import { Loader2, TrendingUp, Clock, Target } from 'lucide-react';

interface RealTimeInvestmentsProps {
  refreshTrigger?: number; // Pour forcer le refresh depuis le parent
}

export function RealTimeInvestments({ refreshTrigger }: RealTimeInvestmentsProps) {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInvestments = async () => {
    try {
      setError(null);
      const response = await stakingService.getUserInvestments();
      
      if (response.success && response.data) {
        setInvestments(response.data);
      } else {
        setError(response.message || 'Erreur lors du chargement des investments');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
      console.error('Investments fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvestments();
  }, [refreshTrigger]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchInvestments, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500 text-white">Actif</Badge>;
      case 'completed':
        return <Badge variant="secondary">Terminé</Badge>;
      case 'paused':
        return <Badge variant="outline">En pause</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Annulé</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const calculateProgress = (investment: Investment) => {
    if (!investment.start_at || !investment.end_at) return 0;
    
    const startTime = new Date(investment.start_at).getTime();
    const endTime = new Date(investment.end_at).getTime();
    const currentTime = new Date().getTime();
    
    if (currentTime <= startTime) return 0;
    if (currentTime >= endTime) return 100;
    
    return ((currentTime - startTime) / (endTime - startTime)) * 100;
  };

  const calculateDaysRemaining = (investment: Investment) => {
    if (!investment.end_at) return 0;
    
    const endTime = new Date(investment.end_at).getTime();
    const currentTime = new Date().getTime();
    const diffTime = endTime - currentTime;
    
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  };

  const canClaimInvestment = (investment: Investment) => {
    if (investment.status !== 'active') return false;
    if (!investment.next_claim_at) return false;
    
    return new Date() >= new Date(investment.next_claim_at);
  };

  const calculateExpectedClaimAmount = (investment: Investment) => {
    return investment.amount * investment.daily_rate;
  };

  const handleClaimSuccess = () => {
    // Refresh investments after successful claim
    fetchInvestments();
  };

  if (isLoading) {
    return (
      <GlowCard>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin mr-4" />
          <span>Chargement de vos investments...</span>
        </CardContent>
      </GlowCard>
    );
  }

  if (error) {
    return (
      <GlowCard>
        <CardContent className="text-center p-8">
          <p className="text-destructive mb-4">{error}</p>
          <button 
            onClick={() => fetchInvestments()}
            className="text-primary hover:underline"
          >
            Réessayer
          </button>
        </CardContent>
      </GlowCard>
    );
  }

  if (investments.length === 0) {
    return (
      <GlowCard>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Aucun Investment Actif
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Vous n'avez pas encore d'investments actifs. Commencez à investir vos Pi pour gagner des récompenses quotidiennes.
          </p>
          <button 
            onClick={() => window.dispatchEvent(new CustomEvent('openStakingModal'))}
            className="text-primary hover:underline"
          >
            Créer votre premier investment
          </button>
        </CardContent>
      </GlowCard>
    );
  }

  const activeInvestments = investments.filter(inv => inv.status === 'active');

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Investments Actifs</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold pi-purple">
              {activeInvestments.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Sur {investments.length} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valeur Totale</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold pi-gold">
              {activeInvestments.reduce((sum, inv) => sum + inv.amount, 0).toFixed(0)} π
            </div>
            <p className="text-xs text-muted-foreground">
              En cours d'investment
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gains Quotidiens</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {activeInvestments.reduce((sum, inv) => sum + (inv.amount * inv.daily_rate), 0).toFixed(2)} π
            </div>
            <p className="text-xs text-muted-foreground">
              Estimés par jour
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Investments Table */}
      <GlowCard>
        <CardHeader>
          <CardTitle>Détail de vos Investments</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Package</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Taux</TableHead>
                <TableHead>Progression</TableHead>
                <TableHead>Total Réclamé</TableHead>
                <TableHead>Prochaine Réclamation</TableHead>
                <TableHead>Actions</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {investments.map(investment => {
                const progress = calculateProgress(investment);
                const daysRemaining = calculateDaysRemaining(investment);
                const canClaim = canClaimInvestment(investment);
                const expectedAmount = calculateExpectedClaimAmount(investment);

                return (
                  <TableRow key={investment.id}>
                    <TableCell className="font-medium">
                      {investment.package?.name || `Package #${investment.staking_package_id}`}
                    </TableCell>
                    <TableCell>{investment.amount.toFixed(2)} π</TableCell>
                    <TableCell className="text-green-600">
                      {(investment.daily_rate * 100).toFixed(2)}%/jour
                    </TableCell>
                    <TableCell>
                      <div className="w-full">
                        <Progress 
                          value={Math.min(progress, 100)} 
                          className="h-2 mb-1"
                        />
                        <span className="text-xs text-muted-foreground">
                          {progress.toFixed(1)}% • {daysRemaining} jours restants
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-green-600">
                      {investment.claimed_amount.toFixed(2)} π
                    </TableCell>
                    <TableCell>
                      {investment.next_claim_at ? (
                        <ClaimTimer targetTime={new Date(investment.next_claim_at)} />
                      ) : (
                        <span className="text-muted-foreground">Non disponible</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {investment.status === 'active' ? (
                        <ClaimButton
                          investmentId={investment.id}
                          canClaim={canClaim}
                          expectedAmount={expectedAmount}
                          onClaimSuccess={handleClaimSuccess}
                        />
                      ) : (
                        <span className="text-muted-foreground text-sm">Terminé</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(investment.status)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </GlowCard>

      {/* Quick Actions */}
      {activeInvestments.some(inv => canClaimInvestment(inv)) && (
        <GlowCard>
          <CardHeader>
            <CardTitle className="text-green-600">Réclamations Disponibles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {activeInvestments
                .filter(inv => canClaimInvestment(inv))
                .map(investment => (
                  <div key={investment.id} className="flex items-center justify-between p-3 border rounded-lg bg-green-50">
                    <div>
                      <p className="font-medium">{investment.package?.name || `Package #${investment.staking_package_id}`}</p>
                      <p className="text-sm text-muted-foreground">
                        Réclamation disponible maintenant
                      </p>
                    </div>
                    <ClaimButton
                      investmentId={investment.id}
                      canClaim={true}
                      expectedAmount={calculateExpectedClaimAmount(investment)}
                      onClaimSuccess={handleClaimSuccess}
                    />
                  </div>
                ))}
            </div>
          </CardContent>
        </GlowCard>
      )}
    </div>
  );
}