// =============================================================================
// Monitoring & Observability Types
// =============================================================================

export interface MetricPoint {
  timestamp: number;
  value: number;
  labels?: Record<string, string>;
}

export interface TimeSeries {
  name: string;
  points: MetricPoint[];
  unit?: string;
  description?: string;
}

export interface PrometheusMetric {
  name: string;
  help: string;
  type: 'counter' | 'gauge' | 'histogram' | 'summary';
  samples: Array<{
    labels: Record<string, string>;
    value: number;
    timestamp?: number;
  }>;
}

export interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: number;
  details?: {
    latency?: number;
    error?: string;
    dependencies?: Record<string, 'healthy' | 'unhealthy'>;
    [key: string]: any;
  };
}

export interface SystemHealth {
  overall_status: 'healthy' | 'degraded' | 'unhealthy';
  services: HealthCheckResult[];
  timestamp: number;
}

export interface AlertRule {
  name: string;
  description: string;
  query: string;
  threshold: number;
  comparison: 'gt' | 'lt' | 'eq' | 'ne' | 'gte' | 'lte';
  duration: string; // e.g., '5m', '1h'
  severity: 'info' | 'warning' | 'critical';
  labels: Record<string, string>;
  annotations: Record<string, string>;
}

export interface AlertInstance {
  id: string;
  rule_name: string;
  labels: Record<string, string>;
  annotations: Record<string, string>;
  state: 'pending' | 'firing' | 'resolved';
  active_at: string;
  fired_at?: string;
  resolved_at?: string;
  value: number;
}

export interface NotificationChannel {
  id: string;
  name: string;
  type: 'email' | 'slack' | 'webhook' | 'sms' | 'discord';
  settings: {
    webhook_url?: string;
    email_addresses?: string[];
    channel?: string;
    phone_numbers?: string[];
    [key: string]: any;
  };
  enabled: boolean;
}

export interface LogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  message: string;
  service: string;
  trace_id?: string;
  span_id?: string;
  user_id?: number;
  context?: Record<string, any>;
  exception?: {
    type: string;
    message: string;
    stack: string;
  };
}

export interface PerformanceMetrics {
  response_time: {
    p50: number;
    p95: number;
    p99: number;
    avg: number;
  };
  throughput: {
    requests_per_second: number;
    claims_per_second: number;
  };
  error_rate: number;
  availability: number;
  database: {
    query_time: number;
    active_connections: number;
    slow_queries: number;
  };
  cache: {
    hit_rate: number;
    memory_usage: number;
  };
}

export interface AuditLog {
  id: number;
  actor_id: number | null;
  actor_type: 'user' | 'admin' | 'system' | 'api';
  action: string;
  resource: string;
  resource_id: number | null;
  old_values: Record<string, any> | null;
  new_values: Record<string, any> | null;
  changes: Record<string, any> | null;
  event_type: 'create' | 'update' | 'delete' | 'login' | 'claim';
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  ip_address: string | null;
  user_agent: string | null;
  endpoint: string | null;
  request_id: string | null;
  is_suspicious: boolean;
  anomaly_score: number | null;
  fraud_indicators: Record<string, any> | null;
  created_at: string;
}