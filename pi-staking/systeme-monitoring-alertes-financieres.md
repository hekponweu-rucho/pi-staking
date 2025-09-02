# Système de Monitoring et Alertes Financières

## 🎯 Vue d'ensemble

Système complet de surveillance financière temps réel pour la plateforme Progressive Rewards, conçu pour détecter les risques proactivement et déclencher des actions automatiques de protection.

## 🏗️ Architecture du Monitoring

```
┌─────────────────────────────────────────────────────────────────┐
│                    Système de Monitoring                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐    ┌─────────────────────────────────────┐ │
│  │  Data Sources   │    │          Collectors                 │ │
│  │                 │    │                                     │ │
│  │ • PostgreSQL    │◄──►│ • Laravel Metrics Collector        │ │
│  │ • Redis Cache   │    │ • Node.js Real-time Processor      │ │
│  │ • Application   │    │ • Database Query Metrics           │ │
│  │ • System Logs   │    │ • External API Monitors            │ │
│  │ • API Metrics   │    │ • Custom Business Logic Checks     │ │
│  └─────────────────┘    └─────────────────────────────────────┘ │
│            │                         │                          │
│  ┌─────────────────┐    ┌─────────────────────────────────────┐ │
│  │ Metric Storage  │    │      Processing Engine             │ │
│  │                 │    │                                     │ │
│  │ • Prometheus    │◄──►│ • Real-time Analysis                │ │
│  │ • InfluxDB      │    │ • Trend Detection                   │ │
│  │ • Redis TSeries │    │ • Anomaly Detection                │ │
│  │ • PostgreSQL    │    │ • Threshold Monitoring              │ │
│  └─────────────────┘    │ • Predictive Analytics             │ │
│                         └─────────────────────────────────────┘ │
│                                     │                          │
│  ┌─────────────────┐    ┌─────────────────────────────────────┐ │
│  │ Alert Manager   │    │         Dashboards                  │ │
│  │                 │    │                                     │ │
│  │ • Multi-level   │◄──►│ • Grafana Real-time                │ │
│  │ • Multi-channel │    │ • Admin Console                    │ │
│  │ • Auto-actions  │    │ • Mobile Dashboards                │ │
│  │ • Escalation    │    │ • Public Status Page               │ │
│  └─────────────────┘    └─────────────────────────────────────┘ │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                    Notification Channels                        │
│                                                                 │
│ 📧 Email  📱 SMS  💬 Slack  📞 PagerDuty  🔔 Push  📊 Dashboard │
└─────────────────────────────────────────────────────────────────┘
```

## 📊 Métriques Financières Critiques

### 1. Métriques de Liquidité

```yaml
Liquidity_Ratio:
  description: Nombre de jours de claims couverts par les réserves
  formula: total_reserves / daily_average_claims
  thresholds:
    critical: < 10 jours
    warning: < 20 jours
    healthy: > 30 jours
  monitoring_frequency: 5 minutes
  
Available_Cash_Ratio:
  description: Liquidité immédiatement disponible
  formula: available_cash / pending_withdrawals
  thresholds:
    critical: < 1.0
    warning: < 2.0
    healthy: > 5.0
  monitoring_frequency: 1 minute
  
Reserve_Depletion_Rate:
  description: Vitesse de diminution des réserves
  formula: (reserves_today - reserves_7d_ago) / 7
  thresholds:
    critical: < -50000 Pi/jour
    warning: < -20000 Pi/jour
    healthy: > -5000 Pi/jour
  monitoring_frequency: 1 hour
```

### 2. Métriques de Performance

```yaml
Revenue_to_Claims_Ratio:
  description: Rentabilité opérationnelle quotidienne
  formula: daily_revenues / daily_claims
  thresholds:
    critical: < 1.0
    warning: < 1.1
    healthy: > 1.2
  monitoring_frequency: 1 hour
  
Claim_Processing_Rate:
  description: Volume de claims traités
  formula: claims_processed / time_period
  thresholds:
    critical: < 50% normal_rate
    warning: < 80% normal_rate
    healthy: >= normal_rate
  monitoring_frequency: 5 minutes
  
User_Growth_Rate:
  description: Croissance utilisateurs actifs
  formula: (active_users_today - active_users_7d_ago) / active_users_7d_ago
  thresholds:
    critical: < -10% (churn massif)
    warning: < 0%
    healthy: > 5%
  monitoring_frequency: 24 hours
```

