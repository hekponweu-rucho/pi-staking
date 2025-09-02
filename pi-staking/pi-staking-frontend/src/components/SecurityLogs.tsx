import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Activity, 
  Shield, 
  AlertTriangle, 
  MapPin,
  Monitor,
  Smartphone as SmartphoneIcon,
  Tablet,
  Search,
  Calendar,
  Filter
} from 'lucide-react';
import api from '@/lib/api';

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

export function SecurityLogs() {
  const [logs, setLogs] = useState<SecurityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');

  useEffect(() => {
    loadSecurityLogs();
  }, []);

  const loadSecurityLogs = async () => {
    try {
      const response = await api.get('/security/activity');
      setLogs(response.data.data);
    } catch (error) {
      console.error('Erreur chargement logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesText = !filter || 
      log.action.toLowerCase().includes(filter.toLowerCase()) ||
      log.ip_address.includes(filter) ||
      (log.location && log.location.toLowerCase().includes(filter.toLowerCase()));
    
    const matchesSeverity = !severityFilter || log.severity === severityFilter;
    
    return matchesText && matchesSeverity;
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500 text-white';
      case 'warning': return 'bg-yellow-500 text-white';
      default: return 'bg-blue-500 text-white';
    }
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType.toLowerCase()) {
      case 'mobile': return SmartphoneIcon;
      case 'tablet': return Tablet;
      default: return Monitor;
    }
  };

  const getRiskLevelColor = (riskScore: number) => {
    if (riskScore > 0.7) return 'text-red-500';
    if (riskScore > 0.4) return 'text-yellow-500';
    return 'text-green-500';
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="pt-6">
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Journaux de Sécurité
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par action, IP, localisation..."
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrer par sévérité" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Toutes les sévérités</SelectItem>
                <SelectItem value="info">Information</SelectItem>
                <SelectItem value="warning">Avertissement</SelectItem>
                <SelectItem value="critical">Critique</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {filter || severityFilter ? 'Aucun log correspondant aux critères' : 'Aucun log de sécurité'}
              </div>
            ) : (
              filteredLogs.map((log) => {
                const DeviceIcon = getDeviceIcon(log.device_type);
                
                return (
                  <div key={log.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex items-center gap-2">
                        <DeviceIcon className="h-4 w-4 text-muted-foreground" />
                        <Badge className={getSeverityColor(log.severity)} variant="secondary">
                          {log.severity}
                        </Badge>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{log.action}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {log.ip_address}
                          </span>
                          {log.location && (
                            <span>{log.location}</span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(log.created_at).toLocaleString('fr-FR')}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Risque:</span>
                        <Badge 
                          variant="outline" 
                          className={`${getRiskLevelColor(log.risk_score)} border-current`}
                        >
                          {(log.risk_score * 100).toFixed(0)}%
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 capitalize">
                        {log.device_type}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          
          {filteredLogs.length > 0 && (
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Affichage de {filteredLogs.length} événement{filteredLogs.length > 1 ? 's' : ''} 
                {(filter || severityFilter) && ` (filtré sur ${logs.length})`}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}