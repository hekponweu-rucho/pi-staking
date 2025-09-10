import api from '@/lib/api';

export type DepositStatus = 'pending' | 'confirmed' | 'expired' | 'failed';

export interface AdminDeposit {
  id: number;
  user_id: number;
  user?: { id: number; username: string; email: string };
  address: string;
  amount: number;
  status: DepositStatus;
  tx_hash?: string | null;
  detected_at?: string | null;
  confirmed_at?: string | null;
  expires_at?: string | null;
  created_at: string;
}

class AdminDepositsService {
  private baseUrl = '/api/admin/deposits';

  async list(params: {
    page?: number;
    per_page?: number;
    status?: DepositStatus;
    user_id?: number;
    address?: string;
    date_from?: string;
    date_to?: string;
  } = {}): Promise<{ data: AdminDeposit[]; current_page: number; last_page: number; total: number; per_page: number; }> {
    const res = await api.get(this.baseUrl, { params });
    return res.data.data;
  }

  async confirm(id: number): Promise<AdminDeposit> {
    const res = await api.post(`${this.baseUrl}/${id}/confirm`);
    return res.data.data;
  }

  async expire(id: number): Promise<AdminDeposit> {
    const res = await api.post(`${this.baseUrl}/${id}/expire`);
    return res.data.data;
  }
}

export const adminDepositsService = new AdminDepositsService();
export default adminDepositsService;