### 3. Métriques de Risque

```yaml
Concentration_Risk:
  description: Concentration sur gros utilisateurs
  formula: sum(top_10_users_tvl) / total_tvl
  thresholds:
    critical: > 50%
    warning: > 30%
    healthy: < 20%
  monitoring_frequency: 1 hour
  
Withdrawal_Pressure:
  description: Pression de retrait
  formula: pending_withdrawals / total_user_balance
  thresholds:
    critical: > 30%
    warning: > 15%
    healthy: < 10%
  monitoring_frequency: 15 minutes
  
Fraud_Score_Average:
  description: Score moyen de détection de fraude
  formula: avg(user_fraud_scores)
  thresholds:
    critical: > 0.8
    warning: > 0.6
    healthy: < 0.4
  monitoring_frequency: 1 hour
```

## 🚨 Système d'Alertes Multi-Niveaux

### 1. Configuration des Niveaux

```php
// config/monitoring.php
return [
    'alert_levels' => [
        'INFO' => [
            'color' => 'blue',
            'priority' => 1,
            'auto_resolve' => true,
            'notifications' => ['dashboard'],
            'retention_days' => 7
        ],
        'WARNING' => [
            'color' => 'orange', 
            'priority' => 2,
            'auto_resolve' => false,
            'notifications' => ['dashboard', 'email_admin'],
            'retention_days' => 30
        ],
        'CRITICAL' => [
            'color' => 'red',
            'priority' => 3,
            'auto_resolve' => false,
            'notifications' => ['dashboard', 'email_all', 'sms_emergency', 'slack'],
            'retention_days' => 365,
            'auto_actions' => ['reduce_rates', 'limit_operations']
        ],
        'EMERGENCY' => [
            'color' => 'purple',
            'priority' => 4,
            'auto_resolve' => false,
            'notifications' => ['all_channels'],
            'retention_days' => 999,
            'auto_actions' => ['emergency_shutdown', 'notify_executives']
        ]
    ],
    
    'metrics' => [
        'liquidity_ratio' => [
            'critical_threshold' => 10,
            'warning_threshold' => 20,
            'check_interval' => 300, // 5 minutes
            'auto_actions' => [
                'critical' => ['reduce_all_rates_0.2', 'stop_new_investments'],
                'warning' => ['reduce_high_rates_0.1', 'alert_admin']
            ]
        ],
        
        'revenue_ratio' => [
            'critical_threshold' => 1.0,
            'warning_threshold' => 1.1,
            'check_interval' => 3600, // 1 hour
            'auto_actions' => [
                'critical' => ['emergency_rate_adjustment', 'financial_review'],
                'warning' => ['optimize_rates', 'revenue_analysis']
            ]
        ]
    ]
];
```

### 2. Gestionnaire d'Alertes

