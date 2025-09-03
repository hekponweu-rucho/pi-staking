import api from '../lib/api-enhanced';
import type { StakingPackage } from '@shared/investment';

export interface Investment {
  id: number;
  user_id: number;
  staking_package_id: number;
  amount: number;
  daily_rate: number;
  total_earned: number;
  total_claimed: number;
  status: 'active' | 'completed' | 'cancelled';
  started_at: string;
  ends_at: string;
  next_claim_available_at: string;
  created_at: string;
  updated_at: string;
  package?: StakingPackage;
}

export interface PerformanceData {
  date: string;
  total_invested: number;
  total_earned: number;
  total_claimed: number;
  active_investments: number;
}

export interface EarningsCalculation {
  daily_earning: number;
  total_earning: number;
  after_fees: number;
  deposit_fee: number;
  performance_fee: number;
  net_profit: number;
}

class StakingService {
  async getPackages(): Promise<{ packages: StakingPackage[]; user_level: string; level_info: any }> {
    try {
      const response = await api.get('/staking/packages');
      const { packages, user_level, level_info } = response?.data?.data || {};
      return { packages: packages || [], user_level, level_info };
    } catch (error) {
      console.error('Erreur lors de la récupération des packages:', error);
      throw error;
    }
  }

  async createInvestment(
    packageId: number,
    amount: number,
    source: 'funds' | 'bonus' = 'funds'
  ): Promise<{ success: boolean; data: Investment; message: string }> {
    try {
      const response = await api.post('/staking/invest', {
        package_id: packageId,
        amount,
        source,
      });
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la création de l'investissement:", error);
      throw error;
    }
  }

  async getUserInvestments(): Promise<{ success: boolean; data: Investment[] }> {
    try {
      const response = await api.get('/staking/investments');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des investissements:', error);
      throw error;
    }
  }

  async getInvestmentDetails(
    investmentId: number
  ): Promise<{
    success: boolean;
    data: Investment & {
      claimable_amount: number;
      days_remaining: number;
      total_days: number;
      progress_percentage: number;
    };
  }> {
    try {
      const response = await api.get(`/staking/investment/${investmentId}`);
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la récupération des détails de l'investissement:", error);
      throw error;
    }
  }

  async calculateEarnings(
    packageId: number,
    amount: number,
    duration?: number
  ): Promise<{ success: boolean; data: EarningsCalculation }> {
    try {
      const response = await api.post('/staking/calculate-earnings', {
        package_id: packageId,
        amount,
        duration_days: duration,
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors du calcul des gains:', error);
      throw error;
    }
  }

  async getPerformanceHistory(
    period: 'week' | 'month' | 'year' = 'month'
  ): Promise<{ success: boolean; data: PerformanceData[] }> {
    try {
      const periodMap: Record<'week' | 'month' | 'year', string> = {
        week: '7days',
        month: '30days',
        year: '1year',
      };
      const apiPeriod = periodMap[period];
      const response = await api.get(`/staking/performance?period=${apiPeriod}`);
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la récupération de l'historique de performance:", error);
      throw error;
    }
  }

  async getStakingStats(): Promise<{
    success: boolean;
    data: {
      total_invested: number;
      total_earned: number;
      total_claimed: number;
      active_investments: number;
      completed_investments: number;
      average_daily_return: number;
      best_package: string;
      total_profit_percentage: number;
    };
  }> {
    try {
      const investmentsResponse = await this.getUserInvestments();
      if (!investmentsResponse.success) throw new Error('Impossible de récupérer les investissements');

      const investments = investmentsResponse.data;
      const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0);
      const totalEarned = investments.reduce((sum, inv) => sum + inv.total_earned, 0);
      const totalClaimed = investments.reduce((sum, inv) => sum + inv.total_claimed, 0);
      const activeInvestments = investments.filter((inv) => inv.status === 'active').length;
      const completedInvestments = investments.filter((inv) => inv.status === 'completed').length;

      const totalDailyReturns = investments.reduce((sum, inv) => {
        if (inv.status === 'active') {
          const dailyReturn = inv.amount * inv.daily_rate;
          return sum + dailyReturn;
        }
        return sum;
      }, 0);

      const averageDailyReturn = activeInvestments > 0 ? totalDailyReturns / activeInvestments : 0;

      const packageCounts = investments.reduce((acc, inv) => {
        const packageName = inv.package?.name || 'Inconnu';
        acc[packageName] = (acc[packageName] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const bestPackage = Object.entries(packageCounts).reduce((a, b) =>
        packageCounts[a[0]] > packageCounts[b[0]] ? a : b
      )[0] || 'Aucun';

      const totalProfitPercentage = totalInvested > 0 ? (totalEarned / totalInvested) * 100 : 0;

      return {
        success: true,
        data: {
          total_invested: totalInvested,
          total_earned: totalEarned,
          total_claimed: totalClaimed,
          active_investments: activeInvestments,
          completed_investments: completedInvestments,
          average_daily_return: averageDailyReturn,
          best_package: bestPackage,
          total_profit_percentage: totalProfitPercentage,
        },
      };
    } catch (error) {
      console.error('Erreur lors du calcul des statistiques de staking:', error);
      throw error;
    }
  }
}

export const stakingService = new StakingService();
export default stakingService;
