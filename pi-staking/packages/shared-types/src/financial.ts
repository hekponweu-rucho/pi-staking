// =============================================================================
// Financial Metrics & Risk Management Types  
// =============================================================================

export enum AlertLevel {
  GREEN = 'GREEN',
  ORANGE = 'ORANGE', 
  RED = 'RED',
  EMERGENCY = 'EMERGENCY',
}

export enum TransactionType {
  DEPOSIT = 'deposit',
  WITHDRAWAL = 'withdrawal',
  BONUS = 'bonus',
  REFERRAL = 'referral',
  CLAIM = 'claim',
  FEE = 'fee',
  ADJUSTMENT = 'adjustment',
}

export enum TransactionStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export interface Transaction {
  id: number;
  user_id: number;
  
  // Transaction details
  type: TransactionType;
  amount: number;
  fee_amount: number;
  net_amount: number;
  
  // Status
  status: TransactionStatus;
  
  // References
  reference: string | null;
  reference_type: string | null;
  related_id: number | null;
  
  // Metadata
  description: string | null;
  processed_at: string | null;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface WithdrawalRequest {
  id: number;
  user_id: number;
  
  // Amounts
  amount: number;
  fee_amount: number;
  net_amount: number;
  
  // Destination
  wallet_address: string;
  network: string;
  
  // Status
  status: 'pending' | 'processing' | 'approved' | 'rejected' | 'completed' | 'failed';
  
  // Processing
  processed_at: string | null;
  processed_by: number | null;
  admin_notes: string | null;
  
  // Blockchain
  tx_hash: string | null;
  confirmations: number;
  
  // Metadata
  ip_address: string | null;
  user_agent: string | null;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface FinancialMetric {
  id: number;
  metric_date: string;
  
  // User metrics
  total_users: number;
  active_users: number;
  new_users: number;
  
  // Financial metrics
  total_tvl: number;
  daily_claims: number;
  daily_deposits: number;
  daily_withdrawals: number;
  daily_revenues: number;
  
  // Reserves & liquidity
  total_reserves: number;
  available_liquidity: number;
  liquidity_ratio: number;
  
  // Ratios & KPIs
  revenue_ratio: number;
  growth_rate: number;
  churn_rate: number;
  
  // TVL by level
  discovery_tvl: number;
  bronze_tvl: number;
  silver_tvl: number;
  gold_tvl: number;
  diamond_tvl: number;
  
  // Alert level
  alert_level: AlertLevel;
  
  // Timestamps
  calculated_at: string;
  created_at: string;
}

export interface FinancialHealthStatus {
  liquidity_ratio: number;
  revenue_ratio: number;
  growth_rate: number;
  alert_level: AlertLevel;
  recommendations: string[];
}

export interface RiskMetrics {
  concentration_risk: number;
  withdrawal_pressure: number;
  fraud_score_average: number;
  anomaly_count: number;
  high_risk_users: number;
}

export interface SystemAlert {
  id: number;
  
  // Classification
  type: 'financial_risk' | 'user_behavior' | 'system_health' | 'security' | 'compliance';
  level: 'INFO' | 'WARNING' | 'CRITICAL' | 'EMERGENCY';
  
  // Content
  title: string;
  message: string;
  
  // Context
  metadata: Record<string, any> | null;
  affected_users: number;
  financial_impact: number | null;
  
  // Resolution
  status: 'active' | 'investigating' | 'resolved' | 'dismissed';
  acknowledged_at: string | null;
  acknowledged_by: number | null;
  resolved_at: string | null;
  resolved_by: number | null;
  resolution_notes: string | null;
  
  // Actions
  auto_actions_taken: Record<string, any> | null;
  requires_manual_action: boolean;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface RateAdjustment {
  id: number;
  
  // Target
  level: 'discovery' | 'bronze' | 'silver' | 'gold' | 'diamond' | 'all';
  package_id: number | null;
  
  // Rates
  old_rate: number;
  new_rate: number;
  adjustment_amount: number;
  
  // Reason
  reason: string;
  adjustment_type: 'automatic' | 'manual' | 'emergency' | 'scheduled';
  
  // Trigger
  trigger_metric: string | null;
  trigger_value: number | null;
  trigger_threshold: number | null;
  
  // Application
  applied_at: string;
  effective_from: string | null;
  effective_until: string | null;
  
  // Authorization
  created_by: number | null;
  approved_by: number | null;
  
  // Impact
  affected_investments: number;
  estimated_impact: number | null;
  
  // Timestamps
  created_at: string;
}