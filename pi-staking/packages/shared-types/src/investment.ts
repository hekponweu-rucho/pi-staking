// =============================================================================
// Investment & Staking Related Types
// =============================================================================

import { UserLevel } from './user';

export enum InvestmentStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed', 
  CANCELLED = 'cancelled',
  PAUSED = 'paused',
}

export enum InvestmentSource {
  BONUS = 'bonus',
  FUNDS = 'funds',
  COMPOUND = 'compound',
}

export interface StakingPackage {
  id: number;
  name: string;
  description: string | null;
  
  // Configuration
  level: UserLevel;
  daily_rate: number;
  
  // Limits
  min_amount: number;
  max_amount: number | null;
  max_duration_days: number;
  
  // Settings
  is_active: boolean;
  requires_kyc: boolean;
  
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface Investment {
  id: number;
  user_id: number;
  staking_package_id: number | null;
  
  // Amounts
  amount: number;
  claimed_amount: number;
  
  // Rates
  user_level: UserLevel;
  base_rate: number;
  bonus_rate: number;
  
  // Duration
  start_at: string;
  end_at: string | null;
  
  // Status
  status: InvestmentStatus;
  source: InvestmentSource;
  
  // Claims tracking
  last_claim_at: string | null;
  next_claim_at: string | null;
  total_claims: number;
  
  // Relations
  user?: any; // Avoid circular dependency
  package?: StakingPackage;
  claims?: Claim[];
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface Claim {
  id: number;
  investment_id: number;
  user_id: number;
  
  // Claim details
  claimed_for_day: string;
  final_amount: number;
  
  // Breakdown
  base_amount: number;
  bonus_amount: number;
  streak_bonus: number;
  
  // Rates used
  base_rate: number;
  bonus_rate: number;
  streak_rate: number;
  
  // Status & metadata
  status: 'processed' | 'failed' | 'cancelled';
  claimed_at: string;
  processed_at: string | null;
  ip_address: string | null;
  user_agent: string | null;
  
  // Relations
  investment?: Investment;
  user?: any; // Avoid circular dependency
  
  // Timestamps
  created_at: string;
}

export interface BonusGrant {
  id: number;
  user_id: number;
  
  // Amounts
  initial_amount: number;
  remaining_amount: number;
  used_amount: number;
  
  // Configuration
  grant_type: string;
  expires_at: string;
  
  // Restrictions
  usable_for: 'staking' | 'any' | 'withdrawal';
  min_investment: number;
  
  // Status
  is_active: boolean;
  used_at: string | null;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface ClaimCalculation {
  total_amount: number;
  base_amount: number;
  streak_amount: number;
  event_amount: number;
  loyalty_amount: number;
  rates_used: {
    base_rate: number;
    streak_rate: number;
    event_rate: number;
    loyalty_rate: number;
  };
}

export interface InvestmentSummary {
  total_invested: number;
  active_investments: number;
  total_claimed: number;
  daily_claims_available: number;
  next_claim_time: string | null;
  estimated_daily_return: number;
  estimated_monthly_return: number;
  apy: number;
}