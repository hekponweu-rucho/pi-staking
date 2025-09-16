import api from '../lib/api-enhanced';

// === TYPES INCHANGÉS ===
export interface DashboardData { /* ... */ }
export interface FinancialSummary { /* ... */ }
export interface PerformanceMetrics { /* ... */ }
export interface Notification { /* ... */ }
export interface ChartsData { /* ... */ }
export interface AdminDashboardStats { /* ... */ }
export interface AdminAnalytics { /* ... */ }

class DashboardService {
  // Helper pour gérer les erreurs et retourner des données par défaut
  private handleError<T>(error: any, defaultValue: T, context: string): { success: boolean; data: T } {
    console.error(`Erreur dans ${context}:`, error);
    return { success: false, data: defaultValue };
  }

  // Récupérer les données principales du dashboard utilisateur
  async getDashboardData(): Promise<{ success: boolean; data: DashboardData }> {
    try {
      const response = await api.get('/dashboard');
      return response.data;
    } catch (error) {
      return this.handleError(error, {
        user: {
          id: '',
          username: '',
          email: '',
          balance_pi: 0,
          total_invested: 0,
          total_earned: 0,
          total_claimed: 0,
          current_level: 'bronze',
          referral_code: '',
          welcome_bonus_claimed: false,
          created_at: ''
        },
        investments: {
          active_count: 0,
          total_amount: 0,
          today_earnings: 0,
          pending_claims: 0
        },
        statistics: {
          total_users: 0,
          total_investments: 0,
          platform_tvl: 0,
          daily_volume: 0
        },
        recent_activities: []
      }, 'getDashboardData');
    }
  }

  // Résumé financier
  async getFinancialSummary(): Promise<{ success: boolean; data: FinancialSummary }> {
    try {
      const response = await api.get('/dashboard/financial-summary');
      return response.data;
    } catch (error) {
      return this.handleError(error, {
        current_balance: 0,
        total_invested: 0,
        total_earned: 0,
        total_claimed: 0,
        available_to_claim: 0,
        pending_withdrawals: 0,
        net_profit: 0,
        roi_percentage: 0,
        monthly_growth: { current_month: 0, last_month: 0, growth_percentage: 0 },
        portfolio_breakdown: []
      }, 'getFinancialSummary');
    }
  }

  // Métriques de performance
  async getPerformanceMetrics(): Promise<{ success: boolean; data: PerformanceMetrics }> {
    try {
      const response = await api.get('/dashboard/performance');
      return response.data;
    } catch (error) {
      return this.handleError(error, {
        daily_earnings: [],
        weekly_summary: { total_earned: 0, average_daily: 0, best_day: { date: '', amount: 0 }, growth_rate: 0 },
        monthly_comparison: [],
        performance_by_package: []
      }, 'getPerformanceMetrics');
    }
  }

  // Notifications
  async getNotifications(unreadOnly: boolean = false): Promise<{ success: boolean; data: { notifications: Notification[]; unread_count: number } }> {
    try {
      const response = await api.get(`/dashboard/notifications?unread_only=${unreadOnly}`);
      return response.data;
    } catch (error) {
      return this.handleError(error, { notifications: [], unread_count: 0 }, 'getNotifications');
    }
  }

  // Graphiques
  async getChartsData(period: 'week' | 'month' | 'year' = 'month'): Promise<{ success: boolean; data: ChartsData }> {
    try {
      const response = await api.get(`/dashboard/charts?period=${period}`);
      return response.data;
    } catch (error) {
      return this.handleError(error, {
        earnings_chart: { labels: [], datasets: [] },
        investments_chart: { labels: [], datasets: [] },
        growth_chart: { labels: [], datasets: [] }
      }, 'getChartsData');
    }
  }

  // Notifications admin
  async markNotificationAsRead(notificationId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.patch(`/dashboard/notifications/${notificationId}/read`);
      return response.data;
    } catch (error) {
      return { success: false, message: 'Impossible de marquer comme lu' };
    }
  }

  async markAllNotificationsAsRead(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.patch('/dashboard/notifications/mark-all-read');
      return response.data;
    } catch (error) {
      return { success: false, message: 'Impossible de marquer toutes les notifications comme lues' };
    }
  }

  // === ADMIN ===

  async getAdminAnalytics(period: 'week' | 'month' | 'year' = 'month'): Promise<{ success: boolean; data: AdminAnalytics }> {
    try {
      const response = await api.get(`/admin/analytics?period=${period}`);
      return response.data;
    } catch (error) {
      return this.handleError(error, {
        user_analytics: { registrations_by_day: [], user_levels_distribution: [], retention_rate: { daily: 0, weekly: 0, monthly: 0 } },
        financial_analytics: { revenue_by_day: [], investment_trends: [], withdrawal_patterns: [] },
        performance_analytics: { package_roi: [], user_satisfaction: 0, platform_efficiency: 0 }
      }, 'getAdminAnalytics');
    }
  }

  async getUsers(page: number = 1, search?: string, level?: string) {
    try {
      const params = new URLSearchParams({ page: page.toString(), ...(search && { search }), ...(level && { level }) });
      const response = await api.get(`/admin/users?${params}`);
      return response.data;
    } catch (error) {
      return this.handleError(error, { users: [], pagination: { current_page: 1, total_pages: 1, total_items: 0, per_page: 10 } }, 'getUsers');
    }
  }

  async updateUser(userId: string, updates: { current_level?: string; is_active?: boolean; balance_pi?: number; notes?: string; }) {
    try {
      const response = await api.patch(`/admin/users/${userId}`, updates);
      return response.data;
    } catch (error) {
      return { success: false, message: 'Mise à jour impossible' };
    }
  }

  async getUserDetails(userId: string) {
    try {
      const response = await api.get(`/admin/users/${userId}/details`);
      return response.data;
    } catch (error) {
      return this.handleError(error, { user: {}, investments: [], claims: [], transactions: [], security_logs: [] }, 'getUserDetails');
    }
  }

  async getAdminTransactions(page: number = 1, type?: string, status?: string) {
    try {
      const params = new URLSearchParams({ page: page.toString(), ...(type && { type }), ...(status && { status }) });
      const response = await api.get(`/admin/transactions?${params}`);
      return response.data;
    } catch (error) {
      return this.handleError(error, { transactions: [], pagination: { current_page: 1, total_pages: 1, total_items: 0, per_page: 10 } }, 'getAdminTransactions');
    }
  }

  // === UTILS ===

  formatCurrency(amount: number, currency: string = 'Pi'): string {
    if (currency === 'Pi') {
      return `${amount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} Pi`;
    }
    return `${amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}`;
  }

  calculateGrowthPercentage(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }

  generateChartColors(count: number): string[] {
    const piColors = ['#8B5CF6', '#F59E0B', '#3B82F6', '#10B981', '#EF4444', '#F97316', '#8B5CF6', '#06B6D4'];
    return Array.from({ length: count }, (_, i) => piColors[i % piColors.length]);
  }
}

export const dashboardService = new DashboardService();
export default dashboardService;
