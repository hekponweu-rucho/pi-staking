import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Coins, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import { AnimatedCounter } from './AnimatedCounter';
import { EmailVerifiedGuard } from './EmailVerifiedGuard';
import { useAuth } from '../contexts/AuthContext';

interface StakingPackage {
  name: string;
  level: string;
  minAmount: number;
  maxAmount: number | null;
  dailyRate: number;
  duration: number;
  color: string;
}

interface StakingModalProps {
  package: StakingPackage;
  userBalance: number;
  children: React.ReactNode;
}

export function StakingModal({ package: pkg, userBalance, children }: StakingModalProps) {
  const { checkEmailVerified } = useAuth();
  const [amount, setAmount] = useState(pkg.minAmount);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);

  const maxInvestment = Math.min(pkg.maxAmount || userBalance, userBalance);
  const dailyReturn = (amount * pkg.dailyRate) / 100;
  const totalReturn = dailyReturn * pkg.duration;
  const roi = ((totalReturn / amount) * 100);

  const handleSliderChange = (value: number[]) => {
    setAmount(value[0]);
  };

  const handleStake = async () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setStep(3);
    }, 2000);
  };

  const levelColors = {
    discovery: 'bg-gray-500',
    bronze: 'bg-amber-600',
    silver: 'bg-gray-400',
    gold: 'bg-yellow-500',
    diamond: 'bg-cyan-400'
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <EmailVerifiedGuard 
          feature="les investissements"
          message="Pour votre sécurité, vous devez vérifier votre adresse email avant d'investir vos Pi."
          showAlternative={false}
        >
        {step === 1 && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <div className={`h-8 w-8 rounded-full ${levelColors[pkg.level as keyof typeof levelColors]} flex items-center justify-center`}>
                  <Coins className="h-4 w-4 text-white" />
                </div>
                Stake in {pkg.name} Package
              </DialogTitle>
              <DialogDescription>
                Earn {pkg.dailyRate}% daily returns for {pkg.duration} days
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Package Info */}
              <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-muted/50">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Daily Rate</p>
                  <p className="text-lg font-semibold text-green-600">{pkg.dailyRate}%</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p className="text-lg font-semibold">{pkg.duration} days</p>
                </div>
              </div>

              {/* Amount Input */}
              <div className="space-y-3">
                <Label>Investment Amount</Label>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(Math.max(pkg.minAmount, Math.min(maxInvestment, Number(e.target.value))))}
                      min={pkg.minAmount}
                      max={maxInvestment}
                      className="flex-1"
                    />
                    <span className="text-muted-foreground"> Pi</span>
                  </div>
                  
                  <Slider
                    value={[amount]}
                    onValueChange={handleSliderChange}
                    min={pkg.minAmount}
                    max={maxInvestment}
                    step={100}
                    className="w-full"
                  />
                  
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Min: {pkg.minAmount.toLocaleString()} Pi</span>
                    <span>Max: {maxInvestment.toLocaleString()} Pi</span>
                  </div>
                </div>
              </div>

              {/* Calculations */}
              <div className="space-y-3 p-4 rounded-lg border border-border/50">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Daily Return:</span>
                  <span className="font-semibold text-green-600">
                    <AnimatedCounter value={dailyReturn} decimals={2} suffix=" Pi" />
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Return:</span>
                  <span className="font-semibold">
                    <AnimatedCounter value={totalReturn} decimals={2} suffix=" Pi" />
                  </span>
                </div>
                <div className="flex justify-between border-t border-border/50 pt-2">
                  <span className="font-medium">ROI:</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    <AnimatedCounter value={roi} decimals={0} suffix="%" />
                  </Badge>
                </div>
              </div>

              {/* Balance Check */}
              {amount > userBalance && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">Insufficient balance</span>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={() => setStep(2)}
                  disabled={amount < pkg.minAmount || amount > userBalance}
                  className="flex-1 pi-gradient text-white"
                >
                  Continue
                </Button>
              </div>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <DialogHeader>
              <DialogTitle>Confirm Investment</DialogTitle>
              <DialogDescription>
                Please review your investment details before confirming
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <h4 className="font-medium mb-3">Investment Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Package:</span>
                    <span className="font-medium">{pkg.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Amount:</span>
                    <span className="font-medium">{amount.toLocaleString()} Pi</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Daily Rate:</span>
                    <span className="font-medium text-green-600">{pkg.dailyRate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Duration:</span>
                    <span className="font-medium">{pkg.duration} days</span>
                  </div>
                  <div className="flex justify-between border-t border-border pt-2">
                    <span>Expected Total Return:</span>
                    <span className="font-semibold text-green-600">{totalReturn.toFixed(2)} Pi</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={handleStake}
                  disabled={isLoading}
                  className="flex-1 pi-gradient text-white"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Processing...
                    </div>
                  ) : (
                    <>
                      <TrendingUp className="mr-2 h-4 w-4" />
                      Confirm Stake
                    </>
                  )}
                </Button>
              </div>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-6 w-6" />
                Investment Successful!
              </DialogTitle>
              <DialogDescription>
                Your Pi coins have been staked successfully
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 text-center">
              <div className="p-6 rounded-lg bg-green-50 border border-green-200">
                <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                  <Coins className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Staking Active</h3>
                <p className="text-muted-foreground mb-4">
                  Your {amount.toLocaleString()} Pi investment is now earning {pkg.dailyRate}% daily returns
                </p>
                <p className="text-sm text-green-600 font-medium">
                  First claim available in 24 hours
                </p>
              </div>

              <Button 
                onClick={() => window.location.reload()} 
                className="w-full"
              >
                View Dashboard
              </Button>
            </div>
          </>
        )}
        </EmailVerifiedGuard>
      </DialogContent>
    </Dialog>
  );
}