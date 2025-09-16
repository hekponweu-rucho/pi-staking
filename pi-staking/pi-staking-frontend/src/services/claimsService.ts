import api from '../lib/api-enhanced';

// Types pour les réclamations
export interface ClaimableInvestment {
  id: string;
  investment_id: string;
  amount: number;
  claimable_amount: number;
  last_claimed_at: string | null;
  next_claim_at: string;
  can_claim: boolean;
  daily_rate: number;
  days_since_last_claim: number;
  investment: {
    id: string;
    amount: number;
    status: string;
    package: {
      name: string;
      level: string;
    };
  };
}

export interface ClaimHistory {
  id: string;
  user_id: string;
  investment_id: string;
  final_amount: number;
  claimed_at: string;
  status: 'pending' | 'processed' | 'failed';
  transaction_hash: string | null;
  investment: {
    id: string;
    package: {
      name: string;
      level: string;
    };
  };
}

export interface ClaimStatistics {
  total_claims: number;
  total_claimed_amount: number;
  average_claim_amount: number;
  successful_claims: number;
  failed_claims: number;
  pending_claims: number;
  last_claim_date: string | null;
  total_claimable_now: number;
  next_claim_available: string | null;
  daily_potential_earnings: number;
  weekly_potential_earnings: number;
  monthly_potential_earnings: number;
}

export interface EarningsSimulation {
  current_earnings: number;
  projected_1_day: number;
  projected_7_days: number;
  projected_30_days: number;
  compound_effect: {
    without_compound: number;
    with_compound: number;
    difference: number;
    percentage_increase: number;
  };
}

export interface BulkClaimResult {
  success: boolean;
  total_claimed: number;
  successful_claims: number;
  failed_claims: number;
  details: Array<{
    investment_id: string;
    amount: number;
    status: 'success' | 'failed';
    message: string;
  }>;
}

class ClaimsService {
  
  // Récupérer tous les investissements réclamables
  async getClaimableInvestments(): Promise<{ success: boolean; data: ClaimableInvestment[] }> {
    try {
      const response = await api.get('/claims/available');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des investissements réclamables:', error);
      throw error;
    }
  }

  // Réclamer un investissement spécifique
  async claimInvestment(investmentId: string): Promise<{ 
    success: boolean; 
    data: {
      claim_id: string;
      amount: number;
      transaction_hash: string;
      status: string;
    };
    message: string; 
  }> {
    try {
      const response = await api.post(`/claims/${investmentId}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la réclamation de l\'investissement:', error);
      throw error;
    }
  }

  // Récupérer l'historique des réclamations
  async getClaimHistory(page: number = 1, limit: number = 20): Promise<{ 
    success: boolean; 
    data: {
      claims: ClaimHistory[];
      pagination: {
        current_page: number;
        total_pages: number;
        total_items: number;
        per_page: number;
      };
    }
  }> {
    try {
      const response = await api.get(`/claims/history?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'historique des réclamations:', error);
      throw error;
    }
  }

  // Récupérer les statistiques des réclamations
  async getClaimStatistics(): Promise<{ success: boolean; data: ClaimStatistics }> {
    try {
      const response = await api.get('/claims/statistics');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      throw error;
    }
  }

  // Réclamation en masse de tous les investissements disponibles
  async bulkClaim(): Promise<{ success: boolean; data: BulkClaimResult; message: string }> {
    try {
      const response = await api.post('/claims/bulk-claim');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la réclamation en masse:', error);
      throw error;
    }
  }

