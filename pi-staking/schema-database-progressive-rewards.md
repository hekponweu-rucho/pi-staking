# Schéma de Base de Données - Progressive Rewards Platform

## 🗄️ Vue d'ensemble

Base de données PostgreSQL optimisée pour le modèle Progressive Rewards avec monitoring financier, gamification et gestion des risques intégrés.

## 📊 Diagramme ERD (Relations)

```
Users ──┐
        ├─── Investments ──── Claims
        ├─── BonusGrants
        ├─── UserStreaks ──── LoyaltyPoints
        ├─── Transactions
        ├─── WithdrawalRequests
        └─── Referrals

StakingPackages ──── Investments

SystemAlerts ──── Users (acknowledged_by)
FinancialMetrics (standalone)
RateAdjustments ──── Users (created_by)
Audits ──── Users
```

## 📋 Tables Détaillées

### 1. Users (Modifiée)
```sql
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    email_verified_at TIMESTAMP,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin')),
    
    -- Données financières
    balance_pi DECIMAL(20,8) DEFAULT 0 CHECK (balance_pi >= 0),
    total_invested DECIMAL(20,8) DEFAULT 0 CHECK (total_invested >= 0),
    total_claimed DECIMAL(20,8) DEFAULT 0 CHECK (total_claimed >= 0),
    total_withdrawn DECIMAL(20,8) DEFAULT 0 CHECK (total_withdrawn >= 0),
    
    -- Système de niveaux
    current_level VARCHAR(20) DEFAULT 'discovery' 
        CHECK (current_level IN ('discovery', 'bronze', 'silver', 'gold', 'diamond')),
    level_updated_at TIMESTAMP,
    
    -- Parrainage
    referral_code VARCHAR(20) UNIQUE,
    referred_by BIGINT REFERENCES users(id),
    
    -- KYC et sécurité
    kyc_status VARCHAR(20) DEFAULT 'pending' 
        CHECK (kyc_status IN ('pending', 'verified', 'rejected')),
    kyc_verified_at TIMESTAMP,
    
    -- Gamification
    loyalty_points INTEGER DEFAULT 0 CHECK (loyalty_points >= 0),
    streak_bonus DECIMAL(6,4) DEFAULT 0 CHECK (streak_bonus >= 0),
    
    -- Tracking
    last_activity TIMESTAMP,
    last_claim_at TIMESTAMP,
    wallet_address VARCHAR(255),
    
    -- Métadonnées
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Index pour users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_referral_code ON users(referral_code);
CREATE INDEX idx_users_level ON users(current_level);
CREATE INDEX idx_users_total_invested ON users(total_invested);
CREATE INDEX idx_users_last_activity ON users(last_activity);
CREATE INDEX idx_users_referred_by ON users(referred_by);
```

### 2. StakingPackages (Étendue)
```sql
CREATE TABLE staking_packages (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Configuration niveaux
    level VARCHAR(20) NOT NULL 
        CHECK (level IN ('discovery', 'bronze', 'silver', 'gold', 'diamond')),
    daily_rate DECIMAL(8,6) NOT NULL CHECK (daily_rate > 0 AND daily_rate <= 1),
    
    -- Limites
    min_amount DECIMAL(20,8) NOT NULL CHECK (min_amount > 0),
    max_amount DECIMAL(20,8) CHECK (max_amount IS NULL OR max_amount >= min_amount),
    
    -- Configuration
    max_duration_days INTEGER DEFAULT 365,
    is_active BOOLEAN DEFAULT true,
    requires_kyc BOOLEAN DEFAULT false,
    
    -- Frais
    deposit_fee_rate DECIMAL(6,4) DEFAULT 0,
    performance_fee_rate DECIMAL(6,4) DEFAULT 0,
    
    -- Métadonnées
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour staking_packages
CREATE INDEX idx_staking_packages_level ON staking_packages(level);
CREATE INDEX idx_staking_packages_active ON staking_packages(is_active);
```