```php
class AlertManager
{
    private MetricsCollector $metricsCollector;
    private NotificationService $notificationService;
    private ActionProcessor $actionProcessor;
    
    public function processAlert(string $metricName, float $value, array $context = []): ?SystemAlert
    {
        $config = config("monitoring.metrics.{$metricName}");
        if (!$config) return null;
        
        $level = $this->determineAlertLevel($value, $config);
        if (!$level) return null;
        
        // Vérifier si alerte similaire récente existe
        if ($this->isDuplicateAlert($metricName, $level)) {
            return null;
        }
        
        // Créer l'alerte
        $alert = $this->createAlert($metricName, $value, $level, $context);
        
        // Déclencher notifications
        $this->sendNotifications($alert);
        
        // Exécuter actions automatiques
        $this->executeAutoActions($alert);
        
        return $alert;
    }
    
    private function determineAlertLevel(float $value, array $config): ?string
    {
        if ($value <= $config['critical_threshold']) {
            return 'CRITICAL';
        }
        
        if ($value <= $config['warning_threshold']) {
            return 'WARNING';
        }
        
        return null; // Pas d'alerte nécessaire
    }
    
    private function createAlert(string $metricName, float $value, string $level, array $context): SystemAlert
    {
        return SystemAlert::create([
            'type' => 'financial_risk',
            'level' => $level,
            'title' => $this->generateAlertTitle($metricName, $value, $level),
            'message' => $this->generateAlertMessage($metricName, $value, $context),
            'metadata' => json_encode([
                'metric_name' => $metricName,
                'metric_value' => $value,
                'context' => $context,
                'thresholds' => config("monitoring.metrics.{$metricName}"),
                'timestamp' => now()->toISOString()
            ]),
            'requires_manual_action' => in_array($level, ['CRITICAL', 'EMERGENCY']),
            'status' => 'active'
        ]);
    }
    
    private function sendNotifications(SystemAlert $alert): void
    {
        $channels = config("monitoring.alert_levels.{$alert->level}.notifications", []);
        
        foreach ($channels as $channel) {
            try {
                $this->notificationService->send($channel, $alert);
            } catch (Exception $e) {
                Log::error("Failed to send alert notification", [
                    'channel' => $channel,
                    'alert_id' => $alert->id,
                    'error' => $e->getMessage()
                ]);
            }
        }
    }
    
    private function executeAutoActions(SystemAlert $alert): void
    {
        $metricName = json_decode($alert->metadata, true)['metric_name'];
        $actions = config("monitoring.metrics.{$metricName}.auto_actions.{$alert->level}", []);
        
        $executedActions = [];
        
        foreach ($actions as $action) {
            try {
                $result = $this->actionProcessor->execute($action, $alert);
                $executedActions[] = [
                    'action' => $action,
                    'result' => $result,
                    'executed_at' => now()->toISOString()
                ];
            } catch (Exception $e) {
                Log::error("Failed to execute auto action", [
                    'action' => $action,
                    'alert_id' => $alert->id,
                    'error' => $e->getMessage()
                ]);
            }
        }
        
        if (!empty($executedActions)) {
            $alert->update([
                'auto_actions_taken' => json_encode($executedActions)
            ]);
        }
    }
}
```

## 📈 Collecteur de Métriques

### 1. Collecteur Principal

```php
class FinancialMetricsCollector
{
    public function collectAllMetrics(): array
    {
        return [
            'liquidity' => $this->collectLiquidityMetrics(),
            'performance' => $this->collectPerformanceMetrics(),
            'risk' => $this->collectRiskMetrics(),
            'user_activity' => $this->collectUserMetrics(),
            'system_health' => $this->collectSystemMetrics()
        ];
    }
    
    private function collectLiquidityMetrics(): array
    {
        $totalReserves = $this->calculateTotalReserves();
        $dailyClaims = $this->getDailyClaimsAverage();
        $availableCash = $this->getAvailableCash();
        $pendingWithdrawals = $this->getPendingWithdrawals();
        
        return [
            'liquidity_ratio' => $dailyClaims > 0 ? $totalReserves / $dailyClaims : 999,
            'available_cash_ratio' => $pendingWithdrawals > 0 ? $availableCash / $pendingWithdrawals : 999,
            'reserve_depletion_rate' => $this->calculateReserveDepletionRate(),
            'total_reserves' => $totalReserves,
            'available_cash' => $availableCash,
            'pending_withdrawals' => $pendingWithdrawals,
            'calculated_at' => now()
        ];
    }
    
    private function collectPerformanceMetrics(): array
    {
        return [
            'revenue_ratio' => $this->calculateRevenueRatio(),
            'claim_processing_rate' => $this->getClaimProcessingRate(),
            'daily_revenues' => $this->getDailyRevenues(),
            'daily_claims' => $this->getDailyClaims(),
            'avg_processing_time' => $this->getAverageProcessingTime(),
            'success_rate' => $this->getOperationSuccessRate(),
            'calculated_at' => now()
        ];
    }
    
    private function collectRiskMetrics(): array
    {
        return [
            'concentration_risk' => $this->calculateConcentrationRisk(),
            'withdrawal_pressure' => $this->calculateWithdrawalPressure(),
            'fraud_score_average' => $this->getAverageFraudScore(),
            'anomaly_count' => $this->getActiveAnomalyCount(),
            'high_risk_users' => $this->getHighRiskUserCount(),
            'calculated_at' => now()
        ];
    }
    
    public function pushToPrometheus(array $metrics): void
    {
        $gateway = new PushGateway('prometheus-pushgateway:9091');
        $registry = new CollectorRegistry(new RedisAdapter());
        
        foreach ($metrics as $category => $categoryMetrics) {
            foreach ($categoryMetrics as $name => $value) {
                if (is_numeric($value)) {
                    $gauge = $registry->getOrRegisterGauge(
                        'pinetwork_platform',
                        "financial_{$category}_{$name}",
                        "Financial metric: {$category} {$name}"
                    );
                    $gauge->set($value);
                }
            }
        }
        
        $gateway->push($registry, 'financial_metrics');
    }
}
```

