import React, { useState, useEffect } from 'react';
import { StakingPackage } from '../../../packages/shared-types/src/investment';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ParticleBackground } from '@/components/ParticleBackground';
import { GlowCard } from '@/components/GlowCard';
import { 
  Wallet, 
  LogOut, 
  Coins, 
  TrendingUp, 
  Clock, 
  Target, 
  Users, 
  Award,
  Plus,
  History,
  Gift,
  Settings,
  BarChart3,
  Shield,
  Bell,
  Eye,
  EyeOff,
  Download,
  Upload,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Lock,
  Unlock,
  Star,
  Calendar,
  DollarSign,
  PieChart,
  Activity,
  Zap,
  Timer
} from 'lucide-react';

// Import des contextes
import { useAuth } from '../contexts/AuthContext';
import { useStaking } from '../contexts/StakingContext';
import { useDashboard } from '../contexts/DashboardContext';

// Import des services
import { securityService } from '../services/securityService';
import { transactionsService } from '../services/transactionsService';
import { claimsService } from '../services/claimsService';

// Import du composant Parrainage
import { ReferralDashboard } from './ReferralDashboard';

interface UserDashboardCompleteProps {
  onLogout: () => void;
}

export function UserDashboardComplete({ onLogout }: UserDashboardCompleteProps) {
  const { state: authState, updateProfile } = useAuth();
  const user = authState.user;
  const { state: stakingState, refreshAllData, createInvestment, claimInvestment } = useStaking();
  const { 
    packages, 
    investments, 
    claimableInvestments, 
    totalEarned,
    totalClaimed,
    activeInvestments,
    totalClaimableNow,
    isLoading: stakingLoading 
  } = stakingState;
  const { state: dashboardState } = useDashboard();
  const { 
    dashboardData, 
    financialSummary, 
    notifications, 
    isLoading: dashboardLoading 
  } = dashboardState;

  const [activeTab, setActiveTab] = useState('overview');
  const [showBalance, setShowBalance] = useState(true);
  const [securityLogs, setSecurityLogs] = useState<any[]>([]);
  const [transactionHistory, setTransactionHistory] = useState<any[]>([]);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [notifications2FA, setNotifications2FA] = useState(false);

  // Données pour les graphiques et statistiques
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [withdrawalLimits, setWithdrawalLimits] = useState({ daily: 0, monthly: 0 });

  // État pour les modales
  const [showInvestModal, setShowInvestModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<StakingPackage | null>(null);

  // État pour les formulaires
  const [investmentForm, setInvestmentForm] = useState({
    package_id: '',
    amount: ''
  });
  const [withdrawalForm, setWithdrawalForm] = useState({
    amount: '',
    pi_address: ''
  });

  // Charger les données additionnelles
  useEffect(() => {
    loadSecurityData();
    loadTransactionHistory();
    loadWithdrawalLimits();
  }, []);

  const loadSecurityData = async () => {
    try {
      const logs = await securityService.getSecurityLogs();
      setSecurityLogs(logs.data?.logs?.slice(0, 10) || []); // Dernières 10 entrées
      
      const response = await securityService.getSecurityStats();
      setTwoFactorEnabled(response.data?.risk_score_average > 0.8 || false);
    } catch (error) {
      console.error('Erreur chargement sécurité:', error);
    }
  };

  const loadTransactionHistory = async () => {
    try {
      const history = await transactionsService.getTransactionHistory();
      setTransactionHistory(history.data?.transactions?.slice(0, 10) || []); // Dernières 10 transactions
    } catch (error) {
      console.error('Erreur chargement transactions:', error);
    }
  };

  const loadWithdrawalLimits = async () => {
    try {
      const limitsResponse = await transactionsService.getLimitsAndStats();
      const limits = limitsResponse.data?.limits;
      setWithdrawalLimits({
        daily: limits?.daily_withdrawal_limit || 0,
        monthly: limits?.monthly_withdrawal_limit || 0
      });
    } catch (error) {
      console.error('Erreur chargement limites:', error);
    }
  };

  const handleInvestment = async () => {
    if (!selectedPackage || !investmentForm.amount) return;
    
    try {
      await createInvestment(selectedPackage.id.toString(), parseFloat(investmentForm.amount));
      
      setShowInvestModal(false);
      setInvestmentForm({ package_id: '', amount: '' });
      await refreshAllData();
    } catch (error) {
      console.error('Erreur investissement:', error);
    }
  };

  const handleWithdrawal = async () => {
    if (!withdrawalForm.amount || !withdrawalForm.pi_address) return;
    
    try {
      await transactionsService.createWithdrawal(
        parseFloat(withdrawalForm.amount),
        withdrawalForm.pi_address
      );
      
      setShowWithdrawModal(false);
      setWithdrawalForm({ amount: '', pi_address: '' });
      await loadTransactionHistory();
    } catch (error) {
      console.error('Erreur retrait:', error);
    }
  };

  const handleClaimAll = async () => {
    if (!claimableInvestments?.length) return;
    
    try {
      await claimsService.bulkClaim();
      await refreshAllData();
    } catch (error) {
      console.error('Erreur réclamation:', error);
    }
  };

  const toggle2FA = async () => {
    try {
      if (!twoFactorEnabled) {
        const qrData = await securityService.setup2FA();
        // Afficher QR code dans une modale
        console.log('QR Code pour 2FA:', qrData);
      } else {
        // Pour simplifier, on utilise un mot de passe par défaut ou on demande à l'utilisateur
        await securityService.disable2FA('password_placeholder');
      }
      setTwoFactorEnabled(!twoFactorEnabled);
      await loadSecurityData();
    } catch (error) {
      console.error('Erreur 2FA:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 8
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const normalizedPackages = Array.isArray(packages) ? packages : (packages as any)?.packages || [];
  const calculatedTotalInvested = investments?.reduce((sum, inv) => sum + inv.amount, 0) || 0;
  const totalEarnings = investments?.reduce((sum, inv) => sum + (inv.total_earned || 0), 0) || 0;
  const totalClaimable = claimableInvestments?.reduce((sum, inv) => sum + (inv.claimable_amount || 0), 0) || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 relative">
      <ParticleBackground />
      
      {/* Header Amélioré */}
      <header className="relative z-10 border-b border-border/50 bg-card/80 backdrop-blur-md">
        <div className="container mx-auto flex h-20 items-center justify-between px-4">
          <div className="flex items-center space-x-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full pi-gradient animate-pi-pulse">
              <span className="text-xl font-bold text-white">π</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold">Pi Staking Dashboard</h1>
              <p className="text-sm text-muted-foreground">Bienvenue, {user?.username}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            {/* Balance avec toggle */}
            <div className="text-right">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm text-muted-foreground">Solde Total</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowBalance(!showBalance)}
                  className="h-4 w-4 p-0"
                >
                  {showBalance ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                </Button>
              </div>
              <p className="text-2xl font-bold text-pi-primary">
                {showBalance ? `${formatCurrency(Number(user?.balance_pi ?? 0))} π` : '****'}
              </p>
            </div>

            {/* Notifications */}
            <div className="relative">
              <Button variant="ghost" size="sm">
                <Bell className="h-5 w-5" />
                {notifications?.length > 0 && (
                  <Badge className="absolute -top-1 -right-1 px-1 min-w-[1.2rem] h-5 text-xs bg-red-500">
                    {notifications.length}
                  </Badge>
                )}
              </Button>
            </div>

            {/* Niveau utilisateur */}
            <Badge variant="outline" className="bg-pi-gold text-white border-0 px-3 py-1">
              <Star className="h-3 w-3 mr-1" />
              NIVEAU OR
            </Badge>

            {/* Logout */}
            <Button variant="ghost" size="sm" onClick={onLogout}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Navigation Améliorée */}
      <div className="relative z-10 border-b border-border/50 bg-card/60 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-8 h-14">
              <TabsTrigger value="overview" className="flex flex-col items-center gap-1 text-xs">
                <BarChart3 className="h-4 w-4" />
                Vue d'ensemble
              </TabsTrigger>
              <TabsTrigger value="staking" className="flex flex-col items-center gap-1 text-xs">
                <Target className="h-4 w-4" />
                Staking
              </TabsTrigger>
              <TabsTrigger value="investments" className="flex flex-col items-center gap-1 text-xs">
                <Coins className="h-4 w-4" />
                Investissements
              </TabsTrigger>
              <TabsTrigger value="claims" className="flex flex-col items-center gap-1 text-xs">
                <Gift className="h-4 w-4" />
                Réclamations
              </TabsTrigger>
              <TabsTrigger value="referrals" className="flex flex-col items-center gap-1 text-xs">
                <Users className="h-4 w-4" />
                Parrainage
              </TabsTrigger>
              <TabsTrigger value="transactions" className="flex flex-col items-center gap-1 text-xs">
                <History className="h-4 w-4" />
                Transactions
              </TabsTrigger>
              <TabsTrigger value="security" className="flex flex-col items-center gap-1 text-xs">
                <Shield className="h-4 w-4" />
                Sécurité
              </TabsTrigger>
              <TabsTrigger value="profile" className="flex flex-col items-center gap-1 text-xs">
                <Settings className="h-4 w-4" />
                Profil
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Contenu Principal */}
      <main className="relative z-10 container mx-auto p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">

          {/* Vue d'ensemble */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats Rapides */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <GlowCard>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Investi</CardTitle>
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-pi-primary">
                    {formatCurrency(calculatedTotalInvested)} π
                  </div>
                  <p className="text-xs text-muted-foreground">
                    +{investments?.length || 0} investissements
                  </p>
                </CardContent>
              </GlowCard>

              <GlowCard>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Gains Totaux</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    +{formatCurrency(totalEarnings)} π
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {totalEarnings > 0 ? `+${((totalEarnings / calculatedTotalInvested) * 100).toFixed(2)}%` : '0%'} ROI
                  </p>
                </CardContent>
              </GlowCard>

              <GlowCard>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">À Réclamer</CardTitle>
                  <Gift className="h-4 w-4 text-pi-gold" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-pi-gold">
                    {formatCurrency(totalClaimable)} π
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {claimableInvestments?.length || 0} réclamations disponibles
                  </p>
                </CardContent>
              </GlowCard>

              <GlowCard>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Niveau</CardTitle>
                  <Award className="h-4 w-4 text-pi-gold" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-pi-gold">OR</div>
                  <p className="text-xs text-muted-foreground">
                    {user?.loyalty_points || 0} points de fidélité
                  </p>
                </CardContent>
              </GlowCard>
            </div>

            {/* Actions Rapides */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                onClick={() => setActiveTab('staking')} 
                className="h-16 pi-gradient text-white hover:pi-gradient-hover"
              >
                <div className="flex flex-col items-center gap-2">
                  <Plus className="h-5 w-5" />
                  <span>Nouvel Investissement</span>
                </div>
              </Button>

              <Button 
                onClick={handleClaimAll}
                disabled={!claimableInvestments?.length}
                className="h-16 bg-pi-gold hover:bg-pi-gold/90 text-white"
              >
                <div className="flex flex-col items-center gap-2">
                  <Gift className="h-5 w-5" />
                  <span>Réclamer Tout ({claimableInvestments?.length || 0})</span>
                </div>
              </Button>

              <Button 
                onClick={() => setShowWithdrawModal(true)}
                variant="outline" 
                className="h-16"
              >
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-5 w-5" />
                  <span>Retirer des π</span>
                </div>
              </Button>
            </div>

            {/* Activité Récente */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <GlowCard>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Activité Récente
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {transactionHistory.slice(0, 5).map((transaction, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${
                          transaction.type === 'claim' ? 'bg-green-500/20 text-green-500' :
                          transaction.type === 'investment' ? 'bg-blue-500/20 text-blue-500' :
                          'bg-orange-500/20 text-orange-500'
                        }`}>
                          {transaction.type === 'claim' && <Download className="h-4 w-4" />}
                          {transaction.type === 'investment' && <Target className="h-4 w-4" />}
                          {transaction.type === 'withdrawal' && <Upload className="h-4 w-4" />}
                        </div>
                        <div>
                          <p className="font-medium capitalize">{transaction.type}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(transaction.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {transaction.amount > 0 ? '+' : ''}{formatCurrency(transaction.amount)} π
                        </p>
                        <Badge variant={transaction.status === 'completed' ? 'default' : 'secondary'}>
                          {transaction.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </GlowCard>

              <GlowCard>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Répartition des Investissements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {investments ? (
                    <div className="space-y-4">
                      {normalizedPackages.map((pkg: any) => {
                        const pkgInvestments = investments.filter(inv => inv.package?.id === pkg.id);
                        const pkgTotal = pkgInvestments.reduce((sum, inv) => sum + inv.amount, 0);
                        const percentage = calculatedTotalInvested > 0 ? (pkgTotal / calculatedTotalInvested) * 100 : 0;
                        if (percentage === 0) return null;
                        return (
                          <div key={pkg.id} className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium">{pkg.name}</span>
                              <span className="text-sm text-muted-foreground">
                                {formatCurrency(pkgTotal)} π ({percentage.toFixed(1)}%)
                              </span>
                            </div>
                            <Progress value={percentage} className="h-2" />
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Aucun investissement pour le moment</p>
                  )}
                </CardContent>
              </GlowCard>
            </div>
          </TabsContent>

          {/* Tab Staking */}
          <TabsContent value="staking" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold">Packages de Staking</h2>
              <Button onClick={() => refreshAllData()} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualiser
              </Button>
            </div>

            {/* Packages disponibles */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {normalizedPackages.map((pkg: any) => (
                <GlowCard key={pkg.id} className="cursor-pointer hover:scale-105 transition-transform">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl">{pkg.name}</CardTitle>
                        <Badge variant="outline" className="mt-2">
                          {(pkg.daily_rate * 365).toFixed(2)}% APY
                        </Badge>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Minimum</p>
                        <p className="font-bold">{formatCurrency(pkg.min_amount)} π</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground">{pkg.description}</p>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Durée:</span>
                        <span className="font-medium">{pkg.max_duration_days} jours</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Claims:</span>
                        <span className="font-medium">Quotidien</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Maximum:</span>
                        <span className="font-medium">
                          {pkg.max_amount ? `${formatCurrency(pkg.max_amount)} π` : 'Illimité'}
                        </span>
                      </div>
                    </div>

                    <Button 
                      onClick={() => {
                        setSelectedPackage(pkg as any);
                        setInvestmentForm({ ...investmentForm, package_id: pkg.id });
                        setShowInvestModal(true);
                      }}
                      className="w-full pi-gradient text-white hover:pi-gradient-hover"
                    >
                      <Target className="h-4 w-4 mr-2" />
                      Investir
                    </Button>
                  </CardContent>
                </GlowCard>
              ))}
            </div>
          </TabsContent>

          {/* Tab Investissements */}
          <TabsContent value="investments" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold">Mes Investissements</h2>
              <div className="flex gap-2">
                <Button onClick={() => refreshAllData()} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Actualiser
                </Button>
              </div>
            </div>

            {/* Investissements actifs */}
            <div className="space-y-4">
              {investments?.map((investment) => (
                <GlowCard key={investment.id}>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                      <div>
                        <h3 className="font-semibold text-lg">{investment.package?.name || 'Package inconnu'}</h3>
                        <p className="text-sm text-muted-foreground">
                          Démarré le {formatDate(investment.created_at)}
                        </p>
                      </div>
                      
                      <div className="text-center">
                        <p className="text-2xl font-bold">{formatCurrency(investment.amount)} π</p>
                        <p className="text-sm text-muted-foreground">Investi</p>
                      </div>
                      
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">
                          +{formatCurrency(investment.total_earned || 0)} π
                        </p>
                        <p className="text-sm text-muted-foreground">Gagné</p>
                      </div>
                      
                      <div className="text-center">
                        <div className="space-y-2">
                          {(() => {
                            const daysElapsed = Math.floor((new Date().getTime() - new Date(investment.created_at).getTime()) / (1000 * 60 * 60 * 24));
                            const maxDays = investment.package?.max_duration_days || 365;
                            return (
                              <>
                                <Progress 
                                  value={(daysElapsed / maxDays) * 100} 
                                  className="h-2" 
                                />
                                <p className="text-sm text-muted-foreground">
                                  {daysElapsed}/{maxDays} jours
                                </p>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    </div>

                    <Separator className="my-4" />

                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <Badge variant={investment.status === 'active' ? 'default' : 'secondary'}>
                          {investment.status}
                        </Badge>
                        {investment.next_claim_available_at && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            Prochain claim: {formatDate(investment.next_claim_available_at)}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        {investment.status === 'active' && (
                          <Button 
                            onClick={() => claimInvestment(investment.id.toString())}
                            className="bg-pi-gold hover:bg-pi-gold/90 text-white"
                          >
                            <Gift className="h-4 w-4 mr-2" />
                            Réclamer
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </GlowCard>
              ))}

              {!investments?.length && (
                <GlowCard>
                  <CardContent className="text-center py-12">
                    <Target className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Aucun investissement</h3>
                    <p className="text-muted-foreground mb-4">
                      Commencez votre premier investissement pour générer des revenus passifs.
                    </p>
                    <Button 
                      onClick={() => setActiveTab('staking')}
                      className="pi-gradient text-white hover:pi-gradient-hover"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Premier Investissement
                    </Button>
                  </CardContent>
                </GlowCard>
              )}
            </div>
          </TabsContent>

          {/* Tab Réclamations */}
          <TabsContent value="claims" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold">Réclamations</h2>
              <div className="flex gap-2">
                {totalClaimable > 0 && (
                  <Button 
                    onClick={handleClaimAll}
                    className="bg-pi-gold hover:bg-pi-gold/90 text-white"
                  >
                    <Gift className="h-4 w-4 mr-2" />
                    Tout Réclamer ({formatCurrency(totalClaimable)} π)
                  </Button>
                )}
                <Button onClick={() => refreshAllData()} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Actualiser
                </Button>
              </div>
            </div>

            {/* Réclamations disponibles */}
            <div className="space-y-4">
              {claimableInvestments?.map((investment) => (
                <GlowCard key={investment.id} className="border-pi-gold/50">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                          <Gift className="h-5 w-5 text-pi-gold" />
                          {investment.investment?.package?.name || 'Package inconnu'}
                        </h3>
                        <p className="text-muted-foreground">
                          Investissement de {formatCurrency(investment.amount)} π
                        </p>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-2xl font-bold text-pi-gold">
                          +{formatCurrency(investment.claimable_amount)} π
                        </p>
                        <p className="text-sm text-muted-foreground">À réclamer</p>
                      </div>
                      
                      <Button 
                        onClick={() => claimInvestment(investment.id.toString())}
                        className="bg-pi-gold hover:bg-pi-gold/90 text-white"
                      >
                        <Gift className="h-4 w-4 mr-2" />
                        Réclamer
                      </Button>
                    </div>
                  </CardContent>
                </GlowCard>
              ))}

              {!claimableInvestments?.length && (
                <GlowCard>
                  <CardContent className="text-center py-12">
                    <Timer className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Aucune réclamation disponible</h3>
                    <p className="text-muted-foreground">
                      Vos prochaines réclamations seront disponibles selon le calendrier de vos investissements.
                    </p>
                  </CardContent>
                </GlowCard>
              )}
            </div>
          </TabsContent>

          {/* Tab Parrainage */}
          <TabsContent value="referrals" className="space-y-6">
            <ReferralDashboard />
          </TabsContent>

          {/* Tab Transactions */}
          <TabsContent value="transactions" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold">Historique des Transactions</h2>
              <div className="flex gap-2">
                <Button onClick={() => setShowWithdrawModal(true)} variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Nouveau Retrait
                </Button>
                <Button onClick={() => loadTransactionHistory()} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Actualiser
                </Button>
              </div>
            </div>

            {/* Limites de retrait */}
            <GlowCard>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Limites de Retrait
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Limite Journalière</p>
                    <p className="text-xl font-bold">
                      {formatCurrency(withdrawalLimits.daily)} π
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Limite Mensuelle</p>
                    <p className="text-xl font-bold">
                      {formatCurrency(withdrawalLimits.monthly)} π
                    </p>
                  </div>
                </div>
              </CardContent>
            </GlowCard>

            {/* Liste des transactions */}
            <GlowCard>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {transactionHistory.map((transaction, index) => (
                    <div key={index} className="flex items-center justify-between p-4 rounded-lg border">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-full ${
                          transaction.type === 'claim' ? 'bg-green-500/20 text-green-500' :
                          transaction.type === 'investment' ? 'bg-blue-500/20 text-blue-500' :
                          'bg-orange-500/20 text-orange-500'
                        }`}>
                          {transaction.type === 'claim' && <Download className="h-5 w-5" />}
                          {transaction.type === 'investment' && <Target className="h-5 w-5" />}
                          {transaction.type === 'withdrawal' && <Upload className="h-5 w-5" />}
                        </div>
                        <div>
                          <h4 className="font-medium capitalize">{transaction.type}</h4>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(transaction.created_at)}
                          </p>
                          {transaction.description && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {transaction.description}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-lg font-semibold">
                          {transaction.amount > 0 ? '+' : ''}{formatCurrency(transaction.amount)} π
                        </p>
                        <Badge 
                          variant={
                            transaction.status === 'completed' ? 'default' :
                            transaction.status === 'pending' ? 'secondary' :
                            'destructive'
                          }
                        >
                          {transaction.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  
                  {!transactionHistory.length && (
                    <div className="text-center py-8">
                      <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">Aucune transaction pour le moment</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </GlowCard>
          </TabsContent>

          {/* Tab Sécurité */}
          <TabsContent value="security" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold">Centre de Sécurité</h2>
              <Button onClick={() => loadSecurityData()} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualiser
              </Button>
            </div>

            {/* Paramètres de sécurité */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <GlowCard>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Authentification à Deux Facteurs (2FA)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Statut 2FA</p>
                      <p className="text-sm text-muted-foreground">
                        {twoFactorEnabled ? 'Activée' : 'Désactivée'}
                      </p>
                    </div>
                    <Switch
                      checked={twoFactorEnabled}
                      onCheckedChange={toggle2FA}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Notifications 2FA</p>
                      <p className="text-sm text-muted-foreground">
                        Alertes pour les connexions
                      </p>
                    </div>
                    <Switch
                      checked={notifications2FA}
                      onCheckedChange={setNotifications2FA}
                    />
                  </div>

                  <Alert>
                    <Shield className="h-4 w-4" />
                    <AlertDescription>
                      L'authentification à deux facteurs ajoute une couche de sécurité supplémentaire à votre compte.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </GlowCard>

              <GlowCard>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    État de Sécurité
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span>Mot de passe sécurisé</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {twoFactorEnabled ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-yellow-500" />
                      )}
                      <span>Authentification 2FA</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span>Email vérifié</span>
                    </div>
                    
                    <div className="pt-4">
                      <p className="text-sm font-medium mb-2">Score de Sécurité</p>
                      <Progress value={twoFactorEnabled ? 95 : 75} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">
                        {twoFactorEnabled ? 'Excellent' : 'Bon - Activez la 2FA pour améliorer'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </GlowCard>
            </div>

            {/* Journal de sécurité */}
            <GlowCard>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Journal de Sécurité
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {securityLogs.map((log, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${
                          log.type === 'login' ? 'bg-green-500/20 text-green-500' :
                          log.type === 'logout' ? 'bg-gray-500/20 text-gray-500' :
                          'bg-blue-500/20 text-blue-500'
                        }`}>
                          {log.type === 'login' && <Lock className="h-4 w-4" />}
                          {log.type === 'logout' && <Unlock className="h-4 w-4" />}
                          {log.type === 'security' && <Shield className="h-4 w-4" />}
                        </div>
                        <div>
                          <p className="font-medium">{log.description}</p>
                          <p className="text-sm text-muted-foreground">
                            IP: {log.ip_address} • {formatDate(log.created_at)}
                          </p>
                        </div>
                      </div>
                      <Badge variant={log.status === 'success' ? 'default' : 'destructive'}>
                        {log.status}
                      </Badge>
                    </div>
                  ))}
                  
                  {!securityLogs.length && (
                    <div className="text-center py-8">
                      <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">Aucun événement de sécurité enregistré</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </GlowCard>
          </TabsContent>

          {/* Tab Profil */}
          <TabsContent value="profile" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold">Mon Profil</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Informations personnelles */}
              <GlowCard>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Informations Personnelles
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Nom d'utilisateur</Label>
                    <p className="text-lg mt-1">{user?.username || 'Non défini'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Adresse email</Label>
                    <p className="text-lg mt-1">{user?.email || 'Non défini'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Niveau de compte</Label>
                    <Badge className="bg-pi-gold text-white mt-1">NIVEAU OR</Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Membre depuis</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {user?.created_at ? formatDate(user.created_at) : 'Non disponible'}
                    </p>
                  </div>
                </CardContent>
              </GlowCard>

              {/* Statistiques du compte */}
              <GlowCard>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Statistiques du Compte
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Total investi:</span>
                    <span className="font-bold">{formatCurrency(calculatedTotalInvested)} π</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total gagné:</span>
                    <span className="font-bold text-green-600">+{formatCurrency(totalEarnings)} π</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Investissements actifs:</span>
                    <span className="font-bold">{investments?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Points de fidélité:</span>
                    <span className="font-bold text-pi-gold">{user?.loyalty_points || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Code de parrainage:</span>
                    <span className="font-bold pi-gold">{user?.referral_code || 'Non disponible'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Dernière réclamation:</span>
                    <span className="text-sm">
                      {user?.last_claim_at ? formatDate(user.last_claim_at) : 'Jamais'}
                    </span>
                  </div>
                </CardContent>
              </GlowCard>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Modal d'investissement */}
      <Dialog open={showInvestModal} onOpenChange={setShowInvestModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nouvel Investissement</DialogTitle>
          </DialogHeader>
          {selectedPackage && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <h3 className="font-semibold">{selectedPackage.name}</h3>
                <p className="text-sm text-muted-foreground">
                  APY: {(selectedPackage.daily_rate * 365).toFixed(2)}% • Durée: {selectedPackage.max_duration_days} jours
                </p>
              </div>
              
              <div className="space-y-2">
                <Label>Montant à investir (π)</Label>
                <Input
                  type="number"
                  placeholder={`Minimum: ${formatCurrency(selectedPackage.min_amount)} π`}
                  value={investmentForm.amount}
                  onChange={(e) => setInvestmentForm({
                    ...investmentForm,
                    amount: e.target.value
                  })}
                />
                <p className="text-xs text-muted-foreground">
                  Solde disponible: {formatCurrency(Number(user?.balance_pi ?? 0))} π
                </p>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={handleInvestment}
                  disabled={!investmentForm.amount || parseFloat(investmentForm.amount) < selectedPackage.min_amount}
                  className="flex-1 pi-gradient text-white hover:pi-gradient-hover"
                >
                  Investir
                </Button>
                <Button 
                  onClick={() => setShowInvestModal(false)} 
                  variant="outline"
                >
                  Annuler
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de retrait */}
      <Dialog open={showWithdrawModal} onOpenChange={setShowWithdrawModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Demande de Retrait</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Les retraits sont traités sous 24-48h ouvrables après vérification.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-2">
              <Label>Montant à retirer (π)</Label>
              <Input
                type="number"
                placeholder="Montant en π"
                value={withdrawalForm.amount}
                onChange={(e) => setWithdrawalForm({
                  ...withdrawalForm,
                  amount: e.target.value
                })}
              />
              <p className="text-xs text-muted-foreground">
                Limite journalière: {formatCurrency(withdrawalLimits.daily)} π
              </p>
            </div>
            
            <div className="space-y-2">
              <Label>Adresse Pi Network</Label>
              <Input
                placeholder="Votre adresse de portefeuille Pi"
                value={withdrawalForm.pi_address}
                onChange={(e) => setWithdrawalForm({
                  ...withdrawalForm,
                  pi_address: e.target.value
                })}
              />
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button 
                onClick={handleWithdrawal}
                disabled={!withdrawalForm.amount || !withdrawalForm.pi_address}
                className="flex-1"
              >
                Demander le Retrait
              </Button>
              <Button 
                onClick={() => setShowWithdrawModal(false)} 
                variant="outline"
              >
                Annuler
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}