### 3. Investments (Modifiée)
```sql
CREATE TABLE investments (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    package_id BIGINT REFERENCES staking_packages(id),
    
    -- Montants
    amount DECIMAL(20,8) NOT NULL CHECK (amount > 0),
    claimed_amount DECIMAL(20,8) DEFAULT 0 CHECK (claimed_amount >= 0),
    
    -- Taux de rendement
    user_level VARCHAR(20) NOT NULL,
    base_rate DECIMAL(8,6) NOT NULL CHECK (base_rate > 0),
    bonus_rate DECIMAL(8,6) DEFAULT 0 CHECK (bonus_rate >= 0),
    effective_rate DECIMAL(8,6) GENERATED ALWAYS AS (base_rate + bonus_rate) STORED,
    
    -- Durée
    start_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_at TIMESTAMP,
    
    -- Statut
    status VARCHAR(20) DEFAULT 'active' 
        CHECK (status IN ('active', 'completed', 'cancelled', 'paused')),
    source VARCHAR(20) DEFAULT 'funds' 
        CHECK (source IN ('bonus', 'funds', 'compound')),
    
    -- Claims
    last_claim_at TIMESTAMP,
    next_claim_available_at TIMESTAMP,
    total_claims INTEGER DEFAULT 0,
    
    -- Métadonnées
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour investments
CREATE INDEX idx_investments_user_id ON investments(user_id);
CREATE INDEX idx_investments_status ON investments(status);
CREATE INDEX idx_investments_user_level ON investments(user_level);
CREATE INDEX idx_investments_next_claim ON investments(next_claim_available_at);
CREATE INDEX idx_investments_created_at ON investments(created_at);
CREATE UNIQUE INDEX idx_investments_active_user ON investments(user_id, id) WHERE status = 'active';
```

### 4. Claims (Étendue)
```sql
CREATE TABLE claims (
    id BIGSERIAL PRIMARY KEY,
    investment_id BIGINT NOT NULL REFERENCES investments(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Claim details
    claimed_for_day DATE NOT NULL,
    amount DECIMAL(20,8) NOT NULL CHECK (amount > 0),
    
    -- Calculs détaillés
    base_amount DECIMAL(20,8) NOT NULL,
    bonus_amount DECIMAL(20,8) DEFAULT 0,
    streak_bonus DECIMAL(20,8) DEFAULT 0,
    
    -- Rates utilisés
    base_rate DECIMAL(8,6) NOT NULL,
    bonus_rate DECIMAL(8,6) DEFAULT 0,
    streak_rate DECIMAL(8,6) DEFAULT 0,
    
    -- Statut et timing
    status VARCHAR(20) DEFAULT 'completed' 
        CHECK (status IN ('completed', 'failed', 'cancelled')),
    claimed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP,
    
    -- Métadonnées
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour claims
CREATE INDEX idx_claims_investment_id ON claims(investment_id);
CREATE INDEX idx_claims_user_id ON claims(user_id);
CREATE INDEX idx_claims_claimed_for_day ON claims(claimed_for_day);
CREATE INDEX idx_claims_claimed_at ON claims(claimed_at);
CREATE UNIQUE INDEX idx_claims_unique_daily ON claims(investment_id, claimed_for_day);
```

### 5. BonusGrants (Nouvelle)
```sql
CREATE TABLE bonus_grants (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Montants
    initial_amount DECIMAL(20,8) NOT NULL CHECK (initial_amount > 0),
    remaining_amount DECIMAL(20,8) NOT NULL CHECK (remaining_amount >= 0),
    used_amount DECIMAL(20,8) DEFAULT 0 CHECK (used_amount >= 0),
    
    -- Configuration
    grant_type VARCHAR(50) DEFAULT 'welcome_bonus',
    expires_at TIMESTAMP NOT NULL,
    
    -- Restrictions
    usable_for VARCHAR(20) DEFAULT 'staking' 
        CHECK (usable_for IN ('staking', 'any', 'withdrawal')),
    min_investment DECIMAL(20,8) DEFAULT 0,
    
    -- Statut
    is_active BOOLEAN DEFAULT true,
    used_at TIMESTAMP,
    
    -- Métadonnées
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour bonus_grants
CREATE INDEX idx_bonus_grants_user_id ON bonus_grants(user_id);
CREATE INDEX idx_bonus_grants_expires_at ON bonus_grants(expires_at);
CREATE INDEX idx_bonus_grants_active ON bonus_grants(is_active);
```

