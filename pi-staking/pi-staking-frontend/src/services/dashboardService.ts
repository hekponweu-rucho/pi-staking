import api from '../lib/api-enhanced';

// Types pour le dashboard (UI stables)
export interface DashboardData {
  user: {
    id: string;
    username: string;
    email: string;
    balance_pi: number;
    total_invested: number;
    total_earned: number;
    total_claimed: number;
    current_level: string;
    referral_code: string;
    welcome_bonus_claimed: boolean;
    created_at: string;
  };
  investments: {
    active_count: number;
    total_amount: number;
    today_earnings: number;
    pending_claims: number;
  };
  statistics: {
    total_users: number;
    total_investments: number;
    platform_tvl: number;
    daily_volume: number;
  };
  recent_activities: Array<{
    type: 'investment' | 'claim' | 'withdrawal' | 'bonus' | 'activity';
    amount?: number;
    description: string;
    created_at: string;
  }>;
}

export interface FinancialSummary {
  current_balance: number;
  total_invested: number;
  total_earned: number;
  total_claimed: number;
  available_to_claim: number;
  pending_withdrawals: number;
  net_profit: number;
  roi_percentage: number;
  monthly_growth: {
    current_month: number;
    last_month: number;
    growth_percentage: number;
  };
  portfolio_breakdown: Array<{
    package_name: string;
    amount: number;
    percentage: number;
    status: string;
  }>;
}

export interface PerformanceMetrics {
  daily_earnings: Array<{
    date: string;
    amount: number;
  }>;
  weekly_summary: {
    total_earned: number;
    average_daily: number;
    best_day: { date: string; amount: number };
    growth_rate: number;
  };
  monthly_comparison: Array<{
    month: string;
    invested: number;
    earned: number;
    claimed: number;
  }>;
  performance_by_package: Array<{
    package_name: string;
    total_invested: number;
    total_earned: number;
    roi_percentage: number;
    active_investments: number;
  }>;
}

export interface Notification {
  id: string;
  type: 'success' | 'warning' | 'info' | 'error';
  title: string;
  message: string;
  is_read?: boolean;
  created_at: string;
  action_url?: string;
}

export interface ChartsData {
  earnings_chart: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      backgroundColor?: string;
      borderColor?: string;
    }>;
  };
  investments_chart: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      backgroundColor?: string[];
    }>;
  };
  growth_chart: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      borderColor?: string;
      backgroundColor?: string;
    }>;
  };
}

// Types pour l'administration (inchangés)
export interface AdminDashboardStats {
  overview: {
    total_users: number;
    active_users: number;
    total_investments: number;
    platform_tvl: number;
    total_claimed: number;
    pending_withdrawals: number;
  };
  growth_metrics: {
    new_users_today: number;
    new_users_this_month: number;
    investment_volume_today: number;
    investment_volume_this_month: number;
    growth_rate: number;
  };
  financial_health: {
    total_deposits: number;
    total_withdrawals: number;
    platform_balance: number;
    profit_margin: number;
  };
  package_performance: Array<{
    id: string;
    name: string;
    total_investments: number;
    total_amount: number;
    average_investment: number;
    active_count: number;
  }>;
  recent_activities: Array<{
    type: string;
    description: string;
    amount?: number;
    user_id: string;
    created_at: string;
  }>;
  alerts: Array<{
    id: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    created_at: string;
    is_resolved: boolean;
  }>;
}

export interface AdminAnalytics {
  user_analytics: {
    registrations_by_day: Array<{ date: string; count: number }>;
    user_levels_distribution: Array<{ level: string; count: number; percentage: number }>;
    retention_rate: { daily: number; weekly: number; monthly: number };
  };
  financial_analytics: {
    revenue_by_day: Array<{ date: string; amount: number }>;
    investment_trends: Array<{ date: string; amount: number; count: number }>;
    withdrawal_patterns: Array<{ date: string; amount: number; count: number }>;
  };
  performance_analytics: {
    package_roi: Array<{ package_name: string; average_roi: number }>;
    user_satisfaction: number;
    platform_efficiency: number;
  };
}

