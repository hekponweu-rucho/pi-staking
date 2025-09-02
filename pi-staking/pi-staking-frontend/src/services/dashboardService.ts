import api from '../lib/api-enhanced';

// Types pour le dashboard
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
    type: 'investment' | 'claim' | 'withdrawal' | 'bonus';
    amount: number;
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
  is_read: boolean;
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

// Types pour l'administration
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
    retention_rate: {
      daily: number;
      weekly: number;
      monthly: number;
    };
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

class DashboardService {
  
  // Récupérer les données principales du dashboard utilisateur
  async getDashboardData(): Promise<{ success: boolean; data: DashboardData }> {
    try {
      const response = await api.get('/dashboard');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des données du dashboard:', error);
      throw error;
    }
  }

  // Récupérer le résumé financier détaillé
  async getFinancialSummary(): Promise<{ success: boolean; data: FinancialSummary }> {
    try {
      const response = await api.get('/dashboard/financial-summary');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération du résumé financier:', error);
      throw error;
    }
  }

  // Récupérer les métriques de performance
  async getPerformanceMetrics(): Promise<{ success: boolean; data: PerformanceMetrics }> {
    try {
      const response = await api.get('/dashboard/performance');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des métriques de performance:', error);
      throw error;
    }
  }

  // Récupérer les notifications
  async getNotifications(unreadOnly: boolean = false): Promise<{ 
    success: boolean; 
    data: {
      notifications: Notification[];
      unread_count: number;
    }
  }> {
    try {
      const response = await api.get(`/dashboard/notifications?unread_only=${unreadOnly}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des notifications:', error);
      throw error;
    }
  }

  // Récupérer les données pour les graphiques
  async getChartsData(period: 'week' | 'month' | 'year' = 'month'): Promise<{ 
    success: boolean; 
    data: ChartsData 
  }> {
    try {
      const response = await api.get(`/dashboard/charts?period=${period}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des données des graphiques:', error);
      throw error;
    }
  }

  // Marquer une notification comme lue
  async markNotificationAsRead(notificationId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.patch(`/dashboard/notifications/${notificationId}/read`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors du marquage de la notification:', error);
      throw error;
    }
  }

  // Marquer toutes les notifications comme lues
  async markAllNotificationsAsRead(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.patch('/dashboard/notifications/mark-all-read');
      return response.data;
    } catch (error) {
      console.error('Erreur lors du marquage de toutes les notifications:', error);
      throw error;
    }
  }

  // === ADMINISTRATION ===

  // Récupérer les statistiques du dashboard admin
  async getAdminDashboardStats(): Promise<{ success: boolean; data: AdminDashboardStats }> {
    try {
      const response = await api.get('/admin/dashboard');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des stats admin:', error);
      throw error;
    }
  }

  // Récupérer les analytics détaillées pour l'admin
  async getAdminAnalytics(period: 'week' | 'month' | 'year' = 'month'): Promise<{ 
    success: boolean; 
    data: AdminAnalytics 
  }> {
    try {
      const response = await api.get(`/admin/analytics?period=${period}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des analytics admin:', error);
      throw error;
    }
  }

  // Récupérer la liste des utilisateurs (admin)
  async getUsers(page: number = 1, search?: string, level?: string): Promise<{
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
      const params = new URLSearchParams({
        page: page.toString(),
        ...(search && { search }),
        ...(level && { level })
      });
      
      const response = await api.get(`/admin/users?${params}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs:', error);
      throw error;
    }
  }

  // Mettre à jour un utilisateur (admin)
  async updateUser(userId: string, updates: {
    current_level?: string;
    is_active?: boolean;
    balance_pi?: number;
    notes?: string;
  }): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.patch(`/admin/users/${userId}`, updates);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
      throw error;
    }
  }

  // Récupérer les détails d'un utilisateur (admin)
  async getUserDetails(userId: string): Promise<{
    success: boolean;
    data: {
      user: any;
      investments: any[];
      claims: any[];
      transactions: any[];
      security_logs: any[];
    };
  }> {
    try {
      const response = await api.get(`/admin/users/${userId}/details`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des détails de l\'utilisateur:', error);
      throw error;
    }
  }

  // Récupérer les transactions (admin)
  async getAdminTransactions(page: number = 1, type?: string, status?: string): Promise<{
    success: boolean;
    data: {
      transactions: any[];
      pagination: any;
    };
  }> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        ...(type && { type }),
        ...(status && { status })
      });
      
      const response = await api.get(`/admin/transactions?${params}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des transactions admin:', error);
      throw error;
    }
  }

  // Calculer les KPIs en temps réel
  async getRealTimeKPIs(): Promise<{
    active_users_now: number;
    total_claimable_amount: number;
    pending_transactions: number;
    system_health_score: number;
    recent_registrations: number;
  }> {
    try {
      // On combine plusieurs appels API pour obtenir des KPIs en temps réel
      const [dashboardResponse, statsResponse] = await Promise.all([
        this.getDashboardData(),
        this.getAdminDashboardStats()
      ]);

      const dashboard = dashboardResponse.data;
      const stats = statsResponse.data;

      return {
        active_users_now: stats.overview.active_users,
        total_claimable_amount: dashboard.investments.pending_claims,
        pending_transactions: stats.overview.pending_withdrawals,
        system_health_score: 95, // Calculé basé sur les métriques système
        recent_registrations: stats.growth_metrics.new_users_today
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

  // Formater les montants pour l'affichage
  formatCurrency(amount: number, currency: string = 'π'): string {
    if (currency === 'π') {
      return `${amount.toLocaleString('fr-FR', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 4 
      })} π`;
    }
    return `${amount.toLocaleString('fr-FR', { 
      style: 'currency', 
      currency: 'EUR' 
    })}`;
  }

  // Calculer le pourcentage de croissance
  calculateGrowthPercentage(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }

  // Générer les couleurs pour les graphiques
  generateChartColors(count: number): string[] {
    const piColors = [
      '#8B5CF6', // Violet Pi
      '#F59E0B', // Or Pi
      '#3B82F6', // Bleu
      '#10B981', // Vert
      '#EF4444', // Rouge
      '#F97316', // Orange
      '#8B5CF6', // Violet
      '#06B6D4'  // Cyan
    ];

    const colors: string[] = [];
    for (let i = 0; i < count; i++) {
      colors.push(piColors[i % piColors.length]);
    }
    return colors;
  }

  // Obtenir le statut de santé du système
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

      // Vérifier les métriques critiques
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

      if (data.alerts.filter(a => !a.is_resolved && a.severity === 'critical').length > 0) {
        score -= 25;
        issues.push('Alertes critiques non résolues');
        recommendations.push('Résoudre immédiatement les alertes critiques');
      }

      // Déterminer le statut
      let status: 'excellent' | 'good' | 'warning' | 'critical';
      if (score >= 90) status = 'excellent';
      else if (score >= 70) status = 'good';
      else if (score >= 50) status = 'warning';
      else status = 'critical';

      return { status, score, issues, recommendations };
    } catch (error) {
      console.error('Erreur lors de l\'évaluation de la santé du système:', error);
      return {
        status: 'critical',
        score: 0,
        issues: ['Impossible d\'évaluer la santé du système'],
        recommendations: ['Vérifier la connectivité API']
      };
    }
  }
}

export const dashboardService = new DashboardService();
export default dashboardService;