// =============================================================================
// API Response & Request Types
// =============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
  meta?: {
    current_page?: number;
    last_page?: number;
    per_page?: number;
    total?: number;
    [key: string]: any;
  };
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
    path: string;
    links: {
      first: string;
      last: string;
      prev: string | null;
      next: string | null;
    };
  };
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  errors?: Record<string, string[]>;
}

// Authentication
export interface LoginRequest {
  email: string;
  password: string;
  remember?: boolean;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  password_confirmation: string;
  referral_code?: string;
}

export interface AuthResponse {
  user: import('./user').User;
  token: string;
  expires_at: string;
}

// Investment requests
export interface CreateInvestmentRequest {
  amount: number;
  package_id?: number;
  source: 'bonus' | 'funds';
}

export interface ClaimRequest {
  investment_id: number;
}

// Withdrawal requests
export interface CreateWithdrawalRequest {
  amount: number;
  wallet_address: string;
  network?: string;
}

// Admin requests
export interface AdminUserUpdateRequest {
  username?: string;
  email?: string;
  current_level?: string;
  kyc_status?: string;
  balance_pi?: number;
}

export interface AdminRateAdjustmentRequest {
  level: string;
  new_rate: number;
  reason: string;
  effective_from?: string;
  effective_until?: string;
}

// WebSocket events
export interface WebSocketEvent<T = any> {
  type: string;
  data: T;
  timestamp: string;
  user_id?: number;
}

export interface ClaimProcessedEvent {
  claim: import('./investment').Claim;
  user: import('./user').User;
  new_balance: number;
  streak_updated: boolean;
}

export interface LevelUpEvent {
  user: import('./user').User;
  old_level: string;
  new_level: string;
  new_benefits: Record<string, any>;
}

export interface AlertEvent {
  alert: import('./financial').SystemAlert;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

// Dashboard data
export interface DashboardStats {
  user: {
    level: string;
    balance: number;
    total_invested: number;
    total_claimed: number;
    loyalty_points: number;
    current_streak: number;
  };
  investments: {
    active_count: number;
    total_value: number;
    daily_return: number;
    next_claim_available: string | null;
  };
  recent_activities: Array<{
    type: string;
    amount: number;
    description: string;
    created_at: string;
  }>;
}

export interface AdminDashboardStats {
  overview: {
    total_users: number;
    active_users: number;
    total_tvl: number;
    daily_claims: number;
    pending_withdrawals: number;
    active_alerts: number;
  };
  financial_health: {
    liquidity_ratio: number;
    revenue_ratio: number;
    alert_level: string;
  };
  charts: {
    tvl_evolution: Array<{ date: string; value: number }>;
    claims_vs_revenue: Array<{ date: string; claims: number; revenue: number }>;
    user_levels: Array<{ level: string; count: number; percentage: number }>;
  };
}