### 2. Monitoring Service Node.js

```javascript
// src/services/MonitoringService.js
class MonitoringService {
    constructor() {
        this.redis = new Redis(process.env.REDIS_URL);
        this.prometheus = require('prom-client');
        this.metrics = this.initializeMetrics();
        this.collectors = new Map();
    }
    
    initializeMetrics() {
        return {
            liquidityRatio: new this.prometheus.Gauge({
                name: 'liquidity_ratio',
                help: 'Days of claims covered by reserves'
            }),
            
            revenueRatio: new this.prometheus.Gauge({
                name: 'revenue_ratio', 
                help: 'Daily revenue to claims ratio'
            }),
            
            activeUsers: new this.prometheus.Gauge({
                name: 'active_users_total',
                help: 'Number of active users'
            }),
            
            claimsPerSecond: new this.prometheus.Counter({
                name: 'claims_processed_total',
                help: 'Total number of claims processed'
            }),
            
            alertsActive: new this.prometheus.Gauge({
                name: 'alerts_active',
                help: 'Number of active alerts',
                labelNames: ['level']
            })
        };
    }
    
    async startRealTimeMonitoring() {
        // Surveillance des métriques critiques toutes les 30 secondes
        setInterval(async () => {
            await this.collectAndAnalyze();
        }, 30000);
        
        // Métriques détaillées toutes les 5 minutes
        setInterval(async () => {
            await this.collectDetailedMetrics();
        }, 300000);
        
        // Nettoyage et archivage toutes les heures
        setInterval(async () => {
            await this.cleanupOldMetrics();
        }, 3600000);
    }
    
    async collectAndAnalyze() {
        try {
            const metrics = await this.fetchMetricsFromLaravel();
            
            // Mettre à jour les métriques Prometheus
            this.updatePrometheusMetrics(metrics);
            
            // Analyser pour détecter les anomalies
            const anomalies = await this.detectAnomalies(metrics);
            
            if (anomalies.length > 0) {
                await this.handleAnomalies(anomalies);
            }
            
            // Publier vers Redis pour les dashboards temps réel
            await this.redis.publish('metrics:realtime', JSON.stringify({
                timestamp: Date.now(),
                metrics,
                anomalies
            }));
            
        } catch (error) {
            console.error('Error in real-time monitoring:', error);
            await this.handleMonitoringError(error);
        }
    }
    
    async detectAnomalies(metrics) {
        const anomalies = [];
        const thresholds = await this.getThresholds();
        
        // Vérifier chaque métrique critique
        for (const [key, value] of Object.entries(metrics)) {
            if (thresholds[key]) {
                const anomaly = this.checkThreshold(key, value, thresholds[key]);
                if (anomaly) {
                    anomalies.push(anomaly);
                }
            }
        }
        
        // Détecter les patterns anormaux
        const patternAnomalies = await this.detectPatternAnomalies(metrics);
        anomalies.push(...patternAnomalies);
        
        return anomalies;
    }
    
    async handleAnomalies(anomalies) {
        for (const anomaly of anomalies) {
            // Envoyer alerte à Laravel
            await this.sendAlertToLaravel(anomaly);
            
            // Notification temps réel aux admins
            await this.sendRealtimeAlert(anomaly);
            
            // Log pour audit
            console.warn('Anomaly detected:', anomaly);
        }
    }
    
    async detectPatternAnomalies(currentMetrics) {
        const anomalies = [];
        const historicalData = await this.getHistoricalMetrics(24); // 24h
        
        // Détecter les changements soudains
        for (const [key, value] of Object.entries(currentMetrics)) {
            if (typeof value === 'number' && historicalData[key]) {
                const historical = historicalData[key];
                const change = Math.abs(value - historical.average) / historical.stdDev;
                
                if (change > 3) { // Plus de 3 écarts-types
                    anomalies.push({
                        type: 'sudden_change',
                        metric: key,
                        current_value: value,
                        expected_range: [
                            historical.average - 2 * historical.stdDev,
                            historical.average + 2 * historical.stdDev
                        ],
                        severity: change > 5 ? 'critical' : 'warning'
                    });
                }
            }
        }
        
        return anomalies;
    }
}
```

