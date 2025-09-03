import { useEffect, useState } from 'react';
import { adminDepositService, DepositAddress, DepositSessionItem } from '@/admin/services/adminDepositService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Loader2, CheckCircle, X, Plus, RefreshCw } from 'lucide-react';

export default function AdminDepositManager() {
  const [addresses, setAddresses] = useState<DepositAddress[]>([]);
  const [isLoadingAddr, setIsLoadingAddr] = useState(true);
  const [newAddress, setNewAddress] = useState({ address: '', label: '' });
  const [creating, setCreating] = useState(false);

  const [sessions, setSessions] = useState<DepositSessionItem[]>([]);
  const [isLoadingSess, setIsLoadingSess] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'pending'|'confirmed'|'expired'|'cancelled'|'all'>('pending');
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [confirming, setConfirming] = useState<number | null>(null);
  const [confirmAmount, setConfirmAmount] = useState('');
  const [confirmHash, setConfirmHash] = useState('');

  const loadAddresses = async () => {
    try {
      setIsLoadingAddr(true);
      const res = await adminDepositService.getAddresses();
      if (res.success) setAddresses(res.data);
    } finally {
      setIsLoadingAddr(false);
    }
  };

  const loadSessions = async () => {
    try {
      setIsLoadingSess(true);
      const st = statusFilter === 'all' ? undefined : statusFilter;
      const res = await adminDepositService.getSessions(st, page, 20);
      if (res.success) {
        setSessions(res.data.data);
        setLastPage(res.data.last_page);
      }
    } finally {
      setIsLoadingSess(false);
    }
  };

  useEffect(() => { loadAddresses(); }, []);
  useEffect(() => { loadSessions(); }, [statusFilter, page]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Gestion des Dépôts</h1>
        <Button variant="outline" onClick={() => { loadAddresses(); loadSessions(); }}>
          <RefreshCw className="h-4 w-4 mr-2" /> Actualiser
        </Button>
      </div>

      <Tabs defaultValue="addresses">
        <TabsList>
          <TabsTrigger value="addresses">Adresses</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
        </TabsList>

        <TabsContent value="addresses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ajouter une adresse</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label>Adresse</Label>
                <Input value={newAddress.address} onChange={e=>setNewAddress(a=>({...a, address: e.target.value}))} placeholder="Adresse Pi" />
              </div>
              <div>
                <Label>Label (optionnel)</Label>
                <Input value={newAddress.label} onChange={e=>setNewAddress(a=>({...a, label: e.target.value}))} placeholder="Ex: Caisse #1" />
              </div>
              <Button disabled={creating || !newAddress.address} onClick={async()=>{
                try{
                  setCreating(true);
                  await adminDepositService.createAddress(newAddress.address, newAddress.label || undefined, true);
                  setNewAddress({ address: '', label: '' });
                  await loadAddresses();
                } finally { setCreating(false); }
              }}>
                {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />} Ajouter
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Adresses configurées</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {isLoadingAddr ? (
                <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin"/> Chargement…</div>
              ) : (
                <div className="space-y-2">
                  {addresses.map(addr => (
                    <div key={addr.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="min-w-0">
                        <div className="font-mono text-sm break-all">{addr.address}</div>
                        <div className="text-xs text-muted-foreground">{addr.label || '—'} • Utilisation: {addr.usage_count}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        {addr.is_active ? <Badge className="bg-green-100 text-green-700">Active</Badge> : <Badge variant="outline">Inactive</Badge>}
                        <Button size="sm" variant="outline" onClick={async()=>{
                          await adminDepositService.updateAddress(addr.id, { is_active: !addr.is_active });
                          await loadAddresses();
                        }}>
                          {addr.is_active ? 'Désactiver' : 'Activer'}
                        </Button>
                        <Button size="sm" variant="destructive" onClick={async()=>{
                          await adminDepositService.deleteAddress(addr.id);
                          await loadAddresses();
                        }}>
                          <X className="h-4 w-4"/>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4">
          <div className="flex items-center gap-2">
            <Label>Statut</Label>
            <select className="border rounded px-2 py-1" value={statusFilter} onChange={e=>{ setPage(1); setStatusFilter(e.target.value as any); }}>
              <option value="pending">pending</option>
              <option value="confirmed">confirmed</option>
              <option value="expired">expired</option>
              <option value="cancelled">cancelled</option>
              <option value="all">all</option>
            </select>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Sessions de dépôt</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {isLoadingSess ? (
                <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin"/> Chargement…</div>
              ) : (
                <div className="space-y-2">
                  {sessions.map(s => (
                    <div key={s.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0">
                          <div className="text-sm">User: <span className="font-medium">{s.user.username}</span> • Memo: <span className="font-mono break-all">{s.memo}</span></div>
                          <div className="text-xs text-muted-foreground">Adresse: {s.address.address} • Créée: {new Date(s.created_at).toLocaleString()} • Expire: {new Date(s.expires_at).toLocaleString()}</div>
                        </div>
                        <Badge variant={s.status==='pending'?'outline': s.status==='confirmed'?'default':'secondary'}>{s.status}</Badge>
                      </div>

                      {s.status === 'pending' && (
                        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2">
                          <div>
                            <Label>Montant crédité</Label>
                            <Input type="number" value={confirming===s.id?confirmAmount:''} onChange={e=>setConfirmAmount(e.target.value)} placeholder="Ex: 5.0" />
                          </div>
                          <div>
                            <Label>Tx hash (optionnel)</Label>
                            <Input value={confirming===s.id?confirmHash:''} onChange={e=>setConfirmHash(e.target.value)} placeholder="Hash / référence" />
                          </div>
                          <div className="flex items-end gap-2">
                            <Button className="flex-1" disabled={confirming===s.id && !confirmAmount} onClick={async()=>{
                              setConfirming(s.id);
                              try{
                                const amount = parseFloat(confirmAmount);
                                if (!amount || amount<=0) return;
                                await adminDepositService.confirmSession(s.id, amount, confirmHash || undefined);
                                setConfirmAmount(''); setConfirmHash(''); setConfirming(null);
                                await loadSessions();
                              } finally { setConfirming(null); }
                            }}>
                              <CheckCircle className="h-4 w-4 mr-2"/> Confirmer
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  <Separator />
                  <div className="flex items-center justify-between text-sm">
                    <span>Page {page} / {lastPage}</span>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" disabled={page<=1} onClick={()=>setPage(p=>Math.max(1,p-1))}>Précédent</Button>
                      <Button size="sm" variant="outline" disabled={page>=lastPage} onClick={()=>setPage(p=>p+1)}>Suivant</Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
