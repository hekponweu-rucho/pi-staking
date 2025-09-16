import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCw, CheckCircle, XCircle, Search } from 'lucide-react';
import adminService from '../services/adminService';

interface Withdrawal {
  id: number;
  user_id: number;
  amount: number;
  status: string;
  created_at: string;
  processed_at?: string;
  rejection_reason?: string;
  user?: {
    id: number;
    username: string;
    email: string;
  }
}

export function AdminWithdrawals() {
  const [items, setItems] = useState<Withdrawal[]>([]);
  const [status, setStatus] = useState<'pending' | 'reviewing' | 'approved' | 'processing' | 'completed' | 'rejected' | 'cancelled'>('pending');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [total, setTotal] = useState(0);
  const [modal, setModal] = useState<{open: boolean; id?: number; action?: 'approve' | 'reject'; reason?: string}>({ open: false });
  const [search, setSearch] = useState('');

  const load = async () => {
    const res = await adminService.getWithdrawals({ status, page, per_page: perPage });
    setItems(res.data?.data || res.data?.items || res.data || []);
    const meta = res.data?.meta || res.meta;
    setTotal(meta?.total || (res.data?.total ?? 0));
  };

  useEffect(() => { load(); }, [status, page, perPage]);

  const onConfirm = async () => {
    if (!modal.id || !modal.action) return;
    await adminService.updateWithdrawal(modal.id, { action: modal.action, reason: modal.reason });
    setModal({ open: false });
    await load();
  };

  const formatCurrency = (n: number) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 8 }).format(n);
  const formatDate = (s: string) => new Date(s).toLocaleString('fr-FR');

  const filtered = items.filter(w => !search || w.user?.username?.toLowerCase().includes(search.toLowerCase()) || String(w.user_id).includes(search));

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Retraits en attente</CardTitle>
        <div className="flex gap-2 items-center">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher par user/id" className="pl-8 w-56" />
          </div>
          <Select value={status} onValueChange={(v: any) => setStatus(v)}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">En attente</SelectItem>
              <SelectItem value="reviewing">En révision</SelectItem>
              <SelectItem value="approved">Approuvés</SelectItem>
              <SelectItem value="rejected">Rejetés</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={load}><RefreshCw className="h-4 w-4 mr-2" />Actualiser</Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Utilisateur</TableHead>
              <TableHead>Montant</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Créé</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(w => (
              <TableRow key={w.id}>
                <TableCell>#{w.id}</TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{w.user?.username || w.user_id}</span>
                    <span className="text-xs text-muted-foreground">{w.user?.email}</span>
                  </div>
                </TableCell>
                <TableCell className="font-mono">{formatCurrency(w.amount)} Pi</TableCell>
                <TableCell>
                  <Badge variant={w.status === 'pending' || w.status === 'reviewing' ? 'secondary' : w.status === 'rejected' ? 'destructive' : 'default'} className="capitalize">
                    {w.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">{w.created_at ? formatDate(w.created_at) : '-'}</TableCell>
                <TableCell>
                  {(w.status === 'pending' || w.status === 'reviewing') && (
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" className="text-green-600" onClick={() => setModal({ open: true, id: w.id, action: 'approve' })}>
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-red-600" onClick={() => setModal({ open: true, id: w.id, action: 'reject' })}>
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>

      <Dialog open={modal.open} onOpenChange={(o) => setModal({ open: o })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{modal.action === 'approve' ? 'Approuver le retrait' : 'Rejeter le retrait'}</DialogTitle>
          </DialogHeader>
          {modal.action === 'reject' && (
            <div className="space-y-2">
              <Label>Raison du rejet</Label>
              <Input value={modal.reason || ''} onChange={e => setModal({ ...modal, reason: e.target.value })} placeholder="Motif obligatoire" />
            </div>
          )}
          <div className="flex gap-2 justify-end pt-4">
            <Button variant="outline" onClick={() => setModal({ open: false })}>Annuler</Button>
            <Button onClick={onConfirm} className={modal.action === 'approve' ? 'bg-green-600 hover:bg-green-700 text-white' : ''}>{modal.action === 'approve' ? 'Approuver' : 'Rejeter'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export default AdminWithdrawals;
