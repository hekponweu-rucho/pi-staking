import api from '@/lib/api-enhanced';

export interface DepositAddress {
  id: number;
  address: string;
  label?: string;
  is_active: boolean;
  usage_count: number;
  created_at: string;
}

export interface DepositSessionItem {
  id: number;
  user: { id: number; username: string; email: string };
  address: { id: number; address: string; label?: string };
  memo: string;
  amount_requested?: number;
  status: 'pending' | 'confirmed' | 'expired' | 'cancelled';
  confirmations_required: number;
  confirmations: number;
  credited_amount?: number;
  tx_hash?: string;
  expires_at: string;
  created_at: string;
}

export interface Pagination<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

class AdminDepositService {
  async getAddresses() {
    const res = await api.get('/admin/deposits/addresses');
    return res.data as { success: boolean; data: DepositAddress[] };
  }

  async createAddress(address: string, label?: string, is_active = true) {
    const res = await api.post('/admin/deposits/addresses', { address, label, is_active });
    return res.data as { success: boolean; data: DepositAddress };
  }

  async updateAddress(id: number, payload: Partial<Pick<DepositAddress, 'label' | 'is_active'>>) {
    const res = await api.patch(`/admin/deposits/addresses/${id}`, payload);
    return res.data as { success: boolean; data: DepositAddress };
  }

  async deleteAddress(id: number) {
    const res = await api.delete(`/admin/deposits/addresses/${id}`);
    return res.data as { success: boolean; message: string };
  }

  async getSessions(status?: string, page = 1, per_page = 20) {
    const params = new URLSearchParams({ page: String(page), per_page: String(per_page) });
    if (status) params.set('status', status);
    const res = await api.get(`/admin/deposits/sessions?${params}`);
    return res.data as { success: boolean; data: Pagination<DepositSessionItem> };
  }

  async confirmSession(sessionId: number, credited_amount: number, tx_hash?: string) {
    const res = await api.post(`/admin/deposits/sessions/${sessionId}/confirm`, {
      credited_amount,
      tx_hash,
    });
    return res.data as { success: boolean; message: string };
  }
}

export const adminDepositService = new AdminDepositService();
export default adminDepositService;