## 📊 Configuration Grafana

### 1. Dashboard Principal

```json
{
  "dashboard": {
    "title": "Pi Network Platform - Financial Health",
    "tags": ["pi-network", "financial", "monitoring"],
    "refresh": "30s",
    "panels": [
      {
        "title": "Liquidity Status",
        "type": "stat",
        "targets": [
          {
            "expr": "liquidity_ratio",
            "legendFormat": "Days of Coverage"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "thresholds": {
              "steps": [
                { "color": "red", "value": 0 },
                { "color": "orange", "value": 20 },
                { "color": "green", "value": 30 }
              ]
            }
          }
        }
      },
      {
        "title": "Revenue vs Claims",
        "type": "timeseries",
        "targets": [
          {
            "expr": "daily_revenues",
            "legendFormat": "Daily Revenues"
          },
          {
            "expr": "daily_claims", 
            "legendFormat": "Daily Claims"
          }
        ]
      },
      {
        "title": "User Activity",
        "type": "timeseries",
        "targets": [
          {
            "expr": "active_users_total",
            "legendFormat": "Active Users"
          },
          {
            "expr": "rate(claims_processed_total[5m])",
            "legendFormat": "Claims/sec"
          }
        ]
      },
      {
        "title": "Alert Status",
        "type": "table",
        "targets": [
          {
            "expr": "alerts_active",
            "format": "table"
          }
        ]
      }
    ]
  }
}
```

### 2. Alertes Grafana

```json
{
  "alerts": [
    {
      "title": "Critical Liquidity Alert",
      "condition": "liquidity_ratio < 10",
      "frequency": "30s",
      "notifications": [
        {
          "type": "slack",
          "settings": {
            "webhook": "https://hooks.slack.com/services/...",
            "channel": "#financial-alerts",
            "message": "🚨 CRITICAL: Liquidity ratio dropped to {{ $value }} days!"
          }
        },
        {
          "type": "email",
          "settings": {
            "addresses": ["admin@pinetwork.com", "finance@pinetwork.com"]
          }
        }
      ]
    },
    {
      "title": "Revenue Deficit Alert", 
      "condition": "revenue_ratio < 1.0",
      "frequency": "1m",
      "notifications": [
        {
          "type": "slack",
          "settings": {
            "channel": "#financial-alerts",
            "message": "⚠️ Revenue deficit detected: {{ $value }} ratio"
          }
        }
      ]
    }
  ]
}
```

## 📱 Dashboard Temps Réel

### 1. Composant React Dashboard

