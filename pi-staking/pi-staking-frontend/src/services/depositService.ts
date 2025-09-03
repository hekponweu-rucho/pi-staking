import api from '../lib/api-enhanced';

export interface DepositSession {
  id: string;
  address: string;
  memo: string;
  expires_at: string;
  confirmations_required: number;
}

export interface DepositStatus {
  status: 'pending' | 'confirmed' | 'expired' | 'cancelled';
  confirmations: number;
  credited_amount?: number;
  tx_hash?: string;
  updated_at?: string;
}

class DepositService {
  async startDepositSession(amount?: number): Promise<{ success: boolean; data: DepositSession; message?: string }>{
    try {
      const response = await api.post('/transactions/deposits/session', amount ? { amount } : undefined);
      const payload = response?.data?.data ?? response?.data ?? {};
      const session: DepositSession = {
        id: String(payload?.session_id ?? payload?.id ?? ''),
        address: String(payload?.address ?? ''),
        memo: String(payload?.memo ?? ''),
        expires_at: String(payload?.expires_at ?? new Date(Date.now() + 30*60*1000).toISOString()),
        confirmations_required: Number(payload?.confirmations_required ?? 1)
      };
      return { success: true, data: session, message: response?.data?.message };
    } catch (error) {
      console.error('Erreur démarrage session dépôt:', error);
      throw error;
    }
  }

  async getDepositStatus(sessionId: string): Promise<{ success: boolean; data: DepositStatus }>{
    try {
      const response = await api.get(`/transactions/deposits/session/${sessionId}`);
      const payload = response?.data?.data ?? response?.data ?? {};
      const status: DepositStatus = {
        status: (payload?.status ?? 'pending') as DepositStatus['status'],
        confirmations: Number(payload?.confirmations ?? 0),
        credited_amount: payload?.credited_amount != null ? Number(payload?.credited_amount) : undefined,
        tx_hash: payload?.tx_hash,
        updated_at: payload?.updated_at
      };
      return { success: true, data: status };
    } catch (error) {
      console.error('Erreur statut dépôt:', error);
      throw error;
    }
  }

  async cancelDepositSession(sessionId: string): Promise<{ success: boolean; message?: string }>{
    try {
      const response = await api.post(`/transactions/deposits/session/${sessionId}/cancel`);
      return response.data;
    } catch (error) {
      console.error('Erreur annulation session dépôt:', error);
      throw error;
    }
  }
}

export const depositService = new DepositService();
export default depositService;
