import React, { useState, useEffect } from 'react';
import { StakingPackage } from '../../../packages/shared-types/src/investment';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
  Timer,
  Menu,
} from 'lucide-react';

// Contexts
import { useAuth } from '../contexts/AuthContext';
import { useStaking } from '../contexts/StakingContext';
import { useDashboard } from '../contexts/DashboardContext';

// Services
import { securityService } from '../services/securityService';
import { transactionsService } from '../services/transactionsService';
import { claimsService } from '../services/claimsService';
import { stakingService } from '../services/stakingService';

import { ReferralDashboard } from './ReferralDashboard';
import { DepositModal } from './DepositModal';
import { Navbar } from '@/components/ui/Navbar';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from '@/components/ui/drawer';
import { useIsMobile } from '@/hooks/use-mobile';
import { Skeleton } from '@/components/ui/skeleton';
import { EmailVerificationBanner } from '@/components/ui/EmailVerificationBanner';
import { notify } from '@/components/ui/notify';

interface UserDashboardCompleteProps {
  onLogout: () => void;
}

export function UserDashboardComplete({ onLogout }: UserDashboardCompleteProps) {
  const { state: authState, updateProfile, refreshUser, claimWelcomeBonus, checkEmailVerified } = useAuth();
  const user = authState.user as any;
  const { state: stakingState, refreshAllData, createInvestment, claimInvestment } = useStaking();
  const {
    packages,
    investments,
    claimableInvestments,
    totalEarned,
    totalClaimed,
    activeInvestments,
    totalClaimableNow,
    isLoading: stakingLoading,
  } = stakingState as any;
  const { state: dashboardState } = useDashboard();
  const { dashboardData, financialSummary, notifications, isLoading: dashboardLoading } = dashboardState as any;

  const [activeTab, setActiveTab] = useState('overview');
  const [showBalance, setShowBalance] = useState(true);
  const [securityLogs, setSecurityLogs] = useState<any[]>([]);
  const [transactionHistory, setTransactionHistory] = useState<any[]>([]);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [notifications2FA, setNotifications2FA] = useState(false);

  const isMobile = useIsMobile();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Data for stats
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [withdrawalLimits, setWithdrawalLimits] = useState({ daily: 0, monthly: 0 });
  const [reinvestForm, setReinvestForm] = useState<{ source: 'claimable' | 'claimable_bonus'; packageId: string; amount: string }>({ source: 'claimable', packageId: '', amount: '' });
  const [reinvestLoading, setReinvestLoading] = useState(false);

  // Modals
  const [showInvestModal, setShowInvestModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<StakingPackage | null>(null);

  // Forms
  const [investmentForm, setInvestmentForm] = useState({
    staking_package_id: '',
    amount: '',
  });
  const [withdrawalForm, setWithdrawalForm] = useState({
    amount: '',
    pi_address: '',
  });

  // Load additional data
  useEffect(() => {
    loadSecurityData();
    loadTransactionHistory();
    loadWithdrawalLimits();
  }, []);

  const loadSecurityData = async () => {
    try {
      const logs = await securityService.getSecurityLogs();
      setSecurityLogs(logs.data?.logs?.slice(0, 10) || []);
    } catch (error) {
      console.error('Erreur chargement sécurité:', error);
    }
  };

  const loadTransactionHistory = async () => {
    try {
      const history = await transactionsService.getTransactionHistory();
      setTransactionHistory(history.data?.transactions?.slice(0, 10) || []);
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
        monthly: limits?.monthly_withdrawal_limit || 0,
      });
    } catch (error) {
      console.error('Erreur chargement limites:', error);
    }
  };

  const handleInvestment = async () => {
    if (!selectedPackage || !investmentForm.amount) return;

    try {
      const source = selectedPackage.level === 'discovery' || (selectedPackage as any).is_discovery_bonus ? 'bonus' : 'funds';
      await createInvestment(selectedPackage.id.toString(), parseFloat(investmentForm.amount), source);

      setShowInvestModal(false);
      setInvestmentForm({ staking_package_id: '', amount: '' });
      await refreshAllData();
      notify.success('Investment créé avec succès');
    } catch (error) {
      console.error('Erreur investissement:', error);
      notify.error("Erreur lors de l'investissement");
    }
  };

  const handleWithdrawal = async () => {
    if (!withdrawalForm.amount || !withdrawalForm.pi_address) return;

    try {
      await transactionsService.createWithdrawal(parseFloat(withdrawalForm.amount), withdrawalForm.pi_address);

      setShowWithdrawModal(false);
      setWithdrawalForm({ amount: '', pi_address: '' });
      await loadTransactionHistory();
      notify.success('Demande de retrait envoyée');
    } catch (error) {
      console.error('Erreur retrait:', error);
      notify.error('Erreur lors du retrait');
    }
  };

  const handleClaimWelcome = async () => {
    try {
      const ok = await claimWelcomeBonus();
      if (ok) {
        await refreshUser();
        await refreshAllData();
        notify.success('Bonus de bienvenue réclamé avec succès');
      }
    } catch (e) {
      console.error(e);
      notify.error('Échec de la réclamation du bonus');
    }
  };

  const handleReinvestBonus = async () => {
    try {
      const res = await stakingService.reinvestBonus();
      if (res.success) {
        notify.success('Bonus réinvesti avec succès');
        await refreshAllData();
        await refreshUser();
      } else {
        notify.error(res.message || 'Échec du réinvestissement du bonus');
      }
    } catch (e) {
      console.error(e);
      notify.error('Échec du réinvestissement du bonus');
    }
  };

  const [claimAllLoading, setClaimAllLoading] = useState(false);
  const [reinvestQuickLoading, setReinvestQuickLoading] = useState(false);

  const handleClaimAll = async () => {
    const safeClaimableInvestments = Array.isArray(claimableInvestments) ? claimableInvestments : [];
    if (!safeClaimableInvestments?.length) return;
    try {
      setClaimAllLoading(true);
      const ids = safeClaimableInvestments.map((c: any) => Number(c.investment_id || c.id)).filter(Boolean);
      const res = await claimsService.bulkClaim(ids);
      if (!res.success) {
        notify.error(res.message || 'Échec de la réclamation en masse');
      } else {
        notify.success('Réclamation effectuée');
      }
      await refreshAllData();
      await refreshUser();
    } catch (error) {
      console.error('Erreur réclamation:', error);
      notify.error('Erreur lors de la réclamation');
    } finally {
      setClaimAllLoading(false);
    }
  };

  const toggle2FA = async () => {
    try {
      if (!twoFactorEnabled) {
        const qrData = await securityService.setup2FA();
        console.log('QR Code pour 2FA:', qrData);
      } else {
        await securityService.disable2FA('password_placeholder');
      }
      setTwoFactorEnabled(!twoFactorEnabled);
      await loadSecurityData();
      notify.success('Paramètres 2FA mis à jour');
    } catch (error) {
      console.error('Erreur 2FA:', error);
      notify.error('Erreur lors de la mise à jour 2FA');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 8 }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const normalizedPackages = Array.isArray(packages) ? packages : (packages as any)?.packages || [];
  const discoveryPackages = normalizedPackages.filter((p: any) => p.is_discovery_bonus);
  const regularPackages = normalizedPackages.filter((p: any) => !p.is_discovery_bonus);
  const safeInvestments = Array.isArray(investments) ? investments : [];
  const calculatedTotalInvested = safeInvestments.reduce((sum, inv) => sum + inv.amount, 0) || 0;
  const totalEarnings = safeInvestments.reduce((sum, inv) => sum + (inv.total_earned || 0), 0) || 0;
  const safeClaimableInvestments = Array.isArray(claimableInvestments) ? claimableInvestments : [];
  const totalClaimable = safeClaimableInvestments.reduce((sum, inv) => sum + (inv.claimable_amount || 0), 0);

  const welcomeBonusClaimed = Boolean(user?.welcome_bonus_claimed);
  const welcomeBonusReinvested = Boolean(user?.welcome_bonus_reinvested);
  const bonusGrants = user?.bonus_grants || [];
  const activeWelcomeGrant = Array.isArray(bonusGrants) ? bonusGrants.find((g: any) => g?.type === 'welcome' && !g?.is_used) : null;

  const [bonusCountdown, setBonusCountdown] = useState<string>('');
  const [bonusUrgent, setBonusUrgent] = useState<boolean>(false);

  useEffect(() => {
    if (!activeWelcomeGrant?.expires_at) {
      setBonusCountdown('');
      setBonusUrgent(false);
      return;
    }
    const update = () => {
      const expires = new Date(activeWelcomeGrant.expires_at).getTime();
      const now = Date.now();
      let diff = expires - now;
      if (diff <= 0) {
        setBonusCountdown('Expiré');
        setBonusUrgent(true);
        return;
      }
      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      diff -= d * 24 * 60 * 60 * 1000;
      const h = Math.floor(diff / (1000 * 60 * 60));
      diff -= h * 60 * 60 * 1000;
      const m = Math.floor(diff / (1000 * 60));
      diff -= m * 60 * 1000;
      const s = Math.floor(diff / 1000);
      const parts = [d > 0 ? `${d}j` : null, `${String(h).padStart(2, '0')}h`, `${String(m).padStart(2, '0')}m`, `${String(s).padStart(2, '0')}s`].filter(Boolean);
      setBonusCountdown(parts.join(' '));
      setBonusUrgent(new Date(activeWelcomeGrant.expires_at).getTime() - now <= 7 * 24 * 60 * 60 * 1000);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [activeWelcomeGrant?.expires_at]);

  const handleReinvest = async () => {
    try {
      setReinvestLoading(true);
      const pkgId = reinvestForm.packageId || (reinvestForm.source === 'claimable_bonus' ? discoveryPackages[0]?.id : regularPackages[0]?.id);
      if (!pkgId) {
        notify.error('Aucun package disponible pour ce réinvestissement');
        setReinvestLoading(false);
        return;
      }
      const amountNum = parseFloat(reinvestForm.amount);
      if (!amountNum || amountNum <= 0) {
        notify.error('Montant invalide');
        setReinvestLoading(false);
        return;
      }
      const cb = Number(user?.claimable_balance || 0);
      const cbb = Number(user?.claimable_bonus_balance || 0);
      if (reinvestForm.source === 'claimable' && amountNum > cb) {
        notify.error('Montant supérieur à votre solde de gains réinvestissables');
        setReinvestLoading(false);
        return;
      }
      if (reinvestForm.source === 'claimable_bonus' && amountNum > cbb) {
        notify.error('Montant supérieur à votre solde de gains bonus réinvestissables');
        setReinvestLoading(false);
        return;
      }
      const chosen = normalizedPackages.find((p: any) => p.id === pkgId);
      if (chosen) {
        if (reinvestForm.source === 'claimable_bonus' && !chosen.is_discovery_bonus) {
          notify.error('Les gains bonus ne peuvent être réinvestis que dans le package Discovery');
          setReinvestLoading(false);
          return;
        }
        if (amountNum < chosen.min_amount) {
          notify.error(`Le montant doit être ≥ ${formatCurrency(chosen.min_amount)} Pi`);
          setReinvestLoading(false);
          return;
        }
        if (chosen.max_amount && amountNum > chosen.max_amount) {
          notify.error(`Le montant doit être ≤ ${formatCurrency(chosen.max_amount)} Pi`);
          setReinvestLoading(false);
          return;
        }
      }

      const res = await stakingService.reinvest(String(pkgId), amountNum, reinvestForm.source);
      if (!res.success) {
        notify.error(res.message || 'Échec du réinvestissement');
      } else {
        notify.success('Réinvestissement effectué avec succès');
        setReinvestForm({ ...reinvestForm, amount: '' });
        await refreshAllData();
        await refreshUser();
      }
    } catch (e) {
      console.error(e);
      notify.error('Erreur lors du réinvestissement');
    } finally {
      setReinvestLoading(false);
    }
  };

  const navItems: { key: string; label: string; icon: React.ReactNode }[] = [
    { key: 'overview', label: "Vue d'ensemble", icon: <BarChart3 className="h-4 w-4" /> },
    { key: 'staking', label: 'Staking', icon: <Target className="h-4 w-4" /> },
    { key: 'investments', label: 'Investissements', icon: <Coins className="h-4 w-4" /> },
    { key: 'claims', label: 'Réclamations', icon: <Gift className="h-4 w-4" /> },
    { key: 'referrals', label: 'Parrainage', icon: <Users className="h-4 w-4" /> },
    { key: 'transactions', label: 'Transactions', icon: <History className="h-4 w-4" /> },
    { key: 'security', label: 'Sécurité', icon: <Shield className="h-4 w-4" /> },
    { key: 'profile', label: 'Profil', icon: <Settings className="h-4 w-4" /> },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 relative">
      <ParticleBackground />

      <Navbar
        onMenuClick={() => setMobileOpen(true)}
        title="Pi Staking Dashboard"
        subtitle={user?.username ? `Bienvenue, ${user.username}` : undefined}
        right={
          <div className="flex items-center space-x-4 md:space-x-6">
            <div className="text-right max-[360px]:hidden">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm text-muted-foreground">Solde Total</p>
                <Button variant="ghost" size="sm" onClick={() => setShowBalance(!showBalance)} className="h-4 w-4 p-0">
                  {showBalance ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                </Button>
              </div>
              <p className="text-xl md:text-2xl font-bold text-pi-primary whitespace-nowrap">
                {showBalance ? `${formatCurrency(Number(user?.balance_pi ?? 0))} Pi` : '****'}
              </p>
            </div>

            <div className="relative">
              <Button variant="ghost" size="sm" aria-label="Notifications">
                <Bell className="h-5 w-5" />
                {notifications?.length > 0 && (
                  <Badge className="absolute -top-1 -right-1 px-1 min-w-[1.2rem] h-5 text-xs bg-red-500">{notifications.length}</Badge>
                )}
              </Button>
            </div>

            <Badge variant="outline" className="bg-pi-gold text-white border-0 px-3 py-1 whitespace-nowrap"> 
              <Star className="h-3 w-3 mr-1" />
              NIVEAU OR
            </Badge>

            <Button variant="ghost" size="sm" onClick={onLogout} aria-label="Se déconnecter">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        }
      />

      {/* Mobile Drawer */}
      <Drawer open={mobileOpen} onOpenChange={setMobileOpen} direction="left">
        <DrawerContent className="w-[85vw] max-w-sm">
          <DrawerHeader className="flex items-center justify-between">
            <DrawerTitle>Navigation</DrawerTitle>
            <DrawerClose asChild>
              <Button variant="ghost" size="sm" aria-label="Fermer le menu">Fermer</Button>
            </DrawerClose>
          </DrawerHeader>
          <div className="px-4 pb-4">
            <nav className="flex flex-col gap-1">
              {navItems.map((item) => (
                <Button
                  key={item.key}
                  variant={activeTab === item.key ? 'secondary' : 'ghost'}
                  className="justify-start gap-3 w-full whitespace-nowrap text-ellipsis overflow-hidden"
                  onClick={() => {
                    setActiveTab(item.key);
                    setMobileOpen(false);
                  }}
                  aria-current={activeTab === item.key ? 'page' : undefined}
                >
                  {item.icon}
                  <span className="text-sm max-[360px]:text-xs">{item.label}</span>
                </Button>
              ))}
              <Separator className="my-2" />
              <Button variant="ghost" className="justify-start gap-3" onClick={onLogout}>
                <LogOut className="h-4 w-4" /> Se déconnecter
              </Button>
            </nav>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Desktop Navigation */}
      <div className="relative z-10 border-b border-border/50 bg-card/60 backdrop-blur-sm hidden md:block">
        <div className="container mx-auto px-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-8 h-14">
              <TabsTrigger value="overview" className="flex flex-col items-center gap-1 text-xs whitespace-nowrap">
                <BarChart3 className="h-4 w-4" /> Vue d'ensemble
              </TabsTrigger>
              <TabsTrigger value="staking" className="flex flex-col items-center gap-1 text-xs whitespace-nowrap">
                <Target className="h-4 w-4" /> Staking
              </TabsTrigger>
              <TabsTrigger value="investments" className="flex flex-col items-center gap-1 text-xs whitespace-nowrap">
                <Coins className="h-4 w-4" /> Investissements
              </TabsTrigger>
              <TabsTrigger value="claims" className="flex flex-col items-center gap-1 text-xs whitespace-nowrap">
                <Gift className="h-4 w-4" /> Réclamations
              </TabsTrigger>
              <TabsTrigger value="referrals" className="flex flex-col items-center gap-1 text-xs whitespace-nowrap">
                <Users className="h-4 w-4" /> Parrainage
              </TabsTrigger>
              <TabsTrigger value="transactions" className="flex flex-col items-center gap-1 text-xs whitespace-nowrap">
                <History className="h-4 w-4" /> Transactions
              </TabsTrigger>
              <TabsTrigger value="security" className="flex flex-col items-center gap-1 text-xs whitespace-nowrap">
                <Shield className="h-4 w-4" /> Sécurité
              </TabsTrigger>
              <TabsTrigger value="profile" className="flex flex-col items-center gap-1 text-xs whitespace-nowrap">
                <Settings className="h-4 w-4" /> Profil
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto p-4 md:p-6">
        {!checkEmailVerified() && (
          <div className="mb-4">
            <EmailVerificationBanner email={user?.email} />
          </div>
        )}

        {(stakingLoading || dashboardLoading) && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <GlowCard key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-32" />
                </CardHeader>
                <CardContent className="space-y-2">
                  <Skeleton className="h-7 w-24" />
                  <Skeleton className="h-4 w-40" />
                </CardContent>
              </GlowCard>
            ))}
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Overview */}
          <TabsContent value="overview" className="space-y-6">
            {!welcomeBonusClaimed && (
              <Alert>
                <Gift className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between w-full">
                  <span>Vous avez un bonus de bienvenue à réclamer pour découvrir le package "Discovery".</span>
                  <Button size="sm" className="ml-4" onClick={handleClaimWelcome}>
                    Réclamer maintenant
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <GlowCard>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Investi</CardTitle>
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-pi-primary">{formatCurrency(calculatedTotalInvested)} Pi</div>
                  <p className="text-xs text-muted-foreground">+{investments?.length || 0} investissements</p>
                </CardContent>
              </GlowCard>

              <GlowCard>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Solde disponible</CardTitle>
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(Number(user?.balance_pi || 0) - Number(user?.pending_withdrawal || 0))} Pi
                  </div>
                  <p className="text-xs text-muted-foreground">Après réservations de retraits</p>
                </CardContent>
              </GlowCard>

              <GlowCard>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Gains réinvestissables</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{formatCurrency(Number(user?.claimable_balance || 0))} Pi</div>
                  <p className="text-xs text-muted-foreground">Réinvestissable dans n'importe quel package</p>
                </CardContent>
              </GlowCard>

              <GlowCard>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Gains bonus réinvestissables</CardTitle>
                  <Gift className="h-4 w-4 text-pi-gold" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-pi-gold">{formatCurrency(Number(user?.claimable_bonus_balance || 0))} Pi</div>
                  <p className="text-xs text-muted-foreground">Réinvestissable seulement dans Discovery</p>
                </CardContent>
              </GlowCard>
            </div>

            {welcomeBonusClaimed && (
              <GlowCard className={bonusUrgent ? 'ring-1 ring-red-500/40' : ''}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Gift className="h-4 w-4 text-pi-gold" /> Bonus de bienvenue
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                    <div>
                      <p className="text-sm text-muted-foreground">Disponible</p>
                      <p className="text-xl font-bold">{formatCurrency(Number(user?.bonus_balance ?? 0))} Pi</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Expiration</p>
                      <p className={`text-xl font-bold ${bonusUrgent ? 'text-red-600' : ''}`}>
                        {activeWelcomeGrant?.expires_at ? formatDate(activeWelcomeGrant.expires_at) : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Compte à rebours</p>
                      <p className={`text-xl font-bold ${bonusUrgent ? 'text-red-600' : ''}`}>{bonusCountdown || '—'}</p>
                    </div>
                    <div className="text-right">
                      <Badge className={bonusUrgent ? 'bg-red-500/10 text-red-600' : ''} variant={welcomeBonusReinvested ? 'default' : 'secondary'}>
                        {welcomeBonusReinvested ? 'Réinvesti' : 'À réinvestir'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </GlowCard>
            )}

            <GlowCard>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" /> Réinvestir mes gains
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <Label>Source</Label>
                    <select className="w-full border rounded-md h-10 px-2 bg-background" value={reinvestForm.source} onChange={(e) => setReinvestForm({ ...reinvestForm, source: e.target.value as any, packageId: '' })}>
                      <option value="claimable">Gains</option>
                      <option value="claimable_bonus">Gains bonus (Discovery)</option>
                    </select>
                  </div>
                  <div>
                    <Label>Package</Label>
                    <select className="w-full border rounded-md h-10 px-2 bg-background" value={reinvestForm.packageId} onChange={(e) => setReinvestForm({ ...reinvestForm, packageId: e.target.value })}>
                      {(reinvestForm.source === 'claimable' ? regularPackages : discoveryPackages).map((p: any) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>Montant (Pi)</Label>
                    <Input type="number" placeholder="0.00" value={reinvestForm.amount} onChange={(e) => setReinvestForm({ ...reinvestForm, amount: e.target.value })} />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleReinvest} disabled={reinvestLoading} className="pi-gradient text-white hover:pi-gradient-hover">
                    {reinvestLoading ? 'Réinvestissement...' : 'Réinvestir'}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Solde gains: {formatCurrency(Number(user?.claimable_balance || 0))} Pi • Gains bonus: {formatCurrency(Number(user?.claimable_bonus_balance || 0))} Pi • Réservé: {formatCurrency(Number(user?.pending_withdrawal || 0))} Pi
                </p>
              </CardContent>
            </GlowCard>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button onClick={() => setActiveTab('staking')} className="h-16 pi-gradient text-white hover:pi-gradient-hover">
                <div className="flex flex-col items-center gap-2">
                  <Plus className="h-5 w-5" />
                  <span>Nouvel Investissement</span>
                </div>
              </Button>

              {user?.welcome_bonus_claimed && !user?.welcome_bonus_reinvested && (
                <Button onClick={handleReinvestBonus} className="h-16 bg-green-600 hover:bg-green-700 text-white">
                  <div className="flex flex-col items-center gap-2">
                    <Gift className="h-5 w-5" />
                    <span>Réinvestir mon bonus</span>
                  </div>
                </Button>
              )}

              <Button onClick={handleClaimAll} disabled={!safeClaimableInvestments?.length || claimAllLoading} aria-busy={claimAllLoading} className="h-16 bg-pi-gold hover:bg-pi-gold/90 text-white">
                <div className="flex flex-col items-center gap-2">
                  <Gift className="h-5 w-5" />
                  <span>{claimAllLoading ? 'Réclamation...' : `Réclamer Tout (${safeClaimableInvestments?.length || 0})`}</span>
                </div>
              </Button>

              {(() => {
                const cb = Number(user?.claimable_balance || 0);
                const eligible = [...regularPackages].sort((a: any, b: any) => a.min_amount - b.min_amount).find((p: any) => cb >= Number(p.min_amount));
                return (
                  <Button
                    onClick={async () => {
                      try {
                        setReinvestQuickLoading(true);
                        const res = await stakingService.reinvestQuick();
                        if (!res.success) {
                          notify.error(res.message || 'Échec du réinvestissement rapide');
                        } else {
                          notify.success(`Réinvestissement rapide: ${formatCurrency(res.data?.reinvested_amount || 0)} Pi`);
                        }
                        await refreshAllData();
                        await refreshUser();
                      } catch (e) {
                        console.error(e);
                        notify.error('Erreur lors du réinvestissement rapide');
                      } finally {
                        setReinvestQuickLoading(false);
                      }
                    }}
                    disabled={!eligible || reinvestQuickLoading}
                    aria-busy={reinvestQuickLoading}
                    variant="outline"
                    className="h-16"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      <span>{reinvestQuickLoading ? 'Réinvest. rapide...' : 'Réinvestissement rapide'}</span>
                    </div>
                  </Button>
                );
              })()}

              <Button onClick={() => setShowWithdrawModal(true)} variant="outline" className="h-16">
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-5 w-5" />
                  <span>Retirer des Pi</span>
                </div>
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <GlowCard>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" /> Activité Récente
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {transactionHistory.slice(0, 5).map((transaction, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-full ${transaction.type === 'claim' ? 'bg-green-500/20 text-green-500' : transaction.type === 'investment' ? 'bg-blue-500/20 text-blue-500' : 'bg-orange-500/20 text-orange-500'}`}
                        >
                          {transaction.type === 'claim' && <Download className="h-4 w-4" />}
                          {transaction.type === 'investment' && <Target className="h-4 w-4" />}
                          {transaction.type === 'withdrawal' && <Upload className="h-4 w-4" />}
                        </div>
                        <div>
                          <p className="font-medium capitalize">{transaction.type}</p>
                          <p className="text-sm text-muted-foreground">{formatDate(transaction.created_at)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{transaction.amount > 0 ? '+' : ''}
                          {formatCurrency(transaction.amount)} Pi
                        </p>
                        <Badge variant={transaction.status === 'completed' ? 'default' : 'secondary'}>{transaction.status}</Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </GlowCard>

              <GlowCard>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" /> Répartition des Investissements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {investments ? (
                    <div className="space-y-4">
                      {normalizedPackages.map((pkg: any) => {
                        const pkgInvestments = investments.filter((inv: any) => inv.package?.id === pkg.id);
                        const pkgTotal = pkgInvestments.reduce((sum: number, inv: any) => sum + inv.amount, 0);
                        const percentage = calculatedTotalInvested > 0 ? (pkgTotal / calculatedTotalInvested) * 100 : 0;
                        if (percentage === 0) return null;
                        return (
                          <div key={pkg.id} className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium">{pkg.name}</span>
                              <span className="text-sm text-muted-foreground">{formatCurrency(pkgTotal)} Pi ({percentage.toFixed(1)}%)</span>
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

          {/* Staking */}
          <TabsContent value="staking" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold">Packages de Staking</h2>
              <div className="flex gap-2">
                <Button onClick={() => setShowDepositModal(true)} className="pi-gradient text-white hover:pi-gradient-hover">
                  Faire un dépôt
                </Button>
                <Button onClick={() => refreshAllData()} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" /> Actualiser
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {normalizedPackages.map((pkg: any) => (
                <GlowCard key={pkg.id} className="cursor-pointer hover:scale-105 transition-transform">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl">{pkg.name}</CardTitle>
                        <Badge variant="outline" className="mt-2">{(pkg.daily_rate * 365).toFixed(2)}% APY</Badge>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Minimum</p>
                        <p className="font-bold">{formatCurrency(pkg.min_amount)} Pi</p>
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
                        <span className="font-medium">{pkg.max_amount ? `${formatCurrency(pkg.max_amount)} Pi` : 'Illimité'}</span>
                      </div>
                    </div>

                    <Button
                      onClick={() => {
                        setSelectedPackage(pkg as any);
                        setInvestmentForm({ ...investmentForm, staking_package_id: pkg.id });
                        setShowInvestModal(true);
                      }}
                      className="w-full pi-gradient text-white hover:pi-gradient-hover"
                    >
                      <Target className="h-4 w-4 mr-2" /> Investir
                    </Button>
                  </CardContent>
                </GlowCard>
              ))}
            </div>
          </TabsContent>

          {/* Investments */}
          <TabsContent value="investments" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold">Mes Investissements</h2>
              <div className="flex gap-2">
                <Button onClick={() => setShowDepositModal(true)} className="pi-gradient text-white hover:pi-gradient-hover">
                  Faire un dépôt
                </Button>
                <Button onClick={() => refreshAllData()} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" /> Actualiser
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              {safeInvestments.map((investment) => (
                <GlowCard key={investment.id}>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                      <div>
                        <h3 className="font-semibold text-lg">{investment.package?.name || 'Package inconnu'}</h3>
                        <p className="text-sm text-muted-foreground">Démarré le {formatDate(investment.created_at)}</p>
                      </div>

                      <div className="text-center">
                        <p className="text-2xl font-bold">{formatCurrency(investment.amount)} Pi</p>
                        <p className="text-sm text-muted-foreground">Investi</p>
                      </div>

                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">+{formatCurrency(investment.total_earned || 0)} Pi</p>
                        <p className="text-sm text-muted-foreground">Gagné</p>
                      </div>

                      <div className="text-center">
                        <div className="space-y-2">
                          {(() => {
                            const daysElapsed = Math.floor((new Date().getTime() - new Date(investment.created_at).getTime()) / (1000 * 60 * 60 * 24));
                            const maxDays = investment.package?.duration_days || 365;
                            return (
                              <>
                                <Progress value={(daysElapsed / maxDays) * 100} className="h-2" />
                                <p className="text-sm text-muted-foreground">{daysElapsed}/{maxDays} jours</p>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    </div>

                    <Separator className="my-4" />

                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <Badge variant={investment.status === 'active' ? 'default' : 'secondary'}>{investment.status}</Badge>
                        {investment.next_claim_at && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" /> Prochain claim: {formatDate(investment.next_claim_at)}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {investment.status === 'active' && (
                          <Button onClick={() => claimInvestment(investment.id.toString())} className="bg-pi-gold hover:bg-pi-gold/90 text-white">
                            <Gift className="h-4 w-4 mr-2" /> Réclamer
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </GlowCard>
              ))}

              {!safeInvestments.length && (
                <GlowCard>
                  <CardContent className="text-center py-12">
                    <Target className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Aucun investissement</h3>
                    <p className="text-muted-foreground mb-4">Commencez votre premier investissement pour générer des revenus passifs.</p>
                    <Button onClick={() => setActiveTab('staking')} className="pi-gradient text-white hover:pi-gradient-hover">
                      <Plus className="h-4 w-4 mr-2" /> Premier Investissement
                    </Button>
                  </CardContent>
                </GlowCard>
              )}
            </div>
          </TabsContent>

          {/* Claims */}
          <TabsContent value="claims" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold">Réclamations</h2>
              <div className="flex gap-2">
                {totalClaimable > 0 && (
                  <Button onClick={handleClaimAll} className="bg-pi-gold hover:bg-pi-gold/90 text-white" disabled={claimAllLoading} aria-busy={claimAllLoading}>
                    <Gift className="h-4 w-4 mr-2" /> {claimAllLoading ? 'Réclamation...' : `Tout Réclamer (${formatCurrency(totalClaimable)} Pi)`}
                  </Button>
                )}
                <Button onClick={() => refreshAllData()} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" /> Actualiser
                </Button>
              </div>
            </div>

            <div className="text-xs text-muted-foreground">
              Min retrait: 2 Pi • Caps/jour: Bronze 20, Silver 50, Gold 100, Diamond 200 Pi • Taux journaliers approx.: Discovery 2.5%, Bronze 0.8%, Silver 0.5%, Gold 0.3%, Diamond 0.2%
            </div>

            <div className="space-y-4">
              {safeClaimableInvestments.map((investment) => (
                <GlowCard key={investment.id} className="border-pi-gold/50">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                          <Gift className="h-5 w-5 text-pi-gold" /> {investment.investment?.package?.name || 'Package inconnu'}
                        </h3>
                        <p className="text-muted-foreground">Investissement de {formatCurrency(investment.amount)} Pi</p>
                      </div>

                      <div className="text-right">
                        <p className="text-2xl font-bold text-pi-gold">+{formatCurrency(investment.claimable_amount)} Pi</p>
                        <p className="text-sm text-muted-foreground">À réclamer</p>
                      </div>

                      <Button onClick={() => claimInvestment(investment.id.toString())} className="bg-pi-gold hover:bg-pi-gold/90 text-white">
                        <Gift className="h-4 w-4 mr-2" /> Réclamer
                      </Button>
                    </div>
                  </CardContent>
                </GlowCard>
              ))}

              {!safeClaimableInvestments.length && (
                <GlowCard>
                  <CardContent className="text-center py-12">
                    <Timer className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Aucune réclamation disponible</h3>
                    <p className="text-muted-foreground">Vos prochaines réclamations seront disponibles selon le calendrier de vos investissements.</p>
                  </CardContent>
                </GlowCard>
              )}
            </div>
          </TabsContent>

          {/* Referrals */}
          <TabsContent value="referrals" className="space-y-6">
            <ReferralDashboard />
          </TabsContent>

          {/* Transactions */}
          <TabsContent value="transactions" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold">Historique des Transactions</h2>
              <div className="flex gap-2">
                <Button onClick={() => setShowWithdrawModal(true)} variant="outline">
                  <Upload className="h-4 w-4 mr-2" /> Nouveau Retrait
                </Button>
                <Button onClick={() => loadTransactionHistory()} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" /> Actualiser
                </Button>
              </div>
            </div>

            <GlowCard>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" /> Limites de Retrait
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Limite Journalière</p>
                    <p className="text-xl font-bold">{formatCurrency(withdrawalLimits.daily)} Pi</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Limite Mensuelle</p>
                    <p className="text-xl font-bold">{formatCurrency(withdrawalLimits.monthly)} Pi</p>
                  </div>
                </div>
              </CardContent>
            </GlowCard>

            <GlowCard>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {transactionHistory.map((transaction, index) => (
                    <div key={index} className="flex items-center justify-between p-4 rounded-lg border">
                      <div className="flex items-center gap-4">
                        <div
                          className={`p-3 rounded-full ${transaction.type === 'claim' ? 'bg-green-500/20 text-green-500' : transaction.type === 'investment' ? 'bg-blue-500/20 text-blue-500' : 'bg-orange-500/20 text-orange-500'}`}
                        >
                          {transaction.type === 'claim' && <Download className="h-5 w-5" />}
                          {transaction.type === 'investment' && <Target className="h-5 w-5" />}
                          {transaction.type === 'withdrawal' && <Upload className="h-5 w-5" />}
                        </div>
                        <div>
                          <h4 className="font-medium capitalize">{transaction.type}</h4>
                          <p className="text-sm text-muted-foreground">{formatDate(transaction.created_at)}</p>
                          {transaction.description && <p className="text-xs text-muted-foreground mt-1">{transaction.description}</p>}
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-lg font-semibold">{transaction.amount > 0 ? '+' : ''}{formatCurrency(transaction.amount)} Pi</p>
                        <Badge
                          variant={transaction.status === 'completed' ? 'default' : transaction.status === 'pending' ? 'secondary' : 'destructive'}
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

          {/* Security */}
          <TabsContent value="security" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold">Centre de Sécurité</h2>
              <Button onClick={() => loadSecurityData()} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" /> Actualiser
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <GlowCard>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" /> Authentification à Deux Facteurs (2FA)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Statut 2FA</p>
                      <p className="text-sm text-muted-foreground">{twoFactorEnabled ? 'Activée' : 'Désactivée'}</p>
                    </div>
                    <Switch checked={twoFactorEnabled} onCheckedChange={toggle2FA} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Notifications 2FA</p>
                      <p className="text-sm text-muted-foreground">Alertes pour les connexions</p>
                    </div>
                    <Switch checked={notifications2FA} onCheckedChange={setNotifications2FA} />
                  </div>

                  <Alert>
                    <Shield className="h-4 w-4" />
                    <AlertDescription>L'authentification à deux facteurs ajoute une couche de sécurité supplémentaire à votre compte.</AlertDescription>
                  </Alert>
                </CardContent>
              </GlowCard>

              <GlowCard>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5" /> État de Sécurité
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500" /> <span>Mot de passe sécurisé</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {twoFactorEnabled ? <CheckCircle className="h-5 w-5 text-green-500" /> : <AlertTriangle className="h-5 w-5 text-yellow-500" />}
                      <span>Authentification 2FA</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500" /> <span>Email vérifié</span>
                    </div>

                    <div className="pt-4">
                      <p className="text-sm font-medium mb-2">Score de Sécurité</p>
                      <Progress value={twoFactorEnabled ? 95 : 75} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">{twoFactorEnabled ? 'Excellent' : 'Bon - Activez la 2FA pour améliorer'}</p>
                    </div>
                  </div>
                </CardContent>
              </GlowCard>
            </div>

            <GlowCard>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" /> Journal de Sécurité
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {securityLogs.map((log, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-full ${log.type === 'login' ? 'bg-green-500/20 text-green-500' : log.type === 'logout' ? 'bg-gray-500/20 text-gray-500' : 'bg-blue-500/20 text-blue-500'}`}
                        >
                          {log.type === 'login' && <Lock className="h-4 w-4" />}
                          {log.type === 'logout' && <Unlock className="h-4 w-4" />}
                          {log.type === 'security' && <Shield className="h-4 w-4" />}
                        </div>
                        <div>
                          <p className="font-medium">{log.description}</p>
                          <p className="text-sm text-muted-foreground">IP: {log.ip_address} • {formatDate(log.created_at)}</p>
                        </div>
                      </div>
                      <Badge variant={log.status === 'success' ? 'default' : 'destructive'}>{log.status}</Badge>
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

          {/* Profile */}
          <TabsContent value="profile" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold">Mon Profil</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <GlowCard>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" /> Informations Personnelles
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
                    <p className="text-sm text-muted-foreground mt-1">{user?.created_at ? formatDate(user.created_at) : 'Non disponible'}</p>
                  </div>
                </CardContent>
              </GlowCard>

              <GlowCard>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" /> Statistiques du Compte
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Total investi:</span>
                    <span className="font-bold">{formatCurrency(calculatedTotalInvested)} Pi</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total gagné:</span>
                    <span className="font-bold text-green-600">+{formatCurrency(totalEarnings)} Pi</span>
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
                    <span className="text-sm">{user?.last_claim_at ? formatDate(user.last_claim_at) : 'Jamais'}</span>
                  </div>
                </CardContent>
              </GlowCard>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Deposit Modal */}
      <DepositModal open={showDepositModal} onOpenChange={setShowDepositModal} />

      {/* Invest Modal */}
      <Dialog open={showInvestModal} onOpenChange={setShowInvestModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nouvel Investissement</DialogTitle>
          </DialogHeader>
          {selectedPackage && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <h3 className="font-semibold">{selectedPackage.name}</h3>
                <p className="text-sm text-muted-foreground">APY: {(selectedPackage.daily_rate * 365).toFixed(2)}% • Durée: {selectedPackage.max_duration_days} jours</p>
              </div>

              <div className="space-y-2">
                <Label>Montant à investir (Pi)</Label>
                <Input
                  type="number"
                  placeholder={`Minimum: ${formatCurrency(selectedPackage.min_amount)} Pi`}
                  value={investmentForm.amount}
                  onChange={(e) => setInvestmentForm({ ...investmentForm, amount: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">Solde disponible: {formatCurrency(Number(user?.balance_pi ?? 0))} Pi</p>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleInvestment} disabled={!investmentForm.amount || parseFloat(investmentForm.amount) < selectedPackage.min_amount} className="flex-1 pi-gradient text-white hover:pi-gradient-hover">
                  Investir
                </Button>
                <Button onClick={() => setShowInvestModal(false)} variant="outline">
                  Annuler
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Withdraw Modal */}
      <Dialog open={showWithdrawModal} onOpenChange={setShowWithdrawModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Demande de Retrait</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>Les retraits sont traités sous 24-48h ouvrables après vérification.</AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label>Montant à retirer (Pi)</Label>
              <Input
                type="number"
                placeholder="Montant en Pi"
                value={withdrawalForm.amount}
                onChange={(e) => setWithdrawalForm({ ...withdrawalForm, amount: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">Limite journalière: {formatCurrency(withdrawalLimits.daily)} Pi</p>
            </div>

            <div className="space-y-2">
              <Label>Adresse Pi Network</Label>
              <Input
                placeholder="Votre adresse de portefeuille Pi"
                value={withdrawalForm.pi_address}
                onChange={(e) => setWithdrawalForm({ ...withdrawalForm, pi_address: e.target.value })}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleWithdrawal} disabled={!withdrawalForm.amount || !withdrawalForm.pi_address} className="flex-1">
                Demander le Retrait
              </Button>
              <Button onClick={() => setShowWithdrawModal(false)} variant="outline">
                Annuler
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