### 6. UserStreaks (Nouvelle)
```sql
CREATE TABLE user_streaks (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Streaks
    current_streak INTEGER DEFAULT 0 CHECK (current_streak >= 0),
    longest_streak INTEGER DEFAULT 0 CHECK (longest_streak >= 0),
    
    -- Dates
    last_claim_date DATE,
    streak_started_at DATE,
    
    -- Bonus
    streak_bonus DECIMAL(6,4) DEFAULT 0 CHECK (streak_bonus >= 0),
    bonus_tier VARCHAR(20) DEFAULT 'none' 
        CHECK (bonus_tier IN ('none', 'bronze', 'silver', 'gold', 'diamond')),
    
    -- Métadonnées
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour user_streaks
CREATE UNIQUE INDEX idx_user_streaks_user ON user_streaks(user_id);
CREATE INDEX idx_user_streaks_current ON user_streaks(current_streak);
```

### 7. LoyaltyPoints (Nouvelle)
```sql
CREATE TABLE loyalty_points (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Points
    points INTEGER NOT NULL,
    source VARCHAR(50) NOT NULL 
        CHECK (source IN ('claim', 'referral', 'bonus', 'streak', 'level_up', 'special_event')),
    
    -- Référence
    reference_id BIGINT, -- ID de l'action qui a généré les points
    reference_type VARCHAR(50), -- 'claim', 'investment', 'referral'
    
    -- Métadonnées
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP
);

-- Index pour loyalty_points
CREATE INDEX idx_loyalty_points_user_id ON loyalty_points(user_id);
CREATE INDEX idx_loyalty_points_source ON loyalty_points(source);
CREATE INDEX idx_loyalty_points_earned_at ON loyalty_points(earned_at);
```

### 8. Transactions (Modifiée)
```sql
CREATE TABLE transactions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Transaction details
    type VARCHAR(50) NOT NULL 
        CHECK (type IN ('deposit', 'withdrawal', 'bonus', 'referral', 'claim', 'fee', 'adjustment')),
    amount DECIMAL(20,8) NOT NULL,
    
    -- Fees
    fee_amount DECIMAL(20,8) DEFAULT 0,
    net_amount DECIMAL(20,8) GENERATED ALWAYS AS (amount - fee_amount) STORED,
    
    -- Statut
    status VARCHAR(20) DEFAULT 'pending' 
        CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    
    -- Références
    reference VARCHAR(255), -- TX hash, order ID, etc.
    reference_type VARCHAR(50),
    related_id BIGINT, -- ID de l'investissement, claim, etc.
    
    -- Métadonnées
    description TEXT,
    processed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour transactions
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);
```

### 9. WithdrawalRequests (Modifiée)
```sql
CREATE TABLE withdrawal_requests (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Montants
    amount DECIMAL(20,8) NOT NULL CHECK (amount > 0),
    fee_amount DECIMAL(20,8) DEFAULT 0,
    net_amount DECIMAL(20,8) GENERATED ALWAYS AS (amount - fee_amount) STORED,
    
    -- Destination
    wallet_address VARCHAR(255) NOT NULL,
    network VARCHAR(50) DEFAULT 'pi',
    
    -- Statut
    status VARCHAR(20) DEFAULT 'pending' 
        CHECK (status IN ('pending', 'processing', 'approved', 'rejected', 'completed', 'failed')),
    
    -- Processing
    processed_at TIMESTAMP,
    processed_by BIGINT REFERENCES users(id),
    admin_notes TEXT,
    
    -- Blockchain
    tx_hash VARCHAR(255),
    confirmations INTEGER DEFAULT 0,
    
    -- Métadonnées
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour withdrawal_requests
CREATE INDEX idx_withdrawal_requests_user_id ON withdrawal_requests(user_id);
CREATE INDEX idx_withdrawal_requests_status ON withdrawal_requests(status);
CREATE INDEX idx_withdrawal_requests_created_at ON withdrawal_requests(created_at);
```

