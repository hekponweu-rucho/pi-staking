import api from '../lib/api-enhanced';

// Types pour les réclamations (permissifs côté UI)
export interface ClaimableInvestment {
  id: string;
  investment_id: string;
  amount: number;
  claimable_amount: number;
  last_claimed_at: string | null;
  next_claim_available_at: string;
  can_claim: boolean;
  daily_rate?: number;
  days_since_last_claim?: number;
  investment?: {
    id: string;
    amount?: number;
    status?: string;
    package?: {
      name?: string;
      level?: string;
    };
  };
}

export interface ClaimHistory {
  id: string;
  user_id: string;
  investment_id: string;
  amount: number;
  claimed_at: string;
  status: 'pending' | 'completed' | 'failed';
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

export interface Paginated<T> {
  items: T[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_items: number;
    per_page: number;
  };
}

// Helpers d'adaptation
const adaptClaimableInvestment = (item: any): ClaimableInvestment => {
  const inv = item?.investment ?? {};
  const pkg = inv?.package ?? item?.package ?? {};

  return {
    id: String(item?.id ?? item?.investment_id ?? inv?.id ?? ''),
    investment_id: String(item?.investment_id ?? item?.id ?? inv?.id ?? ''),
    amount: Number(item?.amount ?? inv?.amount ?? 0),
    claimable_amount: Number(item?.claimable_amount ?? item?.next_claim_amount ?? 0),
    last_claimed_at: item?.last_claimed_at ?? null,
    next_claim_available_at: String(item?.next_claim_available_at ?? item?.next_claim_at ?? ''),
    can_claim: Boolean(item?.can_claim ?? item?.can_claim_now ?? false),
    daily_rate: Number(item?.daily_rate ?? inv?.daily_rate ?? 0),
    days_since_last_claim: Number(item?.days_since_last_claim ?? 0),
    investment: {
      id: String(inv?.id ?? item?.investment_id ?? item?.id ?? ''),
      amount: Number(inv?.amount ?? item?.amount ?? 0),
      status: String(inv?.status ?? ''),
      package: {
        name: String(pkg?.name ?? 'Package'),
        level: String(pkg?.level ?? 'bronze')
      }
    }
  };
};

const adaptClaimHistoryItem = (raw: any): ClaimHistory => {
  const inv = raw?.investment ?? {};
  const pkg = inv?.package ?? raw?.package ?? {};
  const statusRaw = String(raw?.status ?? '').toLowerCase();
  const status: 'pending' | 'completed' | 'failed' =
    statusRaw === 'pending' ? 'pending' : statusRaw === 'failed' ? 'failed' : 'completed';

  return {
    id: String(raw?.id ?? ''),
    user_id: String(raw?.user_id ?? ''),
    investment_id: String(raw?.investment_id ?? inv?.id ?? ''),
    amount: Number(raw?.amount ?? 0),
    claimed_at: String(raw?.claimed_at ?? raw?.created_at ?? new Date().toISOString()),
    status,
    transaction_hash: raw?.transaction_hash ?? null,
    investment: {
      id: String(inv?.id ?? raw?.investment_id ?? ''),
      package: {
        name: String(pkg?.name ?? 'Package'),
        level: String(pkg?.level ?? 'bronze')
      }
    }
  };
};

const adaptLaravelPaginator = (p: any, fallbackPerPage: number) => ({
  current_page: Number(p?.current_page ?? 1),
  total_pages: Number(p?.last_page ?? p?.total_pages ?? 1),
  total_items: Number(p?.total ?? p?.total_items ?? (Array.isArray(p?.data) ? p.data.length : 0)),
  per_page: Number(p?.per_page ?? fallbackPerPage)
});

const defaultStats = (): ClaimStatistics => ({
  total_claims: 0,
  total_claimed_amount: 0,
  average_claim_amount: 0,
  successful_claims: 0,
  failed_claims: 0,
  pending_claims: 0,
  last_claim_date: null,
  total_claimable_now: 0,
  next_claim_available: null,
  daily_potential_earnings: 0,
  weekly_potential_earnings: 0,
  monthly_potential_earnings: 0
});

class ClaimsService {
  async getClaimableInvestments(): Promise<{ success: boolean; data: ClaimableInvestment[]; meta?: { total_claimable_amount?: number; claimable_count?: number } }> {
    try {
      const response = await api.get('/claims/available');
      const payload = response?.data?.data ?? {};
      const list = Array.isArray(payload?.claimable_investments) ? payload.claimable_investments : [];
      return {
        success: true,
        data: list.map(adaptClaimableInvestment),
        meta: {
          total_claimable_amount: Number(payload?.total_claimable_amount ?? 0),
          claimable_count: Number(payload?.claimable_count ?? list.length)
        }
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des investissements réclamables:', error);
      throw error;
    }
  }

  async claimInvestment(investmentId: string): Promise<{
    success: boolean;
    data: {
      claim_id: string;
      amount: number;
      transaction_hash: string | null;
      status: string;
      next_claim_at?: string;
    };
    message: string;
  }> {
    try {
      const response = await api.post(`/claims/${investmentId}`);
      const data = response?.data?.data ?? {};
      const claim = data?.claim ?? {};
      return {
        success: Boolean(response?.data?.success ?? true),
        data: {
          claim_id: String(claim?.id ?? claim?.claim_id ?? ''),
          amount: Number(claim?.amount ?? 0),
          transaction_hash: claim?.transaction_hash ?? null,
          status: String(claim?.status ?? 'completed'),
          next_claim_at: data?.next_claim_at ?? claim?.next_claim_at ?? null
        },
        message: String(response?.data?.message ?? '')
      };
    } catch (error) {
      console.error("Erreur lors de la réclamation de l'investissement:", error);
      throw error;
    }
  }

  async getClaimHistory(
    page: number = 1,
    perPage: number = 20,
    filters?: { investment_id?: string; start_date?: string; end_date?: string }
  ): Promise<{
    success: boolean;
    data: { claims: ClaimHistory[]; pagination: { current_page: number; total_pages: number; total_items: number; per_page: number } };
  }> {
    try {
      const params: Record<string, string> = { page: String(page), per_page: String(perPage) };
      if (filters?.investment_id) params.investment_id = filters.investment_id;
      if (filters?.start_date) params.start_date = filters.start_date;
      if (filters?.end_date) params.end_date = filters.end_date;

      const response = await api.get('/claims/history', { params });
      const payload = response?.data?.data ?? {};
      const paginator = payload?.claims ?? response?.data?.claims ?? {};
      const items = Array.isArray(paginator?.data) ? paginator.data : Array.isArray(paginator) ? paginator : [];

      return {
        success: Boolean(response?.data?.success ?? true),
        data: {
          claims: items.map(adaptClaimHistoryItem),
          pagination: adaptLaravelPaginator(paginator, perPage)
        }
      };
    } catch (error) {
      console.error("Erreur lors de la récupération de l'historique des réclamations:", error);
      throw error;
    }
  }

  async getClaimStatistics(): Promise<{ success: boolean; data: ClaimStatistics }> {
    try {
      const response = await api.get('/claims/statistics');
      const raw = response?.data?.data;

      if (!raw || (Array.isArray(raw) && raw.length === 0)) {
        return { success: true, data: defaultStats() };
      }

      const base = defaultStats();
      const adapted: ClaimStatistics = {
        total_claims: Number(raw?.total_claims ?? base.total_claims),
        total_claimed_amount: Number(raw?.total_claimed_amount ?? base.total_claimed_amount),
        average_claim_amount: Number(raw?.average_claim_amount ?? base.average_claim_amount),
        successful_claims: Number(raw?.successful_claims ?? base.successful_claims),
        failed_claims: Number(raw?.failed_claims ?? base.failed_claims),
        pending_claims: Number(raw?.pending_claims ?? base.pending_claims),
        last_claim_date: raw?.last_claim_date ?? base.last_claim_date,
        total_claimable_now: Number(raw?.total_claimable_now ?? base.total_claimable_now),
        next_claim_available: raw?.next_claim_available ?? base.next_claim_available,
        daily_potential_earnings: Number(raw?.daily_potential_earnings ?? base.daily_potential_earnings),
        weekly_potential_earnings: Number(raw?.weekly_potential_earnings ?? base.weekly_potential_earnings),
        monthly_potential_earnings: Number(raw?.monthly_potential_earnings ?? base.monthly_potential_earnings)
      };

      return {
        success: Boolean(response?.data?.success ?? true),
        data: adapted
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      return { success: true, data: defaultStats() };
    }
  }

  async bulkClaim(): Promise<{ success: boolean; data: BulkClaimResult; message: string }> {
    try {
      const response = await api.post('/claims/bulk-claim');
      return response.data;
    } catch (err: any) {
      const status = err?.response?.status;
      const message = err?.response?.data?.message || (status === 422 ? 'Aucun investissement éligible' : 'Une erreur est survenue');
      console.error('Erreur lors de la réclamation en masse:', err?.response?.data || err);
      return {
        success: false,
        data: {
          success: false,
          total_claimed: 0,
          successful_claims: 0,
          failed_claims: 0,
          details: []
        },
        message
      };
    }
  }

  async simulateEarnings(days: number = 7): Promise<{ success: boolean; data: { simulation: any; breakdown_by_investment: any[] } }> {
    try {
      const response = await api.post('/claims/simulate-earnings', { days });
      const payload = response?.data?.data ?? {};
      return {
        success: Boolean(response?.data?.success ?? true),
        data: {
          simulation: payload?.simulation ?? {},
          breakdown_by_investment: Array.isArray(payload?.breakdown_by_investment) ? payload.breakdown_by_investment : []
        }
      };
    } catch (error) {
      console.error('Erreur lors de la simulation des gains:', error);
      throw error;
    }
  }

  getTimeUntilNextClaim(nextClaimDate: string): {
    canClaim: boolean;
    timeRemaining: { hours: number; minutes: number; seconds: number; total_seconds: number };
    formatted: string;
  } {
    const now = new Date();
    const nextClaim = new Date(nextClaimDate);
    const diffMs = nextClaim.getTime() - now.getTime();

    if (isNaN(nextClaim.getTime()) || diffMs <= 0) {
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
    if (hours > 0) formatted = `${hours}h ${minutes}m`;
    else if (minutes > 0) formatted = `${minutes}m ${seconds}s`;
    else formatted = `${seconds}s`;

    return {
      canClaim: false,
      timeRemaining: { hours, minutes, seconds, total_seconds: totalSeconds },
      formatted
    };
  }

  async getTodayPotentialEarnings(): Promise<number> {
    try {
      const claimableResponse = await this.getClaimableInvestments();
      if (!claimableResponse.success) return 0;

      return claimableResponse.data.reduce((total, investment) => {
        if (investment.can_claim) {
          return total + (investment.claimable_amount || 0);
        }
        return total;
      }, 0);
    } catch (error) {
      console.error('Erreur lors du calcul des gains potentiels:', error);
      return 0;
    }
  }

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
        claimableResponse.data.forEach((investment) => {
          if (investment.can_claim) {
            totalClaimable += investment.claimable_amount || 0;
            claimableCount++;
          }

          if (!nextClaimDate || (investment.next_claim_available_at && investment.next_claim_available_at < nextClaimDate)) {
            nextClaimDate = investment.next_claim_available_at || nextClaimDate;
          }
        });
      }

      const stats = statsResponse.success ? statsResponse.data : null;

      return {
        total_claimable: totalClaimable,
        claimable_count: claimableCount,
        next_claim_in: nextClaimDate,
        daily_potential: stats?.daily_potential_earnings || 0,
        last_claim_amount: 0,
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

  formatPiAmount(amount: number): string {
    return `${amount.toFixed(4)} π`;
  }

  calculateClaimProgress(lastClaimedAt: string | null, nextClaimAt: string): number {
    if (!lastClaimedAt) return 100;

    const lastClaim = new Date(lastClaimedAt);
    const nextClaim = new Date(nextClaimAt);
    const now = new Date();

    const totalDuration = nextClaim.getTime() - lastClaim.getTime();
    const elapsed = now.getTime() - lastClaim.getTime();

    const progress = totalDuration > 0 ? Math.min(100, Math.max(0, (elapsed / totalDuration) * 100)) : 100;
    return Math.round(progress);
  }
}

export const claimsService = new ClaimsService();
export default claimsService;
