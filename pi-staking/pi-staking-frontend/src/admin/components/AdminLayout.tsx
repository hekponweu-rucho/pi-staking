import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '../contexts/AdminContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  LayoutDashboard,
  Users,
  DollarSign,
  Activity,
  AlertTriangle,
  Settings,
  FileText,
  LogOut,
  Menu,
  X,
  Bell,
  Shield
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
  currentSection: string;
  onSectionChange: (section: string) => void;
}

const navigationItems = [
  {
    id: 'dashboard',
    label: 'Tableau de Bord',
    icon: LayoutDashboard,
    description: 'Métriques principales'
  },
  {
    id: 'users',
    label: 'Gestion Utilisateurs',
    icon: Users,
    description: 'Comptes et profils'
  },
  {
    id: 'financial',
    label: 'Finances & Analytics',
    icon: DollarSign,
    description: 'TVL, revenus, transactions'
  },
  {
    id: 'monitoring',
    label: 'Monitoring Temps Réel',
    icon: Activity,
    description: 'Transactions live'
  },
  {
    id: 'alerts',
    label: 'Alertes & Notifications',
    icon: AlertTriangle,
    description: 'Incidents système'
  },
  {
    id: 'reports',
    label: 'Rapports & Exports',
    icon: FileText,
    description: 'Analyses détaillées'
  },
  {
    id: 'settings',
    label: 'Configuration',
    icon: Settings,
    description: 'Paramètres système'
  }
];

export function AdminLayout({ children, currentSection, onSectionChange }: AdminLayoutProps) {
  const { user, logout } = useAuth();
  const { state } = useAdmin();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
  };

  const currentItem = navigationItems.find(item => item.id === currentSection);

  if (!state.isAuthorized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <Shield className="h-16 w-16 mx-auto text-destructive" />
              <div>
                <h2 className="text-xl font-bold">Accès Refusé</h2>
                <p className="text-muted-foreground">
                  Vous n'avez pas les permissions administrateur nécessaires.
                </p>
              </div>
              <Button onClick={handleLogout} variant="outline" className="w-full">
                <LogOut className="h-4 w-4 mr-2" />
                Retour à l'accueil
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (state.isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-16 w-16 animate-spin rounded-full border-4 pi-gradient border-t-transparent mx-auto"></div>
          <p className="text-lg font-medium">Chargement de l'interface administrateur...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Mobile Header */}
      <header className="lg:hidden border-b border-border/50 bg-card/80 backdrop-blur-md">
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <div className="flex h-8 w-8 items-center justify-center rounded-full pi-gradient">
              <span className="text-sm font-bold text-white">Pi</span>
            </div>
            <span className="font-semibold">Admin</span>
          </div>
          
          <div className="flex items-center space-x-2">
            {state.unreadAlertsCount > 0 && (
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-4 w-4" />
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs"
                >
                  {state.unreadAlertsCount}
                </Badge>
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50 w-72 transition-transform duration-300 ease-in-out`}>
          <div className="h-full border-r border-border/50 bg-card/95 backdrop-blur-md">
            {/* Admin Header */}
            <div className="p-6 border-b border-border/50">
              <div className="flex items-center space-x-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full pi-gradient animate-pi-pulse">
                  <span className="text-lg font-bold text-white">Pi</span>
                </div>
                <div>
                  <h1 className="text-lg font-bold">Pi Staking Admin</h1>
                  <p className="text-sm text-muted-foreground">Interface Administrateur</p>
                </div>
              </div>
              
              <div className="mt-4 p-3 rounded-lg bg-pi-gold/10 border border-pi-gold/20">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Admin connecté</span>
                  <Badge variant="outline" className="bg-pi-gold text-white border-0">
                    <Shield className="h-3 w-3 mr-1" />
                    ADMIN
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {user?.username || user?.email}
                </p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="p-4 space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentSection === item.id;
                const hasAlerts = item.id === 'alerts' && state.unreadAlertsCount > 0;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSectionChange(item.id);
                      setSidebarOpen(false);
                    }}
                    className={`
                      w-full text-left p-3 rounded-lg transition-all duration-200
                      flex items-center space-x-3 group relative
                      ${isActive 
                        ? 'bg-pi-gold/20 border border-pi-gold/30 text-foreground' 
                        : 'hover:bg-muted/50 text-muted-foreground hover:text-foreground'
                      }
                    `}
                  >
                    <Icon className={`h-5 w-5 ${isActive ? 'text-pi-gold' : ''}`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.label}</p>
                      <p className="text-xs opacity-75 truncate">{item.description}</p>
                    </div>
                    {hasAlerts && (
                      <Badge 
                        variant="destructive" 
                        className="h-5 w-5 rounded-full p-0 text-xs"
                      >
                        {state.unreadAlertsCount}
                      </Badge>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Footer */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border/50">
              <Button 
                variant="ghost" 
                onClick={handleLogout}
                className="w-full justify-start text-muted-foreground hover:text-destructive"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Déconnexion
              </Button>
            </div>
          </div>
        </aside>

        {/* Overlay pour mobile */}
        {sidebarOpen && (
          <div 
            className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 min-h-screen">
          {/* Desktop Header */}
          <header className="hidden lg:block border-b border-border/50 bg-card/80 backdrop-blur-md">
            <div className="flex h-16 items-center justify-between px-6">
              <div>
                <h2 className="text-xl font-bold">{currentItem?.label}</h2>
                <p className="text-sm text-muted-foreground">{currentItem?.description}</p>
              </div>
              
              <div className="flex items-center space-x-4">
                {state.unreadAlertsCount > 0 && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onSectionChange('alerts')}
                    className="relative"
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    {state.unreadAlertsCount} Alerte{state.unreadAlertsCount > 1 ? 's' : ''}
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs"
                    >
                      !
                    </Badge>
                  </Button>
                )}
                
                <Separator orientation="vertical" className="h-6" />
                
                <div className="text-right">
                  <p className="text-sm font-medium">{user?.username}</p>
                  <p className="text-xs text-muted-foreground">Administrateur</p>
                </div>
                
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <div className="p-6">
            {state.error && (
              <Card className="mb-6 border-destructive">
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2 text-destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="font-medium">Erreur:</span>
                    <span>{state.error}</span>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}