// === Helpers d'adaptation (backend -> UI) ===
const adaptDashboardData = (payload: any): DashboardData => {
  const user = payload?.user ?? {};
  const stats = payload?.stats ?? {};
  const level = payload?.level ?? {};
  const claimable = payload?.claimable ?? {};
  const recent = Array.isArray(payload?.recent_activity) ? payload.recent_activity : [];

  return {
    user: {
      id: String(user?.id ?? ''),
      username: String(user?.username ?? user?.name ?? ''),
      email: String(user?.email ?? ''),
      balance_pi: Number(stats?.balances?.available ?? stats?.balance ?? user?.balance_pi ?? 0),
      total_invested: Number(stats?.totals?.invested ?? stats?.total_invested ?? 0),
      total_earned: Number(stats?.totals?.earned ?? stats?.total_earned ?? 0),
      total_claimed: Number(stats?.totals?.claimed ?? stats?.total_claimed ?? 0),
      current_level: String(level?.current ?? user?.current_level ?? ''),
      referral_code: String(user?.referral_code ?? ''),
      welcome_bonus_claimed: Boolean(user?.welcome_bonus_claimed ?? false),
      created_at: String(user?.created_at ?? '')
    },
    investments: {
      active_count: Number(stats?.investments?.active_count ?? 0),
      total_amount: Number(stats?.investments?.total_amount ?? 0),
      today_earnings: Number(stats?.earnings?.today ?? 0),
      pending_claims: Number(claimable?.count ?? 0)
    },
    statistics: {
      total_users: Number(stats?.users?.total ?? 0),
      total_investments: Number(stats?.investments?.count ?? 0),
      platform_tvl: Number(stats?.platform?.tvl ?? 0),
      daily_volume: Number(stats?.platform?.daily_volume ?? 0)
    },
    recent_activities: recent.map((r: any) => ({
      type: (r?.type ?? 'activity') as any,
      amount: Number(r?.amount ?? 0),
      description: String(r?.description ?? ''),
      created_at: String(r?.created_at ?? r?.date ?? new Date().toISOString())
    }))
  };
};

const adaptFinancialSummary = (payload: any): FinancialSummary => {
  const balances = payload?.balances ?? {};
  const lifetime = payload?.lifetime ?? {};
  const active = Array.isArray(payload?.active_investments) ? payload.active_investments : [];
  const performance = payload?.performance ?? {};

  const total_invested = Number(lifetime?.total_invested ?? 0);
  const total_earned = Number(lifetime?.total_earned ?? 0);
  const total_claimed = Number(lifetime?.total_claimed ?? 0);
  const current_balance = Number(balances?.available ?? balances?.current_balance ?? 0);
  const net_profit = Number(performance?.net_profit ?? total_earned - total_claimed);
  const roi_percentage = total_invested > 0 ? (total_earned / total_invested) * 100 : 0;

  const current_month = Number(performance?.monthly?.current ?? 0);
  const last_month = Number(performance?.monthly?.last ?? performance?.monthly?.previous ?? 0);
  const growth_percentage = last_month === 0 ? (current_month > 0 ? 100 : 0) : ((current_month - last_month) / last_month) * 100;

  const totalActiveAmount = active.reduce((sum: number, i: any) => sum + Number(i?.amount ?? 0), 0);

  return {
    current_balance,
    total_invested,
    total_earned,
    total_claimed,
    available_to_claim: Number(payload?.available_to_claim ?? 0),
    pending_withdrawals: Number(performance?.pending_withdrawals ?? 0),
    net_profit,
    roi_percentage,
    monthly_growth: { current_month, last_month, growth_percentage },
    portfolio_breakdown: active.map((i: any) => ({
      package_name: String(i?.package?.name ?? 'Package'),
      amount: Number(i?.amount ?? 0),
      percentage: totalActiveAmount > 0 ? (Number(i?.amount ?? 0) / totalActiveAmount) * 100 : 0,
      status: String(i?.status ?? 'active')
    }))
  };
};

