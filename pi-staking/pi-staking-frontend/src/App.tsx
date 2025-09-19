import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { StakingProvider } from '@/contexts/StakingContext';
import { DashboardProvider } from '@/contexts/DashboardContext';
import { LandingPageEnhanced } from '@/components/LandingPageEnhanced';
import { AuthPage } from '@/components/AuthPage';
import { UserDashboardComplete } from '@/components/UserDashboardComplete';
import { EmailVerificationPage } from '@/components/EmailVerificationPage';
import { ParticleBackground } from '@/components/ParticleBackground';
import AdminApp from '@/admin/components/AdminApp';
import adminService from '@/admin/services/adminService';
import { config } from '@/lib/config';
import { Toaster } from '@/components/ui/sonner';


// Types pour la navigation
type AppState = 'landing' | 'auth' | 'email-verification' | 'dashboard';

function Dashboard() {
  const { state, logout, checkEmailVerified } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const user = state.user;

  // Vérifier si l'utilisateur est admin
  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) return setIsAdmin(false);
      const allowlist = (import.meta.env.VITE_ADMIN_EMAILS as string | undefined)?.split(',').map(e => e.trim().toLowerCase()) || [];
      const byRole = (user as any).role === 'admin' || (user as any).is_admin === true;
      const byEmail = allowlist.includes((user.email || '').toLowerCase());
      if (byRole || byEmail) {
        return setIsAdmin(true);
      }
      const ok = await adminService.checkAdminAccess();
      setIsAdmin(!!ok);
    };
    checkAdmin();
  }, [user]);

  // Si l'utilisateur est admin, afficher le dashboard admin
  if (isAdmin) {
    return <AdminApp />;
  }

  const handleLogout = async () => {
    await logout();
  };

  // Utiliser le nouveau dashboard complet
  return <UserDashboardComplete onLogout={handleLogout} />;
}

function AppContent() {
  const { state } = useAuth();
  const { isAuthenticated, isLoading, user } = state;
  const [appState, setAppState] = useState<AppState>('landing');

  // Détecter un lien de vérification par URL (token + hash)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const hash = params.get('hash');
    if (token && hash) {
      setAppState('email-verification');
    }
  }, []);

  // Gérer les transitions entre les états
  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated && user) {
        setAppState('dashboard');
      } else {
        if (appState === 'auth') {
          setAppState('auth');
        } else {
          setAppState('landing');
        }
      }
    }
  }, [isAuthenticated, isLoading, appState, user]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center relative">
        <ParticleBackground />
        <div className="text-center relative z-10">
          <div className="h-16 w-16 animate-spin rounded-full border-4 pi-gradient border-t-transparent mx-auto mb-4"></div>
          <p className="text-lg font-medium">Chargement de votre espace Pi Staking...</p>
        </div>
      </div>
    );
  }

  // Rendu conditionnel basé sur l'état de l'app
  switch (appState) {
    case 'landing':
      return (
        <LandingPageEnhanced 
          onLogin={() => setAppState('auth')}
          onRegister={() => setAppState('auth')}
          onGetStarted={() => setAppState('auth')}
        />
      );
    
    case 'auth':
      return <AuthPage onBack={() => setAppState('landing')} />;
    
    case 'email-verification':
      return (
        <EmailVerificationPage
          email={user?.email || ''}
          type="registration"
          onBack={() => setAppState('dashboard')}
          onVerified={() => setAppState('dashboard')}
        />
      );
    
    case 'dashboard':
      return <Dashboard />;
    
    default:
      return <LandingPageEnhanced onLogin={() => setAppState('auth')} onRegister={() => setAppState('auth')} onGetStarted={() => setAppState('auth')} />;
  }
}

export default function App() {
  return (
    <AuthProvider>
      <StakingProvider>
        <DashboardProvider>
          <AppContent />
          <Toaster position="top-center" richColors closeButton />
        </DashboardProvider>
      </StakingProvider>
    </AuthProvider>
  );
}