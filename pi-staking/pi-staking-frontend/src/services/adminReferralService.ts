import api from '../lib/api-enhanced';

// Types pour l'administration du parrainage
export interface AdminGlobalStats {
  overview: {
    total_referrals: number;
    qualified_referrals: number;
    active_referrers: number;
    total_commissions_paid: number;
    conversion_rate: number;
    average_commission_per_referral: number;
  };
  today: {
    new_referrals: number;
    qualified_referrals: number;
    commissions_paid: number;
  };
  this_week: {
    new_referrals: number;
    qualified_referrals: number;
    commissions_paid: number;
  };
  this_month: {
    new_referrals: number;
    qualified_referrals: number;
    commissions_paid: number;
  };
}

export interface AdminLevelMetrics {
  level_1: LevelMetric;
  level_2: LevelMetric;
  level_3: LevelMetric;
}

export interface LevelMetric {
  total_referrals: number;
  qualified_referrals: number;
  total_commissions: number;
  average_qualifying_investment: number;
  commission_rate: string;
}

export interface TopReferrer {
  id: number;
  username: string;
  email: string;
  current_level: string;
  referral_code: string;
  qualified_referrals_count: number;
  total_commissions_earned: number;
  registration_date: string;
  last_referral_date?: string;
}

export interface MonthlyGrowthData {
  month: string;
  month_key: string;
  new_referrals: number;
  qualified_referrals: number;
  commissions_paid: number;
  conversion_rate: number;
}

export interface ReferralActivity {
  id: string;
  type: 'new_referral' | 'commission_paid';
  title: string;
  description: string;
  amount?: number;
  level: number;
  status: string;
  created_at: string;
  users: {
    referrer: string;
    referred: string;
  };
}

export interface SystemAlert {
  type: 'error' | 'warning' | 'info';
  title: string;
  message: string;
  action_url?: string;
  priority: 'low' | 'medium' | 'high';
}

export interface RealTimeMetrics {
  last_hour: {
    new_referrals: number;
    qualified_referrals: number;
    commissions_paid: number;
  };
  last_24_hours: {
    new_referrals: number;
    qualified_referrals: number;
    commissions_paid: number;
  };
  active_users_with_referrals: number;
}

export interface AdminReferralDashboard {
  global_stats: AdminGlobalStats;
  level_metrics: AdminLevelMetrics;
  top_referrers: TopReferrer[];
  recent_activities: ReferralActivity[];
  system_alerts: SystemAlert[];
  realtime_metrics: RealTimeMetrics;
}

export interface ReferralSearchFilters {
  status?: string;
  level?: number;
  referrer?: string;
  referred?: string;
  date_from?: string;
  date_to?: string;
  min_amount?: number;
}

export interface ReferralSearchResult {
  data: any[];
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

class AdminReferralService {
  /**
   * Obtenir le dashboard principal d'administration
   */
  async getDashboard(): Promise<AdminReferralDashboard> {
    try {
      const response = await api.get<{ success: boolean; data: AdminReferralDashboard }>(
        '/admin/referrals/dashboard'
      );
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error('Erreur lors de la récupération du dashboard');
    } catch (error) {
      console.error('Erreur getDashboard:', error);
      throw error;
    }
  }

  /**
   * Obtenir les statistiques globales
   */
  async getGlobalStats(): Promise<AdminGlobalStats> {
    try {
      const response = await api.get<{ success: boolean; data: AdminGlobalStats }>(
        '/admin/referrals/stats/global'
      );
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error('Erreur lors de la récupération des statistiques globales');
    } catch (error) {
      console.error('Erreur getGlobalStats:', error);
      throw error;
    }
  }

  /**
   * Obtenir les métriques par niveau
   */
  async getLevelMetrics(): Promise<AdminLevelMetrics> {
    try {
      const response = await api.get<{ success: boolean; data: AdminLevelMetrics }>(
        '/admin/referrals/stats/levels'
      );
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error('Erreur lors de la récupération des métriques par niveau');
    } catch (error) {
      console.error('Erreur getLevelMetrics:', error);
      throw error;
    }
  }

  /**
   * Obtenir la croissance mensuelle
   */
  async getMonthlyGrowth(months = 12): Promise<MonthlyGrowthData[]> {
    try {
      const response = await api.get<{ success: boolean; data: MonthlyGrowthData[] }>(
        `/admin/referrals/stats/monthly-growth?months=${months}`
      );
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error('Erreur lors de la récupération de la croissance mensuelle');
    } catch (error) {
      console.error('Erreur getMonthlyGrowth:', error);
      throw error;
    }
  }

