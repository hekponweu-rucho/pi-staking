import api from '@/lib/api';

export interface AdminDeposit {
  id: number;
  user_id: number;
  address_id: number;
  amount: number | null;
  tx_hash: string | null;
  status: 'pending' | 'confirmed' | 'expired' | 'failed';
  confirmed_at?: string | null;
  created_at: string;
  updated_at: string;
  user?: { id: number; username: string; email: string };
  address?: { id: number; address: string };
}

export interface ListDepositsParams {
  status?: 'pending' | 'confirmed' | 'expired' | 'failed';
  user_id?: number;
  address?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  per_page?: number;
}

class AdminDepositsService {
  private baseUrl = '/api/admin/deposits';

  async list(params: ListDepositsParams = {}) {
    const res = await api.get(this.baseUrl, { params });
    return res.data.data as {
      data: AdminDeposit[];
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
    };
  }

  async expire(id: number) {
    const res = await api.post(`${this.baseUrl}/${id}/expire`);
    return res.data;
    }

  async confirm(id: number, payload: { amount: number; tx_hash: string }) {
    const res = await api.post(`${this.baseUrl}/${id}/confirm`, payload);
    return res.data;
  }
}

export const adminDepositsService = new AdminDepositsService();
export default adminDepositsService;