```tsx
// src/components/admin/FinancialHealthDashboard.tsx
import { useQuery } from '@tanstack/react-query';
import { useWebSocket } from '../hooks/useWebSocket';

interface FinancialMetrics {
    liquidityRatio: number;
    revenueRatio: number;
    totalTVL: number;
    dailyClaims: number;
    activeAlerts: SystemAlert[];
    alertLevel: 'GREEN' | 'ORANGE' | 'RED';
}

export function FinancialHealthDashboard() {
    // Données initiales via API
    const { data: initialMetrics } = useQuery({
        queryKey: ['financial-metrics'],
        queryFn: fetchFinancialMetrics,
        refetchInterval: 30000
    });
    
    // Mises à jour temps réel via WebSocket
    const { data: realtimeMetrics } = useWebSocket<FinancialMetrics>({
        channel: 'admin:financial-metrics',
        onMessage: (metrics) => {
            // Mettre à jour les graphiques en temps réel
            updateCharts(metrics);
            
            // Notifications locales pour alertes critiques
            if (metrics.alertLevel === 'RED') {
                showCriticalAlert(metrics);
            }
        }
    });
    
    const metrics = realtimeMetrics || initialMetrics;
    
    if (!metrics) return <LoadingSkeleton />;
    
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {/* Status Global */}
            <div className="col-span-full">
                <HealthStatusCard 
                    level={metrics.alertLevel}
                    liquidityRatio={metrics.liquidityRatio}
                    revenueRatio={metrics.revenueRatio}
                />
            </div>
            
            {/* Métriques Principales */}
            <MetricCard
                title="Ratio de Liquidité"
                value={metrics.liquidityRatio}
                unit="jours"
                trend={calculateTrend(metrics.liquidityRatio)}
                thresholds={{ critical: 10, warning: 20, healthy: 30 }}
                format={(val) => `${val.toFixed(1)} jours`}
            />
            
            <MetricCard
                title="Ratio Revenus/Claims"
                value={metrics.revenueRatio}
                unit=""
                trend={calculateTrend(metrics.revenueRatio)}
                thresholds={{ critical: 1.0, warning: 1.1, healthy: 1.2 }}
                format={(val) => `${(val * 100).toFixed(1)}%`}
            />
            
            <MetricCard
                title="TVL Total"
                value={metrics.totalTVL}
                unit="Pi"
                trend={calculateTrend(metrics.totalTVL)}
                format={(val) => formatNumber(val)}
            />
            
            {/* Alertes Actives */}
            <div className="col-span-full">
                <ActiveAlertsPanel alerts={metrics.activeAlerts} />
            </div>
            
            {/* Graphiques Temps Réel */}
            <div className="col-span-full grid grid-cols-1 lg:grid-cols-2 gap-6">
                <RealtimeChart
                    title="Claims vs Revenus (24h)"
                    series={[
                        { name: 'Claims', data: metrics.claimsHistory },
                        { name: 'Revenus', data: metrics.revenuesHistory }
                    ]}
                />
                
                <RealtimeChart
                    title="Évolution Liquidité (7j)"
                    series={[
                        { name: 'Ratio Liquidité', data: metrics.liquidityHistory }
                    ]}
                />
            </div>
        </div>
    );
}

function HealthStatusCard({ level, liquidityRatio, revenueRatio }) {
    const statusConfig = {
        GREEN: {
            color: 'bg-green-500',
            text: 'Système Sain',
            icon: '✅',
            description: 'Toutes les métriques sont dans les seuils normaux'
        },
        ORANGE: {
            color: 'bg-orange-500', 
            text: 'Attention Requise',
            icon: '⚠️',
            description: 'Une ou plusieurs métriques approchent les seuils critiques'
        },
        RED: {
            color: 'bg-red-500',
            text: 'État Critique',
            icon: '🚨',
            description: 'Action immédiate requise - métriques en zone dangereuse'
        }
    };
    
    const config = statusConfig[level];
    
    return (
        <div className={`${config.color} text-white p-6 rounded-lg`}>
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{config.icon}</span>
                        <h2 className="text-xl font-bold">{config.text}</h2>
                    </div>
                    <p className="text-sm opacity-90">{config.description}</p>
                </div>
                
                <div className="text-right">
                    <div className="text-sm opacity-75">Liquidité</div>
                    <div className="text-lg font-bold">{liquidityRatio.toFixed(1)}j</div>
                    
                    <div className="text-sm opacity-75 mt-2">Revenus</div>
                    <div className="text-lg font-bold">{(revenueRatio * 100).toFixed(1)}%</div>
                </div>
            </div>
        </div>
    );
}
```

