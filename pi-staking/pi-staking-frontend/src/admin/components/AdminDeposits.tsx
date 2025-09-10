import React, { useEffect, useMemo, useState } from 'react';
import { adminDepositsService, type AdminDeposit } from '../services/adminDepositsService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { RefreshCw, CheckCircle, XCircle } from 'lucide-react';

export function AdminDeposits() {
  const [deposits, setDeposits] = useState<AdminDeposit[]>([]);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState<'pending' | 'confirmed' | 'expired' | 'failed' | 'all'>('all');
  const [userId, setUserId] = useState<string>('');
  const [address, setAddress] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<AdminDeposit | null>(null);
  const [confirmAmount, setConfirmAmount] = useState<string>('');
  const [confirmHash, setConfirmHash] = useState<string>('');

  const totalPages = useMemo(() => (perPage ? Math.ceil(total / perPage) : 1), [total, perPage]);

  const load = async () => {
    setLoading(true);
    try {
      const resp = await adminDepositsService.list({
        page,
        per_page: perPage,
        status: status === 'all' ? undefined : status,
        user_id: userId ? Number(userId) : undefined,
        address: address || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      });
      setDeposits(resp.data);
      setTotal(resp.total);
    } catch (e: any) {
      console.error(e);
      toast.error("Erreur lors du chargement des dépôts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, perPage]);

  const onExpire = async (dep: AdminDeposit) => {
    if (!confirm(`Expirer le dépôt #${dep.id} ?`)) return;
    try {
      await adminDepositsService.expire(dep.id);
      toast.success('Dépôt expiré');
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Impossible d'expirer");
    }
  };

  const onOpenConfirm = (dep: AdminDeposit) => {
    setConfirmTarget(dep);
    setConfirmAmount(dep.amount?.toString() || '');
    setConfirmHash(dep.tx_hash || '');
    setConfirmOpen(true);
  };

  const onConfirm = async () => {
    if (!confirmTarget) return;
    const amount = Number(confirmAmount);
    const tx_hash = confirmHash.trim();
    if (!amount || !tx_hash) {
      toast.error('Montant et hash requis');
      return;
    }
    try {
      await adminDepositsService.confirm(confirmTarget.id, { amount, tx_hash });
      toast.success('Dépôt confirmé');
      setConfirmOpen(false);
      setConfirmTarget(null);
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Échec de la confirmation');
    }
  };

  const statusBadge = (s: AdminDeposit['status']) => {
    const variant = s === 'confirmed' ? 'default' : s === 'pending' ? 'secondary' : 'destructive';
    return <Badge variant={variant}>{s}</Badge>;
  };

  const formatDate = (d?: string | null) => (d ? new Date(d).toLocaleString('fr-FR') : '-');

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Dépôts</CardTitle>
        <Button onClick={load} variant="outline" size="sm"><RefreshCw className="h-4 w-4 mr-2"/>Actualiser</Button>
      </CardHeader>
      <CardContent>
        {/* Filtres */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3 mb-4">
          <div>
            <label className="text-xs text-muted-foreground">Statut</label>
            <Select value={status} onValueChange={(v: any) => setStatus(v)}>
              <SelectTrigger><SelectValue placeholder="Tous" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="pending">pending</SelectItem>
                <SelectItem value="confirmed">confirmed</SelectItem>
                <SelectItem value="expired">expired</SelectItem>
                <SelectItem value="failed">failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">User ID</label>
            <Input value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="ex: 123"/>
          </div>
          <div className="md:col-span-2">
            <label className="text-xs text-muted-foreground">Adresse</label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="contient..."/>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Du</label>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Au</label>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
          <div className="md:col-span-6 flex gap-2 justify-end">
            <Button onClick={() => { setPage(1); load(); }}>Filtrer</Button>
          </div>
        </div>

        {/* Tableau */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Adresse</TableHead>
                <TableHead className="text-right">Montant</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Tx Hash</TableHead>
                <TableHead>Créé</TableHead>
                <TableHead>Confirmé</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deposits.map((d) => (
                <TableRow key={d.id}>
                  <TableCell>#{d.id}</TableCell>
                  <TableCell>{d.user?.username || d.user_id}</TableCell>
                  <TableCell className="font-mono text-xs">{d.address?.address || d.address_id}</TableCell>
                  <TableCell className="text-right">{d.amount ?? '-'}</TableCell>
                  <TableCell>{statusBadge(d.status)}</TableCell>
                  <TableCell className="font-mono text-xs max-w-[220px] truncate" title={d.tx_hash || ''}>{d.tx_hash || '-'}</TableCell>
                  <TableCell className="text-sm">{formatDate(d.created_at)}</TableCell>
                  <TableCell className="text-sm">{formatDate(d.confirmed_at)}</TableCell>
                  <TableCell>
                    {d.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" className="text-yellow-600" onClick={() => onExpire(d)}>
                          <XCircle className="h-4 w-4 mr-1"/> Expire
                        </Button>
                        <Button size="sm" variant="ghost" className="text-green-600" onClick={() => onOpenConfirm(d)}>
                          <CheckCircle className="h-4 w-4 mr-1"/> Confirm
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {deposits.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-sm text-muted-foreground">Aucun dépôt</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination simple */}
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-muted-foreground">
            {total} éléments — page {page}/{totalPages || 1}
          </div>
          <div className="flex items-center gap-2">
            <Select value={String(perPage)} onValueChange={(v) => { setPerPage(Number(v)); setPage(1); }}>
              <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 / page</SelectItem>
                <SelectItem value="20">20 / page</SelectItem>
                <SelectItem value="50">50 / page</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Préc.</Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Suiv.</Button>
          </div>
        </div>
      </CardContent>

      {/* Dialog confirmation manuelle */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmer le dépôt #{confirmTarget?.id}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Montant (π)</Label>
              <Input type="number" step="0.00000001" value={confirmAmount} onChange={(e) => setConfirmAmount(e.target.value)} />
            </div>
            <div>
              <Label>Tx Hash</Label>
              <Input value={confirmHash} onChange={(e) => setConfirmHash(e.target.value)} />
            </div>
            <div className="flex gap-2 pt-2 justify-end">
              <Button onClick={() => setConfirmOpen(false)} variant="outline">Annuler</Button>
              <Button onClick={onConfirm} className="bg-green-600 text-white hover:bg-green-700">Confirmer</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export default AdminDeposits;
