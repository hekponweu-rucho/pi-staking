/**
 * Service de vérification par email pour Pi Staking
 * Gère la vérification email lors de l'inscription et des retraits
 */

import { apiClient } from '../lib/api-enhanced';
import { config, debugLog } from '../lib/config';

export interface EmailVerificationResponse {
  success: boolean;
  message: string;
  data?: {
    email: string;
    expires_at: string;
    token?: string;
  };
}

export interface WithdrawalVerificationRequest {
  withdrawal_id: string;
  email: string;
  amount: number;
  pi_address: string;
}

export interface WithdrawalVerificationResponse {
  success: boolean;
  message: string;
  data?: {
    verification_token: string;
    expires_at: string;
    withdrawal_id: string;
  };
}

export interface ResendVerificationRequest {
  email: string;
  type: 'registration' | 'withdrawal';
}

export class EmailVerificationService {
  
  /**
   * Envoyer email de vérification lors de l'inscription
   */
  async sendRegistrationVerification(email: string): Promise<EmailVerificationResponse> {
    try {
      debugLog('Envoi email vérification inscription:', email);
      const response = await apiClient.post('/auth/email/resend');
      return {
        success: true,
        message: 'Email de vérification envoyé avec succès',
        data: response.data
      };
    } catch (error: any) {
      console.error('Erreur envoi email vérification:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Erreur lors de l\'envoi de l\'email de vérification'
      };
    }
  }
  
  /**
   * Vérifier email avec token
   */
  async verifyFromQuery(search: string): Promise<EmailVerificationResponse> {
    try {
      debugLog('Vérification email via lien signé');
      const response = await apiClient.get(`/auth/email/verify${search}`);
      return {
        success: true,
        message: response.data?.message || 'Email vérifié avec succès',
        data: response.data
      };
    } catch (error: any) {
      console.error('Erreur vérification email:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Lien de vérification invalide ou expiré'
      };
    }
  }
  
  /**
   * Renvoyer email de vérification
   */
  async resendVerification(request: ResendVerificationRequest): Promise<EmailVerificationResponse> {
    try {
      debugLog('Renvoi email vérification:', request);
      const endpoint = request.type === 'registration' 
        ? '/auth/email/resend'
        : '/withdrawals/resend-verification';
      const response = await apiClient.post(endpoint);
      return {
        success: true,
        message: 'Email de vérification renvoyé avec succès',
        data: response.data
      };
    } catch (error: any) {
      console.error('Erreur renvoi vérification:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Erreur lors du renvoi de l\'email'
      };
    }
  }
  
  /**
   * Vérifier le statut de vérification email de l'utilisateur
   */
  async checkVerificationStatus(): Promise<{ verified: boolean; email?: string }> {
    try {
      const response = await apiClient.get('/auth/email/status');
      const data = response.data?.data || response.data;
      return {
        verified: data.email_verified_at !== null,
        email: data.email
      };
    } catch (error: any) {
      console.error('Erreur vérification statut:', error);
      return { verified: false };
    }
  }
  
  /**
   * Envoyer email de vérification pour retrait
   */
  async sendWithdrawalVerification(request: WithdrawalVerificationRequest): Promise<WithdrawalVerificationResponse> {
    try {
      debugLog('Envoi vérification retrait:', { 
        withdrawal_id: request.withdrawal_id, 
        amount: request.amount 
      });
      
      const response = await apiClient.post('/withdrawals/send-verification', request);
      
      return {
        success: true,
        message: 'Email de vérification de retrait envoyé',
        data: response.data
      };
      
    } catch (error: any) {
      console.error('Erreur vérification retrait:', error);
      
      return {
        success: false,
        message: error.response?.data?.message || 'Erreur lors de l\'envoi de la vérification de retrait'
      };
    }
  }
  
  /**
   * Confirmer retrait via email
   */
  async confirmWithdrawal(token: string): Promise<EmailVerificationResponse> {
    try {
      debugLog('Confirmation retrait avec token');
      
      const response = await apiClient.post('/withdrawals/confirm', {
        verification_token: token
      });
      
      return {
        success: true,
        message: 'Retrait confirmé avec succès',
        data: response.data
      };
      
    } catch (error: any) {
      console.error('Erreur confirmation retrait:', error);
      
      return {
        success: false,
        message: error.response?.data?.message || 'Token de confirmation invalide ou expiré'
      };
    }
  }
  
  /**
   * Annuler retrait via email
   */
  async cancelWithdrawal(token: string): Promise<EmailVerificationResponse> {
    try {
      debugLog('Annulation retrait avec token');
      
      const response = await apiClient.post('/withdrawals/cancel', {
        verification_token: token
      });
      
      return {
        success: true,
        message: 'Retrait annulé avec succès',
        data: response.data
      };
      
    } catch (error: any) {
      console.error('Erreur annulation retrait:', error);
      
      return {
        success: false,
        message: error.response?.data?.message || 'Erreur lors de l\'annulation du retrait'
      };
    }
  }
  
  /**
   * Obtenir les détails d'un retrait en attente de vérification
   */
  async getWithdrawalDetails(token: string): Promise<{
    success: boolean;
    data?: {
      withdrawal_id: string;
      amount: number;
      pi_address: string;
      created_at: string;
      expires_at: string;
    };
    message?: string;
  }> {
    try {
      const response = await apiClient.get(`/withdrawals/details/${token}`);
      
      return {
        success: true,
        data: response.data
      };
      
    } catch (error: any) {
      console.error('Erreur détails retrait:', error);
      
      return {
        success: false,
        message: error.response?.data?.message || 'Retrait non trouvé ou token expiré'
      };
    }
  }
  
  /**
   * Utilitaires pour formater les messages
   */
  getVerificationInstructions(type: 'registration' | 'withdrawal'): string {
    if (type === 'registration') {
      return 'Nous avons envoyé un lien de vérification à votre adresse email. Cliquez sur le lien pour activer votre compte.';
    } else {
      return 'Un email de confirmation a été envoyé. Cliquez sur le lien pour confirmer votre demande de retrait.';
    }
  }
  
  /**
   * Vérifier si un email est dans un format valide
   */
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  
  /**
   * Calculer le temps restant avant expiration d'un token
   */
  getTimeUntilExpiry(expiresAt: string): {
    expired: boolean;
    timeLeft: string;
    minutes: number;
  } {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffMs = expiry.getTime() - now.getTime();
    
    if (diffMs <= 0) {
      return {
        expired: true,
        timeLeft: 'Expiré',
        minutes: 0
      };
    }
    
    const minutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(minutes / 60);
    
    let timeLeft = '';
    if (hours > 0) {
      timeLeft = `${hours}h ${minutes % 60}min`;
    } else {
      timeLeft = `${minutes} min`;
    }
    
    return {
      expired: false,
      timeLeft,
      minutes
    };
  }
}

// Instance singleton
export const emailVerificationService = new EmailVerificationService();

// Export par défaut
export default emailVerificationService;