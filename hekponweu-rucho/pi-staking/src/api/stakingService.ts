import { api } from './api';

export interface StakingPackage {
  id: string;
  name: string;
  minAmount: number;
  maxAmount: number;
  duration: number; // en jours
  apy: number; // pourcentage annuel
  description: string;
  isActive: boolean;
}

export interface StakingPosition {
  id: string;
  packageId: string;
  amount: number;
  startDate: string;
  endDate: string;
  currentValue: number;
  status: 'active' | 'completed' | 'cancelled';
}

/**
 * Service pour la gestion du staking
 */
export const stakingService = {
  /**
   * Récupère la liste des packages de staking disponibles
   */
  async getPackages(): Promise<StakingPackage[]> {
    try {
      const response = await api.get('/api/staking/packages');
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Erreur lors de la récupération des packages:', error);
      return [];
    }
  },

  /**
   * Récupère les positions de staking de l'utilisateur
   */
  async getUserPositions(): Promise<StakingPosition[]> {
    try {
      const response = await api.get('/api/staking/positions');
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Erreur lors de la récupération des positions:', error);
      return [];
    }
  },

  /**
   * Crée une nouvelle position de staking
   */
  async createPosition(packageId: string, amount: number): Promise<StakingPosition | null> {
    try {
      const response = await api.post('/api/staking/positions', {
        packageId,
        amount
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création de la position:', error);
      return null;
    }
  },

  /**
   * Récupère les détails d'une position spécifique
   */
  async getPosition(positionId: string): Promise<StakingPosition | null> {
    try {
      const response = await api.get(`/api/staking/positions/${positionId}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération de la position:', error);
      return null;
    }
  }
};