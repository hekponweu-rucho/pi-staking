import { useEffect, useState } from 'react';
import { adminWithdrawalService, WithdrawalItem } from '@/admin/services/adminWithdrawalService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle, X, RefreshCw, Upload } from 'lucide-react';

export default function AdminWithdrawalsManager(){
  const [items, setItems] = useState<WithdrawalItem[]>([]);
  const [status, setStatus] = useState<'pending'|'reviewing'|'approved'|'processing'|'completed'|'rejected'|'cancelled'|'all'>('pending');
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [txHash, setTxHash] = useState('');
  const [reason, setReason] = useState('');
  const [acting, setActing] = useState<number | null>(null);

  const load = async ()=>{
    setLoading(true);
    try{
      const st = status === 'all' ? undefined : status;
      const res = await adminWithdrawalService.getWithdrawals(st, page, 20);
      if(res.success){
        setItems(res.data.data);
        setLastPage(res.data.last_page);
      }
    } finally { setLoading(false); }
  };

  useEffect(()=>{ load(); }, [status, page]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Demandes de Retrait</h2>
        <Button variant="outline" onClick={load}><RefreshCw className="h-4 w-4 mr-2"/>Actualiser</Button>
      </div>

      <div className="flex items-center gap-2">
        <Label>Statut</Label>
        <select className="border rounded px-2 py-1" value={status} onChange={e=>{setPage(1); setStatus(e.target.value as any)}}>
          <option value="pending">pending</option>
          <option value="reviewing">reviewing</option>
          <option value="approved">approved</option>
          <option value="processing">processing</option>
          <option value="completed">completed</option>
          <option value="rejected">rejected</option>
          <option value="cancelled">cancelled</option>
          <option value="all">all</option>
        </select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des retraits</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin"/> Chargement…</div>
          ) : (
            <div className="space-y-2">
              {items.map(w => (
                <div key={w.id} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <div className="text-sm">User: <span className="font-medium">{w.user.username}</span> • Montant: <span className="font-mono">{w.amount} π</span></div>
                      <div className="text-xs text-muted-foreground">Adresse: {w.destination_address || '—'} • Créée: {new Date(w.created_at).toLocaleString()}</div>
                    </div>
                    <Badge variant={w.status==='pending'?'outline': w.status==='completed'?'default':'secondary'}>{w.status}</Badge>
                  </div>

                  {w.status === 'pending' && (
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2">
                      <div>
                        <Label>Tx hash (optionnel)</Label>
                        <Input value={acting===w.id?txHash:''} onChange={e=>setTxHash(e.target.value)} placeholder="Hash / référence" />
                      </div>
                      <div>
                        <Label>Raison rejet (optionnel)</Label>
                        <Input value={acting===w.id?reason:''} onChange={e=>setReason(e.target.value)} placeholder="Ex: vérification échouée" />
                      </div>
                      <div className="flex items-end gap-2">
                        <Button className="flex-1" onClick={async()=>{
                          setActing(w.id);
                          try{
                            await adminWithdrawalService.completeWithdrawal(w.id, txHash || undefined);
                            setTxHash(''); setReason(''); setActing(null);
                            await load();
                          } finally { setActing(null); }
                        }}>
                          <CheckCircle className="h-4 w-4 mr-2"/> Marquer complété
                        </Button>
                        <Button variant="destructive" onClick={async()=>{
                          setActing(w.id);
                          try{
                            await adminWithdrawalService.rejectWithdrawal(w.id, reason || undefined);
                            setTxHash(''); setReason(''); setActing(null);
                            await load();
                          } finally { setActing(null); }
                        }}>
                          <X className="h-4 w-4"/>
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              <div className="flex items-center justify-between text-sm pt-2">
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
    </div>
  );
}
