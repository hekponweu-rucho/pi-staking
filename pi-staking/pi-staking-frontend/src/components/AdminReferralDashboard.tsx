import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { GlowCard } from '@/components/GlowCard';
import adminReferralService, {
  AdminReferralDashboard as DashboardData,
  ReferralSearchFilters,
  SystemAlert,
  TopReferrer,
  ReferralActivity
} from '@/services/adminReferralService';
import {
  BarChart3,
  Users,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Search,
  Filter,
  Download,
  RefreshCw,
  Calendar,
  Award,
  Target,
  Activity,
  Eye,
  Settings,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  Mail,
  User,
  Crown,
  Shield,
  Zap,
  Bell,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';

export function AdminReferralDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchFilters, setSearchFilters] = useState<ReferralSearchFilters>({});
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedReferral, setSelectedReferral] = useState<any>(null);
  const [managementAction, setManagementAction] = useState<'approve' | 'reject' | 'pay_bonus' | null>(null);
  const [managementNote, setManagementNote] = useState('');
  const [isManaging, setIsManaging] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await adminReferralService.getDashboard();
      setDashboardData(data);
    } catch (error) {
      console.error('Erreur lors du chargement du dashboard:', error);
      setError('Impossible de charger les données du dashboard');
      toast.error('Erreur lors du chargement des données');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    try {
      setIsSearching(true);
      const results = await adminReferralService.searchReferrals(searchFilters);
      setSearchResults(results.data);
      toast.success(`${results.data.length} résultat(s) trouvé(s)`);
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
      toast.error('Erreur lors de la recherche');
    } finally {
      setIsSearching(false);
    }
  };

  const handleExport = async (type: 'all' | 'referrals' | 'commissions' | 'top_referrers') => {
    try {
      setIsExporting(true);
      const data = await adminReferralService.exportData(type, searchFilters);
      
      // Créer un fichier et le télécharger
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `referrals-${type}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Export réussi !');
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      toast.error('Erreur lors de l\'export');
    } finally {
      setIsExporting(false);
    }
  };

  const handleManageReferral = async () => {
    if (!selectedReferral || !managementAction) return;
    
    try {
      setIsManaging(true);
      await adminReferralService.manageReferral(
        selectedReferral.id,
        managementAction,
        managementNote
      );
      
      toast.success('Action effectuée avec succès');
      setSelectedReferral(null);
      setManagementAction(null);
      setManagementNote('');
      await fetchDashboardData();
      if (searchResults.length > 0) {
        await handleSearch();
      }
    } catch (error) {
      console.error('Erreur lors de la gestion:', error);
      toast.error('Erreur lors de l\'action');
    } finally {
      setIsManaging(false);
    }
  };

  const getAlertIcon = (type: SystemAlert['type']) => {
    switch (type) {
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info': return <CheckCircle className="h-4 w-4 text-blue-500" />;
    }
  };

  const getActivityIcon = (type: ReferralActivity['type']) => {
    switch (type) {
      case 'new_referral': return <Users className="h-4 w-4 text-blue-500" />;
      case 'commission_paid': return <DollarSign className="h-4 w-4 text-green-500" />;
    }
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Chargement du dashboard administrateur...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-red-600 mb-2">
            <AlertTriangle className="h-5 w-5" />
            <span className="font-medium">Erreur</span>
          </div>
          <p className="text-red-700 mb-4">{error}</p>
          <Button onClick={fetchDashboardData} variant="outline">
            Réessayer
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!dashboardData) {
    return <div>Aucune donnée disponible</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Administration - Système de Parrainage
          </h1>
          <p className="text-gray-600 mt-1">
            Monitoring, gestion et analytics du système de parrainage multi-niveaux
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={fetchDashboardData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Alertes système */}
      {dashboardData.system_alerts.length > 0 && (
        <div className="space-y-2">
          {dashboardData.system_alerts.map((alert, index) => (
            <Alert key={index} className={adminReferralService.getAlertColor(alert.type)}>
              <div className="flex items-center gap-2">
                {getAlertIcon(alert.type)}
                <div className="flex-1">
                  <div className="font-medium">{alert.title}</div>
                  <AlertDescription>{alert.message}</AlertDescription>
                </div>
                <Badge variant="outline" className={adminReferralService.getPriorityColor(alert.priority)}>
                  {alert.priority}
                </Badge>
              </div>
            </Alert>
          ))}
        </div>
      )}

      {/* Métriques temps réel */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-600" />
            Métriques Temps Réel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                <AnimatedCounter value={dashboardData.realtime_metrics.last_hour.new_referrals} />
              </div>
              <p className="text-sm text-gray-600">Nouveaux parrainages (1h)</p>
              <div className="text-xs text-gray-500 mt-1">
                Commissions: {adminReferralService.formatPiAmount(dashboardData.realtime_metrics.last_hour.commissions_paid)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                <AnimatedCounter value={dashboardData.realtime_metrics.last_24_hours.new_referrals} />
              </div>
              <p className="text-sm text-gray-600">Nouveaux parrainages (24h)</p>
              <div className="text-xs text-gray-500 mt-1">
                Commissions: {adminReferralService.formatPiAmount(dashboardData.realtime_metrics.last_24_hours.commissions_paid)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                <AnimatedCounter value={dashboardData.realtime_metrics.active_users_with_referrals} />
              </div>
              <p className="text-sm text-gray-600">Utilisateurs actifs (24h)</p>
              <div className="text-xs text-gray-500 mt-1">
                Avec nouveaux parrainages
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <GlowCard className="border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Parrainages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              <AnimatedCounter value={dashboardData.global_stats.overview.total_referrals} />
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
              <TrendingUp className="h-3 w-3" />
              Aujourd'hui: +{dashboardData.global_stats.today.new_referrals}
            </div>
          </CardContent>
        </GlowCard>

        <GlowCard className="border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Qualifiés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              <AnimatedCounter value={dashboardData.global_stats.overview.qualified_referrals} />
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
              <Target className="h-3 w-3" />
              Taux: {dashboardData.global_stats.overview.conversion_rate}%
            </div>
          </CardContent>
        </GlowCard>

        <GlowCard className="border-purple-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Commissions Totales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {adminReferralService.formatPiAmount(dashboardData.global_stats.overview.total_commissions_paid)}
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
              <Calendar className="h-3 w-3" />
              Ce mois: {adminReferralService.formatPiAmount(dashboardData.global_stats.this_month.commissions_paid)}
            </div>
          </CardContent>
        </GlowCard>

        <GlowCard className="border-orange-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Crown className="h-4 w-4" />
              Parrains Actifs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              <AnimatedCounter value={dashboardData.global_stats.overview.active_referrers} />
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
              <Award className="h-3 w-3" />
              Moyenne: {adminReferralService.formatPiAmount(dashboardData.global_stats.overview.average_commission_per_referral)} / parrainage
            </div>
          </CardContent>
        </GlowCard>
      </div>

      {/* Tabs pour les détails */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="levels">Par Niveau</TabsTrigger>
          <TabsTrigger value="top-referrers">Top Parrains</TabsTrigger>
          <TabsTrigger value="activities">Activités</TabsTrigger>
          <TabsTrigger value="management">Gestion</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Performance par période */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Aujourd'hui
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span>Nouveaux:</span>
                  <Badge variant="outline">{dashboardData.global_stats.today.new_referrals}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Qualifiés:</span>
                  <Badge variant="outline">{dashboardData.global_stats.today.qualified_referrals}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Commissions:</span>
                  <Badge variant="outline">
                    {adminReferralService.formatPiAmount(dashboardData.global_stats.today.commissions_paid)}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Cette Semaine
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span>Nouveaux:</span>
                  <Badge variant="outline">{dashboardData.global_stats.this_week.new_referrals}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Qualifiés:</span>
                  <Badge variant="outline">{dashboardData.global_stats.this_week.qualified_referrals}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Commissions:</span>
                  <Badge variant="outline">
                    {adminReferralService.formatPiAmount(dashboardData.global_stats.this_week.commissions_paid)}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Ce Mois
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span>Nouveaux:</span>
                  <Badge variant="outline">{dashboardData.global_stats.this_month.new_referrals}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Qualifiés:</span>
                  <Badge variant="outline">{dashboardData.global_stats.this_month.qualified_referrals}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Commissions:</span>
                  <Badge variant="outline">
                    {adminReferralService.formatPiAmount(dashboardData.global_stats.this_month.commissions_paid)}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="levels" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((level) => {
              const metrics = dashboardData.level_metrics[`level_${level}` as keyof typeof dashboardData.level_metrics];
              const conversionRate = metrics.total_referrals > 0 
                ? (metrics.qualified_referrals / metrics.total_referrals) * 100 
                : 0;
              
              return (
                <Card key={level}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Badge className={`${
                        level === 1 ? 'bg-green-100 text-green-800 border-green-200' :
                        level === 2 ? 'bg-blue-100 text-blue-800 border-blue-200' :
                        'bg-purple-100 text-purple-800 border-purple-200'
                      }`}>
                        Niveau {level} • {metrics.commission_rate}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm text-gray-600">Total parrainages</span>
                        <span className="font-medium">{metrics.total_referrals}</span>
                      </div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm text-gray-600">Qualifiés</span>
                        <span className="font-medium text-green-600">{metrics.qualified_referrals}</span>
                      </div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm text-gray-600">Taux conversion</span>
                        <span className="font-medium">{conversionRate.toFixed(1)}%</span>
                      </div>
                      <Progress value={conversionRate} className="h-2" />
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm text-gray-600">Commissions totales</span>
                        <span className="font-medium text-blue-600">
                          {adminReferralService.formatPiAmount(metrics.total_commissions)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Investissement moyen</span>
                        <span className="font-medium">
                          {adminReferralService.formatPiAmount(metrics.average_qualifying_investment)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="top-referrers" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Top Parrains</h3>
            <Button onClick={() => handleExport('top_referrers')} disabled={isExporting} size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
          </div>
          
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left p-4 font-medium text-gray-600">Rang</th>
                      <th className="text-left p-4 font-medium text-gray-600">Utilisateur</th>
                      <th className="text-left p-4 font-medium text-gray-600">Code</th>
                      <th className="text-left p-4 font-medium text-gray-600">Filleuls</th>
                      <th className="text-left p-4 font-medium text-gray-600">Commissions</th>
                      <th className="text-left p-4 font-medium text-gray-600">Niveau</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardData.top_referrers.map((referrer: TopReferrer, index) => (
                      <tr key={referrer.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            {index < 3 && <Crown className="h-4 w-4 text-yellow-500" />}
                            #{index + 1}
                          </div>
                        </td>
                        <td className="p-4">
                          <div>
                            <div className="font-medium">{referrer.username}</div>
                            <div className="text-sm text-gray-500">{referrer.email}</div>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge variant="outline">{referrer.referral_code}</Badge>
                        </td>
                        <td className="p-4">
                          <span className="font-medium">{referrer.qualified_referrals_count}</span>
                        </td>
                        <td className="p-4">
                          <span className="font-medium text-green-600">
                            {adminReferralService.formatPiAmount(referrer.total_commissions_earned)}
                          </span>
                        </td>
                        <td className="p-4">
                          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                            {referrer.current_level}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activities" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Activités Récentes</h3>
            <Button onClick={fetchDashboardData} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
          </div>
          
          <Card>
            <CardContent className="p-4">
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {dashboardData.recent_activities.map((activity: ReferralActivity) => (
                  <div key={activity.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm">{activity.title}</div>
                      <div className="text-xs text-gray-600">{activity.description}</div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-gray-500">{activity.created_at}</span>
                        <Badge variant="outline">Niveau {activity.level}</Badge>
                        {activity.amount && (
                          <span className="text-xs font-medium text-green-600">
                            +{adminReferralService.formatPiAmount(activity.amount)}
                          </span>
                        )}
                      </div>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={
                        activity.status === 'completed' ? 'text-green-600 border-green-200' : 
                        activity.status === 'qualified' ? 'text-blue-600 border-blue-200' :
                        'text-gray-600 border-gray-200'
                      }
                    >
                      {activity.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="management" className="space-y-4">
          {/* Formulaire de recherche */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Recherche et Filtres
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <Label htmlFor="status">Statut</Label>
                  <Select value={searchFilters.status || ''} onValueChange={(value) => 
                    setSearchFilters(prev => ({ ...prev, status: value || undefined }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Tous les statuts" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Tous les statuts</SelectItem>
                      <SelectItem value="pending">En attente</SelectItem>
                      <SelectItem value="qualified">Qualifié</SelectItem>
                      <SelectItem value="paid">Payé</SelectItem>
                      <SelectItem value="rejected">Rejeté</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="level">Niveau</Label>
                  <Select value={searchFilters.level?.toString() || ''} onValueChange={(value) => 
                    setSearchFilters(prev => ({ ...prev, level: value ? parseInt(value) : undefined }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Tous les niveaux" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Tous les niveaux</SelectItem>
                      <SelectItem value="1">Niveau 1</SelectItem>
                      <SelectItem value="2">Niveau 2</SelectItem>
                      <SelectItem value="3">Niveau 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="referrer">Parrain</Label>
                  <Input
                    id="referrer"
                    placeholder="Username ou email..."
                    value={searchFilters.referrer || ''}
                    onChange={(e) => setSearchFilters(prev => ({ ...prev, referrer: e.target.value || undefined }))}
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button onClick={handleSearch} disabled={isSearching}>
                  {isSearching ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
                  Rechercher
                </Button>
                <Button variant="outline" onClick={() => {
                  setSearchFilters({});
                  setSearchResults([]);
                }}>
                  Réinitialiser
                </Button>
                <Button variant="outline" onClick={() => handleExport('referrals')} disabled={isExporting}>
                  <Download className="h-4 w-4 mr-2" />
                  Exporter Résultats
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Résultats de recherche */}
          {searchResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Résultats de Recherche ({searchResults.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {searchResults.map((referral) => (
                    <div key={referral.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">Niveau {referral.level}</Badge>
                          <span className="font-medium">{referral.referrer?.username} → {referral.referred?.username}</span>
                          <Badge 
                            className={
                              referral.status === 'paid' ? 'bg-green-100 text-green-800' :
                              referral.status === 'qualified' ? 'bg-blue-100 text-blue-800' :
                              referral.status === 'rejected' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }
                          >
                            {referral.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          Investissement: {adminReferralService.formatPiAmount(referral.qualifying_investment || 0)} • 
                          Bonus: {adminReferralService.formatPiAmount(referral.bonus_amount || 0)}
                        </div>
                      </div>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedReferral(referral)}
                          >
                            <Settings className="h-4 w-4 mr-2" />
                            Gérer
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Gestion du Parrainage #{referral.id}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label>Action</Label>
                              <Select value={managementAction || ''} onValueChange={(value: any) => setManagementAction(value)}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Choisir une action" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="approve">Approuver</SelectItem>
                                  <SelectItem value="reject">Rejeter</SelectItem>
                                  <SelectItem value="pay_bonus">Payer le bonus</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div>
                              <Label>Note (optionnelle)</Label>
                              <Textarea
                                value={managementNote}
                                onChange={(e) => setManagementNote(e.target.value)}
                                placeholder="Ajouter une note..."
                                rows={3}
                              />
                            </div>
                            
                            <Button 
                              onClick={handleManageReferral} 
                              disabled={!managementAction || isManaging}
                              className="w-full"
                            >
                              {isManaging ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                              Confirmer l'Action
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}