const adaptPerformanceMetrics = (payload: any): PerformanceMetrics => {
  const metrics = payload?.metrics ?? {};
  const trends = payload?.trends ?? {};

  const daily = Array.isArray(metrics?.daily) ? metrics.daily : [];
  const weekly = Array.isArray(metrics?.weekly) ? metrics.weekly : [];
  const monthly = Array.isArray(metrics?.monthly) ? metrics.monthly : [];

  const daily_earnings = daily.map((d: any) => ({ date: String(d?.date ?? ''), amount: Number(d?.amount ?? 0) }));
  const total_week = weekly.reduce((sum: number, d: any) => sum + Number(d?.earned ?? d?.amount ?? 0), 0);
  const avg_daily = weekly.length > 0 ? total_week / weekly.length : 0;
  const best = weekly.reduce(
    (max: { date: string; amount: number }, d: any) => {
      const amount = Number(d?.earned ?? d?.amount ?? 0);
      return amount > max.amount ? { date: String(d?.date ?? ''), amount } : max;
    },
    { date: '', amount: 0 }
  );

  const monthly_comparison = monthly.map((m: any) => ({
    month: String(m?.month ?? m?.label ?? ''),
    invested: Number(m?.invested ?? 0),
    earned: Number(m?.earned ?? 0),
    claimed: Number(m?.claimed ?? 0)
  }));

  return {
    daily_earnings,
    weekly_summary: {
      total_earned: total_week,
      average_daily: avg_daily,
      best_day: best,
      growth_rate: Number(trends?.claims_trend?.growth_rate ?? 0)
    },
    monthly_comparison,
    performance_by_package: Array.isArray(trends?.performance_by_package)
      ? trends.performance_by_package.map((p: any) => ({
          package_name: String(p?.package_name ?? 'Package'),
          total_invested: Number(p?.total_invested ?? 0),
          total_earned: Number(p?.total_earned ?? 0),
          roi_percentage: Number(p?.roi_percentage ?? 0),
          active_investments: Number(p?.active_investments ?? 0)
        }))
      : []
  };
};

const mapPeriod = (period: 'week' | 'month' | 'year'): '7days' | '30days' | '90days' | '1year' => {
  if (period === 'week') return '7days';
  if (period === 'year') return '1year';
  return '30days';
};

const buildChartsData = (payload: any, colorGen: (n: number) => string[]): ChartsData => {
  const dailyClaims = Array.isArray(payload?.daily_claims) ? payload.daily_claims : [];
  const investmentDistribution = Array.isArray(payload?.investment_distribution) ? payload.investment_distribution : [];
  const balanceEvolution = Array.isArray(payload?.balance_evolution) ? payload.balance_evolution : [];

  const labelsEarnings = dailyClaims.map((d: any) => String(d?.date ?? d?.label ?? ''));
  const dataEarnings = dailyClaims.map((d: any) => Number(d?.amount ?? 0));

  const labelsInvest = investmentDistribution.map((d: any) => String(d?.name ?? d?.package ?? d?.category ?? ''));
  const dataInvest = investmentDistribution.map((d: any) => Number(d?.amount ?? d?.value ?? 0));
  const colors = colorGen(Math.max(1, dataInvest.length));

  const labelsGrowth = balanceEvolution.map((d: any) => String(d?.date ?? ''));
  const dataGrowth = balanceEvolution.map((d: any) => Number(d?.balance ?? d?.value ?? 0));

  return {
    earnings_chart: {
      labels: labelsEarnings,
      datasets: [
        {
          label: 'Réclamations quotidiennes',
          data: dataEarnings,
          backgroundColor: '#8B5CF6',
          borderColor: '#8B5CF6'
        }
      ]
    },
    investments_chart: {
      labels: labelsInvest,
      datasets: [
        {
          label: 'Répartition des investissements',
          data: dataInvest,
          backgroundColor: colors
        }
      ]
    },
    growth_chart: {
      labels: labelsGrowth,
      datasets: [
        {
          label: 'Évolution du solde',
          data: dataGrowth,
          borderColor: '#10B981',
          backgroundColor: 'rgba(16, 185, 129, 0.2)'
        }
      ]
    }
  };
};

class DashboardService {
  async getDashboardData(): Promise<{ success: boolean; data: DashboardData }> {
    try {
      const response = await api.get('/dashboard');
      const adapted = adaptDashboardData(response?.data?.data ?? response?.data ?? {});
      return { success: true, data: adapted };
    } catch (error) {
      console.error('Erreur lors de la récupération des données du dashboard:', error);
      throw error;
    }
  }