  /**
   * Obtenir les top parrains
   */
  async getTopReferrers(limit = 20): Promise<TopReferrer[]> {
    try {
      const response = await api.get<{ success: boolean; data: TopReferrer[] }>(
        `/admin/referrals/top-referrers?limit=${limit}`
      );
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error('Erreur lors de la récupération des top parrains');
    } catch (error) {
      console.error('Erreur getTopReferrers:', error);
      throw error;
    }
  }

  /**
   * Obtenir les activités récentes
   */
  async getRecentActivities(limit = 50): Promise<ReferralActivity[]> {
    try {
      const response = await api.get<{ success: boolean; data: ReferralActivity[] }>(
        `/admin/referrals/recent-activities?limit=${limit}`
      );
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error('Erreur lors de la récupération des activités récentes');
    } catch (error) {
      console.error('Erreur getRecentActivities:', error);
      throw error;
    }
  }

  /**
   * Obtenir les alertes système
   */
  async getSystemAlerts(): Promise<SystemAlert[]> {
    try {
      const response = await api.get<{ success: boolean; data: SystemAlert[] }>(
        '/admin/referrals/system-alerts'
      );
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error('Erreur lors de la récupération des alertes système');
    } catch (error) {
      console.error('Erreur getSystemAlerts:', error);
      throw error;
    }
  }

  /**
   * Obtenir les métriques temps réel
   */
  async getRealTimeMetrics(): Promise<RealTimeMetrics> {
    try {
      const response = await api.get<{ success: boolean; data: RealTimeMetrics }>(
        '/admin/referrals/stats/realtime'
      );
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error('Erreur lors de la récupération des métriques temps réel');
    } catch (error) {
      console.error('Erreur getRealTimeMetrics:', error);
      throw error;
    }
  }

  /**
   * Rechercher des parrainages avec filtres
   */
  async searchReferrals(
    filters: ReferralSearchFilters = {},
    perPage = 20
  ): Promise<ReferralSearchResult> {
    try {
      const params = new URLSearchParams({
        per_page: perPage.toString(),
        ...Object.entries(filters).reduce((acc, [key, value]) => {
          if (value !== undefined && value !== '') {
            acc[key] = value.toString();
          }
          return acc;
        }, {} as Record<string, string>)
      });

      const response = await api.get<{
        success: boolean;
        data: any[];
        pagination: ReferralSearchResult['pagination'];
      }>(`/admin/referrals/search?${params}`);
      
      if (response.data.success) {
        return {
          data: response.data.data,
          pagination: response.data.pagination
        };
      }
      throw new Error('Erreur lors de la recherche des parrainages');
    } catch (error) {
      console.error('Erreur searchReferrals:', error);
      throw error;
    }
  }

  /**
   * Exporter des données
   */
  async exportData(type: 'all' | 'referrals' | 'commissions' | 'top_referrers', filters = {}): Promise<any> {
    try {
      const response = await api.post<{ success: boolean; data: any }>('/admin/referrals/export', {
        type,
        filters
      });
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error('Erreur lors de l\'export des données');
    } catch (error) {
      console.error('Erreur exportData:', error);
      throw error;
    }
  }

  /**
   * Gérer manuellement un parrainage
   */
  async manageReferral(
    referralId: number,
    action: 'approve' | 'reject' | 'pay_bonus',
    note?: string
  ): Promise<any> {
    try {
      const response = await api.patch<{ success: boolean; data: any; message: string }>(
        `/admin/referrals/${referralId}/manage`,
        { action, note }
      );
      if (response.data.success) {
        return response.data;
      }
      throw new Error(response.data.message || 'Erreur lors de la gestion du parrainage');
    } catch (error) {
      console.error('Erreur manageReferral:', error);
      throw error;
    }
  }

  /**
   * Formater les montants en Pi
   */
  formatPiAmount(amount: number): string {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M Pi`;
    }
    if (amount >= 1000) {
      return `${(amount / 1000).toFixed(1)}K Pi`;
    }
    return `${amount.toFixed(2)} Pi`;
  }

  /**
   * Obtenir la couleur selon le niveau d'alerte
   */
  getAlertColor(type: SystemAlert['type']): string {
    const colors = {
      error: 'text-red-600 bg-red-50 border-red-200',
      warning: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      info: 'text-blue-600 bg-blue-50 border-blue-200'
    };
    return colors[type];
  }

  /**
   * Obtenir la couleur selon la priorité
   */
  getPriorityColor(priority: SystemAlert['priority']): string {
    const colors = {
      high: 'text-red-600',
      medium: 'text-yellow-600',
      low: 'text-green-600'
    };
    return colors[priority];
  }

  /**
   * Calculer le pourcentage de croissance
   */
  calculateGrowthPercentage(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }

  /**
   * Formater les pourcentages
   */
  formatPercentage(value: number): string {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  }
}

export default new AdminReferralService();