## 🔔 Système de Notifications

### 1. Service de Notifications

```php
class NotificationService
{
    public function send(string $channel, SystemAlert $alert): void
    {
        match ($channel) {
            'dashboard' => $this->sendDashboardNotification($alert),
            'email_admin' => $this->sendEmailToAdmins($alert),
            'email_all' => $this->sendEmailToAllStaff($alert),
            'sms_emergency' => $this->sendEmergencySMS($alert),
            'slack' => $this->sendSlackNotification($alert),
            'push' => $this->sendPushNotification($alert),
            'webhook' => $this->sendWebhookNotification($alert),
            default => Log::warning("Unknown notification channel: {$channel}")
        };
    }
    
    private function sendSlackNotification(SystemAlert $alert): void
    {
        $webhook = config('services.slack.financial_webhook');
        if (!$webhook) return;
        
        $color = match ($alert->level) {
            'CRITICAL' => 'danger',
            'WARNING' => 'warning',
            'INFO' => 'good',
            default => '#36a64f'
        };
        
        $payload = [
            'channel' => '#financial-alerts',
            'username' => 'Pi Platform Monitor',
            'icon_emoji' => ':warning:',
            'attachments' => [[
                'color' => $color,
                'title' => $alert->title,
                'text' => $alert->message,
                'fields' => [
                    [
                        'title' => 'Niveau',
                        'value' => $alert->level,
                        'short' => true
                    ],
                    [
                        'title' => 'Type',
                        'value' => $alert->type,
                        'short' => true
                    ],
                    [
                        'title' => 'Timestamp',
                        'value' => $alert->created_at->format('Y-m-d H:i:s'),
                        'short' => true
                    ]
                ],
                'actions' => [
                    [
                        'type' => 'button',
                        'text' => 'View Dashboard',
                        'url' => route('admin.dashboard.financial'),
                        'style' => 'primary'
                    ],
                    [
                        'type' => 'button', 
                        'text' => 'Acknowledge',
                        'url' => route('admin.alerts.acknowledge', $alert),
                        'style' => 'default'
                    ]
                ]
            ]]
        ];
        
        Http::post($webhook, $payload);
    }
    
    private function sendEmergencySMS(SystemAlert $alert): void
    {
        $emergencyNumbers = config('monitoring.emergency_numbers', []);
        
        foreach ($emergencyNumbers as $number) {
            try {
                SMS::to($number)->send(
                    "🚨 URGENT - Pi Platform: {$alert->title}. Check dashboard immediately. Alert ID: {$alert->id}"
                );
            } catch (Exception $e) {
                Log::error("Failed to send emergency SMS", [
                    'number' => $number,
                    'alert_id' => $alert->id,
                    'error' => $e->getMessage()
                ]);
            }
        }
    }
}
```

### 2. Templates Email

```php
// resources/views/emails/alerts/financial-alert.blade.php
@component('mail::message')
# {{ $alert->title }}

**Niveau:** {{ $alert->level }}  
**Type:** {{ $alert->type }}  
**Détecté le:** {{ $alert->created_at->format('d/m/Y à H:i:s') }}

## Description
{{ $alert->message }}

## Métriques
@if($metrics = json_decode($alert->metadata, true))
@foreach($metrics['context'] ?? [] as $key => $value)
- **{{ ucfirst(str_replace('_', ' ', $key)) }}:** {{ $value }}
@endforeach
@endif

## Actions Recommandées
@if($alert->level === 'CRITICAL')
1. Vérifier immédiatement le dashboard de monitoring
2. Évaluer la nécessité d'ajustements de taux
3. Contacter l'équipe technique si nécessaire
4. Surveiller l'évolution des métriques

@elseif($alert->level === 'WARNING')
1. Surveiller l'évolution des métriques
2. Préparer des ajustements préventifs si nécessaire
3. Vérifier les logs système récents

@endif

@component('mail::button', ['url' => route('admin.dashboard.financial')])
Voir le Dashboard
@endcomponent

@component('mail::button', ['url' => route('admin.alerts.acknowledge', $alert)])
Accuser Réception
@endcomponent

Cette alerte sera automatiquement résolue si les métriques reviennent à la normale.

Cordialement,  
Système de Monitoring Pi Platform
@endcomponent
```

