import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  Smartphone, 
  Key, 
  AlertTriangle, 
  CheckCircle,
  Copy,
  QrCode,
  Activity,
  Clock,
  MapPin,
  Monitor,
  Tablet,
  Smartphone as SmartphoneIcon
} from 'lucide-react';
import api from '@/lib/api';

// Types pour la sécurité
interface SecurityStatus {
  score: number;
  level: string;
  recommendations: string[];
  two_factor_enabled: boolean;
  phone_verified: boolean;
  last_password_change: string;
  last_activity: string;
}

interface TwoFactorStatus {
  enabled: boolean;
  enabled_at: string | null;
  backup_codes_count: number;
}

interface SecurityLog {
  id: number;
  action: string;
  ip_address: string;
  device_type: string;
  location?: string;
  risk_score: number;
  severity: 'info' | 'warning' | 'critical';
  created_at: string;
  metadata?: any;
}

interface SecurityStats {
  total_events: number;
  logins: number;
  failed_attempts: number;
  high_risk_events: number;
  unique_ips: number;
  device_types: Record<string, number>;
}

// Composant principal de sécurité
export function SecurityCenter() {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-pi-gold" />
            Centre de Sécurité
          </h1>
          <p className="text-muted-foreground">
            Gérez et surveillez la sécurité de votre compte
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Aperçu
          </TabsTrigger>
          <TabsTrigger value="2fa" className="flex items-center gap-2">
            <Smartphone className="h-4 w-4" />
            2FA
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Activité
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            Paramètres
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <SecurityOverview />
        </TabsContent>

        <TabsContent value="2fa">
          <TwoFactorAuth />
        </TabsContent>

        <TabsContent value="activity">
          <SecurityActivity />
        </TabsContent>

        <TabsContent value="settings">
          <SecuritySettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Composant aperçu sécurité
function SecurityOverview() {
  const [status, setStatus] = useState<SecurityStatus | null>(null);
  const [stats, setStats] = useState<SecurityStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSecurityData();
  }, []);

  const loadSecurityData = async () => {
    try {
      const [statusRes, statsRes] = await Promise.all([
        api.get('/security/account-status'),
        api.get('/security/stats')
      ]);
      
      setStatus(statusRes.data.data);
      setStats(statsRes.data.data);
    } catch (error) {
      console.error('Erreur chargement données sécurité:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="pt-6">
              <div className="h-20 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const getSecurityLevelColor = (level: string) => {
    switch (level) {
      case 'Excellent': return 'text-green-500';
      case 'Bon': return 'text-blue-500';
      case 'Moyen': return 'text-yellow-500';
      default: return 'text-red-500';
    }
  };

  const getSecurityLevelBadge = (level: string) => {
    switch (level) {
      case 'Excellent': return 'bg-green-500';
      case 'Bon': return 'bg-blue-500';
      case 'Moyen': return 'bg-yellow-500';
      default: return 'bg-red-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Score de sécurité */}
      {status && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Score de Sécurité
              </span>
              <Badge className={`${getSecurityLevelBadge(status.level)} text-white`}>
                {status.level}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Niveau de sécurité</span>
                  <span className={`font-semibold ${getSecurityLevelColor(status.level)}`}>
                    {status.score}/100
                  </span>
                </div>
                <Progress value={status.score} className="h-3" />
              </div>
              
              {status.recommendations.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2 text-sm">Recommandations :</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {status.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statut des fonctionnalités de sécurité */}
      {status && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Authentification 2FA
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {status.two_factor_enabled ? 'Activée' : 'Désactivée'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Sécurité supplémentaire avec votre téléphone
                  </p>
                </div>
                {status.two_factor_enabled ? (
                  <CheckCircle className="h-8 w-8 text-green-500" />
                ) : (
                  <AlertTriangle className="h-8 w-8 text-red-500" />
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Téléphone Vérifié
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {status.phone_verified ? 'Vérifié' : 'Non vérifié'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Pour les vérifications par SMS
                  </p>
                </div>
                {status.phone_verified ? (
                  <CheckCircle className="h-8 w-8 text-green-500" />
                ) : (
                  <AlertTriangle className="h-8 w-8 text-orange-500" />
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Statistiques d'activité */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Activité des 30 derniers jours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-500">{stats.total_events}</p>
                <p className="text-sm text-muted-foreground">Événements</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-500">{stats.logins}</p>
                <p className="text-sm text-muted-foreground">Connexions</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-500">{stats.failed_attempts}</p>
                <p className="text-sm text-muted-foreground">Échecs</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-500">{stats.unique_ips}</p>
                <p className="text-sm text-muted-foreground">IP uniques</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Informations compte */}
      {status && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Informations Compte
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Dernier changement de mot de passe :</span>
                <span className="font-medium">{status.last_password_change}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Dernière activité :</span>
                <span className="font-medium">{status.last_activity}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Composant 2FA (à continuer dans le prochain fichier...)
function TwoFactorAuth() {
  const [twoFactorStatus, setTwoFactorStatus] = useState<TwoFactorStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [setupMode, setSetupMode] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    load2FAStatus();
  }, []);

  const load2FAStatus = async () => {
    try {
      const response = await api.get('/security/2fa/status');
      setTwoFactorStatus(response.data.data);
    } catch (error) {
      console.error('Erreur chargement statut 2FA:', error);
    } finally {
      setLoading(false);
    }
  };

  const start2FASetup = async () => {
    try {
      setError('');
      setLoading(true);
      
      const response = await api.post('/security/2fa/setup');
      const data = response.data.data;
      
      setQrCodeUrl(data.qr_code_url);
      setSecretKey(data.secret_key);
      setBackupCodes(data.backup_codes);
      setSetupMode(true);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Erreur lors de la configuration 2FA');
    } finally {
      setLoading(false);
    }
  };

  const confirm2FA = async () => {
    if (!verificationCode || !password) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    try {
      setError('');
      setSuccess('');
      setLoading(true);

      await api.post('/security/2fa/confirm', {
        code: verificationCode,
        password: password,
        backup_codes: backupCodes
      });

      setSuccess('2FA activé avec succès !');
      setSetupMode(false);
      await load2FAStatus();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Erreur lors de la confirmation 2FA');
    } finally {
      setLoading(false);
    }
  };

  const disable2FA = async () => {
    if (!verificationCode || !password) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    try {
      setError('');
      setSuccess('');
      setLoading(true);

      await api.post('/security/2fa/disable', {
        code: verificationCode,
        password: password
      });

      setSuccess('2FA désactivé avec succès');
      await load2FAStatus();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Erreur lors de la désactivation 2FA');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess('Copié dans le presse-papier !');
    setTimeout(() => setSuccess(''), 3000);
  };

  if (loading && !twoFactorStatus) {
    return (
      <Card className="animate-pulse">
        <CardContent className="pt-6">
          <div className="h-40 bg-muted rounded"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {!setupMode ? (
        // Vue statut 2FA
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Authentification à Deux Facteurs (2FA)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">
                    Statut : {twoFactorStatus?.enabled ? 'Activé' : 'Désactivé'}
                  </p>
                  {twoFactorStatus?.enabled && twoFactorStatus.enabled_at && (
                    <p className="text-sm text-muted-foreground">
                      Activé le {new Date(twoFactorStatus.enabled_at).toLocaleDateString('fr-FR')}
                    </p>
                  )}
                  {twoFactorStatus?.enabled && (
                    <p className="text-sm text-muted-foreground">
                      {twoFactorStatus.backup_codes_count} codes de récupération restants
                    </p>
                  )}
                </div>
                {twoFactorStatus?.enabled ? (
                  <CheckCircle className="h-8 w-8 text-green-500" />
                ) : (
                  <AlertTriangle className="h-8 w-8 text-red-500" />
                )}
              </div>

              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  L'authentification à deux facteurs ajoute une couche de sécurité supplémentaire 
                  en demandant un code depuis votre téléphone en plus de votre mot de passe.
                </p>

                {!twoFactorStatus?.enabled ? (
                  <Button 
                    onClick={start2FASetup}
                    disabled={loading}
                    className="pi-gradient text-white"
                  >
                    <Smartphone className="h-4 w-4 mr-2" />
                    Activer 2FA
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                      <h4 className="font-medium mb-2">Désactiver 2FA</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Pour désactiver l'authentification 2FA, entrez votre mot de passe et un code 2FA.
                      </p>
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="disable-password">Mot de passe actuel</Label>
                          <Input
                            id="disable-password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Votre mot de passe"
                          />
                        </div>
                        <div>
                          <Label htmlFor="disable-code">Code 2FA</Label>
                          <Input
                            id="disable-code"
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value)}
                            placeholder="123456"
                            maxLength={6}
                          />
                        </div>
                        <Button 
                          variant="destructive"
                          onClick={disable2FA}
                          disabled={loading}
                        >
                          Désactiver 2FA
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        // Vue configuration 2FA
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuration 2FA - Étape 1</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm">
                  1. Installez Google Authenticator ou une app similaire sur votre téléphone
                </p>
                <p className="text-sm">
                  2. Scannez ce QR code avec votre app :
                </p>
                
                {qrCodeUrl && (
                  <div className="flex justify-center p-4 bg-white rounded-lg border">
                    <img src={qrCodeUrl} alt="QR Code 2FA" className="w-48 h-48" />
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Ou entrez cette clé manuellement :</Label>
                  <div className="flex gap-2">
                    <Input 
                      value={secretKey} 
                      readOnly 
                      className="font-mono text-sm"
                    />
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => copyToClipboard(secretKey)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {backupCodes.length > 0 && (
                  <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <h4 className="font-medium mb-2">Codes de récupération</h4>
                    <p className="text-xs text-muted-foreground mb-3">
                      Sauvegardez ces codes dans un endroit sûr. Ils peuvent remplacer votre app 2FA en cas de perte.
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-sm font-mono">
                      {backupCodes.map((code, index) => (
                        <div key={index} className="p-2 bg-background rounded border">
                          {code}
                        </div>
                      ))}
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-3"
                      onClick={() => copyToClipboard(backupCodes.join('\n'))}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copier tous les codes
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Configuration 2FA - Étape 2</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm">
                  Entrez le code généré par votre app et votre mot de passe pour confirmer :
                </p>
                
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="confirm-password">Mot de passe actuel</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Votre mot de passe"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="confirm-code">Code 2FA</Label>
                    <Input
                      id="confirm-code"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      placeholder="123456"
                      maxLength={6}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={confirm2FA}
                    disabled={loading}
                    className="pi-gradient text-white"
                  >
                    Confirmer et Activer 2FA
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setSetupMode(false)}
                  >
                    Annuler
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// Placeholders pour les autres composants
function SecurityActivity() {
  return <div>Activité de sécurité - En cours de développement</div>;
}

function SecuritySettings() {
  return <div>Paramètres de sécurité - En cours de développement</div>;
}

export default SecurityCenter;