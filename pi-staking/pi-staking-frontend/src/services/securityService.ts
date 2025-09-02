import api from '../lib/api-enhanced';

// Types pour la sécurité
export interface TwoFactorStatus {
  enabled: boolean;
  enabled_at: string | null;
  backup_codes_count: number;
}

export interface TwoFactorSetup {
  secret: string;
  qr_code: string;
  backup_codes: string[];
  setup_key: string;
}

export interface SecurityLog {
  id: string;
  action: string;
  ip_address: string;
  device_type: string;
  location: string;
  risk_score: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
  metadata: Record<string, any>;
}

export interface SecurityPreferences {
  email_notifications: boolean;
  sms_notifications: boolean;
  login_alerts: boolean;
  transaction_alerts: boolean;
  weekly_summary: boolean;
}

export interface AccountSecurityStatus {
  score: number;
  level: 'Faible' | 'Moyen' | 'Bon' | 'Excellent';
  recommendations: string[];
  two_factor_enabled: boolean;
  phone_verified: boolean;
  last_password_change: string;
  last_activity: string;
}

export interface WithdrawalLimits {
  daily_limit: number;
  used_today: number;
  remaining: number;
  level: string;
}

export interface SecurityStats {
  total_logins: number;
  failed_attempts: number;
  suspicious_activities: number;
  countries_count: number;
  devices_count: number;
  risk_score_average: number;
  last_30_days: {
    logins: number;
    locations: number;
    devices: number;
  };
}

export interface WithdrawalVerification {
  verification_id: string;
  code_sent: boolean;
  expires_at: string;
  method: 'email' | 'sms' | '2fa';
}

class SecurityService {
  
  // === GESTION 2FA ===

  // Obtenir le statut de la 2FA
  async get2FAStatus(): Promise<{ success: boolean; data: TwoFactorStatus }> {
    try {
      const response = await api.get('/security/2fa/status');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération du statut 2FA:', error);
      throw error;
    }
  }

  // Configurer la 2FA
  async setup2FA(): Promise<{ success: boolean; data: TwoFactorSetup; message: string }> {
    try {
      const response = await api.post('/security/2fa/setup');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la configuration 2FA:', error);
      throw error;
    }
  }

