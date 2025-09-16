import api from '../lib/api-enhanced';

// Types pour les transactions
export interface Transaction {
  id: string;
  user_id: string;
  type: 'deposit' | 'withdrawal' | 'investment' | 'claim' | 'bonus' | 'fee';
  amount: number;
  balance_before: number;
  balance_after: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  description: string;
  reference_id: string | null;
  transaction_hash: string | null;
  fee_amount: number;
  created_at: string;
  updated_at: string;
  processed_at: string | null;
  metadata: Record<string, any>;
}

export interface WithdrawalRequest {
  id: string;
  user_id: string;
  amount: number;
  fee_amount: number;
  net_amount: number;
  destination_address: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  verification_code: string | null;
  verification_expires_at: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  processed_at: string | null;
  processed_by: string | null;
}

export interface TransactionLimits {
  daily_withdrawal_limit: number;
  monthly_withdrawal_limit: number;
  minimum_withdrawal: number;
  maximum_withdrawal: number;
  withdrawal_fee_percentage: number;
  withdrawal_fee_minimum: number;
  used_today: number;
  used_this_month: number;
  remaining_today: number;
  remaining_this_month: number;
}

export interface TransactionStats {
  total_deposits: number;
  total_withdrawals: number;
  total_investments: number;
  total_claims: number;
  total_fees_paid: number;
  net_balance_change: number;
  transaction_count: number;
  average_transaction_amount: number;
  last_transaction_date: string | null;
  monthly_summary: {
    current_month: {
      deposits: number;
      withdrawals: number;
      investments: number;
      claims: number;
      net_change: number;
    };
    last_month: {
      deposits: number;
      withdrawals: number;
      investments: number;
      claims: number;
      net_change: number;
    };
    growth_percentage: number;
  };
}

export interface WithdrawalCalculation {
  gross_amount: number;
  fee_amount: number;
  fee_percentage: number;
  net_amount: number;
  minimum_fee: number;
  can_withdraw: boolean;
  reasons: string[];
}

class TransactionsService {
  
