import React, { useEffect, useState } from 'react';
import { useAdmin } from '../contexts/AdminContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Activity,
  Clock,
  Target,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  Package
} from 'lucide-react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { adminService, type AdminAnalytics } from '../services/adminService';

// Configuration Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// Composant pour les cartes de statistiques
interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ElementType;
  variant?: 'default' | 'success' | 'warning' | 'destructive';
  description?: string;
  onClick?: () => void;
}

function StatCard({ title, value, change, icon: Icon, variant = 'default', description, onClick }: StatCardProps) {
  const variantStyles = {
    default: 'border-border',
    success: 'border-green-500/50 bg-green-500/5',
    warning: 'border-yellow-500/50 bg-yellow-500/5',
    destructive: 'border-red-500/50 bg-red-500/5',
  };

  const iconStyles = {
    default: 'text-muted-foreground',
    success: 'text-green-500',
    warning: 'text-yellow-500',
    destructive: 'text-red-500',
  };

  return (
    <Card 
      className={`transition-all duration-200 hover:shadow-lg cursor-pointer ${variantStyles[variant]}`}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className={`h-4 w-4 ${iconStyles[variant]}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change !== undefined && (
          <div className="flex items-center text-xs text-muted-foreground mt-1">
            {change >= 0 ? (
              <ArrowUp className="h-3 w-3 text-green-500 mr-1" />
            ) : (
              <ArrowDown className="h-3 w-3 text-red-500 mr-1" />
            )}
            <span className={change >= 0 ? 'text-green-500' : 'text-red-500'}>
              {Math.abs(change).toFixed(1)}%
            </span>
            <span className="ml-1">vs période précédente</span>
          </div>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-2">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

// Composant principal du dashboard
export function AdminDashboard() {
  const { state, refreshDashboard } = useAdmin();
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsPeriod, setAnalyticsPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  // Charger les analytics
  useEffect(() => {
    loadAnalytics();
  }, [analyticsPeriod]);

  const loadAnalytics = async () => {
    try {
      setAnalyticsLoading(true);
      const data = await adminService.getAnalytics(analyticsPeriod);
      setAnalytics(data);
    } catch (error) {
      console.error('Erreur lors du chargement des analytics:', error);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('fr-FR').format(num);
  };

  if (!state.dashboardStats) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const { users, financial, system, popular_packages } = state.dashboardStats;

  // Configuration des graphiques
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
      },
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
      },
    },
  };

  const userGrowthData = {
    labels: analytics?.user_growth.map(d => new Date(d.date).toLocaleDateString('fr-FR')) || [],
    datasets: [
      {
        label: 'Utilisateurs',
        data: analytics?.user_growth.map(d => d.count) || [],
        borderColor: '#FFD60A',
        backgroundColor: 'rgba(255, 214, 10, 0.1)',
        tension: 0.4,
      },
    ],
  };

  const tvlData = {
    labels: analytics?.tvl_evolution.map(d => new Date(d.date).toLocaleDateString('fr-FR')) || [],
    datasets: [
      {
        label: 'TVL (Pi)',
        data: analytics?.tvl_evolution.map(d => d.amount) || [],
        borderColor: '#7B2CBF',
        backgroundColor: 'rgba(123, 44, 191, 0.1)',
        tension: 0.4,
      },
    ],
  };

  const levelDistributionData = {
    labels: analytics?.level_distribution.map(d => d.level) || [],
    datasets: [
      {
        data: analytics?.level_distribution.map(d => d.count) || [],
        backgroundColor: [
          '#FFD60A', // Or
          '#FF8500', // Bronze
          '#7B2CBF', // Argent
          '#9D4EDD', // Platine
        ],
        borderWidth: 2,
        borderColor: '#ffffff',
      },
    ],
  };

  return (
    <div className="space-y-6">
      {/* Header avec bouton refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tableau de Bord Administrateur</h1>
          <p className="text-muted-foreground">
            Aperçu des métriques clés de la plateforme Pi Staking
          </p>
        </div>
        <Button onClick={refreshDashboard} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* Métriques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Utilisateurs"
          value={formatNumber(users.total)}
          change={users.growth_rate}
          icon={Users}
          description={`${formatNumber(users.active)} utilisateurs actifs`}
        />
        
        <StatCard
          title="TVL (Total Value Locked)"
          value={`${formatCurrency(financial.tvl)} Pi`}
          icon={DollarSign}
          variant="success"
          description="Valeur totale verrouillée"
        />
        
        <StatCard
          title="Revenus Plateforme"
          value={`${formatCurrency(financial.platform_revenue)} Pi`}
          icon={TrendingUp}
          variant="success"
          description="Frais et commissions"
        />
        
        <StatCard
          title="Santé Système"
          value={`${(system.system_health * 100).toFixed(1)}%`}
          icon={Activity}
          variant={system.system_health > 0.8 ? 'success' : system.system_health > 0.6 ? 'warning' : 'destructive'}
          description="Performance globale"
        />
      </div>

      {/* Métriques secondaires */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Nouveaux Utilisateurs"
          value={formatNumber(users.new_today)}
          icon={Users}
          description={`${formatNumber(users.new_this_week)} cette semaine`}
        />
        
        <StatCard
          title="Claims en Attente"
          value={formatNumber(financial.pending_claims)}
          icon={Clock}
          variant={financial.pending_claims > 100 ? 'warning' : 'default'}
          description="Réclamations à traiter"
        />
        
        <StatCard
          title="Ratio de Liquidité"
          value={`${(financial.liquidity_ratio * 100).toFixed(1)}%`}
          icon={Target}
          variant={financial.liquidity_ratio > 0.2 ? 'success' : 'destructive'}
          description="Liquidité disponible"
        />
        
        <StatCard
          title="Alertes Critiques"
          value={formatNumber(system.critical_alerts)}
          icon={AlertTriangle}
          variant={system.critical_alerts > 0 ? 'destructive' : 'success'}
          description="Incidents système"
        />
      </div>

      {/* Graphiques et analytics */}
      <Tabs value={analyticsPeriod} onValueChange={(value: any) => setAnalyticsPeriod(value)}>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Analytics Avancés</h2>
          <TabsList>
            <TabsTrigger value="7d">7 jours</TabsTrigger>
            <TabsTrigger value="30d">30 jours</TabsTrigger>
            <TabsTrigger value="90d">90 jours</TabsTrigger>
            <TabsTrigger value="1y">1 an</TabsTrigger>
          </TabsList>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Croissance des utilisateurs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Croissance des Utilisateurs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                {analyticsLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <RefreshCw className="h-8 w-8 animate-spin" />
                  </div>
                ) : analytics ? (
                  <Line data={userGrowthData} options={chartOptions} />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    Aucune donnée disponible
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Évolution TVL */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Évolution du TVL
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                {analyticsLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <RefreshCw className="h-8 w-8 animate-spin" />
                  </div>
                ) : analytics ? (
                  <Line data={tvlData} options={chartOptions} />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    Aucune donnée disponible
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Distribution des niveaux */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Distribution des Niveaux
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                {analyticsLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <RefreshCw className="h-8 w-8 animate-spin" />
                  </div>
                ) : analytics ? (
                  <Doughnut data={levelDistributionData} options={chartOptions} />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    Aucune donnée disponible
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Packages populaires */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Packages les Plus Populaires
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {popular_packages.map((pkg, index) => (
                  <div key={pkg.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="bg-pi-gold text-white border-0">
                        #{index + 1}
                      </Badge>
                      <div>
                        <p className="font-medium">{pkg.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatNumber(pkg.investment_count)} investissements
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(pkg.total_volume)} Pi</p>
                      <p className="text-sm text-muted-foreground">Volume total</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </Tabs>

      {/* Barre de progression de la santé système */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Santé du Système
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Performance Globale</span>
                <span>{(system.system_health * 100).toFixed(1)}%</span>
              </div>
              <Progress 
                value={system.system_health * 100} 
                className="h-3"
              />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Ratio de Liquidité</span>
                <span>{(financial.liquidity_ratio * 100).toFixed(1)}%</span>
              </div>
              <Progress 
                value={financial.liquidity_ratio * 100} 
                className="h-3"
              />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-500">{formatNumber(system.active_investments)}</p>
                <p className="text-sm text-muted-foreground">Investissements Actifs</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-500">{formatNumber(system.completed_transactions)}</p>
                <p className="text-sm text-muted-foreground">Transactions Complétées</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-500">{formatCurrency(financial.daily_volume)} Pi</p>
                <p className="text-sm text-muted-foreground">Volume Journalier</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-500">{formatNumber(users.active)}</p>
                <p className="text-sm text-muted-foreground">Utilisateurs Actifs</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}