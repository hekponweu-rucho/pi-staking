// =============================================================================
// User Related Types
// =============================================================================

export enum UserLevel {
  DISCOVERY = 'discovery',
  BRONZE = 'bronze',
  SILVER = 'silver',
  GOLD = 'gold',
  DIAMOND = 'diamond',
}

export enum KYCStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
}

export interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  email_verified_at: string | null;
  
  // Authentication & Authorization
  role?: 'user' | 'admin';
  is_admin?: boolean;
  
  // Financial data
  balance_pi: number;
  bonus_balance?: number;
  total_invested: number;
  total_claimed: number;
  total_withdrawn: number;
  total_earned?: number;
  
  // Level system
  current_level: UserLevel;
  level_updated_at: string | null;
  
  // Referral system
  referral_code: string;
  referred_by: number | null;
  
  // KYC & Security
  kyc_status: KYCStatus;
  kyc_verified_at: string | null;
  two_factor_enabled?: boolean;
  two_factor_enabled_at?: string | null;
  two_factor_backup_codes?: string;
  phone_verified?: boolean;
  phone_verified_at?: string | null;
  security_preferences?: {
    email_notifications?: boolean;
    sms_notifications?: boolean;
    login_alerts?: boolean;
    transaction_alerts?: boolean;
    weekly_summary?: boolean;
  };
  
  // Gamification
  loyalty_points: number;
  streak_bonus: number;
  
  // Tracking
  last_activity: string | null;
  last_claim_at: string | null;
  last_login?: string | null;
  wallet_address: string | null;
  
  // Status
  status?: 'active' | 'inactive' | 'suspended' | 'banned';
  is_verified?: boolean;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface UserStreak {
  id: number;
  user_id: number;
  current_streak: number;
  longest_streak: number;
  last_claim_date: string | null;
  streak_started_at: string | null;
  streak_bonus: number;
  bonus_tier: 'none' | 'bronze' | 'silver' | 'gold' | 'diamond';
  updated_at: string;
  created_at: string;
}

export interface LoyaltyPoint {
  id: number;
  user_id: number;
  points: number;
  source: 'claim' | 'referral' | 'bonus' | 'streak' | 'level_up' | 'special_event';
  reference_id: number | null;
  reference_type: string | null;
  earned_at: string;
  expires_at: string | null;
}

export interface UserLevelInfo {
  current: UserLevel;
  next: UserLevel | null;
  progress: number;
  remaining_amount: number;
  benefits: {
    daily_rate: number;
    deposit_fee: number;
    withdrawal_fee: number;
    max_investments: number;
  };
}

export interface UserStats {
  total_investments: number;
  active_investments: number;
  total_claims: number;
  average_daily_claim: number;
  current_streak: number;
  longest_streak: number;
  referral_count: number;
  referral_earnings: number;
}

export interface SecurityLog {
  id: number;
  user_id: number;
  action_description: string;
  ip_address: string;
  device_type?: string;
  location?: string;
  risk_score?: number;
  severity_level?: 'low' | 'medium' | 'high' | 'critical';
  status?: 'success' | 'failed' | 'blocked';
  metadata?: Record<string, any>;
  created_at: string;
}