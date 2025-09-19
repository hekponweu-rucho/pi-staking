import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { GlowCard } from './GlowCard';
import { AnimatedCounter } from './AnimatedCounter';
import { stakingService, StakingPackage } from '@/services/stakingService';
import { useAuth } from '@/contexts/AuthContext';
import { DepositModal } from './DepositModal';
import { 
  Loader2, 
  Plus, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  Coins,
  Target,
  Clock
} from 'lucide-react';

interface StakingPackagesProps {
  onInvestmentSuccess?: () => void;
}

interface InvestmentState {
  step: number;
  selectedPackage: StakingPackage | null;
  amount: number;
  isLoading: boolean;
}

export function StakingPackages({ onInvestmentSuccess }: StakingPackagesProps) {
  const [packages, setPackages] = useState<StakingPackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInvestModal, setShowInvestModal] = useState(false);
  const [investment, setInvestment] = useState<InvestmentState>({
    step: 1,
    selectedPackage: null,
    amount: 0,
    isLoading: false
  });
  
  const { user, refreshUser } = useAuth();
  const [showDepositModal, setShowDepositModal] = useState(false);

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await stakingService.getPackages();
      if (response.success && response.data) {
        const active = response.data.filter(pkg => pkg.is_active);
        setPackages(active);
        console.info('packages_loaded', { count: active.length });
      } else {
        setError(response.message || 'Erreur lors du chargement des packages');
        console.info('packages_loaded', { error: response.message });
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
      console.error('Packages fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPackage = (pkg: StakingPackage) => {
    console.info('invest_clicked', { package_id: pkg.id });
    setInvestment({
      step: 1,
      selectedPackage: pkg,
      amount: pkg.min_amount,
      isLoading: false
    });
    setShowInvestModal(true);
  };

  const handleAmountChange = (value: number[]) => {
    setInvestment(prev => ({ ...prev, amount: value[0] }));
  };

  const handleInvest = async () => {
    if (!investment.selectedPackage) return;

    setInvestment(prev => ({ ...prev, isLoading: true }));

    try {
      const response = await stakingService.createInvestment(
        String(investment.selectedPackage.id),
        investment.amount,
        'funds'
      );

      if (response.success) {
        console.info('invest_success', { investment_amount: investment.amount, package_id: investment.selectedPackage.id });
        toast.success("Investissement créé avec succès");
        window.dispatchEvent(new CustomEvent('investment_created', { detail: { package_id: investment.selectedPackage.id, amount: investment.amount } }));
        setInvestment(prev => ({ ...prev, step: 3, isLoading: false }));
        await refreshUser();
        onInvestmentSuccess?.();
      } else {
        const msg = response.message || "Erreur lors de l'investissement";
        console.info('invest_error', { message: msg });
        toast.error(msg);
        setError(msg);
        setInvestment(prev => ({ ...prev, isLoading: false }));
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Erreur de connexion au serveur';
      console.error('Invest error:', err);
      console.info('invest_error', { message: msg });
      toast.error(msg);
      setError(msg);
      setInvestment(prev => ({ ...prev, isLoading: false }));
    }
  };

  const resetModal = () => {
    setInvestment({
      step: 1,
      selectedPackage: null,
      amount: 0,
      isLoading: false
    });
    setShowInvestModal(false);
    setError(null);
  };

  const calculateReturns = (amount: number, rate: number, days: number) => {
    const dailyReturn = amount * rate;
    const totalReturn = dailyReturn * days;
    const roi = ((totalReturn / amount) * 100);
    return { dailyReturn, totalReturn, roi };
  };

  if (isLoading) {
    return (
      <GlowCard>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin mr-4" />
          <span>Chargement des packages de staking...</span>
        </CardContent>
      </GlowCard>
    );
  }

  if (error && !showInvestModal) {
    return (
      <GlowCard>
        <CardContent className="text-center p-8">
          <p className="text-destructive mb-4">{error}</p>
          <Button variant="outline" onClick={fetchPackages}>
            Réessayer
          </Button>
        </CardContent>
      </GlowCard>
    );
  }

  return (
    <div className="space-y-6" data-testid="staking-packages">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">Packages de Staking Disponibles</h2>
          <p className="text-muted-foreground mb-2">
            Choisissez le package qui correspond à votre profil d'investissement et commencez à gagner des récompenses quotidiennes.
          </p>
        </div>
        <Button onClick={() => setShowDepositModal(true)} className="pi-gradient text-white hover:pi-gradient-hover" data-testid="deposit-open-btn">
          Faire un dépôt
        </Button>
      </div>

      {packages.length === 0 ? (
        <GlowCard data-testid="packages-empty">
          <CardHeader>
            <CardTitle>Aucun package actif</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">Aucun package n'est disponible pour le moment. Revenez plus tard ou réessayez.</p>
            <Button variant="outline" onClick={fetchPackages} data-testid="packages-retry-btn">Réessayer</Button>
          </CardContent>
        </GlowCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="packages-grid">
          {packages.map(pkg => {
            const minReturns = calculateReturns(pkg.min_amount, pkg.daily_rate, pkg.max_duration_days);
            const maxReturns = calculateReturns(pkg.max_amount || pkg.min_amount, pkg.daily_rate, pkg.max_duration_days);

            return (
              <GlowCard key={pkg.id} className="relative overflow-hidden" data-testid={`package-card-${pkg.id}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{pkg.name}</CardTitle>
                    <Badge className="pi-gradient text-white">
                      {(pkg.daily_rate * 100).toFixed(2)}%/jour
                    </Badge>
                  </div>
                  {pkg.description && (
                    <p className="text-sm text-muted-foreground">{pkg.description}</p>
                  )}
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Package Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Minimum</p>
                      <p className="font-semibold">{pkg.min_amount.toLocaleString()}  Pi</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Maximum</p>
                      <p className="font-semibold">
                        {pkg.max_amount ? `${pkg.max_amount.toLocaleString()}  Pi` : 'Illimité'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Durée max</p>
                      <p className="font-semibold flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {pkg.max_duration_days} jours
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Niveau requis</p>
                      <Badge variant="outline" className="text-xs">
                        {pkg.level}
                      </Badge>
                    </div>
                  </div>

                  {/* Returns Preview */}
                  <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Retour quotidien min:</span>
                      <span className="font-medium text-green-600">
                        {minReturns.dailyReturn.toFixed(2)}  Pi
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">ROI potentiel:</span>
                      <span className="font-medium">
                        {minReturns.roi.toFixed(0)}% - {maxReturns.roi.toFixed(0)}%
                      </span>
                    </div>
                  </div>

                  {/* Fees removed: backend no longer exposes these fields */}

                  <Button 
                    onClick={() => handleSelectPackage(pkg)}
                    className="w-full pi-gradient text-white hover:pi-gradient-hover"
                    disabled={!user || user.balance_pi < pkg.min_amount}
                    data-testid={`invest-cta-${pkg.id}`}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Investir Maintenant
                  </Button>

                  {user && user.balance_pi < pkg.min_amount && (
                    <p className="text-xs text-destructive text-center">
                      Solde insuffisant (minimum: {pkg.min_amount}  Pi)
                    </p>
                  )}
                </CardContent>
              </GlowCard>
            );
          })}
        </div>
      )}

      {/* Deposit Modal */}
      <DepositModal open={showDepositModal} onOpenChange={setShowDepositModal} />

      {/* Investment Modal */}
      <Dialog open={showInvestModal} onOpenChange={(open) => !open && resetModal()}>
        {/* data-testids in modal for e2e */}
        <DialogContent className="sm:max-w-md">
          {investment.step === 1 && investment.selectedPackage && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full pi-gradient flex items-center justify-center">
                    <Target className="h-4 w-4 text-white" />
                  </div>
                  Investment - {investment.selectedPackage.name}
                </DialogTitle>
                <DialogDescription>
                  Taux quotidien de {(investment.selectedPackage.daily_rate * 100).toFixed(2)}% 
                  pour jusqu'à {investment.selectedPackage.max_duration_days} jours
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Package Info */}
                <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-muted/50">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Taux Quotidien</p>
                    <p className="text-lg font-semibold text-green-600">
                      {(investment.selectedPackage.daily_rate * 100).toFixed(2)}%
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Durée Max</p>
                    <p className="text-lg font-semibold">
                      {investment.selectedPackage.max_duration_days} jours
                    </p>
                  </div>
                </div>

                {/* Amount Input */}
                <div className="space-y-3">
                  <Label>Montant de l'Investment</Label>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={investment.amount}
                        onChange={(e) => setInvestment(prev => ({ 
                          ...prev, 
                          amount: Math.max(investment.selectedPackage!.min_amount, 
                                         Math.min(investment.selectedPackage!.max_amount || Number.MAX_VALUE, 
                                                 Number(e.target.value))) 
                        }))}
                        min={investment.selectedPackage.min_amount}
                        max={investment.selectedPackage.max_amount || undefined}
                        className="flex-1"
                      />
                      <span className="text-muted-foreground"> Pi</span>
                    </div>
                    
                    <Slider
                      value={[investment.amount]}
                      onValueChange={handleAmountChange}
                      min={investment.selectedPackage.min_amount}
                      max={Math.min(investment.selectedPackage.max_amount || Number.MAX_VALUE, user?.balance_pi || 0)}
                      step={100}
                      className="w-full"
                    />
                    
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Min: {investment.selectedPackage.min_amount.toLocaleString()} Pi</span>
                      <span>
                        Max: {Math.min(investment.selectedPackage.max_amount || Number.MAX_VALUE, user?.balance_pi || 0).toLocaleString()} Pi
                      </span>
                    </div>
                  </div>
                </div>

                {/* Calculations */}
                {(() => {
                  const returns = calculateReturns(investment.amount, investment.selectedPackage.daily_rate, investment.selectedPackage.max_duration_days);
                  return (
                    <div className="space-y-3 p-4 rounded-lg border border-border/50">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Retour quotidien:</span>
                        <span className="font-semibold text-green-600">
                          <AnimatedCounter value={returns.dailyReturn} decimals={2} suffix=" Pi" />
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Retour total estimé:</span>
                        <span className="font-semibold">
                          <AnimatedCounter value={returns.totalReturn} decimals={2} suffix=" Pi" />
                        </span>
                      </div>
                      <div className="flex justify-between border-t border-border/50 pt-2">
                        <span className="font-medium">ROI:</span>
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          <AnimatedCounter value={returns.roi} decimals={0} suffix="%" />
                        </Badge>
                      </div>
                    </div>
                  );
                })()}

                {/* Balance Check */}
                {user && investment.amount > user.balance_pi && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">Solde insuffisant</span>
                  </div>
                )}

                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">{error}</span>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={resetModal}
                    className="flex-1"
                  >
                    Annuler
                  </Button>
                  <Button
                    onClick={() => setInvestment(prev => ({ ...prev, step: 2 }))}
                    disabled={investment.amount < investment.selectedPackage.min_amount || 
                             (!user || investment.amount > user.balance_pi)}
                    className="flex-1 pi-gradient text-white"
                    data-testid="continue-invest-btn"
                  >
                    Continuer
                  </Button>
                </div>
              </div>
            </>
          )}

          {investment.step === 2 && investment.selectedPackage && (
            <>
              <DialogHeader>
                <DialogTitle>Confirmation de l'Investment</DialogTitle>
                <DialogDescription>
                  Veuillez vérifier les détails de votre investissement avant de confirmer
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-muted/50">
                  <h4 className="font-medium mb-3">Récapitulatif de l'Investment</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Package:</span>
                      <span className="font-medium">{investment.selectedPackage.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Montant:</span>
                      <span className="font-medium">{investment.amount.toLocaleString()} Pi</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Taux quotidien:</span>
                      <span className="font-medium text-green-600">
                        {(investment.selectedPackage.daily_rate * 100).toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Durée maximale:</span>
                      <span className="font-medium">{investment.selectedPackage.max_duration_days} jours</span>
                    </div>
                    {(() => {
                      const returns = calculateReturns(investment.amount, investment.selectedPackage.daily_rate, investment.selectedPackage.max_duration_days);
                      return (
                        <div className="flex justify-between border-t border-border pt-2">
                          <span>Retour total estimé:</span>
                          <span className="font-semibold text-green-600">{returns.totalReturn.toFixed(2)} Pi</span>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setInvestment(prev => ({ ...prev, step: 1 }))}
                    className="flex-1"
                  >
                    Retour
                  </Button>
                  <Button
                    onClick={handleInvest}
                    disabled={investment.isLoading}
                    className="flex-1 pi-gradient text-white"
                    data-testid="confirm-invest-btn"
                  >
                    {investment.isLoading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Traitement...
                      </div>
                    ) : (
                      <>
                        <TrendingUp className="mr-2 h-4 w-4" />
                        Confirmer l'Investment
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}

          {investment.step === 3 && investment.selectedPackage && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-6 w-6" />
                  Investment Créé avec Succès !
                </DialogTitle>
                <DialogDescription>
                  Vos Pi coins ont été investis avec succès
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 text-center">
                <div className="p-6 rounded-lg bg-green-50 border border-green-200">
                  <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                    <Coins className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Investment Actif</h3>
                  <p className="text-muted-foreground mb-4">
                    Votre investment de {investment.amount.toLocaleString()} Pi dans le package "{investment.selectedPackage.name}" 
                    génère maintenant {(investment.amount * investment.selectedPackage.daily_rate).toFixed(2)} Pi par jour
                  </p>
                  <p className="text-sm text-green-600 font-medium">
                    Première réclamation disponible dans 24 heures
                  </p>
                </div>

                <Button 
                  onClick={resetModal}
                  className="w-full"
                >
                  Retour au Tableau de Bord
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}