  // Récupérer l'historique des transactions
  async getTransactionHistory(
    page: number = 1,
    limit: number = 20,
    type?: string,
    status?: string,
    startDate?: string,
    endDate?: string
  ): Promise<{
    success: boolean;
    data: {
      transactions: Transaction[];
      pagination: {
        current_page: number;
        total_pages: number;
        total_items: number;
        per_page: number;
      };
      summary: {
        total_amount: number;
        count_by_type: Record<string, number>;
        count_by_status: Record<string, number>;
      };
    };
  }> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(type && { type }),
        ...(status && { status }),
        ...(startDate && { start_date: startDate }),
        ...(endDate && { end_date: endDate })
      });

      const response = await api.get(`/transactions?${params}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'historique:', error);
      throw error;
    }
  }

  // Récupérer les limites et statistiques
  async getLimitsAndStats(): Promise<{
    success: boolean;
    data: {
      limits: TransactionLimits;
      stats: TransactionStats;
    };
  }> {
    try {
      const response = await api.get('/transactions/limits');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des limites:', error);
      throw error;
    }
  }

  // Créer une demande de retrait
  async createWithdrawal(
    amount: number,
    destinationAddress: string,
    verificationCode?: string
  ): Promise<{
    success: boolean;
    data: {
      withdrawal_id: string;
      amount: number;
      fee_amount: number;
      net_amount: number;
      estimated_processing_time: string;
      requires_verification: boolean;
    };
    message: string;
  }> {
    try {
      const response = await api.post('/transactions/withdrawal', {
        amount,
        destination_address: destinationAddress,
        verification_code: verificationCode
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création du retrait:', error);
      throw error;
    }
  }

  // Récupérer les demandes de retrait
  async getWithdrawalRequests(
    page: number = 1,
    status?: string
  ): Promise<{
    success: boolean;
    data: {
      withdrawals: WithdrawalRequest[];
      pagination: any;
      summary: {
        total_pending: number;
        total_processing: number;
        total_amount_pending: number;
      };
    };
  }> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        ...(status && { status })
      });

      const response = await api.get(`/transactions/withdrawals?${params}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des retraits:', error);
      throw error;
    }
  }

  // Annuler une demande de retrait
  async cancelWithdrawal(withdrawalId: string, reason?: string): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const response = await api.patch(`/transactions/withdrawal/${withdrawalId}/cancel`, {
        reason
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de l\'annulation du retrait:', error);
      throw error;
    }
  }

  // Calculer les frais de retrait
  async calculateWithdrawalFee(amount: number): Promise<{
    success: boolean;
    data: WithdrawalCalculation;
  }> {
    try {
      // Récupérer les limites pour obtenir les frais
      const limitsResponse = await this.getLimitsAndStats();
      if (!limitsResponse.success) throw new Error('Impossible de récupérer les limites');

      const limits = limitsResponse.data.limits;
      const feePercentage = limits.withdrawal_fee_percentage;
      const minimumFee = limits.withdrawal_fee_minimum;
      
      const feeAmount = Math.max(amount * feePercentage, minimumFee);
      const netAmount = amount - feeAmount;

      const canWithdraw = 
        amount >= limits.minimum_withdrawal &&
        amount <= limits.maximum_withdrawal &&
        amount <= limits.remaining_today &&
        amount <= limits.remaining_this_month;

      const reasons: string[] = [];
      if (amount < limits.minimum_withdrawal) {
        reasons.push(`Montant minimum: ${limits.minimum_withdrawal} Pi`);
      }
      if (amount > limits.maximum_withdrawal) {
        reasons.push(`Montant maximum: ${limits.maximum_withdrawal} Pi`);
      }
      if (amount > limits.remaining_today) {
        reasons.push(`Limite quotidienne dépassée. Restant: ${limits.remaining_today} Pi`);
      }
      if (amount > limits.remaining_this_month) {
        reasons.push(`Limite mensuelle dépassée. Restant: ${limits.remaining_this_month} Pi`);
      }

      return {
        success: true,
        data: {
          gross_amount: amount,
          fee_amount: feeAmount,
          fee_percentage: feePercentage * 100,
          net_amount: netAmount,
          minimum_fee: minimumFee,
          can_withdraw: canWithdraw,
          reasons
        }
      };
    } catch (error) {
      console.error('Erreur lors du calcul des frais:', error);
      throw error;
    }
  }

  // Récupérer les statistiques détaillées pour une période
  async getDetailedStats(period: 'week' | 'month' | 'year' = 'month'): Promise<{
    success: boolean;
    data: {
      period_stats: TransactionStats;
      daily_breakdown: Array<{
        date: string;
        deposits: number;
        withdrawals: number;
        investments: number;
        claims: number;
        net_change: number;
      }>;
      type_distribution: Array<{
        type: string;
        amount: number;
        count: number;
        percentage: number;
      }>;
      status_distribution: Array<{
        status: string;
        count: number;
        percentage: number;
      }>;
    };
  }> {
    try {
      const response = await api.get(`/transactions/stats?period=${period}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques détaillées:', error);
      throw error;
    }
  }

  // Exporter l'historique des transactions
  async exportTransactions(
    format: 'csv' | 'excel' | 'pdf' = 'csv',
    startDate?: string,
    endDate?: string,
    type?: string
  ): Promise<{
    success: boolean;
    data: {
      download_url: string;
      filename: string;
      expires_at: string;
    };
    message: string;
  }> {
    try {
      const params = new URLSearchParams({
        format,
        ...(startDate && { start_date: startDate }),
        ...(endDate && { end_date: endDate }),
        ...(type && { type })
      });

      const response = await api.post(`/transactions/export?${params}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de l\'export des transactions:', error);
      throw error;
    }
  }

  // Récupérer les détails d'une transaction spécifique
  async getTransactionDetails(transactionId: string): Promise<{
    success: boolean;
    data: Transaction & {
      related_transactions: Transaction[];
      verification_details: any;
      processing_timeline: Array<{
        status: string;
        timestamp: string;
        description: string;
        processed_by: string | null;
      }>;
    };
  }> {
    try {
      const response = await api.get(`/transactions/${transactionId}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des détails de la transaction:', error);
      throw error;
    }
  }

  // Rechercher des transactions
  async searchTransactions(
    query: string,
    filters?: {
      type?: string;
      status?: string;
      amount_min?: number;
      amount_max?: number;
      date_from?: string;
      date_to?: string;
    }
  ): Promise<{
    success: boolean;
    data: {
      transactions: Transaction[];
      total_results: number;
      search_summary: {
        total_amount: number;
        types_found: string[];
        date_range: { from: string; to: string };
      };
    };
  }> {
    try {
      const params = new URLSearchParams({
        q: query,
        ...(filters?.type && { type: filters.type }),
        ...(filters?.status && { status: filters.status }),
        ...(filters?.amount_min && { amount_min: filters.amount_min.toString() }),
        ...(filters?.amount_max && { amount_max: filters.amount_max.toString() }),
        ...(filters?.date_from && { date_from: filters.date_from }),
        ...(filters?.date_to && { date_to: filters.date_to })
      });

      const response = await api.get(`/transactions/search?${params}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la recherche de transactions:', error);
      throw error;
    }
  }

  // === UTILITAIRES ===

  // Formater le type de transaction pour l'affichage
  formatTransactionType(type: string): { label: string; icon: string; color: string } {
    const types: Record<string, { label: string; icon: string; color: string }> = {
      deposit: { label: 'Dépôt', icon: '⬇️', color: '#10B981' },
      withdrawal: { label: 'Retrait', icon: '⬆️', color: '#EF4444' },
      investment: { label: 'Investissement', icon: '📈', color: '#3B82F6' },
      claim: { label: 'Réclamation', icon: '💰', color: '#F59E0B' },
      bonus: { label: 'Bonus', icon: '🎁', color: '#8B5CF6' },
      fee: { label: 'Frais', icon: '💸', color: '#6B7280' }
    };

    return types[type] || { label: type, icon: '❓', color: '#6B7280' };
  }

  // Formater le statut de transaction pour l'affichage
  formatTransactionStatus(status: string): { label: string; color: string; bgColor: string } {
    const statuses: Record<string, { label: string; color: string; bgColor: string }> = {
      pending: { label: 'En attente', color: '#F59E0B', bgColor: '#FEF3C7' },
      processing: { label: 'En cours', color: '#3B82F6', bgColor: '#DBEAFE' },
      completed: { label: 'Terminé', color: '#10B981', bgColor: '#D1FAE5' },
      failed: { label: 'Échec', color: '#EF4444', bgColor: '#FEE2E2' },
      cancelled: { label: 'Annulé', color: '#6B7280', bgColor: '#F3F4F6' }
    };

    return statuses[status] || { label: status, color: '#6B7280', bgColor: '#F3F4F6' };
  }

  // Calculer le temps estimé de traitement
  getEstimatedProcessingTime(type: string, amount: number): string {
    if (type === 'withdrawal') {
      if (amount < 100) return '2-4 heures';
      if (amount < 1000) return '4-8 heures';
      if (amount < 10000) return '8-24 heures';
      return '1-3 jours ouvrés';
    }
    
    if (type === 'deposit') return 'Instantané';
    if (type === 'investment') return 'Instantané';
    if (type === 'claim') return 'Instantané';
    
    return 'Variable';
  }

  // Grouper les transactions par date
  groupTransactionsByDate(transactions: Transaction[]): Record<string, Transaction[]> {
    return transactions.reduce((groups, transaction) => {
      const date = new Date(transaction.created_at).toLocaleDateString('fr-FR');
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(transaction);
      return groups;
    }, {} as Record<string, Transaction[]>);
  }

  // Calculer les tendances des transactions
  calculateTransactionTrends(transactions: Transaction[]): {
    daily_average: number;
    weekly_growth: number;
    most_active_day: string;
    most_common_type: string;
    largest_transaction: Transaction;
  } {
    if (transactions.length === 0) {
      return {
        daily_average: 0,
        weekly_growth: 0,
        most_active_day: 'Aucun',
        most_common_type: 'Aucun',
        largest_transaction: {} as Transaction
      };
    }

    // Calculer la moyenne quotidienne
    const totalAmount = transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const dailyAverage = totalAmount / 30; // Moyenne sur 30 jours

    // Trouver le jour le plus actif
    const transactionsByDay = this.groupTransactionsByDate(transactions);
    const mostActiveDay = Object.entries(transactionsByDay)
      .sort((a, b) => b[1].length - a[1].length)[0]?.[0] || 'Aucun';

    // Type le plus commun
    const typeCount: Record<string, number> = {};
    transactions.forEach(t => {
      typeCount[t.type] = (typeCount[t.type] || 0) + 1;
    });
    const mostCommonType = Object.entries(typeCount)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'Aucun';

    // Plus grande transaction
    const largestTransaction = transactions.reduce((max, t) => 
      Math.abs(t.amount) > Math.abs(max.amount) ? t : max
    );

    return {
      daily_average: dailyAverage,
      weekly_growth: 0, // À calculer avec plus de données historiques
      most_active_day: mostActiveDay,
      most_common_type: mostCommonType,
      largest_transaction: largestTransaction
    };
  }

  // Formater les montants Pi
  formatPiAmount(amount: number, showSign: boolean = false): string {
    const sign = showSign && amount > 0 ? '+' : '';
    return `${sign}${amount.toLocaleString('fr-FR', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 4 
    })} Pi`;
  }

  // Valider une adresse de retrait
  validateWithdrawalAddress(address: string): {
    is_valid: boolean;
    error_message?: string;
    address_type?: string;
  } {
    // Validation basique pour une adresse Pi Network (simulation)
    if (!address || address.length === 0) {
      return {
        is_valid: false,
        error_message: 'L\'adresse ne peut pas être vide'
      };
    }

    if (address.length < 20 || address.length > 100) {
      return {
        is_valid: false,
        error_message: 'L\'adresse doit faire entre 20 et 100 caractères'
      };
    }

    // Vérifier le format (simulation)
    if (!/^[A-Za-z0-9]+$/.test(address)) {
      return {
        is_valid: false,
        error_message: 'L\'adresse contient des caractères invalides'
      };
    }

    return {
      is_valid: true,
      address_type: 'pi_network'
    };
  }
}

export const transactionsService = new TransactionsService();
export default transactionsService;