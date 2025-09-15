import api from '../lib/api-enhanced';

// Types pour le staking
export interface StakingPackage {
  id: string;
  name: string;
  description: string | null;
  level_requirement: 'discovery' | 'bronze' | 'silver' | 'gold' | 'diamond' | null;
  daily_rate: number;
  min_amount: number;
  max_amount: number | null;
  duration_days: number;
  is_discovery_bonus: boolean;
  is_active: boolean;
  max_concurrent: number | null;
  features: any | null; // JSON
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Investment {
  id: string;
  user_id: string;
  staking_package_id: string;
  amount: number;
  daily_rate: number;
  total_earned: number;
  total_claimed: number;
  status: 'active' | 'completed' | 'cancelled';
  started_at: string;
  ends_at: string;
  next_claim_at: string;
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
  // ✅ Récupérer tous les packages de staking disponibles
  async getPackages(): Promise<{ success: boolean; data: StakingPackage[]; message?: string }> {
    try {
      const response = await api.get('/staking/packages');
      return response.data;
    } catch (error: any) {
      console.error('Erreur lors de la récupération des packages:', error);
      return {
        success: false,
        data: [],
        message: error.response?.data?.message || 'Erreur serveur lors de la récupération des packages'
      };
    }
  }

  // ✅ Créer un nouvel investissement
  async createInvestment(
    packageId: string,
    amount: number,
    source: 'funds' | 'bonus' = 'funds'
  ): Promise<{ success: boolean; data: Investment | null; message: string }> {
    try {
      const response = await api.post('/staking/invest', {
        staking_package_id: packageId,
        amount,
        source
      });
      return response.data;
    } catch (error: any) {
      console.error('Erreur lors de la création de l\'investissement:', error);
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || 'Impossible de créer l\'investissement'
      };
    }
  }

  // ✅ Récupérer les investissements de l'utilisateur
  async getUserInvestments(): Promise<{ success: boolean; data: Investment[]; message?: string }> {
    try {
      const response = await api.get('/staking/investments');
      return response.data;
    } catch (error: any) {
      console.error('Erreur lors de la récupération des investissements:', error);
      return {
        success: false,
        data: [],
        message: error.response?.data?.message || 'Impossible de charger les investissements'
      };
    }
  }

  // ✅ Récupérer les détails d'un investissement spécifique
  async getInvestmentDetails(
    investmentId: string
  ): Promise<{
    success: boolean;
    data: (Investment & {
      claimable_amount: number;
      days_remaining: number;
      total_days: number;
      progress_percentage: number;
    }) | null;
    message?: string;
  }> {
    try {
      const response = await api.get(`/staking/investment/${investmentId}`);
      return response.data;
    } catch (error: any) {
      console.error('Erreur lors de la récupération des détails de l\'investissement:', error);
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || 'Impossible de charger les détails de l\'investissement'
      };
    }
  }

  // ✅ Calculer les gains potentiels pour un investissement
  async calculateEarnings(
    packageId: string,
    amount: number,
    duration?: number
  ): Promise<{ success: boolean; data: EarningsCalculation | null; message?: string }> {
    try {
      const response = await api.post('/staking/calculate-earnings', {
        staking_package_id: packageId,
        amount,
        duration_days: duration
      });
      return response.data;
    } catch (error: any) {
      console.error('Erreur lors du calcul des gains:', error);
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || 'Impossible de calculer les gains'
      };
    }
  }

  // ✅ Récupérer l'historique de performance
  async getPerformanceHistory(
    period: 'week' | 'month' | 'year' = 'month'
  ): Promise<{ success: boolean; data: PerformanceData[]; message?: string }> {
    try {
      const response = await api.get(`/staking/performance?period=${period}`);
      return response.data;
    } catch (error: any) {
      console.error('Erreur lors de la récupération de l\'historique de performance:', error);
      return {
        success: false,
        data: [],
        message: error.response?.data?.message || 'Impossible de charger l\'historique de performance'
      };
    }
  }

  // Réinvestir le bonus de bienvenue (Discovery)
  async reinvestBonus(): Promise<{ success: boolean; message: string; data: any }> {
    try {
      const response = await api.post('/staking/reinvest-bonus');
      return response.data;
    } catch (error) {
      console.error('Erreur lors du réinvestissement du bonus:', error);
      throw error;
    }
  }

  // Réinvestir depuis les soldes claimables
  async reinvest(
    packageId: string,
    amount: number,
    source: 'claimable' | 'claimable_bonus'
  ): Promise<{ success: boolean; message: string; data: any }> {
    try {
      const response = await api.post('/staking/reinvest', {
        staking_package_id: packageId,
        amount,
        source,
      });
      return response.data;
    } catch (error: any) {
      console.error('Erreur lors du réinvestissement:', error);
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || 'Impossible de réinvestir',
      };
    }
  }

  // ✅ Calculer les statistiques de staking pour l'utilisateur
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
    } | null;
    message?: string;
  }> {
    try {
      const investmentsResponse = await this.getUserInvestments();
      if (!investmentsResponse.success || !investmentsResponse.data) {
        return {
          success: false,
          data: null,
          message: 'Impossible de récupérer les investissements pour calculer les stats'
        };
      }

      const investments = investmentsResponse.data || [];
      const totalInvested = investments.reduce((sum, inv) => sum + (inv.amount || 0), 0);
      const totalEarned = investments.reduce((sum, inv) => sum + (inv.total_earned || 0), 0);
      const totalClaimed = investments.reduce((sum, inv) => sum + (inv.total_claimed || 0), 0);
      const activeInvestments = investments.filter(inv => inv.status === 'active').length;
      const completedInvestments = investments.filter(inv => inv.status === 'completed').length;

      const totalDailyReturns = investments.reduce((sum, inv) => {
        if (inv.status === 'active') {
          const dailyReturn = inv.amount * inv.daily_rate;
          return sum + dailyReturn;
        }
        return sum;
      }, 0);

      const averageDailyReturn = activeInvestments > 0 ? totalDailyReturns / activeInvestments : 0;

      // Best package
      const packageCounts = investments.reduce((acc, inv) => {
        const packageName = inv.package?.name || 'Inconnu';
        acc[packageName] = (acc[packageName] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const bestPackage =
        Object.entries(packageCounts).reduce(
          (a, b) => (packageCounts[a[0]] > packageCounts[b[0]] ? a : b),
          ['Aucun', 0]
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
          total_profit_percentage: totalProfitPercentage
        }
      };
    } catch (error: any) {
      console.error('Erreur lors du calcul des statistiques de staking:', error);
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || 'Erreur serveur lors du calcul des statistiques'
      };
    }
  }
}

export const stakingService = new StakingService();
export default stakingService;
