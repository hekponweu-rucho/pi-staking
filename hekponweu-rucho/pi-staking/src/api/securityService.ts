import { api } from './api';

export interface SecurityStats {
  totalUsers: number;
  activeUsers: number;
  loginAttempts: number;
  blockedIPs: number;
  lastSecurityScan: string;
}

export interface SecurityEvent {
  id: string;
  type: 'login_attempt' | 'failed_login' | 'account_locked' | 'password_reset';
  userId?: string;
  ip: string;
  timestamp: string;
  details: string;
}

/**
 * Service pour les statistiques et événements de sécurité
 */
export const securityService = {
  /**
   * Récupère les statistiques de sécurité
   */
  async getStats(): Promise<SecurityStats> {
    try {
      const response = await api.get('/api/security/stats');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des stats de sécurité:', error);
      return {
        totalUsers: 0,
        activeUsers: 0,
        loginAttempts: 0,
        blockedIPs: 0,
        lastSecurityScan: new Date().toISOString()
      };
    }
  },

  /**
   * Récupère les événements de sécurité récents
   */
  async getRecentEvents(limit = 50): Promise<SecurityEvent[]> {
    try {
      const response = await api.get(`/api/security/events?limit=${limit}`);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Erreur lors de la récupération des événements de sécurité:', error);
      return [];
    }
  },

  /**
   * Récupère les événements pour un utilisateur spécifique
   */
  async getUserEvents(userId: string): Promise<SecurityEvent[]> {
    try {
      const response = await api.get(`/api/security/events/user/${userId}`);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Erreur lors de la récupération des événements utilisateur:', error);
      return [];
    }
  }
};