  // Simuler les gains futurs
  async simulateEarnings(reinvestPercentage: number = 0): Promise<{ 
    success: boolean; 
    data: EarningsSimulation 
  }> {
    try {
      const response = await api.post('/claims/simulate-earnings', {
        reinvest_percentage: reinvestPercentage
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la simulation des gains:', error);
      throw error;
    }
  }

  // Calculer le temps restant avant la prochaine réclamation
  getTimeUntilNextClaim(nextClaimDate: string): {
    canClaim: boolean;
    timeRemaining: {
      hours: number;
      minutes: number;
      seconds: number;
      total_seconds: number;
    };
    formatted: string;
  } {
    const now = new Date();
    const nextClaim = new Date(nextClaimDate);
    const diffMs = nextClaim.getTime() - now.getTime();

    if (diffMs <= 0) {
      return {
        canClaim: true,
        timeRemaining: { hours: 0, minutes: 0, seconds: 0, total_seconds: 0 },
        formatted: 'Réclamation disponible'
      };
    }

    const totalSeconds = Math.floor(diffMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    let formatted = '';
    if (hours > 0) {
      formatted = `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      formatted = `${minutes}m ${seconds}s`;
    } else {
      formatted = `${seconds}s`;
    }

    return {
      canClaim: false,
      timeRemaining: { hours, minutes, seconds, total_seconds: totalSeconds },
      formatted
    };
  }

  // Calculer les gains potentiels pour aujourd'hui
  async getTodayPotentialEarnings(): Promise<number> {
    try {
      const claimableResponse = await this.getClaimableInvestments();
      if (!claimableResponse.success) return 0;

      return claimableResponse.data.reduce((total, investment) => {
        if (investment.can_claim) {
          return total + investment.claimable_amount;
        }
        return total;
      }, 0);
    } catch (error) {
      console.error('Erreur lors du calcul des gains potentiels:', error);
      return 0;
    }
  }

  // Obtenir le résumé des réclamations pour le dashboard
  async getClaimsSummary(): Promise<{
    total_claimable: number;
    claimable_count: number;
    next_claim_in: string | null;
    daily_potential: number;
    last_claim_amount: number;
    last_claim_date: string | null;
  }> {
    try {
      const [claimableResponse, statsResponse] = await Promise.all([
        this.getClaimableInvestments(),
        this.getClaimStatistics()
      ]);

      let totalClaimable = 0;
      let claimableCount = 0;
      let nextClaimDate: string | null = null;

      if (claimableResponse.success) {
        claimableResponse.data.forEach(investment => {
          if (investment.can_claim) {
            totalClaimable += investment.claimable_amount;
            claimableCount++;
          }
          
          // Trouver la prochaine date de réclamation
          if (!nextClaimDate || investment.next_claim_at < nextClaimDate) {
            nextClaimDate = investment.next_claim_at;
          }
        });
      }

      const stats = statsResponse.success ? statsResponse.data : null;

      return {
        total_claimable: totalClaimable,
        claimable_count: claimableCount,
        next_claim_in: nextClaimDate,
        daily_potential: stats?.daily_potential_earnings || 0,
        last_claim_amount: 0, // Récupéré depuis l'historique si nécessaire
        last_claim_date: stats?.last_claim_date || null
      };
    } catch (error) {
      console.error('Erreur lors de la récupération du résumé des réclamations:', error);
      return {
        total_claimable: 0,
        claimable_count: 0,
        next_claim_in: null,
        daily_potential: 0,
        last_claim_amount: 0,
        last_claim_date: null
      };
    }
  }

  // Formater les montants en PI avec les bonnes décimales
  formatPiAmount(amount: number): string {
    return `${amount.toFixed(4)} Pi`;
  }

  // Calculer le pourcentage de progression de réclamation
  calculateClaimProgress(lastClaimedAt: string | null, nextClaimAt: string): number {
    if (!lastClaimedAt) return 100; // Si jamais réclamé, peut réclamer immédiatement

    const lastClaim = new Date(lastClaimedAt);
    const nextClaim = new Date(nextClaimAt);
    const now = new Date();

    const totalDuration = nextClaim.getTime() - lastClaim.getTime();
    const elapsed = now.getTime() - lastClaim.getTime();

    const progress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
    return Math.round(progress);
  }
}

export const claimsService = new ClaimsService();
export default claimsService;