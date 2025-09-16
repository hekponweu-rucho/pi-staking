import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AnimatedCounter } from './AnimatedCounter';
import { GlowCard } from './GlowCard';
import { dashboardService } from '@/services/dashboardService';
import { stakingService } from '@/services/stakingService';
import { claimsService } from '@/services/claimsService';
import { 
  Wallet, 
  TrendingUp, 
  Gift, 
  Clock, 
  Users,
  Award,
  Loader2
} from 'lucide-react';

interface DashboardStatsData {
  totalBalance: number;
  totalStaked: number;
  totalClaimed: number;
  dailyEarnings: number;
  activeInvestments: number;
  userLevel: string;
  nextLevelProgress: number;
  totalReferrals: number;
}

export function DashboardStats() {
  const [stats, setStats] = useState<DashboardStatsData>({
    totalBalance: 0,
    totalStaked: 0,
    totalClaimed: 0,
    dailyEarnings: 0,
    activeInvestments: 0,
    userLevel: 'Bronze',
    nextLevelProgress: 0,
    totalReferrals: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Récupération des données en parallèle
        const [
          dashboardResponse,
          investmentsResponse,
          claimStatsResponse
        ] = await Promise.all([
          dashboardService.getDashboardData(),
          stakingService.getUserInvestments(),
          claimsService.getClaimHistory()
        ]);

        if (dashboardResponse.success && investmentsResponse.success) {
          const dashboardData = dashboardResponse.data;
          const investments = investmentsResponse.data;
          
          // Calculs des statistiques
          const totalStaked = investments.reduce((sum, inv) => 
            inv.status === 'active' ? sum + inv.amount : sum, 0
          );
          
          const dailyEarnings = investments.reduce((sum, inv) => 
            inv.status === 'active' ? sum + (inv.amount * inv.daily_rate) : sum, 0
          );

          const totalClaimed = claimStatsResponse.success ? 
            claimStatsResponse.data.data.reduce((sum, claim) => sum + (claim.final_amount ?? claim.amount ?? 0), 0) : 0;

          setStats({
            totalBalance: dashboardData.user.balance_pi || 0,
            totalStaked: dashboardData.investments.total_amount || totalStaked,
            totalClaimed: dashboardData.user.total_claimed || totalClaimed,
            dailyEarnings: dashboardData.investments.daily_earnings || dailyEarnings,
            activeInvestments: dashboardData.investments.active_count || investments.filter(inv => inv.status === 'active').length,
            userLevel: dashboardData.user.current_level || 'Bronze',
            nextLevelProgress: dashboardData.user.level_progress || 0,
            totalReferrals: dashboardData.referrals.total_referrals || 0
          });
        } else {
          setError('Erreur lors du chargement des données');
        }
      } catch (err) {
        setError('Erreur de connexion au serveur');
        console.error('Dashboard stats error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="col-span-full p-6 text-center">
        <p className="text-destructive mb-4">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="text-primary hover:underline"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Solde Total */}
      <GlowCard>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Solde Total</CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold pi-purple">
            <AnimatedCounter value={stats.totalBalance} decimals={2} suffix=" Pi" />
          </div>
          <p className="text-xs text-muted-foreground">Disponible pour staking</p>
        </CardContent>
      </GlowCard>

      {/* Total Staké */}
      <GlowCard>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Staké</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold pi-gold">
            <AnimatedCounter value={stats.totalStaked} decimals={0} suffix=" Pi" />
          </div>
          <p className="text-xs text-muted-foreground">
            En cours dans {stats.activeInvestments} investment{stats.activeInvestments > 1 ? 's' : ''}
          </p>
        </CardContent>
      </GlowCard>

      {/* Total Réclamé */}
      <GlowCard>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Réclamé</CardTitle>
          <Gift className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            <AnimatedCounter value={stats.totalClaimed} decimals={2} suffix=" Pi" />
          </div>
          <p className="text-xs text-muted-foreground">Récompenses obtenues</p>
        </CardContent>
      </GlowCard>

      {/* Gains Quotidiens */}
      <GlowCard>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Gains Quotidiens</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">
            <AnimatedCounter value={stats.dailyEarnings} decimals={2} suffix=" Pi" />
          </div>
          <p className="text-xs text-muted-foreground">Revenus par jour</p>
        </CardContent>
      </GlowCard>

      {/* Niveau Utilisateur */}
      <GlowCard>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Niveau</CardTitle>
          <Award className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold pi-gold">
            {stats.userLevel}
          </div>
          <div className="mt-2">
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-pi-gold h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(stats.nextLevelProgress, 100)}%` }}
              ></div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.nextLevelProgress.toFixed(0)}% vers le niveau suivant
            </p>
          </div>
        </CardContent>
      </GlowCard>

      {/* Parrainages */}
      <GlowCard>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Parrainages</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold pi-purple">
            <AnimatedCounter value={stats.totalReferrals} decimals={0} />
          </div>
          <p className="text-xs text-muted-foreground">Utilisateurs parrainés</p>
        </CardContent>
      </GlowCard>

      {/* ROI Global */}
      <GlowCard>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">ROI Global</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            <AnimatedCounter 
              value={stats.totalStaked > 0 ? ((stats.totalClaimed / stats.totalStaked) * 100) : 0} 
              decimals={1} 
              suffix="%" 
            />
          </div>
          <p className="text-xs text-muted-foreground">Rendement sur investissement</p>
        </CardContent>
      </GlowCard>

      {/* Performance Quotidienne */}
      <GlowCard>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Performance</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold pi-gold">
            <AnimatedCounter 
              value={stats.totalStaked > 0 ? ((stats.dailyEarnings / stats.totalStaked) * 100) : 0} 
              decimals={2} 
              suffix="%" 
            />
          </div>
          <p className="text-xs text-muted-foreground">Taux quotidien moyen</p>
        </CardContent>
      </GlowCard>
    </div>
  );
}