  async getFinancialSummary(): Promise<{ success: boolean; data: FinancialSummary }> {
    try {
      const response = await api.get('/dashboard/financial-summary');
      const adapted = adaptFinancialSummary(response?.data?.data ?? response?.data ?? {});
      return { success: true, data: adapted };
    } catch (error) {
      console.error('Erreur lors de la récupération du résumé financier:', error);
      throw error;
    }
  }

  async getPerformanceMetrics(): Promise<{ success: boolean; data: PerformanceMetrics }> {
    try {
      const response = await api.get('/dashboard/performance');
      const adapted = adaptPerformanceMetrics(response?.data?.data ?? response?.data ?? {});
      return { success: true, data: adapted };
    } catch (error) {
      console.error('Erreur lors de la récupération des métriques de performance:', error);
      throw error;
    }
  }

  async getNotifications(unreadOnly: boolean = false): Promise<{
    success: boolean;
    data: { notifications: Notification[]; unread_count: number };
  }> {
    try {
      const response = await api.get(`/dashboard/notifications`, { params: { unread_only: unreadOnly } });
      const payload = response?.data?.data ?? response?.data ?? {};
      const list = Array.isArray(payload?.notifications) ? payload.notifications : [];
      const notifications: Notification[] = list.map((n: any) => ({
        id: String(n?.id ?? ''),
        type: (n?.type ?? 'info') as any,
        title: String(n?.title ?? ''),
        message: String(n?.message ?? ''),
        is_read: Boolean(n?.is_read ?? Boolean(n?.read_at)),
        created_at: String(n?.created_at ?? new Date().toISOString()),
        action_url: n?.action_url
      }));
      const unread_count = Number(payload?.unread_count ?? notifications.filter((n) => !n.is_read).length);

      return { success: true, data: { notifications, unread_count } };
    } catch (error) {
      console.error('Erreur lors de la récupération des notifications:', error);
      throw error;
    }
  }

  async getChartsData(period: 'week' | 'month' | 'year' = 'month'): Promise<{
    success: boolean;
    data: ChartsData;
  }> {
    try {
      const mapped = mapPeriod(period);
      const response = await api.get(`/dashboard/charts`, { params: { period: mapped } });
      const payload = response?.data?.data ?? response?.data ?? {};
      const charts = buildChartsData(payload, this.generateChartColors.bind(this));
      return { success: true, data: charts };
    } catch (error) {
      console.error('Erreur lors de la récupération des données des graphiques:', error);
      throw error;
    }
  }

  async getRealTimeKPIs(): Promise<{
    active_users_now: number;
    total_claimable_amount: number;
    pending_transactions: number;
    system_health_score: number;
    recent_registrations: number;
  }> {
    try {
      const [dashboardResponse, statsResponse] = await Promise.all([
        this.getDashboardData(),
        this.getAdminDashboardStats()
      ]);

      const dashboard = dashboardResponse.data;
      const stats = statsResponse.data;

      return {
        active_users_now: Number(stats.overview.active_users ?? 0),
        total_claimable_amount: Number(dashboard.investments.pending_claims ?? 0),
        pending_transactions: Number(stats.overview.pending_withdrawals ?? 0),
        system_health_score: 95,
        recent_registrations: Number(stats.growth_metrics.new_users_today ?? 0)
      };
    } catch (error) {
      console.error('Erreur lors du calcul des KPIs:', error);
      return {
        active_users_now: 0,
        total_claimable_amount: 0,
        pending_transactions: 0,
        system_health_score: 0,
        recent_registrations: 0
      };
    }
  }

  async markNotificationAsRead(notificationId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.patch(`/dashboard/notifications/${notificationId}/read`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors du marquage de la notification:', error);
      throw error;
    }
  }

