import React, { useState, useEffect } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ParticleBackground } from '@/components/ParticleBackground';
import { GlowCard } from '@/components/GlowCard';
import { 
  BarChart3,
  Users,
  DollarSign,
  Activity,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  Download,
  Upload,
  Settings,
  Shield,
  Bell,
  Eye,
  EyeOff,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Plus,
  LogOut,
  Server,
  Database,
  Wifi,
  WifiOff,
  Lock,
  Unlock,
  Mail,
  Phone,
  Calendar,
  Target,
  Award,
  Gift,
  History,
  FileText,
  PieChart,
  LineChart,
  Zap,
  Coins,
  Wallet
} from 'lucide-react';

// Import des contextes et services
import { useAuth } from '@/contexts/AuthContext';
import { useDashboard } from '@/contexts/DashboardContext';
import { dashboardService } from '@/services/dashboardService';
import { transactionsService } from '@/services/transactionsService';
import { stakingService } from '@/services/stakingService';

// Import du dashboard de parrainage
import { AdminReferralDashboard } from '@/components/AdminReferralDashboard';
import AdminDepositManager from '@/admin/components/AdminDepositManager';

interface AdminDashboardCompleteProps {
  onLogout: () => void;
}

export function AdminDashboardComplete({ onLogout }: AdminDashboardCompleteProps) {
  const { state: authState } = useAuth();
  const user = authState.user;
  const { state: dashboardState } = useDashboard();
  const { dashboardData, isLoading } = dashboardState;
  
  const [activeTab, setActiveTab] = useState('overview');
  const [systemHealth, setSystemHealth] = useState({
    database: 'healthy',
    api: 'healthy',
    cache: 'healthy',
    payments: 'healthy'
  });
  
  // États pour les données admin
  const [adminStats, setAdminStats] = useState({
    totalUsers: 0,
    activeInvestments: 0,
    totalVolume: 0,
    pendingWithdrawals: 0,
    monthlyRevenue: 0,
    systemUptime: '99.9%'
  });
  
  const [users, setUsers] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [systemLogs, setSystemLogs] = useState<any[]>([]);
  
  // États pour les filtres et recherche
  const [userFilter, setUserFilter] = useState('');
  const [transactionFilter, setTransactionFilter] = useState('all');
  const [dateRange, setDateRange] = useState('7days');
  
  // États pour les modales
  const [showUserModal, setShowUserModal] = useState(false);
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  
  // États pour les formulaires
  const [userForm, setUserForm] = useState({
    username: '',
    email: '',
    balance_pi: '',
    is_admin: false,
    status: 'active'
  });
  
  const [packageForm, setPackageForm] = useState({
    name: '',
    description: '',
    minimum_amount: '',
    maximum_amount: '',
    apy: '',
    duration_days: '',
    claim_frequency_hours: '',
    is_active: true
  });
  
  // Charger les données admin
  useEffect(() => {
    loadAdminData();
    loadUsers();
    loadTransactions();
    loadPackages();
    loadSystemHealth();
    
    // Actualiser toutes les 30 secondes
    const interval = setInterval(() => {
      loadAdminData();
      loadSystemHealth();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const loadAdminData = async () => {
    try {
      const response = await dashboardService.getAdminDashboardStats();
      const data = response.data;
      setAdminStats({
        totalUsers: data?.overview?.total_users || 0,
        activeInvestments: data?.overview?.active_users || 0,
        totalVolume: data?.overview?.platform_tvl || 0,
        pendingWithdrawals: data?.overview?.pending_withdrawals || 0,
        monthlyRevenue: 0, // Pas dans AdminDashboardStats
        systemUptime: '99.9%' // Pas dans AdminDashboardStats
      });
    } catch (error) {
      console.error('Erreur chargement données admin:', error);
    }
  };

  const loadUsers = async () => {
    try {
      // Simuler un appel API pour les utilisateurs
      const mockUsers = [
        {
          id: 1,
          username: 'john_doe',
          email: 'john@example.com',
          balance_pi: 1250.5,
          total_invested: 500,
          total_earned: 75.25,
          status: 'active',
          is_verified: true,
          last_login: '2024-01-15T10:30:00Z',
          created_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 2,
          username: 'jane_smith',
          email: 'jane@example.com',
          balance_pi: 850.75,
          total_invested: 300,
          total_earned: 45.50,
          status: 'active',
          is_verified: true,
          last_login: '2024-01-14T15:45:00Z',
          created_at: '2024-01-02T00:00:00Z'
        }
      ];
      setUsers(mockUsers);
    } catch (error) {
      console.error('Erreur chargement utilisateurs:', error);
    }
  };

  const loadTransactions = async () => {
    try {
      const history = await transactionsService.getTransactionHistory();
      setTransactions(history.data?.transactions?.slice(0, 50) || []); // Dernières 50 transactions
    } catch (error) {
      console.error('Erreur chargement transactions:', error);
      // Données mockées en cas d'erreur
      const mockTransactions = [
        {
          id: 1,
          user_id: 1,
          type: 'investment',
          amount: 100,
          status: 'completed',
          created_at: '2024-01-15T10:00:00Z',
          user: { username: 'john_doe' },
          description: 'Investissement Package Or'
        },
        {
          id: 2,
          user_id: 2,
          type: 'withdrawal',
          amount: -50,
          status: 'pending',
          created_at: '2024-01-15T11:00:00Z',
          user: { username: 'jane_smith' },
          description: 'Demande de retrait'
        }
      ];
      setTransactions(mockTransactions);
    }
  };

  const loadPackages = async () => {
    try {
      const response = await stakingService.getPackages();
      setPackages(response.data || []);
    } catch (error) {
      console.error('Erreur chargement packages:', error);
    }
  };

  const loadSystemHealth = async () => {
    try {
      // Simuler vérification santé système
      setSystemHealth({
        database: Math.random() > 0.1 ? 'healthy' : 'warning',
        api: Math.random() > 0.05 ? 'healthy' : 'error',
        cache: Math.random() > 0.15 ? 'healthy' : 'warning',
        payments: Math.random() > 0.08 ? 'healthy' : 'warning'
      });
    } catch (error) {
      console.error('Erreur vérification système:', error);
    }
  };

  const handleUserAction = async (action: string, userId?: number) => {
    try {
      switch (action) {
        case 'create':
          // Logique création utilisateur
          console.log('Créer utilisateur:', userForm);
          break;
        case 'edit':
          console.log('Modifier utilisateur:', userId);
          break;
        case 'suspend':
          console.log('Suspendre utilisateur:', userId);
          break;
        case 'delete':
          console.log('Supprimer utilisateur:', userId);
          break;
      }
      await loadUsers();
    } catch (error) {
      console.error('Erreur action utilisateur:', error);
    }
  };

  const handleTransactionAction = async (action: string, transactionId: number) => {
    try {
      switch (action) {
        case 'approve':
          console.log('Approuver transaction:', transactionId);
          break;
        case 'reject':
          console.log('Rejeter transaction:', transactionId);
          break;
        case 'cancel':
          console.log('Annuler transaction:', transactionId);
          break;
      }
      await loadTransactions();
    } catch (error) {
      console.error('Erreur action transaction:', error);
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

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4" />;
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      case 'error': return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 relative">
      <ParticleBackground />
      
      {/* Header Admin */}
      <header className="relative z-10 border-b border-border/50 bg-card/80 backdrop-blur-md">
        <div className="container mx-auto flex h-20 items-center justify-between px-4">
          <div className="flex items-center space-x-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/20 text-red-500 animate-pi-pulse">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-red-600">Administration Pi Staking</h1>
              <p className="text-sm text-muted-foreground">Panneau de contrôle administrateur</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            {/* Indicateurs système */}
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Uptime</p>
                <p className="text-sm font-bold text-green-600">{adminStats.systemUptime}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Utilisateurs</p>
                <p className="text-sm font-bold">{adminStats.totalUsers}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Volume Total</p>
                <p className="text-sm font-bold">{formatCurrency(adminStats.totalVolume)} π</p>
              </div>
            </div>

            {/* Notifications admin */}
            <div className="relative">
              <Button variant="ghost" size="sm">
                <Bell className="h-5 w-5" />
                <Badge className="absolute -top-1 -right-1 px-1 min-w-[1.2rem] h-5 text-xs bg-red-500">
                  {adminStats.pendingWithdrawals}
                </Badge>
              </Button>
            </div>

            {/* Admin badge */}
            <Badge variant="outline" className="bg-red-500 text-white border-0 px-3 py-1">
              <Shield className="h-3 w-3 mr-1" />
              ADMIN
            </Badge>

            {/* Logout */}
            <Button variant="ghost" size="sm" onClick={onLogout}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Navigation Admin */}
      <div className="relative z-10 border-b border-border/50 bg-card/60 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-10 h-14">
              <TabsTrigger value="overview" className="flex flex-col items-center gap-1 text-xs">
                <BarChart3 className="h-4 w-4" />
                Vue d'ensemble
              </TabsTrigger>
              <TabsTrigger value="users" className="flex flex-col items-center gap-1 text-xs">
                <Users className="h-4 w-4" />
                Utilisateurs
              </TabsTrigger>
              <TabsTrigger value="transactions" className="flex flex-col items-center gap-1 text-xs">
                <DollarSign className="h-4 w-4" />
                Transactions
              </TabsTrigger>
              <TabsTrigger value="deposits" className="flex flex-col items-center gap-1 text-xs">
                <Wallet className="h-4 w-4" />
                Dépôts
              </TabsTrigger>
              <TabsTrigger value="packages" className="flex flex-col items-center gap-1 text-xs">
                <Target className="h-4 w-4" />
                Packages
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex flex-col items-center gap-1 text-xs">
                <PieChart className="h-4 w-4" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="referrals" className="flex flex-col items-center gap-1 text-xs">
                <Users className="h-4 w-4" />
                Parrainage
              </TabsTrigger>
              <TabsTrigger value="system" className="flex flex-col items-center gap-1 text-xs">
                <Server className="h-4 w-4" />
                Système
              </TabsTrigger>
              <TabsTrigger value="alerts" className="flex flex-col items-center gap-1 text-xs">
                <AlertTriangle className="h-4 w-4" />
                Alertes
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex flex-col items-center gap-1 text-xs">
                <Settings className="h-4 w-4" />
                Config
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Contenu Principal Admin */}
      <main className="relative z-10 container mx-auto p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">

          {/* Vue d'ensemble */}
          <TabsContent value="overview" className="space-y-6">
            {/* KPIs Principaux */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <GlowCard>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Utilisateurs Totaux</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {adminStats.totalUsers.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    +12% ce mois
                  </p>
                </CardContent>
              </GlowCard>

              <GlowCard>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Volume Total</CardTitle>
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-pi-primary">
                    {formatCurrency(adminStats.totalVolume)} π
                  </div>
                  <p className="text-xs text-muted-foreground">
                    +8% ce mois
                  </p>
                </CardContent>
              </GlowCard>

              <GlowCard>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Revenus Mensuels</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(adminStats.monthlyRevenue)} π
                  </div>
                  <p className="text-xs text-muted-foreground">
                    +15% vs mois dernier
                  </p>
                </CardContent>
              </GlowCard>

              <GlowCard>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Retraits Pendants</CardTitle>
                  <Clock className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">
                    {adminStats.pendingWithdrawals}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Nécessitent approbation
                  </p>
                </CardContent>
              </GlowCard>
            </div>

            {/* Santé du Système */}
            <GlowCard>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  État du Système
                  <Button
                    onClick={loadSystemHealth}
                    variant="ghost"
                    size="sm"
                    className="ml-auto"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="flex items-center gap-3">
                    <Database className={getHealthColor(systemHealth.database)} />
                    <div>
                      <p className="font-medium">Base de Données</p>
                      <p className={`text-sm ${getHealthColor(systemHealth.database)}`}>
                        {systemHealth.database}
                      </p>
                    </div>
                    {getHealthIcon(systemHealth.database)}
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Activity className={getHealthColor(systemHealth.api)} />
                    <div>
                      <p className="font-medium">API</p>
                      <p className={`text-sm ${getHealthColor(systemHealth.api)}`}>
                        {systemHealth.api}
                      </p>
                    </div>
                    {getHealthIcon(systemHealth.api)}
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Zap className={getHealthColor(systemHealth.cache)} />
                    <div>
                      <p className="font-medium">Cache</p>
                      <p className={`text-sm ${getHealthColor(systemHealth.cache)}`}>
                        {systemHealth.cache}
                      </p>
                    </div>
                    {getHealthIcon(systemHealth.cache)}
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Coins className={getHealthColor(systemHealth.payments)} />
                    <div>
                      <p className="font-medium">Paiements</p>
                      <p className={`text-sm ${getHealthColor(systemHealth.payments)}`}>
                        {systemHealth.payments}
                      </p>
                    </div>
                    {getHealthIcon(systemHealth.payments)}
                  </div>
                </div>
              </CardContent>
            </GlowCard>

            {/* Activité Récente et Alertes */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <GlowCard>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Activité Récente
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {transactions.slice(0, 5).map((transaction, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${
                          transaction.type === 'withdrawal' ? 'bg-orange-500/20 text-orange-500' :
                          transaction.type === 'investment' ? 'bg-blue-500/20 text-blue-500' :
                          'bg-green-500/20 text-green-500'
                        }`}>
                          {transaction.type === 'withdrawal' && <Upload className="h-4 w-4" />}
                          {transaction.type === 'investment' && <Target className="h-4 w-4" />}
                          {transaction.type === 'claim' && <Gift className="h-4 w-4" />}
                        </div>
                        <div>
                          <p className="font-medium">{transaction.user?.username}</p>
                          <p className="text-sm text-muted-foreground capitalize">
                            {transaction.type} - {formatDate(transaction.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {transaction.amount > 0 ? '+' : ''}{formatCurrency(Math.abs(transaction.amount))} π
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
                    <AlertTriangle className="h-5 w-5" />
                    Alertes Système
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      {adminStats.pendingWithdrawals} retraits en attente d'approbation
                    </AlertDescription>
                  </Alert>
                  
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      Système opérationnel - Uptime {adminStats.systemUptime}
                    </AlertDescription>
                  </Alert>
                  
                  <Alert>
                    <Activity className="h-4 w-4" />
                    <AlertDescription>
                      {adminStats.activeInvestments} investissements actifs génèrent des revenus
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </GlowCard>
            </div>
          </TabsContent>

          {/* Gestion Utilisateurs */}
          <TabsContent value="users" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold">Gestion des Utilisateurs</h2>
              <div className="flex gap-2">
                <Button onClick={() => setShowUserModal(true)} className="pi-gradient text-white hover:pi-gradient-hover">
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvel Utilisateur
                </Button>
                <Button onClick={() => loadUsers()} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Actualiser
                </Button>
              </div>
            </div>

            {/* Filtres */}
            <div className="flex gap-4 items-center">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Rechercher utilisateurs..."
                  value={userFilter}
                  onChange={(e) => setUserFilter(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="active">Actifs</SelectItem>
                  <SelectItem value="suspended">Suspendus</SelectItem>
                  <SelectItem value="banned">Bannis</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Table des utilisateurs */}
            <GlowCard>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Utilisateur</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Solde</TableHead>
                      <TableHead>Total Investi</TableHead>
                      <TableHead>Total Gagné</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Dernière Connexion</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users
                      .filter(user => 
                        user.username.toLowerCase().includes(userFilter.toLowerCase()) ||
                        user.email.toLowerCase().includes(userFilter.toLowerCase())
                      )
                      .map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{user.username}</p>
                              <p className="text-sm text-muted-foreground">ID: {user.id}</p>
                            </div>
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell className="font-mono">
                            {formatCurrency(user.balance_pi)} π
                          </TableCell>
                          <TableCell className="font-mono">
                            {formatCurrency(user.total_invested)} π
                          </TableCell>
                          <TableCell className="font-mono text-green-600">
                            +{formatCurrency(user.total_earned)} π
                          </TableCell>
                          <TableCell>
                            <Badge variant={user.status === 'active' ? 'default' : 'destructive'}>
                              {user.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {formatDate(user.last_login)}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                onClick={() => {
                                  setSelectedItem(user);
                                  setUserForm({
                                    username: user.username,
                                    email: user.email,
                                    balance_pi: user.balance_pi.toString(),
                                    is_admin: user.is_admin || false,
                                    status: user.status
                                  });
                                  setShowUserModal(true);
                                }}
                                variant="ghost"
                                size="sm"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                onClick={() => handleUserAction('suspend', user.id)}
                                variant="ghost"
                                size="sm"
                              >
                                <Lock className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </CardContent>
            </GlowCard>
          </TabsContent>

          {/* Gestion Dépôts */}
          <TabsContent value="deposits" className="space-y-6">
            <AdminDepositManager />
          </TabsContent>

          {/* Gestion Transactions */}
          <TabsContent value="transactions" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold">Gestion des Transactions</h2>
              <div className="flex gap-2">
                <Select value={transactionFilter} onValueChange={setTransactionFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes</SelectItem>
                    <SelectItem value="pending">En attente</SelectItem>
                    <SelectItem value="completed">Terminées</SelectItem>
                    <SelectItem value="failed">Échouées</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={() => loadTransactions()} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Actualiser
                </Button>
              </div>
            </div>

            {/* Table des transactions */}
            <GlowCard>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Utilisateur</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Montant</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions
                      .filter(tx => transactionFilter === 'all' || tx.status === transactionFilter)
                      .map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell className="font-mono">#{transaction.id}</TableCell>
                          <TableCell>{transaction.user?.username}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {transaction.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono">
                            {transaction.amount > 0 ? '+' : ''}{formatCurrency(transaction.amount)} π
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              transaction.status === 'completed' ? 'default' :
                              transaction.status === 'pending' ? 'secondary' :
                              'destructive'
                            }>
                              {transaction.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {formatDate(transaction.created_at)}
                          </TableCell>
                          <TableCell>
                            {transaction.status === 'pending' && (
                              <div className="flex gap-1">
                                <Button
                                  onClick={() => handleTransactionAction('approve', transaction.id)}
                                  variant="ghost"
                                  size="sm"
                                  className="text-green-600 hover:text-green-700"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button
                                  onClick={() => handleTransactionAction('reject', transaction.id)}
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <AlertTriangle className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </CardContent>
            </GlowCard>
          </TabsContent>

          {/* Gestion Packages */}
          <TabsContent value="packages" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold">Gestion des Packages</h2>
              <Button onClick={() => setShowPackageModal(true)} className="pi-gradient text-white hover:pi-gradient-hover">
                <Plus className="h-4 w-4 mr-2" />
                Nouveau Package
              </Button>
            </div>

            {/* Packages existants */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {packages.map((pkg) => (
                <GlowCard key={pkg.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl">{pkg.name}</CardTitle>
                        <Badge variant={pkg.is_active ? 'default' : 'secondary'}>
                          {pkg.is_active ? 'Actif' : 'Inactif'}
                        </Badge>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          onClick={() => {
                            setSelectedItem(pkg);
                            setPackageForm({
                              name: pkg.name,
                              description: pkg.description,
                              minimum_amount: pkg.minimum_amount.toString(),
                              maximum_amount: pkg.maximum_amount?.toString() || '',
                              apy: pkg.apy.toString(),
                              duration_days: pkg.duration_days.toString(),
                              claim_frequency_hours: pkg.claim_frequency_hours.toString(),
                              is_active: pkg.is_active
                            });
                            setShowPackageModal(true);
                          }}
                          variant="ghost"
                          size="sm"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-muted-foreground">{pkg.description}</p>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">APY:</span>
                        <span className="font-semibold text-pi-gold">{pkg.apy}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Durée:</span>
                        <span className="font-semibold">{pkg.duration_days} jours</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Minimum:</span>
                        <span className="font-semibold">{formatCurrency(pkg.minimum_amount)} π</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Fréquence claims:</span>
                        <span className="font-semibold">{pkg.claim_frequency_hours}h</span>
                      </div>
                    </div>
                    
                    {/* Statistiques du package */}
                    <div className="pt-3 border-t">
                      <div className="flex justify-between text-sm">
                        <span>Investissements actifs:</span>
                        <span className="font-medium">12</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Volume total:</span>
                        <span className="font-medium">2,450 π</span>
                      </div>
                    </div>
                  </CardContent>
                </GlowCard>
              ))}
            </div>
          </TabsContent>

          {/* Analytics */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold">Analytics & Rapports</h2>
              <div className="flex gap-2">
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7days">7 jours</SelectItem>
                    <SelectItem value="30days">30 jours</SelectItem>
                    <SelectItem value="90days">90 jours</SelectItem>
                    <SelectItem value="1year">1 an</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Exporter
                </Button>
              </div>
            </div>

            {/* Métriques détaillées */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <GlowCard>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Croissance Utilisateurs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600 mb-2">+24%</div>
                  <p className="text-sm text-muted-foreground">
                    Croissance sur {dateRange === '7days' ? '7 jours' : dateRange === '30days' ? '30 jours' : '90 jours'}
                  </p>
                  <div className="mt-4">
                    <Progress value={75} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">
                      Objectif atteint à 75%
                    </p>
                  </div>
                </CardContent>
              </GlowCard>

              <GlowCard>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Volume Investissements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-pi-primary mb-2">
                    {formatCurrency(45250)} π
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Volume total période
                  </p>
                  <div className="mt-4">
                    <div className="flex justify-between text-sm">
                      <span>Nouveau:</span>
                      <span className="font-medium text-green-600">+{formatCurrency(8340)} π</span>
                    </div>
                  </div>
                </CardContent>
              </GlowCard>

              <GlowCard>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Taux de Rétention
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600 mb-2">87%</div>
                  <p className="text-sm text-muted-foreground">
                    Utilisateurs actifs
                  </p>
                  <div className="mt-4 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Quotidien:</span>
                      <span>65%</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Hebdomadaire:</span>
                      <span>87%</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Mensuel:</span>
                      <span>94%</span>
                    </div>
                  </div>
                </CardContent>
              </GlowCard>
            </div>

            {/* Placeholder pour graphiques */}
            <GlowCard>
              <CardHeader>
                <CardTitle>Graphiques de Performance (à implémenter)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-muted/50 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <LineChart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      Graphiques interactifs avec Chart.js ou Recharts
                    </p>
                  </div>
                </div>
              </CardContent>
            </GlowCard>
          </TabsContent>

          {/* Gestion Parrainage */}
          <TabsContent value="referrals" className="space-y-6">
            <AdminReferralDashboard />
          </TabsContent>

          {/* Système */}
          <TabsContent value="system" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold">Monitoring Système</h2>
              <Button onClick={() => loadSystemHealth()} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualiser
              </Button>
            </div>

            {/* Monitoring détaillé */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <GlowCard>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Base de Données
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span>Statut:</span>
                    <Badge variant={systemHealth.database === 'healthy' ? 'default' : 'destructive'}>
                      {systemHealth.database}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Connexions actives:</span>
                    <span>12/50</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Temps de réponse:</span>
                    <span>1.2ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Espace disque:</span>
                    <span>65% utilisé</span>
                  </div>
                </CardContent>
              </GlowCard>

              <GlowCard>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Performance API
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span>Statut:</span>
                    <Badge variant={systemHealth.api === 'healthy' ? 'default' : 'destructive'}>
                      {systemHealth.api}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Requêtes/min:</span>
                    <span>342</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Temps de réponse moyen:</span>
                    <span>45ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Taux d'erreur:</span>
                    <span className="text-green-600">0.02%</span>
                  </div>
                </CardContent>
              </GlowCard>
            </div>

            {/* Logs système */}
            <GlowCard>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Logs Système
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  <div className="text-sm font-mono bg-muted/50 p-2 rounded">
                    [2024-01-15 10:30:15] INFO: User registration successful - user_id: 123
                  </div>
                  <div className="text-sm font-mono bg-muted/50 p-2 rounded">
                    [2024-01-15 10:29:42] INFO: Investment created - amount: 100π, package: gold
                  </div>
                  <div className="text-sm font-mono bg-red-500/10 p-2 rounded text-red-600">
                    [2024-01-15 10:28:33] ERROR: Payment gateway timeout - retry scheduled
                  </div>
                  <div className="text-sm font-mono bg-muted/50 p-2 rounded">
                    [2024-01-15 10:27:21] INFO: Claim processed successfully - reward: 2.5π
                  </div>
                </div>
              </CardContent>
            </GlowCard>
          </TabsContent>

          {/* Alertes */}
          <TabsContent value="alerts" className="space-y-6">
            <h2 className="text-3xl font-bold">Centre d'Alertes</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-medium mb-1">Retraits en attente</div>
                  {adminStats.pendingWithdrawals} demandes nécessitent votre attention
                </AlertDescription>
              </Alert>
              
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-medium mb-1">Système opérationnel</div>
                  Tous les services fonctionnent normalement
                </AlertDescription>
              </Alert>
              
              <Alert>
                <Activity className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-medium mb-1">Pic d'activité</div>
                  Trafic 150% au-dessus de la normale
                </AlertDescription>
              </Alert>
            </div>
          </TabsContent>

          {/* Configuration */}
          <TabsContent value="settings" className="space-y-6">
            <h2 className="text-3xl font-bold">Configuration Système</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <GlowCard>
                <CardHeader>
                  <CardTitle>Paramètres Généraux</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Maintenance Mode</p>
                      <p className="text-sm text-muted-foreground">
                        Suspendre temporairement l'accès
                      </p>
                    </div>
                    <Switch />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Nouveaux Enregistrements</p>
                      <p className="text-sm text-muted-foreground">
                        Autoriser la création de comptes
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Notifications Email</p>
                      <p className="text-sm text-muted-foreground">
                        Envoyer les alertes par email
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </CardContent>
              </GlowCard>

              <GlowCard>
                <CardHeader>
                  <CardTitle>Limites du Système</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Limite de retrait journalier (π)</Label>
                    <Input defaultValue="1000" className="mt-1" />
                  </div>
                  
                  <div>
                    <Label>Limite de retrait mensuel (π)</Label>
                    <Input defaultValue="10000" className="mt-1" />
                  </div>
                  
                  <div>
                    <Label>Investissement minimum (π)</Label>
                    <Input defaultValue="10" className="mt-1" />
                  </div>
                </CardContent>
              </GlowCard>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Modal Utilisateur */}
      <Dialog open={showUserModal} onOpenChange={setShowUserModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedItem ? 'Modifier Utilisateur' : 'Nouvel Utilisateur'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nom d'utilisateur</Label>
              <Input
                value={userForm.username}
                onChange={(e) => setUserForm({...userForm, username: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={userForm.email}
                onChange={(e) => setUserForm({...userForm, email: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Solde Pi</Label>
              <Input
                type="number"
                value={userForm.balance_pi}
                onChange={(e) => setUserForm({...userForm, balance_pi: e.target.value})}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label>Administrateur</Label>
              <Switch
                checked={userForm.is_admin}
                onCheckedChange={(checked) => setUserForm({...userForm, is_admin: checked})}
              />
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button 
                onClick={() => handleUserAction(selectedItem ? 'edit' : 'create')}
                className="flex-1 pi-gradient text-white hover:pi-gradient-hover"
              >
                {selectedItem ? 'Modifier' : 'Créer'}
              </Button>
              <Button 
                onClick={() => {
                  setShowUserModal(false);
                  setSelectedItem(null);
                }} 
                variant="outline"
              >
                Annuler
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Package */}
      <Dialog open={showPackageModal} onOpenChange={setShowPackageModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedItem ? 'Modifier Package' : 'Nouveau Package'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nom du package</Label>
              <Input
                value={packageForm.name}
                onChange={(e) => setPackageForm({...packageForm, name: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={packageForm.description}
                onChange={(e) => setPackageForm({...packageForm, description: e.target.value})}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>APY (%)</Label>
                <Input
                  type="number"
                  value={packageForm.apy}
                  onChange={(e) => setPackageForm({...packageForm, apy: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Durée (jours)</Label>
                <Input
                  type="number"
                  value={packageForm.duration_days}
                  onChange={(e) => setPackageForm({...packageForm, duration_days: e.target.value})}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Minimum (π)</Label>
                <Input
                  type="number"
                  value={packageForm.minimum_amount}
                  onChange={(e) => setPackageForm({...packageForm, minimum_amount: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Fréquence claims (h)</Label>
                <Input
                  type="number"
                  value={packageForm.claim_frequency_hours}
                  onChange={(e) => setPackageForm({...packageForm, claim_frequency_hours: e.target.value})}
                />
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <Label>Package actif</Label>
              <Switch
                checked={packageForm.is_active}
                onCheckedChange={(checked) => setPackageForm({...packageForm, is_active: checked})}
              />
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button className="flex-1 pi-gradient text-white hover:pi-gradient-hover">
                {selectedItem ? 'Modifier' : 'Créer'}
              </Button>
              <Button 
                onClick={() => {
                  setShowPackageModal(false);
                  setSelectedItem(null);
                }} 
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