### 10. Referrals (Étendue)
```sql
CREATE TABLE referrals (
    id BIGSERIAL PRIMARY KEY,
    referrer_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    referred_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Niveaux de parrainage
    level INTEGER DEFAULT 1 CHECK (level >= 1 AND level <= 3),
    
    -- Récompenses
    bonus_amount DECIMAL(20,8) DEFAULT 0,
    bonus_percentage DECIMAL(6,4) DEFAULT 0,
    
    -- Statut
    status VARCHAR(20) DEFAULT 'pending' 
        CHECK (status IN ('pending', 'qualified', 'paid', 'cancelled')),
    qualified_at TIMESTAMP, -- Quand le filleul a fait sa première action qualifiante
    paid_at TIMESTAMP,
    
    -- Conditions
    minimum_investment DECIMAL(20,8) DEFAULT 0,
    qualifying_action VARCHAR(50), -- 'first_investment', 'first_real_investment'
    
    -- Métadonnées
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour referrals
CREATE INDEX idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX idx_referrals_referred_id ON referrals(referred_id);
CREATE INDEX idx_referrals_status ON referrals(status);
CREATE UNIQUE INDEX idx_referrals_unique ON referrals(referrer_id, referred_id, level);
```

### 11. FinancialMetrics (Nouvelle)
```sql
CREATE TABLE financial_metrics (
    id BIGSERIAL PRIMARY KEY,
    metric_date DATE UNIQUE NOT NULL,
    
    -- Métriques utilisateurs
    total_users INTEGER NOT NULL DEFAULT 0,
    active_users INTEGER NOT NULL DEFAULT 0,
    new_users INTEGER NOT NULL DEFAULT 0,
    
    -- Métriques financières
    total_tvl DECIMAL(20,8) NOT NULL DEFAULT 0,
    daily_claims DECIMAL(20,8) NOT NULL DEFAULT 0,
    daily_deposits DECIMAL(20,8) NOT NULL DEFAULT 0,
    daily_withdrawals DECIMAL(20,8) NOT NULL DEFAULT 0,
    daily_revenues DECIMAL(20,8) NOT NULL DEFAULT 0,
    
    -- Réserves et liquidité
    total_reserves DECIMAL(20,8) NOT NULL DEFAULT 0,
    available_liquidity DECIMAL(20,8) NOT NULL DEFAULT 0,
    liquidity_ratio DECIMAL(8,4) NOT NULL DEFAULT 0,
    
    -- Ratios et KPIs
    revenue_ratio DECIMAL(8,4) NOT NULL DEFAULT 0, -- Revenus/Claims
    growth_rate DECIMAL(8,4) NOT NULL DEFAULT 0,
    churn_rate DECIMAL(8,4) NOT NULL DEFAULT 0,
    
    -- Investissements par niveau
    discovery_tvl DECIMAL(20,8) DEFAULT 0,
    bronze_tvl DECIMAL(20,8) DEFAULT 0,
    silver_tvl DECIMAL(20,8) DEFAULT 0,
    gold_tvl DECIMAL(20,8) DEFAULT 0,
    diamond_tvl DECIMAL(20,8) DEFAULT 0,
    
    -- Niveau d'alerte
    alert_level VARCHAR(10) DEFAULT 'GREEN' 
        CHECK (alert_level IN ('GREEN', 'ORANGE', 'RED')),
    
    -- Métadonnées
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour financial_metrics
CREATE INDEX idx_financial_metrics_date ON financial_metrics(metric_date DESC);
CREATE INDEX idx_financial_metrics_alert_level ON financial_metrics(alert_level);
```