  async markAllNotificationsAsRead(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.patch('/dashboard/notifications/mark-all-read');
      return response.data;
    } catch (error) {
      console.error('Erreur lors du marquage de toutes les notifications:', error);
      throw error;
    }
  }

  // === ADMINISTRATION (inchangé) ===

  async getAdminDashboardStats(): Promise<{ success: boolean; data: AdminDashboardStats }> {
    try {
      const response = await api.get('/admin/dashboard');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des stats admin:', error);
      throw error;
    }
  }

  async getAdminAnalytics(period: 'week' | 'month' | 'year' = 'month'): Promise<{
    success: boolean;
    data: AdminAnalytics;
  }> {
    try {
      const response = await api.get(`/admin/analytics`, { params: { period } });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des analytics admin:', error);
      throw error;
    }
  }

  async getUsers(
    page: number = 1,
    search?: string,
    level?: string
  ): Promise<{
    success: boolean;
    data: {
      users: Array<{
        id: string;
        username: string;
        email: string;
        current_level: string;
        balance_pi: number;
        total_invested: number;
        total_earned: number;
        is_active: boolean;
        last_activity: string;
        created_at: string;
      }>;
      pagination: {
        current_page: number;
        total_pages: number;
        total_items: number;
        per_page: number;
      };
    };
  }> {
    try {
      const params = new URLSearchParams({ page: page.toString(), ...(search && { search }), ...(level && { level }) });
      const response = await api.get(`/admin/users?${params}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs:', error);
      throw error;
    }
  }

  async updateUser(
    userId: string,
    updates: { current_level?: string; is_active?: boolean; balance_pi?: number; notes?: string }
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.patch(`/admin/users/${userId}`, updates);
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la mise à jour de l'utilisateur:", error);
      throw error;
    }
  }

  async getUserDetails(userId: string): Promise<{
    success: boolean;
    data: { user: any; investments: any[]; claims: any[]; transactions: any[]; security_logs: any[] };
  }> {
    try {
      const response = await api.get(`/admin/users/${userId}/details`);
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la récupération des détails de l'utilisateur:", error);
      throw error;
    }
  }

  async getAdminTransactions(
    page: number = 1,
    type?: string,
    status?: string
  ): Promise<{ success: boolean; data: { transactions: any[]; pagination: any } }> {
    try {
      const params = new URLSearchParams({ page: page.toString(), ...(type && { type }), ...(status && { status }) });
      const response = await api.get(`/admin/transactions?${params}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des transactions admin:', error);
      throw error;
    }
  }

  // === UTILITAIRES ===
  formatCurrency(amount: number, currency: string = 'π'): string {
    if (currency === 'π') {
      return `${amount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} π`;
    }
    return `${amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}`;
  }

  calculateGrowthPercentage(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }

  generateChartColors(count: number): string[] {
    const piColors = ['#8B5CF6', '#F59E0B', '#3B82F6', '#10B981', '#EF4444', '#F97316', '#8B5CF6', '#06B6D4'];
    const colors: string[] = [];
    for (let i = 0; i < count; i++) colors.push(piColors[i % piColors.length]);
    return colors;
  }

  async getSystemHealthStatus(): Promise<{
    status: 'excellent' | 'good' | 'warning' | 'critical';
    score: number;
    issues: string[];
    recommendations: string[];
  }> {
    try {
      const stats = await this.getAdminDashboardStats();
      if (!stats.success) throw new Error('Impossible de récupérer les stats');

      const data = stats.data;
      let score = 100;
      const issues: string[] = [];
      const recommendations: string[] = [];

      if (data.overview.pending_withdrawals > 100) {
        score -= 20;
        issues.push('Beaucoup de retraits en attente');
        recommendations.push('Traiter les retraits en priorité');
      }

      if (data.growth_metrics.growth_rate < 0) {
        score -= 15;
        issues.push('Croissance négative');
        recommendations.push('Analyser les causes de la décroissance');
      }

      if (data.alerts.filter((a) => !a.is_resolved && a.severity === 'critical').length > 0) {
        score -= 25;
        issues.push('Alertes critiques non résolues');
        recommendations.push('Résoudre immédiatement les alertes critiques');
      }

      let status: 'excellent' | 'good' | 'warning' | 'critical';
      if (score >= 90) status = 'excellent';
      else if (score >= 70) status = 'good';
      else if (score >= 50) status = 'warning';
      else status = 'critical';

      return { status, score, issues, recommendations };
    } catch (error) {
      console.error("Erreur lors de l'évaluation de la santé du système:", error);
      return {
        status: 'critical',
        score: 0,
        issues: ["Impossible d'évaluer la santé du système"],
        recommendations: ['Vérifier la connectivité API']
      };
    }
  }
}

export const dashboardService = new DashboardService();
export default dashboardService;
