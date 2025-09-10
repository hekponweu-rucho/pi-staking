import api from '@/lib/api-enhanced';

export interface DepositRequestResponse {
  id: string;
  address: string;
  expires_at: string; // ISO string
}

export interface DepositStatusResponse {
  status: 'pending' | 'confirmed' | 'expired' | string;
  amount?: number;
  tx_hash?: string;
  address: string;
  expires_at: string;
}

class DepositService {
  async requestDeposit(): Promise<DepositRequestResponse> {
    try {
      const res = await api.post('/deposit/request');
      return res.data;
    } catch (error: any) {
      if (error?.response?.status === 409) {
        const data = error.response.data;
        throw Object.assign(new Error(data?.message || 'Adresse déjà attribuée'), { status: 409, data });
      }
      if (error?.response?.status === 503) {
        throw Object.assign(new Error('Pas d\'adresse de dépôt disponible. Réessayez plus tard.'), { status: 503 });
      }
      throw error;
    }
  }

  async getDepositStatus(id: string): Promise<DepositStatusResponse> {
    const res = await api.get(`/deposit/status/${id}`);
    return res.data;
  }
}

export const depositService = new DepositService();
export default depositService;
