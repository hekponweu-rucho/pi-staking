import { api } from './api';

export interface Investment {
  id: string;
  amount: number;
  currency: string;
  date: string;
  status: 'active' | 'pending' | 'completed';
  returns?: number;
}

export interface DashboardStats {
  totalInvested: number;
  totalReturns: number;
  activeInvestments: number;
  pendingInvestments: number;
}

export interface UserDashboard {
  user: {
    id: string;
    name: string;
    email: string;
  };
  stats: DashboardStats;
  investments: Investment[];
}

/**
 * Service pour les données du dashboard utilisateur
 */
export const dashboardService = {
  /**
   * Récupère les données complètes du dashboard
   */
  async getUserDashboard(): Promise<UserDashboard> {
    try {
      const response = await api.get('/api/admin/dashboard');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération du dashboard:', error);
      // Retour de données par défaut en cas d'erreur
      return {
        user: { id: '', name: '', email: '' },
        stats: {
          totalInvested: 0,
          totalReturns: 0,
          activeInvestments: 0,
          pendingInvestments: 0
        },
        investments: []
      };
    }
  },

  /**
   * Récupère uniquement les statistiques
   */
  async getStats(): Promise<DashboardStats> {
    try {
      const response = await api.get('/api/admin/stats');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des stats:', error);
      return {
        totalInvested: 0,
        totalReturns: 0,
        activeInvestments: 0,
        pendingInvestments: 0
      };
    }
  },

  /**
   * Récupère la liste des investissements
   */
  async getInvestments(): Promise<Investment[]> {
    try {
      const response = await api.get('/api/investments');
      // S'assurer que la réponse est un tableau
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Erreur lors de la récupération des investissements:', error);
      return [];
    }
  }
};