import React, { useEffect, useMemo, useState } from 'react';
import { adminDepositsService, type AdminDeposit, type DepositStatus } from '../services/adminDepositsService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, CheckCircle, XCircle, Filter } from 'lucide-react';

export default function AdminDeposits() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<AdminDeposit[]>([]);
  const [pagination, setPagination] = useState({ current_page: 1, per_page: 20, last_page: 1, total: 0 });

  const [status, setStatus] = useState<DepositStatus | 'all'>('all');
  const [userId, setUserId] = useState<string>('');
  const [address, setAddress] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const load = async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminDepositsService.list({
        page,
        per_page: pagination.per_page,
        status: status === 'all' ? undefined : status,
        user_id: userId ? Number(userId) : undefined,
        address: address || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      });
      // API renvoie data: paginator; ici on suppose res contient paginator
      // res: { data: AdminDeposit[]; current_page; last_page; per_page; total }
      // Adapter selon backend
      // @ts-ignore
      setItems(res.data || res);
      // @ts-ignore
      setPagination({
        // @ts-ignore
        current_page: res.current_page ?? page,
        // @ts-ignore
        per_page: res.per_page ?? pagination.per_page,
        // @ts-ignore
        last_page: res.last_page ?? 1,
        // @ts-ignore
        total: res.total ?? (res.data?.length || 0),
      });
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Erreur chargement dépôts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onConfirm = async (id: number) => {
    if (!window.confirm('Confirmer ce dépôt et créditer le solde utilisateur ?')) return;
    setLoading(true);
    try {
      await adminDepositsService.confirm(id);
      window.alert('Dépôt confirmé');
      await load(pagination.current_page);
    } catch (e: any) {
      window.alert(e?.response?.data?.message || 'Erreur lors de la confirmation');
    } finally {
      setLoading(false);
    }
  };

  const onExpire = async (id: number) => {
    if (!window.confirm('Forcer l\'expiration de ce dépôt ?')) return;
    setLoading(true);
    try {
      await adminDepositsService.expire(id);
      window.alert('Dépôt expiré');
      await load(pagination.current_page);
    } catch (e: any) {
      window.alert(e?.response?.data?.message || 'Erreur lors de l\'expiration');
    } finally {
      setLoading(false);
    }
  };

  const statusBadge = (s: DepositStatus) => {
    const variant = s === 'confirmed' ? 'default' : s === 'pending' ? 'secondary' : 'destructive';
    return <Badge variant={variant as any} className="capitalize">{s}</Badge>;
  };

  const formatAmount = (n: number) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 8 }).format(n);
  const formatDate = (d?: string | null) => d ? new Date(d).toLocaleString('fr-FR') : '-';

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Dépôts</CardTitle>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => load(1)} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" /> Actualiser
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 grid grid-cols-1 md:grid-cols-5 gap-3">
          <div>
            <Label>Statut</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as any)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Tous" />
              </SelectTrigger>
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
            <Label>Utilisateur (ID)</Label>
            <Input value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="ex: 42" />
          </div>
          <div>
            <Label>Adresse</Label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="0x..." />
          </div>
          <div>
            <Label>Du</Label>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div>
            <Label>Au</Label>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
          <div className="md:col-span-5 flex justify-end">
            <Button onClick={() => load(1)} disabled={loading}>
              <Filter className="h-4 w-4 mr-2" /> Filtrer
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">{error}</div>
        )}

        <div className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Utilisateur</TableHead>
                <TableHead>Adresse</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Tx Hash</TableHead>
                <TableHead>Créé</TableHead>
                <TableHead>Confirmé</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((d) => (
                <TableRow key={d.id}>
                  <TableCell>#{d.id}</TableCell>
                  <TableCell>{d.user?.username || d.user_id}</TableCell>
                  <TableCell className="font-mono truncate max-w-[220px]" title={d.address}>{d.address}</TableCell>
                  <TableCell className="font-mono">{formatAmount(Number(d.amount))} π</TableCell>
                  <TableCell>{statusBadge(d.status)}</TableCell>
                  <TableCell className="font-mono truncate max-w-[220px]" title={d.tx_hash || ''}>{d.tx_hash || '-'}</TableCell>
                  <TableCell>{formatDate(d.created_at)}</TableCell>
                  <TableCell>{formatDate(d.confirmed_at)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {d.status === 'pending' && (
                        <>
                          <Button size="sm" variant="ghost" className="text-green-600" onClick={() => onConfirm(d.id)} disabled={loading}>
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="text-red-600" onClick={() => onExpire(d.id)} disabled={loading}>
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination simple */}
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-muted-foreground">
            Page {pagination.current_page} / {pagination.last_page} — {pagination.total} éléments
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => load(Math.max(1, pagination.current_page - 1))}
              disabled={loading || pagination.current_page <= 1}
            >
              Précédent
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => load(Math.min(pagination.last_page, pagination.current_page + 1))}
              disabled={loading || pagination.current_page >= pagination.last_page}
            >
              Suivant
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
