import api from '@/lib/api';

// Types pour l'administration
export interface AdminDashboardStats {
  users: {
    total: number;
    active: number;
    new_today: number;
    new_this_week: number;
    growth_rate: number;
  };
  financial: {
    tvl: number;
    platform_revenue: number;
    pending_claims: number;
    daily_volume: number;
    liquidity_ratio: number;
  };
  system: {
    system_health: number;
    critical_alerts: number;
    active_investments: number;
    completed_transactions: number;
  };
  popular_packages: Array<{
    id: number;
    name: string;
    investment_count: number;
    total_volume: number;
  }>;
}

export interface AdminAnalytics {
  user_growth: Array<{
    date: string;
    count: number;
  }>;
  tvl_evolution: Array<{
    date: string;
    amount: number;
  }>;
  claims_vs_revenue: Array<{
    date: string;
    claims: number;
    revenue: number;
  }>;
  level_distribution: Array<{
    level: string;
    count: number;
  }>;
}

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  balance_pi: number;
  level: string;
  status: 'active' | 'suspended' | 'banned';
  created_at: string;
  last_activity: string;
  total_invested: number;
  total_claimed: number;
  referral_code: string;
}

export interface AdminTransaction {
  id: number;
  user: {
    id: number;
    username: string;
    email: string;
  };
  type: string;
  amount: number;
  status: string;
  created_at: string;
  description: string;
}

export interface SystemAlert {
  id: number;
  type: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  created_at: string;
  resolved_at?: string;
  data?: any;
}

class AdminService {
  private baseUrl = '/api/admin';

  // Authentification admin
  async checkAdminAccess(): Promise<boolean> {
    try {
      const response = await api.get(`${this.baseUrl}/dashboard`);
      return response.data.success;
    } catch (error) {
      return false;
    }
  }

  // Dashboard principal
  async getDashboardStats(): Promise<AdminDashboardStats> {
    const response = await api.get(`${this.baseUrl}/dashboard`);
    return response.data.data;
  }

  // Analytics détaillés
  async getAnalytics(period: '7d' | '30d' | '90d' | '1y' = '30d'): Promise<AdminAnalytics> {
    const response = await api.get(`${this.baseUrl}/analytics`, {
      params: { period }
    });
    return response.data.data;
  }

  // Gestion des utilisateurs
  async getUsers(params: {
    page?: number;
    per_page?: number;
    search?: string;
    level?: string;
    status?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
  } = {}): Promise<{
    data: AdminUser[];
    pagination: {
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
    };
  }> {
    const response = await api.get(`${this.baseUrl}/users`, { params });
    return response.data;
  }

  async updateUser(userId: number, data: {
    status?: 'active' | 'suspended' | 'banned';
    level?: string;
    balance_adjustment?: number;
    notes?: string;
  }): Promise<AdminUser> {
    const response = await api.patch(`${this.baseUrl}/users/${userId}`, data);
    return response.data.data;
  }

  async getUserDetails(userId: number): Promise<{
    user: AdminUser;
    investments: any[];
    transactions: any[];
    referrals: any[];
    claims: any[];
  }> {
    const response = await api.get(`${this.baseUrl}/users/${userId}/details`);
    return response.data.data;
  }

  // Transactions et monitoring
  async getTransactions(params: {
    page?: number;
    per_page?: number;
    type?: string;
    status?: string;
    user_id?: number;
    date_from?: string;
    date_to?: string;
    min_amount?: number;
    max_amount?: number;
  } = {}): Promise<{
    data: AdminTransaction[];
    pagination: any;
    summary: {
      total_amount: number;
      count_by_status: Record<string, number>;
      count_by_type: Record<string, number>;
    };
  }> {
    const response = await api.get(`${this.baseUrl}/transactions`, { params });
    return response.data;
  }

  // Alertes système
  async getSystemAlerts(params: {
    page?: number;
    type?: 'critical' | 'warning' | 'info';
    resolved?: boolean;
  } = {}): Promise<{
    data: SystemAlert[];
    pagination: any;
    summary: {
      critical_count: number;
      warning_count: number;
      unresolved_count: number;
    };
  }> {
    const response = await api.get(`${this.baseUrl}/alerts`, { params });
    return response.data;
  }

  async resolveAlert(alertId: number): Promise<void> {
    await api.patch(`${this.baseUrl}/alerts/${alertId}/resolve`);
  }

  // Gestion des packages
  async getPackages(): Promise<any[]> {
    const response = await api.get(`${this.baseUrl}/packages`);
    return response.data.data;
  }

  async updatePackage(packageId: number, data: {
    name?: string;
    min_amount?: number;
    max_amount?: number;
    daily_rate?: number;
    duration_days?: number;
    is_active?: boolean;
  }): Promise<any> {
    const response = await api.patch(`${this.baseUrl}/packages/${packageId}`, data);
    return response.data.data;
  }

  // Rapports
  async generateReport(type: 'users' | 'financial' | 'transactions', params: {
    date_from: string;
    date_to: string;
    format?: 'json' | 'csv' | 'pdf';
  }): Promise<any> {
    const response = await api.get(`${this.baseUrl}/reports/${type}`, { 
      params,
      responseType: params.format === 'pdf' ? 'blob' : 'json'
    });
    return response.data;
  }

  // Configuration système
  async getSystemConfig(): Promise<Record<string, any>> {
    const response = await api.get(`${this.baseUrl}/config`);
    return response.data.data;
  }

  async updateSystemConfig(config: Record<string, any>): Promise<void> {
    await api.patch(`${this.baseUrl}/config`, config);
  }
}

export const adminService = new AdminService();
export default adminService;