## 📋 Plan de Réponse aux Incidents

### 1. Procédures d'Escalade

```yaml
Niveau_INFO:
  response_time: 2 heures
  assignee: "Équipe technique"
  escalation: "Aucune"
  actions:
    - Surveillance continue
    - Documentation dans logs

Niveau_WARNING:
  response_time: 30 minutes
  assignee: "Admin de service + Lead technique"
  escalation: "Si non résolu en 2h → CRITICAL"
  actions:
    - Analyse des causes
    - Préparation ajustements préventifs
    - Communication interne

Niveau_CRITICAL:
  response_time: 5 minutes
  assignee: "Toute l'équipe technique + Management"
  escalation: "Si non résolu en 1h → EMERGENCY"
  actions:
    - War room immédiate
    - Ajustements automatiques activés
    - Communication clients préparée
    - Évaluation arrêt services

Niveau_EMERGENCY:
  response_time: Immédiat
  assignee: "CEO + CTO + Toute l'équipe"
  escalation: "Communication publique"
  actions:
    - Arrêt préventif des services
    - Communication publique
    - Plan de continuité activé
    - Investigation complète
```

### 2. Runbook d'Urgence

```markdown
# Runbook - Crise de Liquidité

## Symptômes
- Liquidity_ratio < 10 jours
- Withdrawal_pressure > 30%
- Reserve_depletion_rate > -50,000 Pi/jour

## Actions Immédiates (0-5 minutes)

### 1. Vérification
```bash
# Vérifier métriques actuelles
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  https://api.pinetwork.local/admin/financial/health

# Vérifier liquidités réelles
psql -c "SELECT SUM(balance_pi) FROM users;"
```

### 2. Protection Automatique
- ✅ Réduction automatique des taux (-0.3%)
- ✅ Blocage nouveaux investissements
- ✅ Limitation retraits (délai +48h)

### 3. Communication
- ✅ Alerte équipe dirigeante
- ✅ Notification Slack #financial-crisis
- ✅ SMS équipe d'urgence

## Actions Court Terme (5-30 minutes)

### 1. Analyse Causes
- Vérifier logs dernières 24h
- Identifier utilisateurs gros retraits
- Vérifier anomalies système

### 2. Ajustements Supplémentaires
- Réduire tous les taux de 0.5% supplémentaires
- Activer délais retraits étendus
- Suspendre bonus referral

### 3. Communication Interne
- War room avec équipe complète
- Briefing toutes les 15 minutes
- Documentation décisions

## Actions Moyen Terme (30 minutes - 2h)

### 1. Stabilisation
- Surveiller évolution métriques
- Ajuster taux selon réponse
- Préparer communication clients

### 2. Plan de Sortie
- Définir conditions retour normal
- Préparer ajustements progressifs
- Validation juridique/conformité

## Post-Incident
- Rapport complet incident
- Amélioration procédures
- Tests stress supplémentaires
```

## 🎯 Conclusion

Le système de monitoring complet comprend :

✅ **Surveillance temps réel** des métriques financières critiques  
✅ **Alertes multi-niveaux** avec escalade automatique  
✅ **Actions automatiques** de protection du système  
✅ **Dashboards interactifs** pour visualisation temps réel  
✅ **Notifications multi-canaux** (email, SMS, Slack, push)  
✅ **Intégration Prometheus/Grafana** pour monitoring avancé  
✅ **Plans de réponse** structurés selon la criticité  
✅ **Runbooks détaillés** pour gestion de crise  

**Phase suivante** : Initialisation de la structure du projet avec la configuration complète des outils de développement.