### 12. RateAdjustments (Nouvelle)
```sql
CREATE TABLE rate_adjustments (
    id BIGSERIAL PRIMARY KEY,
    
    -- Cible de l'ajustement
    level VARCHAR(20) 
        CHECK (level IN ('discovery', 'bronze', 'silver', 'gold', 'diamond', 'all')),
    package_id BIGINT REFERENCES staking_packages(id),
    
    -- Taux
    old_rate DECIMAL(8,6) NOT NULL,
    new_rate DECIMAL(8,6) NOT NULL,
    adjustment_amount DECIMAL(8,6) GENERATED ALWAYS AS (new_rate - old_rate) STORED,
    
    -- Motif
    reason TEXT NOT NULL,
    adjustment_type VARCHAR(50) NOT NULL 
        CHECK (adjustment_type IN ('automatic', 'manual', 'emergency', 'scheduled')),
    
    -- Déclencheur
    trigger_metric VARCHAR(50),
    trigger_value DECIMAL(10,4),
    trigger_threshold DECIMAL(10,4),
    
    -- Application
    applied_at TIMESTAMP NOT NULL,
    effective_from TIMESTAMP,
    effective_until TIMESTAMP,
    
    -- Autorisation
    created_by BIGINT REFERENCES users(id),
    approved_by BIGINT REFERENCES users(id),
    
    -- Impact
    affected_investments INTEGER DEFAULT 0,
    estimated_impact DECIMAL(20,8),
    
    -- Métadonnées
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour rate_adjustments
CREATE INDEX idx_rate_adjustments_level ON rate_adjustments(level);
CREATE INDEX idx_rate_adjustments_applied_at ON rate_adjustments(applied_at);
CREATE INDEX idx_rate_adjustments_type ON rate_adjustments(adjustment_type);
```

### 13. SystemAlerts (Nouvelle)
```sql
CREATE TABLE system_alerts (
    id BIGSERIAL PRIMARY KEY,
    
    -- Classification
    type VARCHAR(50) NOT NULL 
        CHECK (type IN ('financial_risk', 'user_behavior', 'system_health', 'security', 'compliance')),
    level VARCHAR(20) NOT NULL 
        CHECK (level IN ('INFO', 'WARNING', 'CRITICAL', 'EMERGENCY')),
    
    -- Contenu
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    
    -- Contexte
    metadata JSONB,
    affected_users INTEGER DEFAULT 0,
    financial_impact DECIMAL(20,8),
    
    -- Résolution
    status VARCHAR(20) DEFAULT 'active' 
        CHECK (status IN ('active', 'investigating', 'resolved', 'dismissed')),
    acknowledged_at TIMESTAMP,
    acknowledged_by BIGINT REFERENCES users(id),
    resolved_at TIMESTAMP,
    resolved_by BIGINT REFERENCES users(id),
    resolution_notes TEXT,
    
    -- Actions automatiques
    auto_actions_taken JSONB,
    requires_manual_action BOOLEAN DEFAULT false,
    
    -- Métadonnées
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour system_alerts
CREATE INDEX idx_system_alerts_type ON system_alerts(type);
CREATE INDEX idx_system_alerts_level ON system_alerts(level);
CREATE INDEX idx_system_alerts_status ON system_alerts(status);
CREATE INDEX idx_system_alerts_created_at ON system_alerts(created_at DESC);
```

