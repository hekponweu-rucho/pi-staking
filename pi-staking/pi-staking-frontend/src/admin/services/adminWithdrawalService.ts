import api from '@/lib/api-enhanced';

export interface WithdrawalItem {
  id: number;
  user: { id: number; username: string; email: string };
  amount: number;
  net_amount: number;
  fee_amount: number;
  status: string;
  destination_address?: string;
  transaction_hash?: string;
  created_at: string;
  processed_at?: string;
}

export interface Pagination<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

class AdminWithdrawalService {
  async getWithdrawals(status?: string, page = 1, per_page = 20) {
    const params = new URLSearchParams({ page: String(page), per_page: String(per_page) });
    if (status) params.set('status', status);
    const res = await api.get(`/admin/withdrawals?${params}`);
    return res.data as { success: boolean; data: Pagination<WithdrawalItem> };
  }

  async completeWithdrawal(id: number, tx_hash?: string) {
    const res = await api.post(`/admin/withdrawals/${id}/complete`, { tx_hash });
    return res.data as { success: boolean; message: string };
  }

  async rejectWithdrawal(id: number, reason?: string) {
    const res = await api.post(`/admin/withdrawals/${id}/reject`, { reason });
    return res.data as { success: boolean; message: string };
  }
}

export const adminWithdrawalService = new AdminWithdrawalService();
export default adminWithdrawalService;
