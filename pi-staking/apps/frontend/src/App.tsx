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


// Types pour la navigation
type AppState = 'landing' | 'auth' | 'email-verification' | 'dashboard';

function Dashboard() {
  const { state, logout, checkEmailVerified } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const user = state.user;

  // Vérifier si l'utilisateur est admin
  useEffect(() => {
    if (user) {
      // Vérifier par email admin ou propriété is_admin
      const adminEmails = ['admin@pistaking.com', 'admin@example.com'];
      const isAdminUser = user.is_admin || adminEmails.includes(user.email);
      setIsAdmin(isAdminUser);
    }
  }, [user]);

  // Si l'utilisateur n'a pas vérifié son email, le rediriger
  if (user && !checkEmailVerified()) {
    return (
      <EmailVerificationPage 
        email={user.email}
        type="registration"
        onBack={() => logout()}
        onVerified={() => window.location.reload()}
      />
    );
  }

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
  const { state, checkEmailVerified } = useAuth();
  const { isAuthenticated, isLoading, user } = state;
  const [appState, setAppState] = useState<AppState>('landing');

  // Gérer les transitions entre les états
  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated && user) {
        // Vérifier si l'email est vérifié
        if (!checkEmailVerified()) {
          setAppState('email-verification');
        } else {
          setAppState('dashboard');
        }
      } else {
        // Si pas authentifié, rester sur landing sauf si on demande explicitement l'auth
        if (appState === 'auth') {
          setAppState('auth');
        } else {
          setAppState('landing');
        }
      }
    }
  }, [isAuthenticated, isLoading, appState, user, checkEmailVerified]);

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
          onBack={() => setAppState('landing')}
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
        </DashboardProvider>
      </StakingProvider>
    </AuthProvider>
  );
}