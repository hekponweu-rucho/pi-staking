import api from '../lib/api-enhanced';

// Types pour le système de parrainage
export interface ReferralInfo {
  referral_code: string;
  referral_url: string;
  direct_referrals: number;
  total_commissions: number;
  this_month_commissions: number;
  commissions_by_level: {
    level_1: number;
    level_2: number;
    level_3: number;
  };
  recent_earnings: Array<{
    amount: number;
    level: number;
    referred_user: string;
    date: string;
  }>;
  commission_rates: {
    level_1: string;
    level_2: string;
    level_3: string;
  };
  min_qualifying_investment: number;
}

export interface ReferralTree {
  level_1: ReferralMember[];
  level_2: ReferralMember[];
  level_3: ReferralMember[];
}

export interface ReferralMember {
  id: number;
  username: string;
  qualified_at: string;
  qualifying_investment: number;
  bonus_earned: number;
  status: string;
  status_label: string;
  total_invested: number;
}

export interface ReferralEarning {
  id: number;
  amount: number;
  type: string;
  status: string;
  description: string;
  created_at: string;
  metadata: {
    referral_id: number;
    referred_user_id: number;
    level: number;
    qualifying_investment: number;
  };
}

export interface ReferralStats {
  overview: ReferralInfo;
  tree: ReferralTree;
  monthly_progression: Array<{
    month: string;
    earnings: number;
  }>;
}

export interface CodeValidationResponse {
  valid: boolean;
  referrer?: {
    username: string;
    level: string;
  };
}

class ReferralService {
  /**
   * Obtenir les informations de parrainage de l'utilisateur
   */
  async getReferralInfo(): Promise<ReferralInfo> {
    try {
      const response = await api.get<{ success: boolean; data: ReferralInfo }>('/referrals/info');
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error('Erreur lors de la récupération des informations de parrainage');
    } catch (error) {
      console.error('Erreur getReferralInfo:', error);
      throw error;
    }
  }

  /**
   * Obtenir l'arbre de parrainage (filleuls par niveau)
   */
  async getReferralTree(levels = 3): Promise<ReferralTree> {
    try {
      const response = await api.get<{ success: boolean; data: ReferralTree }>(
        `/referrals/tree?levels=${levels}`
      );
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error('Erreur lors de la récupération de l\'arbre de parrainage');
    } catch (error) {
      console.error('Erreur getReferralTree:', error);
      throw error;
    }
  }

  /**
   * Obtenir l'historique des gains de parrainage avec pagination
   */
  async getReferralEarnings(page = 1): Promise<{ data: ReferralEarning[]; total: number; hasMore: boolean }> {
    try {
      const response = await api.get<{
        success: boolean;
        data: {
          data: ReferralEarning[];
          current_page: number;
          last_page: number;
          total: number;
        };
      }>(`/referrals/earnings?page=${page}`);
      
      if (response.data.success) {
        const { data, current_page, last_page, total } = response.data.data;
        return {
          data,
          total,
          hasMore: current_page < last_page
        };
      }
      throw new Error('Erreur lors de la récupération des gains de parrainage');
    } catch (error) {
      console.error('Erreur getReferralEarnings:', error);
      throw error;
    }
  }

  /**
   * Obtenir les statistiques détaillées de parrainage
   */
  async getDetailedStats(): Promise<ReferralStats> {
    try {
      const response = await api.get<{ success: boolean; data: ReferralStats }>('/referrals/stats');
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error('Erreur lors de la récupération des statistiques détaillées');
    } catch (error) {
      console.error('Erreur getDetailedStats:', error);
      throw error;
    }
  }

  /**
   * Valider un code de parrainage
   */
  async validateReferralCode(code: string): Promise<CodeValidationResponse> {
    try {
      const response = await api.post<{ success: boolean; data: CodeValidationResponse }>(
        '/referrals/validate-code',
        { code }
      );
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error('Erreur lors de la validation du code de parrainage');
    } catch (error) {
      console.error('Erreur validateReferralCode:', error);
      throw error;
    }
  }

  /**
   * Partager le lien de parrainage
   */
  async shareReferralLink(referralUrl: string, referralCode: string): Promise<boolean> {
    const shareData = {
      title: 'Rejoignez Pi Staking',
      text: `Utilisez mon code de parrainage ${referralCode} pour commencer à gagner des Pi !`,
      url: referralUrl,
    };

    try {
      // Utiliser l'API Web Share si disponible
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
        return true;
      }
      
      // Fallback : copier dans le presse-papiers
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(
          `Rejoignez Pi Staking avec mon code de parrainage ${referralCode}: ${referralUrl}`
        );
        return true;
      }
      
      // Fallback legacy pour les anciens navigateurs
      const textArea = document.createElement('textarea');
      textArea.value = `Rejoignez Pi Staking avec mon code de parrainage ${referralCode}: ${referralUrl}`;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      return true;
    } catch (error) {
      console.error('Erreur lors du partage:', error);
      throw new Error('Impossible de partager le lien');
    }
  }

  /**
   * Calculer les gains potentiels par niveau
   */
  calculatePotentialEarnings(investmentAmount: number): {
    level_1: number;
    level_2: number;
    level_3: number;
    total: number;
  } {
    const rates = {
      level_1: 0.05, // 5%
      level_2: 0.03, // 3%
      level_3: 0.01, // 1%
    };

    const earnings = {
      level_1: investmentAmount * rates.level_1,
      level_2: investmentAmount * rates.level_2,
      level_3: investmentAmount * rates.level_3,
    };

    return {
      ...earnings,
      total: earnings.level_1 + earnings.level_2 + earnings.level_3,
    };
  }

  /**
   * Formater les montants en Pi avec suffixe
   */
  formatPiAmount(amount: number): string {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M Pi`;
    }
    if (amount >= 1000) {
      return `${(amount / 1000).toFixed(1)}K Pi`;
    }
    return `${amount.toFixed(2)} Pi`;
  }

  /**
   * Obtenir le pourcentage de commission pour un niveau
   */
  getCommissionRate(level: number): string {
    const rates = {
      1: '5%',
      2: '3%',
      3: '1%',
    };
    return rates[level as keyof typeof rates] || '0%';
  }

  /**
   * Vérifier si un montant qualifie pour le parrainage
   */
  isQualifyingAmount(amount: number): boolean {
    return amount >= 50; // MIN_QUALIFYING_INVESTMENT
  }
}

export default new ReferralService();