import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Progress } from '@/components/ui/progress';
import { Copy, CheckCircle2, Timer as TimerIcon, RefreshCw, QrCode, AlertTriangle } from 'lucide-react';
import QRCode from 'react-qr-code';
import { depositService, DepositRequestResponse, DepositStatusResponse } from '@/services/depositService';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

const LS_ID = 'deposit_id';
const LS_ADDRESS = 'deposit_address';
const LS_EXPIRES = 'deposit_expires_at';

function formatCountdown(ms: number) {
  if (ms < 0) ms = 0;
  const totalSeconds = Math.floor(ms / 1000);
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const s = Math.floor(totalSeconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function loadPersisted() {
  const id = localStorage.getItem(LS_ID);
  const address = localStorage.getItem(LS_ADDRESS);
  const expires_at = localStorage.getItem(LS_EXPIRES);
  if (!id || !address || !expires_at) return null;
  return { id, address, expires_at } as DepositRequestResponse;
}

function persist(data: DepositRequestResponse) {
  localStorage.setItem(LS_ID, data.id);
  localStorage.setItem(LS_ADDRESS, data.address);
  localStorage.setItem(LS_EXPIRES, data.expires_at);
}

function clearPersisted() {
  localStorage.removeItem(LS_ID);
  localStorage.removeItem(LS_ADDRESS);
  localStorage.removeItem(LS_EXPIRES);
}

export interface DepositModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DepositModal: React.FC<DepositModalProps> = ({ open, onOpenChange }) => {
  const { refreshUser } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conflictUntil, setConflictUntil] = useState<string | null>(null);

  const [deposit, setDeposit] = useState<DepositRequestResponse | null>(null);
  const [status, setStatus] = useState<'pending' | 'confirmed' | 'expired'>('pending');

  const pollRef = useRef<number | null>(null);
  const [now, setNow] = useState(Date.now());

  const expiresAt = useMemo(() => deposit ? new Date(deposit.expires_at).getTime() : null, [deposit]);
  const remainingMs = useMemo(() => (expiresAt ? expiresAt - now : 0), [expiresAt, now]);
  const progress = useMemo(() => {
    if (!expiresAt || !deposit) return 0;
    const total = new Date(deposit.expires_at).getTime() - (new Date(deposit.expires_at).getTime() - 15 * 60 * 1000);
    const elapsed = 15 * 60 * 1000 - Math.max(0, remainingMs);
    return Math.min(100, Math.max(0, (elapsed / (15 * 60 * 1000)) * 100));
  }, [deposit, expiresAt, remainingMs]);

  const stopPolling = () => {
    if (pollRef.current) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const startPolling = useCallback((id: string) => {
    stopPolling();
    pollRef.current = window.setInterval(async () => {
      try {
        const res: DepositStatusResponse = await depositService.getDepositStatus(id);
        if (res.status === 'confirmed') {
          stopPolling();
          setStatus('confirmed');
          clearPersisted();
          toast.success('Dépôt confirmé');
          await refreshUser();
          setTimeout(() => onOpenChange(false), 1200);
        } else if (res.status === 'expired') {
          stopPolling();
          setStatus('expired');
          clearPersisted();
        }
      } catch (e) {
        // Ignorer les erreurs transitoires du polling
        // Optionnel: journaliser
        console.debug('Polling error', e);
      }
    }, 5000) as unknown as number;
  }, [onOpenChange, refreshUser]);

  const requestOrResume = useCallback(async () => {
    setError(null);
    setConflictUntil(null);

    const persisted = loadPersisted();
    const nowMs = Date.now();
    if (persisted && new Date(persisted.expires_at).getTime() > nowMs) {
      setDeposit(persisted);
      setStatus('pending');
      startPolling(persisted.id);
      return;
    }

    try {
      setLoading(true);
      const res = await depositService.requestDeposit();
      setDeposit(res);
      persist(res);
      setStatus('pending');
      startPolling(res.id);
    } catch (e: any) {
      if (e?.status === 409) {
        const local = loadPersisted();
        setConflictUntil(local?.expires_at || null);
        if (local && new Date(local.expires_at).getTime() > Date.now()) {
          setDeposit(local);
          setStatus('pending');
          startPolling(local.id);
        } else {
          setError("Une adresse vous est déjà attribuée. Réessayez après expiration.");
        }
      } else if (e?.status === 503) {
        setError("Pas d'adresse de dépôt disponible pour le moment. Merci de réessayer plus tard.");
      } else {
        setError("Une erreur est survenue. Merci de réessayer.");
      }
    } finally {
      setLoading(false);
    }
  }, [startPolling]);

  useEffect(() => {
    if (open) {
      requestOrResume();
    } else {
      stopPolling();
      setDeposit(null);
      setStatus('pending');
      setError(null);
      setConflictUntil(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [open]);

  useEffect(() => {
    if (open && expiresAt && remainingMs <= 0 && status === 'pending') {
      setStatus('expired');
      stopPolling();
      clearPersisted();
    }
  }, [expiresAt, remainingMs, open, status]);

  const onCopy = async () => {
    if (!deposit?.address) return;
    try {
      await navigator.clipboard.writeText(deposit.address);
      toast.success('Adresse copiée');
    } catch {
      toast.error("Impossible de copier l'adresse");
    }
  };

  const onRedemander = async () => {
    clearPersisted();
    setDeposit(null);
    setStatus('pending');
    await requestOrResume();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Faire un dépôt en Pi
          </DialogTitle>
          <DialogDescription>
            Envoyez vos Pi à l'adresse ci-dessous. L'adresse expire dans les 15 minutes.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}

        {conflictUntil && (
          <div className="p-3 rounded-md bg-amber-50 text-amber-700 text-sm">
            Une adresse vous est déjà attribuée jusqu'à {new Date(conflictUntil).toLocaleTimeString()}.
          </div>
        )}

        {deposit && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="deposit-address">Adresse de dépôt</Label>
              <div className="flex gap-2">
                <Input id="deposit-address" readOnly value={deposit.address} className="font-mono text-sm" />
                <Button variant="outline" onClick={onCopy} title="Copier l'adresse">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="rounded-lg border p-4 bg-white">
              <AspectRatio ratio={1}>
                <div className="w-full h-full flex items-center justify-center">
                  <QRCode value={deposit.address} size={256} style={{ width: '100%', height: '100%' }} />
                </div>
              </AspectRatio>
            </div>

            {status === 'pending' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <TimerIcon className="h-4 w-4" />
                    <span>Expiration</span>
                  </div>
                  <Badge variant="secondary">{formatCountdown(remainingMs)}</Badge>
                </div>
                <Progress value={progress} />
                <p className="text-xs text-muted-foreground">
                  Veuillez envoyer vos Pi avant l'expiration. L'allocation est réservée pour 15 minutes.
                </p>
              </div>
            )}

            {status === 'confirmed' && (
              <div className="p-4 rounded-lg bg-green-50 border border-green-200 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-green-700 font-medium">Dépôt confirmé</p>
                  <p className="text-xs text-green-700/80">Votre solde sera mis à jour.</p>
                </div>
              </div>
            )}

            {status === 'expired' && (
              <div className="space-y-3">
                <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-800">
                  L'adresse a expiré. Vous pouvez redemander une nouvelle adresse.
                </div>
                <Button onClick={onRedemander} className="w-full">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Redemander une adresse
                </Button>
              </div>
            )}
          </div>
        )}

        {!deposit && !loading && (
          <div className="flex items-center justify-center py-8">
            <Button onClick={requestOrResume}>Allouer une adresse</Button>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
            Allocation en cours...
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DepositModal;