### 14. Audits (Étendue)
```sql
CREATE TABLE audits (
    id BIGSERIAL PRIMARY KEY,
    
    -- Acteur
    actor_id BIGINT REFERENCES users(id),
    actor_type VARCHAR(50) DEFAULT 'user' 
        CHECK (actor_type IN ('user', 'admin', 'system', 'api')),
    
    -- Action
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(100) NOT NULL, -- 'User', 'Investment', 'Transaction'
    resource_id BIGINT,
    
    -- Changements
    old_values JSONB,
    new_values JSONB,
    changes JSONB GENERATED ALWAYS AS (
        CASE 
            WHEN old_values IS NULL THEN new_values
            ELSE jsonb_diff(old_values, new_values)
        END
    ) STORED,
    
    -- Contexte
    event_type VARCHAR(50), -- 'create', 'update', 'delete', 'login', 'claim'
    risk_level VARCHAR(20) DEFAULT 'LOW' 
        CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    
    -- Métadonnées techniques
    ip_address INET,
    user_agent TEXT,
    endpoint VARCHAR(255),
    request_id VARCHAR(50),
    
    -- Détection d'anomalies
    is_suspicious BOOLEAN DEFAULT false,
    anomaly_score DECIMAL(4,2),
    fraud_indicators JSONB,
    
    -- Métadonnées
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour audits
CREATE INDEX idx_audits_actor_id ON audits(actor_id);
CREATE INDEX idx_audits_action ON audits(action);
CREATE INDEX idx_audits_resource ON audits(resource, resource_id);
CREATE INDEX idx_audits_created_at ON audits(created_at);
CREATE INDEX idx_audits_risk_level ON audits(risk_level);
CREATE INDEX idx_audits_suspicious ON audits(is_suspicious) WHERE is_suspicious = true;
```

## 🔧 Fonctions et Triggers

### 1. Fonction de Mise à Jour des Niveaux Utilisateurs
```sql
CREATE OR REPLACE FUNCTION update_user_level()
RETURNS TRIGGER AS $$
DECLARE
    new_level VARCHAR(20);
    total_invested DECIMAL(20,8);
BEGIN
    -- Calculer le total investi
    SELECT COALESCE(SUM(amount), 0) INTO total_invested
    FROM investments 
    WHERE user_id = NEW.user_id AND status = 'active';
    
    -- Déterminer le nouveau niveau
    new_level := CASE 
        WHEN total_invested >= 10000 THEN 'diamond'
        WHEN total_invested >= 2000 THEN 'gold'
        WHEN total_invested >= 500 THEN 'silver'
        WHEN total_invested >= 1 THEN 'bronze'
        ELSE 'discovery'
    END;
    
    -- Mettre à jour si nécessaire
    UPDATE users 
    SET 
        current_level = new_level,
        total_invested = total_invested,
        level_updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.user_id AND current_level != new_level;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger sur les investissements
CREATE TRIGGER trigger_update_user_level
    AFTER INSERT OR UPDATE ON investments
    FOR EACH ROW
    EXECUTE FUNCTION update_user_level();
```

### 2. Fonction de Calcul des Streaks
```sql
CREATE OR REPLACE FUNCTION update_user_streak(user_id_param BIGINT)
RETURNS VOID AS $$
DECLARE
    last_claim_date DATE;
    current_date DATE := CURRENT_DATE;
    streak_record RECORD;
BEGIN
    -- Récupérer le dernier claim
    SELECT DATE(claimed_at) INTO last_claim_date
    FROM claims 
    WHERE user_id = user_id_param 
    ORDER BY claimed_at DESC 
    LIMIT 1;
    
    -- Récupérer ou créer le record de streak
    SELECT * INTO streak_record 
    FROM user_streaks 
    WHERE user_id = user_id_param;
    
    IF NOT FOUND THEN
        INSERT INTO user_streaks (user_id, current_streak, last_claim_date)
        VALUES (user_id_param, 1, current_date);
        RETURN;
    END IF;
    
    -- Calculer le nouveau streak
    IF last_claim_date = current_date THEN
        -- Claim aujourd'hui, continuer le streak
        IF streak_record.last_claim_date = current_date - INTERVAL '1 day' THEN
            -- Streak continu
            UPDATE user_streaks 
            SET 
                current_streak = current_streak + 1,
                longest_streak = GREATEST(longest_streak, current_streak + 1),
                last_claim_date = current_date,
                streak_bonus = calculate_streak_bonus(current_streak + 1)
            WHERE user_id = user_id_param;
        ELSE
            -- Nouveau streak
            UPDATE user_streaks 
            SET 
                current_streak = 1,
                last_claim_date = current_date,
                streak_started_at = current_date,
                streak_bonus = calculate_streak_bonus(1)
            WHERE user_id = user_id_param;
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Fonction helper pour calculer le bonus de streak
CREATE OR REPLACE FUNCTION calculate_streak_bonus(streak_days INTEGER)
RETURNS DECIMAL(6,4) AS $$
BEGIN
    RETURN CASE 
        WHEN streak_days >= 90 THEN 0.0015  -- +0.15%
        WHEN streak_days >= 30 THEN 0.001   -- +0.1%
        WHEN streak_days >= 7 THEN 0.0005   -- +0.05%
        ELSE 0.0
    END;
END;
$$ LANGUAGE plpgsql;
```