  // Confirmer la configuration 2FA
  async confirm2FA(code: string, setupKey: string): Promise<{ 
    success: boolean; 
    data: { backup_codes: string[] }; 
    message: string 
  }> {
    try {
      const response = await api.post('/security/2fa/confirm', {
        code,
        setup_key: setupKey
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la confirmation 2FA:', error);
      throw error;
    }
  }

  // Vérifier un code 2FA
  async verify2FA(code: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.post('/security/2fa/verify', { code });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la vérification 2FA:', error);
      throw error;
    }
  }

  // Désactiver la 2FA
  async disable2FA(password: string, code?: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.post('/security/2fa/disable', {
        password,
        code
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la désactivation 2FA:', error);
      throw error;
    }
  }

  // === VÉRIFICATIONS DE RETRAIT ===

  // Obtenir les limites de retrait
  async getWithdrawalLimits(): Promise<{ success: boolean; data: WithdrawalLimits }> {
    try {
      const response = await api.get('/security/withdrawal/limits');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des limites:', error);
      throw error;
    }
  }

  // Initier une vérification de retrait
  async initiateWithdrawalVerification(amount: number): Promise<{ 
    success: boolean; 
    data: WithdrawalVerification; 
    message: string 
  }> {
    try {
      const response = await api.post('/security/withdrawal/initiate-verification', {
        amount
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de l\'initiation de la vérification:', error);
      throw error;
    }
  }

  // Confirmer une vérification de retrait
  async confirmWithdrawalVerification(
    verificationId: string, 
    code: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.post('/security/withdrawal/confirm-verification', {
        verification_id: verificationId,
        code
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la confirmation de la vérification:', error);
      throw error;
    }
  }

  // === LOGS ET ACTIVITÉ ===

  // Récupérer les logs de sécurité
  async getSecurityLogs(page: number = 1, severity?: string): Promise<{
    success: boolean;
    data: {
      logs: SecurityLog[];
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
        ...(severity && { severity })
      });
      
      const response = await api.get(`/security/logs?${params}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des logs:', error);
      throw error;
    }
  }

  // Récupérer l'activité récente
  async getRecentActivity(limit: number = 50): Promise<{
    success: boolean;
    data: Array<{
      id: string;
      action: string;
      ip_address: string;
      device_type: string;
      location: string;
      risk_score: number;
      severity: string;
      created_at: string;
      metadata: Record<string, any>;
    }>;
  }> {
    try {
      const response = await api.get(`/security/activity?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'activité:', error);
      throw error;
    }
  }

  // Récupérer les statistiques de sécurité
  async getSecurityStats(days: number = 30): Promise<{ success: boolean; data: SecurityStats }> {
    try {
      const response = await api.get(`/security/stats?days=${days}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      throw error;
    }
  }

  // === PRÉFÉRENCES DE SÉCURITÉ ===

  // Récupérer les préférences de sécurité
  async getSecurityPreferences(): Promise<{ success: boolean; data: SecurityPreferences }> {
    try {
      const response = await api.get('/security/preferences');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des préférences:', error);
      throw error;
    }
  }

  // Mettre à jour les préférences de sécurité
  async updateSecurityPreferences(
    preferences: Partial<SecurityPreferences>
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.patch('/security/preferences', preferences);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour des préférences:', error);
      throw error;
    }
  }

  // === STATUT DE SÉCURITÉ DU COMPTE ===

  // Récupérer le statut de sécurité du compte
  async getAccountSecurityStatus(): Promise<{ success: boolean; data: AccountSecurityStatus }> {
    try {
      const response = await api.get('/security/account-status');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération du statut de sécurité:', error);
      throw error;
    }
  }

  // === UTILITAIRES ===

  // Analyser le niveau de risque d'une adresse IP
  analyzeIPRisk(ipAddress: string, location: string): {
    risk_level: 'low' | 'medium' | 'high';
    risk_factors: string[];
    score: number;
  } {
    const riskFactors: string[] = [];
    let score = 0;

    // Vérifications basiques (simulées)
    if (ipAddress.startsWith('192.168.') || ipAddress.startsWith('10.') || ipAddress.startsWith('172.')) {
      // IP privée - risque faible
      score += 10;
    } else {
      // IP publique - vérifications supplémentaires
      score += 30;
    }

    // Analyser la localisation
    if (location && location.toLowerCase().includes('unknown')) {
      riskFactors.push('Localisation inconnue');
      score += 20;
    }

    // VPN/Proxy detection (simulation)
    if (Math.random() > 0.9) {
      riskFactors.push('Possible VPN/Proxy');
      score += 40;
    }

    let risk_level: 'low' | 'medium' | 'high';
    if (score <= 30) risk_level = 'low';
    else if (score <= 60) risk_level = 'medium';
    else risk_level = 'high';

    return { risk_level, risk_factors: riskFactors, score };
  }

  // Générer des codes de sauvegarde
  generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];
    const characters = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    
    for (let i = 0; i < count; i++) {
      let code = '';
      for (let j = 0; j < 8; j++) {
        code += characters.charAt(Math.floor(Math.random() * characters.length));
      }
      // Formater comme XXXX-XXXX
      const formattedCode = code.substring(0, 4) + '-' + code.substring(4, 8);
      codes.push(formattedCode);
    }
    
    return codes;
  }

  // Valider la force d'un mot de passe
  validatePasswordStrength(password: string): {
    score: number;
    level: 'weak' | 'fair' | 'good' | 'strong';
    requirements: {
      length: boolean;
      uppercase: boolean;
      lowercase: boolean;
      numbers: boolean;
      symbols: boolean;
    };
    suggestions: string[];
  } {
    const requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      numbers: /\d/.test(password),
      symbols: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };

    const score = Object.values(requirements).filter(Boolean).length * 20;
    
    let level: 'weak' | 'fair' | 'good' | 'strong';
    if (score <= 40) level = 'weak';
    else if (score <= 60) level = 'fair';
    else if (score <= 80) level = 'good';
    else level = 'strong';

    const suggestions: string[] = [];
    if (!requirements.length) suggestions.push('Utilisez au moins 8 caractères');
    if (!requirements.uppercase) suggestions.push('Ajoutez des lettres majuscules');
    if (!requirements.lowercase) suggestions.push('Ajoutez des lettres minuscules');
    if (!requirements.numbers) suggestions.push('Ajoutez des chiffres');
    if (!requirements.symbols) suggestions.push('Ajoutez des symboles spéciaux');

    return { score, level, requirements, suggestions };
  }

  // Formater la date de dernière activité
  formatLastActivity(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffHours < 1) {
      return 'Il y a moins d\'une heure';
    } else if (diffHours < 24) {
      return `Il y a ${Math.floor(diffHours)} heure${Math.floor(diffHours) > 1 ? 's' : ''}`;
    } else if (diffDays < 30) {
      return `Il y a ${Math.floor(diffDays)} jour${Math.floor(diffDays) > 1 ? 's' : ''}`;
    } else {
      return date.toLocaleDateString('fr-FR');
    }
  }

  // Obtenir l'icône de sévérité
  getSeverityIcon(severity: string): { icon: string; color: string } {
    switch (severity.toLowerCase()) {
      case 'low':
        return { icon: '🟢', color: '#10B981' };
      case 'medium':
        return { icon: '🟡', color: '#F59E0B' };
      case 'high':
        return { icon: '🟠', color: '#F97316' };
      case 'critical':
        return { icon: '🔴', color: '#EF4444' };
      default:
        return { icon: '⚪', color: '#6B7280' };
    }
  }

  // Calculer le score de sécurité global
  calculateSecurityScore(status: AccountSecurityStatus): {
    score: number;
    color: string;
    recommendations: string[];
  } {
    const score = status.score;
    let color: string;
    
    if (score >= 90) color = '#10B981'; // Vert
    else if (score >= 70) color = '#3B82F6'; // Bleu
    else if (score >= 50) color = '#F59E0B'; // Orange
    else color = '#EF4444'; // Rouge

    return {
      score,
      color,
      recommendations: status.recommendations
    };
  }
}

export const securityService = new SecurityService();
export default securityService;