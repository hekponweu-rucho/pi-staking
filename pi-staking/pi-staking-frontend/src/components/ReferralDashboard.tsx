import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { AnimatedCounter } from './AnimatedCounter';
import { GlowCard } from './GlowCard';
import referralService, { ReferralInfo, ReferralTree, ReferralMember } from '@/services/referralService';
import { 
  Users, 
  Share2, 
  Copy, 
  TrendingUp, 
  Gift, 
  Award,
  DollarSign,
  Calendar,
  User,
  Loader2,
  CheckCircle,
  AlertCircle,
  BarChart3
} from 'lucide-react';
import { toast } from 'sonner';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';

export function ReferralDashboard() {
  const [referralInfo, setReferralInfo] = useState<ReferralInfo | null>(null);
  const [referralTree, setReferralTree] = useState<ReferralTree | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchReferralData();
  }, []);

  const fetchReferralData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [info, tree] = await Promise.all([
        referralService.getReferralInfo(),
        referralService.getReferralTree()
      ]);
      
      setReferralInfo(info);
      setReferralTree(tree);
    } catch (error) {
      console.error('Erreur lors du chargement des données de parrainage:', error);
      setError('Impossible de charger les données de parrainage');
      toast.error('Erreur lors du chargement des données de parrainage');
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
    if (!referralInfo) return;
    
    try {
      setIsSharing(true);
      await referralService.shareReferralLink(referralInfo.referral_url, referralInfo.referral_code);
      toast.success('Lien de parrainage copié dans le presse-papiers !');
    } catch (error) {
      console.error('Erreur lors du partage:', error);
      toast.error('Erreur lors du partage du lien');
    } finally {
      setIsSharing(false);
    }
  };

  const copyReferralCode = async () => {
    if (!referralInfo) return;
    
    try {
      await navigator.clipboard.writeText(referralInfo.referral_code);
      toast.success('Code de parrainage copié !');
    } catch (error) {
      console.error('Erreur lors de la copie:', error);
      toast.error('Erreur lors de la copie du code');
    }
  };

  const getLevelBadgeColor = (level: number) => {
    const colors = {
      1: 'bg-green-100 text-green-800 border-green-200',
      2: 'bg-blue-100 text-blue-800 border-blue-200',
      3: 'bg-purple-100 text-purple-800 border-purple-200'
    };
    return colors[level as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const ReferralMemberCard = ({ member, level }: { member: ReferralMember; level: number }) => (
    <Card className="border border-gray-100 hover:border-blue-200 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-gray-500" />
            <span className="font-medium">{member.username}</span>
          </div>
          <Badge className={getLevelBadgeColor(level)}>
            Niveau {level} • {referralService.getCommissionRate(level)}
          </Badge>
        </div>
        
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-gray-500">Qualifié le:</span>
            <p className="font-medium">{formatDate(member.qualified_at)}</p>
          </div>
          <div>
            <span className="text-gray-500">Investissement:</span>
            <p className="font-medium text-green-600">
              {referralService.formatPiAmount(member.qualifying_investment)}
            </p>
          </div>
          <div>
            <span className="text-gray-500">Bonus gagné:</span>
            <p className="font-medium text-blue-600">
              {referralService.formatPiAmount(member.bonus_earned)}
            </p>
          </div>
          <div>
            <span className="text-gray-500">Total investi:</span>
            <p className="font-medium">{referralService.formatPiAmount(member.total_invested)}</p>
          </div>
        </div>
        
        <div className="mt-3 pt-2 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-3 w-3 text-green-500" />
            <span className="text-xs text-green-600 font-medium">{member.status_label}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner label="Chargement des données de parrainage..." />
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchReferralData} />;
  }

  if (!referralInfo) {
    return <div>Aucune donnée de parrainage disponible</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header avec boutons de partage */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Système de Parrainage
          </h2>
          <p className="text-gray-600 mt-1">
            Invitez vos amis et gagnez jusqu'à 5% de commission sur leurs investissements
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            onClick={copyReferralCode}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Copy className="h-4 w-4" />
            Code: {referralInfo.referral_code}
          </Button>
          <Button
            onClick={handleShare}
            disabled={isSharing}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
          >
            {isSharing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Share2 className="h-4 w-4" />
            )}
            Partager le lien
          </Button>
        </div>
      </div>

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <GlowCard className="border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Filleuls Directs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              <AnimatedCounter value={referralInfo.direct_referrals} />
            </div>
            <p className="text-xs text-gray-500 mt-1">Niveau 1 qualifiés</p>
          </CardContent>
        </GlowCard>

        <GlowCard className="border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Commissions Totales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              <AnimatedCounter value={referralInfo.total_commissions} suffix=" Pi" />
            </div>
            <p className="text-xs text-gray-500 mt-1">Tous niveaux confondus</p>
          </CardContent>
        </GlowCard>

        <GlowCard className="border-purple-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Ce Mois-ci
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              <AnimatedCounter value={referralInfo.this_month_commissions} suffix=" Pi" />
            </div>
            <p className="text-xs text-gray-500 mt-1">Gains mensuels</p>
          </CardContent>
        </GlowCard>

        <GlowCard className="border-orange-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Taux de Commission
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Niveau 1:</span>
                <span className="font-medium text-green-600">5%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Niveau 2:</span>
                <span className="font-medium text-blue-600">3%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Niveau 3:</span>
                <span className="font-medium text-purple-600">1%</span>
              </div>
            </div>
          </CardContent>
        </GlowCard>
      </div>

      {/* Répartition des commissions par niveau */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Répartition des Commissions par Niveau
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((level) => {
              const amount = referralInfo.commissions_by_level[`level_${level}` as keyof typeof referralInfo.commissions_by_level];
              const percentage = referralInfo.total_commissions > 0 
                ? (amount / referralInfo.total_commissions) * 100 
                : 0;
              
              return (
                <div key={level} className="text-center">
                  <div className="mb-2">
                    <Badge className={getLevelBadgeColor(level)}>
                      Niveau {level} • {referralService.getCommissionRate(level)}
                    </Badge>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    {referralService.formatPiAmount(amount)}
                  </div>
                  <Progress value={percentage} className="h-2 mb-1" />
                  <div className="text-sm text-gray-500">
                    {percentage.toFixed(1)}% du total
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Tabs pour les détails */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="referrals">Mes Filleuls</TabsTrigger>
          <TabsTrigger value="earnings">Historique</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Comment ça marche ?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                    <Share2 className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="font-medium mb-2">1. Partagez votre lien</h3>
                  <p className="text-sm text-gray-600">
                    Partagez votre code de parrainage avec vos amis et votre réseau
                  </p>
                </div>
                <div className="text-center">
                  <div className="bg-green-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                    <Users className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="font-medium mb-2">2. Ils s'inscrivent</h3>
                  <p className="text-sm text-gray-600">
                    Vos filleuls s'inscrivent avec votre code de parrainage
                  </p>
                </div>
                <div className="text-center">
                  <div className="bg-purple-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                    <Gift className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="font-medium mb-2">3. Vous gagnez</h3>
                  <p className="text-sm text-gray-600">
                    Gagnez des commissions sur leurs investissements ≥ 50 Pi
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Récents gains */}
          {referralInfo.recent_earnings.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Gains Récents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {referralInfo.recent_earnings.map((earning, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge className={getLevelBadgeColor(earning.level)}>
                          Niveau {earning.level}
                        </Badge>
                        <div>
                          <p className="font-medium text-sm">{earning.referred_user}</p>
                          <p className="text-xs text-gray-500">{earning.date}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-green-600">
                          +{referralService.formatPiAmount(earning.amount)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="referrals" className="space-y-4">
          {referralTree && Object.entries(referralTree).map(([levelKey, members]) => {
            const level = parseInt(levelKey.split('_')[1]);
            if (members.length === 0) return null;
            
            return (
              <Card key={levelKey}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Badge className={getLevelBadgeColor(level)}>
                      Niveau {level} • {referralService.getCommissionRate(level)}
                    </Badge>
                    <span>({members.length} filleul{members.length > 1 ? 's' : ''})</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {members.map((member) => (
                      <ReferralMemberCard
                        key={member.id}
                        member={member}
                        level={level}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
          
          {referralTree && Object.values(referralTree).every(level => level.length === 0) && (
            <Card>
              <CardContent className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Aucun filleul pour le moment
                </h3>
                <p className="text-gray-600 mb-4">
                  Commencez à partager votre lien de parrainage pour voir vos filleuls apparaître ici.
                </p>
                <Button onClick={handleShare} className="bg-gradient-to-r from-blue-500 to-purple-600">
                  <Share2 className="h-4 w-4 mr-2" />
                  Partager maintenant
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="earnings">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Historique des Gains
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center text-gray-600 py-8">
                L'historique détaillé des gains sera disponible prochainement.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}