### 3. Trigger de Mise à Jour Automatique
```sql
-- Function pour updated_at automatique
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer à toutes les tables avec updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_investments_updated_at
    BEFORE UPDATE ON investments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Répéter pour toutes les tables concernées...
```

## 📈 Vues pour les Métriques

### 1. Vue Dashboard Administrateur
```sql
CREATE VIEW admin_dashboard_metrics AS
SELECT 
    -- Métriques utilisateurs
    COUNT(DISTINCT u.id) as total_users,
    COUNT(DISTINCT CASE WHEN u.last_activity >= CURRENT_DATE - INTERVAL '7 days' THEN u.id END) as active_users_7d,
    COUNT(DISTINCT CASE WHEN u.created_at >= CURRENT_DATE THEN u.id END) as new_users_today,
    
    -- Métriques financières
    COALESCE(SUM(i.amount), 0) as total_tvl,
    COALESCE(SUM(CASE WHEN i.status = 'active' THEN i.amount ELSE 0 END), 0) as active_tvl,
    
    -- Claims aujourd'hui
    COALESCE(SUM(c.amount), 0) FILTER (WHERE c.claimed_at >= CURRENT_DATE) as claims_today,
    COUNT(c.id) FILTER (WHERE c.claimed_at >= CURRENT_DATE) as claims_count_today,
    
    -- Retraits en attente
    COALESCE(SUM(wr.amount), 0) FILTER (WHERE wr.status = 'pending') as pending_withdrawals_amount,
    COUNT(wr.id) FILTER (WHERE wr.status = 'pending') as pending_withdrawals_count,
    
    -- Répartition par niveau
    COUNT(DISTINCT u.id) FILTER (WHERE u.current_level = 'discovery') as discovery_users,
    COUNT(DISTINCT u.id) FILTER (WHERE u.current_level = 'bronze') as bronze_users,
    COUNT(DISTINCT u.id) FILTER (WHERE u.current_level = 'silver') as silver_users,
    COUNT(DISTINCT u.id) FILTER (WHERE u.current_level = 'gold') as gold_users,
    COUNT(DISTINCT u.id) FILTER (WHERE u.current_level = 'diamond') as diamond_users,
    
    -- Alertes
    COUNT(sa.id) FILTER (WHERE sa.status = 'active' AND sa.level = 'CRITICAL') as critical_alerts,
    COUNT(sa.id) FILTER (WHERE sa.status = 'active' AND sa.level = 'WARNING') as warning_alerts
    
FROM users u
LEFT JOIN investments i ON u.id = i.user_id
LEFT JOIN claims c ON u.id = c.user_id
LEFT JOIN withdrawal_requests wr ON u.id = wr.user_id
LEFT JOIN system_alerts sa ON sa.created_at >= CURRENT_DATE;
```

### 2. Vue Métriques par Niveau
```sql
CREATE VIEW level_metrics AS
SELECT 
    u.current_level as level,
    COUNT(DISTINCT u.id) as user_count,
    COUNT(DISTINCT i.id) as investment_count,
    COALESCE(SUM(i.amount), 0) as total_invested,
    COALESCE(AVG(i.amount), 0) as avg_investment,
    COALESCE(SUM(c.amount), 0) FILTER (WHERE c.claimed_at >= CURRENT_DATE - INTERVAL '30 days') as claims_30d,
    COALESCE(AVG(us.current_streak), 0) as avg_streak
FROM users u
LEFT JOIN investments i ON u.id = i.user_id AND i.status = 'active'
LEFT JOIN claims c ON i.id = c.investment_id
LEFT JOIN user_streaks us ON u.id = us.user_id
GROUP BY u.current_level;
```

