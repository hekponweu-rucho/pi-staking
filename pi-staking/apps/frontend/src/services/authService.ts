import apiClient, { sanctumClient } from '@/lib/api-enhanced';
import type { User } from '../../../packages/shared-types/src/user.ts';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  password_confirmation: string;
  referral_code?: string;
}

export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
  password_confirmation: string;
  referral_code?: string;
}

// Extension du type User partagé avec des propriétés locales
interface ExtendedUser extends User {
  welcome_bonus_claimed?: boolean;
}

export { User, type ExtendedUser };

class AuthService {
  // Initialiser CSRF avant toute requête
  async initializeCsrf(): Promise<void> {
    try {
      await sanctumClient.get('/sanctum/csrf-cookie');
    } catch (error) {
      console.warn('CSRF initialization failed:', error);
    }
  }

  // Connexion
  async login(credentials: LoginCredentials): Promise<{ success: boolean; message?: string; data?: { user: User; token: string } }> {
    try {
      await this.initializeCsrf();
      
      const response = await apiClient.post('/auth/login', credentials);
      
      if (response.data.success) {
        const { user, token } = response.data.data;
        localStorage.setItem('auth_token', token);
        return { success: true, data: { user, token } };
      }
      
      return { success: false, message: response.data.message || 'Erreur de connexion' };
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || 'Erreur de connexion' };
    }
  }

  // Inscription avec bonus de bienvenue automatique
  async register(data: RegisterCredentials): Promise<{ success: boolean; message?: string; data?: { user: User; token: string; bonus: any } }> {
    try {
      await this.initializeCsrf();
      
      const response = await apiClient.post('/auth/register', data);
      
      if (response.data.success) {
        const { user, token, bonus_grant } = response.data.data;
        localStorage.setItem('auth_token', token);
        return { success: true, data: { user, token, bonus: bonus_grant } };
      }
      
      return { success: false, message: response.data.message || 'Erreur d\'inscription' };
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || 'Erreur d\'inscription' };
    }
  }

  // Récupérer l'utilisateur actuel avec ses investissements
  async getCurrentUser(): Promise<{ success: boolean; message?: string; data?: User }> {
    try {
      const response = await apiClient.get('/auth/me');
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      }
      
      return { success: false, message: response.data.message || 'Utilisateur non trouvé' };
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || 'Utilisateur non trouvé' };
    }
  }

  // Déconnexion
  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      localStorage.removeItem('auth_token');
    }
  }

  // Vérifier si l'utilisateur est connecté
  isAuthenticated(): boolean {
    return !!localStorage.getItem('auth_token');
  }

  // Obtenir le niveau d'utilisateur avec couleurs
  getUserLevelInfo(level: string) {
    const levels = {
      discovery: { name: 'Discovery', color: 'text-blue-500', bgColor: 'bg-blue-100' },
      bronze: { name: 'Bronze', color: 'text-amber-600', bgColor: 'bg-amber-100' },
      silver: { name: 'Silver', color: 'text-gray-500', bgColor: 'bg-gray-100' },
      gold: { name: 'Gold', color: 'text-yellow-500', bgColor: 'bg-yellow-100' },
      diamond: { name: 'Diamond', color: 'text-purple-500', bgColor: 'bg-purple-100' }
    };
    
    return levels[level as keyof typeof levels] || levels.discovery;
  }

  // Gestion des tokens
  getStoredToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  removeStoredToken(): void {
    localStorage.removeItem('auth_token');
  }

  // Actualiser le token
  async refreshToken(): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await apiClient.post('/auth/refresh');
      
      if (response.data.success) {
        const { token } = response.data.data;
        localStorage.setItem('auth_token', token);
        return { success: true };
      }
      
      return { success: false, message: response.data.message || 'Erreur de rafraîchissement' };
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || 'Erreur de rafraîchissement' };
    }
  }

  // Mettre à jour le profil
  async updateProfile(updates: Partial<User>): Promise<{ success: boolean; message?: string; data?: User }> {
    try {
      const response = await apiClient.post('/auth/update-profile', updates);
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      }
      
      return { success: false, message: response.data.message || 'Erreur de mise à jour' };
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || 'Erreur de mise à jour' };
    }
  }

  // Changer le mot de passe
  async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await apiClient.post('/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirmation: newPassword
      });
      
      if (response.data.success) {
        return { success: true };
      }
      
      return { success: false, message: response.data.message || 'Erreur de changement de mot de passe' };
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || 'Erreur de changement de mot de passe' };
    }
  }

  // Réclamer le bonus de bienvenue
  async claimWelcomeBonus(): Promise<{ success: boolean; message?: string; data?: any }> {
    try {
      const response = await apiClient.post('/auth/claim-welcome-bonus');
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      }
      
      return { success: false, message: response.data.message || 'Erreur de réclamation du bonus' };
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || 'Erreur de réclamation du bonus' };
    }
  }
}

export const authService = new AuthService();
export default authService;