### 3. Vue Analyse des Risques
```sql
CREATE VIEW risk_analysis AS
WITH daily_metrics AS (
    SELECT 
        DATE(created_at) as metric_date,
        SUM(amount) FILTER (WHERE status = 'completed') as daily_claims,
        COUNT(DISTINCT user_id) as active_claimers
    FROM claims 
    WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY DATE(created_at)
),
liquidity_metrics AS (
    SELECT 
        SUM(balance_pi) as total_user_balance,
        SUM(amount) as total_active_investments
    FROM users u
    JOIN investments i ON u.id = i.user_id AND i.status = 'active'
)
SELECT 
    dm.metric_date,
    dm.daily_claims,
    dm.active_claimers,
    lm.total_user_balance,
    lm.total_active_investments,
    CASE 
        WHEN lm.total_user_balance / NULLIF(dm.daily_claims, 0) > 30 THEN 'GREEN'
        WHEN lm.total_user_balance / NULLIF(dm.daily_claims, 0) > 20 THEN 'ORANGE'
        ELSE 'RED'
    END as liquidity_status
FROM daily_metrics dm
CROSS JOIN liquidity_metrics lm
ORDER BY dm.metric_date DESC;
```

## 🔐 Contraintes de Sécurité

### Row Level Security (RLS)
```sql
-- Activer RLS sur les tables sensibles
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- Politique pour les utilisateurs normaux (accès à leurs données uniquement)
CREATE POLICY user_own_data ON users
    FOR ALL
    TO application_user
    USING (id = current_setting('app.current_user_id')::bigint);

CREATE POLICY user_own_investments ON investments
    FOR ALL
    TO application_user
    USING (user_id = current_setting('app.current_user_id')::bigint);

-- Politique pour les administrateurs (accès total)
CREATE POLICY admin_full_access ON users
    FOR ALL
    TO application_admin
    USING (true);
```

### Contraintes Financières Critiques
```sql
-- Vérifier que les soldes ne deviennent jamais négatifs
ALTER TABLE users ADD CONSTRAINT check_positive_balance 
    CHECK (balance_pi >= 0);

-- Vérifier que les montants de claim sont cohérents
ALTER TABLE claims ADD CONSTRAINT check_claim_amount_positive 
    CHECK (amount > 0);

ALTER TABLE claims ADD CONSTRAINT check_claim_components_sum
    CHECK (amount = base_amount + bonus_amount + streak_bonus);

-- Vérifier que les taux sont dans des limites raisonnables
ALTER TABLE investments ADD CONSTRAINT check_reasonable_rates
    CHECK (effective_rate >= 0 AND effective_rate <= 0.1); -- Max 10% par jour

-- Vérifier les dates logiques
ALTER TABLE investments ADD CONSTRAINT check_logical_dates
    CHECK (end_at IS NULL OR end_at > start_at);

ALTER TABLE bonus_grants ADD CONSTRAINT check_grant_amounts
    CHECK (remaining_amount <= initial_amount);
```

## 🎯 Prochaines Étapes

Le schéma de base de données est maintenant complet avec :

✅ **Tables optimisées** pour le modèle Progressive Rewards
✅ **Index performants** pour les requêtes critiques  
✅ **Triggers automatiques** pour la maintenance des données
✅ **Vues métriques** pour le monitoring
✅ **Contraintes de sécurité** et validation des données
✅ **Row Level Security** pour la protection des données
✅ **Fonctions utilitaires** pour la logique métier

**Phase suivante** : Spécification détaillée de la logique métier avec les calculs, règles de validation et processus automatisés.