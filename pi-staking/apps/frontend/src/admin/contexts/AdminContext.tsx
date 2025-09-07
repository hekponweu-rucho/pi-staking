import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { adminService, type AdminDashboardStats, type SystemAlert } from '../services/adminService';
import { useAuth } from '@/contexts/AuthContext';

// Types pour l'état admin
interface AdminState {
  isAuthorized: boolean;
  isLoading: boolean;
  dashboardStats: AdminDashboardStats | null;
  alerts: SystemAlert[];
  unreadAlertsCount: number;
  error: string | null;
}

// Actions possibles
type AdminAction =
  | { type: 'ADMIN_START_LOADING' }
  | { type: 'ADMIN_SET_AUTHORIZED'; payload: boolean }
  | { type: 'ADMIN_SET_DASHBOARD_STATS'; payload: AdminDashboardStats }
  | { type: 'ADMIN_SET_ALERTS'; payload: SystemAlert[] }
  | { type: 'ADMIN_ADD_ALERT'; payload: SystemAlert }
  | { type: 'ADMIN_RESOLVE_ALERT'; payload: number }
  | { type: 'ADMIN_SET_ERROR'; payload: string }
  | { type: 'ADMIN_CLEAR_ERROR' };

// État initial
const initialState: AdminState = {
  isAuthorized: false,
  isLoading: true,
  dashboardStats: null,
  alerts: [],
  unreadAlertsCount: 0,
  error: null,
};

// Reducer pour gérer l'état
function adminReducer(state: AdminState, action: AdminAction): AdminState {
  switch (action.type) {
    case 'ADMIN_START_LOADING':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    
    case 'ADMIN_SET_AUTHORIZED':
      return {
        ...state,
        isAuthorized: action.payload,
        isLoading: false,
      };
    
    case 'ADMIN_SET_DASHBOARD_STATS':
      return {
        ...state,
        dashboardStats: action.payload,
        isLoading: false,
      };
    
    case 'ADMIN_SET_ALERTS':
      return {
        ...state,
        alerts: action.payload,
        unreadAlertsCount: action.payload.filter(alert => !alert.resolved_at).length,
      };
    
    case 'ADMIN_ADD_ALERT':
      const newAlerts = [action.payload, ...state.alerts];
      return {
        ...state,
        alerts: newAlerts,
        unreadAlertsCount: newAlerts.filter(alert => !alert.resolved_at).length,
      };
    
    case 'ADMIN_RESOLVE_ALERT':
      const updatedAlerts = state.alerts.map(alert =>
        alert.id === action.payload
          ? { ...alert, resolved_at: new Date().toISOString() }
          : alert
      );
      return {
        ...state,
        alerts: updatedAlerts,
        unreadAlertsCount: updatedAlerts.filter(alert => !alert.resolved_at).length,
      };
    
    case 'ADMIN_SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };
    
    case 'ADMIN_CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    
    default:
      return state;
  }
}

// Contexte
const AdminContext = createContext<{
  state: AdminState;
  dispatch: React.Dispatch<AdminAction>;
  refreshDashboard: () => Promise<void>;
  refreshAlerts: () => Promise<void>;
  resolveAlert: (alertId: number) => Promise<void>;
} | null>(null);

// Provider
export function AdminProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(adminReducer, initialState);
  const { isAuthenticated, user } = useAuth();

  // Vérifier l'autorisation admin au démarrage
  useEffect(() => {
    async function checkAdminAccess() {
      if (!isAuthenticated) {
        dispatch({ type: 'ADMIN_SET_AUTHORIZED', payload: false });
        return;
      }

      try {
        dispatch({ type: 'ADMIN_START_LOADING' });
        const isAuthorized = await adminService.checkAdminAccess();
        dispatch({ type: 'ADMIN_SET_AUTHORIZED', payload: isAuthorized });
        
        if (isAuthorized) {
          // Charger les données initiales
          await Promise.all([
            refreshDashboard(),
            refreshAlerts(),
          ]);
        }
      } catch (error) {
        console.error('Erreur lors de la vérification des droits admin:', error);
        dispatch({ type: 'ADMIN_SET_ERROR', payload: 'Erreur lors de la vérification des droits administrateur' });
      }
    }

    checkAdminAccess();
  }, [isAuthenticated]);

  // Actualiser le dashboard
  const refreshDashboard = async () => {
    try {
      dispatch({ type: 'ADMIN_CLEAR_ERROR' });
      const stats = await adminService.getDashboardStats();
      dispatch({ type: 'ADMIN_SET_DASHBOARD_STATS', payload: stats });
    } catch (error) {
      console.error('Erreur lors du chargement des stats:', error);
      dispatch({ type: 'ADMIN_SET_ERROR', payload: 'Erreur lors du chargement des statistiques' });
    }
  };

  // Actualiser les alertes
  const refreshAlerts = async () => {
    try {
      const alertsResponse = await adminService.getSystemAlerts({
        page: 1,
        resolved: false
      });
      dispatch({ type: 'ADMIN_SET_ALERTS', payload: alertsResponse.data });
    } catch (error) {
      console.error('Erreur lors du chargement des alertes:', error);
    }
  };

  // Résoudre une alerte
  const resolveAlert = async (alertId: number) => {
    try {
      await adminService.resolveAlert(alertId);
      dispatch({ type: 'ADMIN_RESOLVE_ALERT', payload: alertId });
    } catch (error) {
      console.error('Erreur lors de la résolution de l\'alerte:', error);
      dispatch({ type: 'ADMIN_SET_ERROR', payload: 'Erreur lors de la résolution de l\'alerte' });
    }
  };

  // Auto-refresh des données toutes les 30 secondes
  useEffect(() => {
    if (!state.isAuthorized) return;

    const interval = setInterval(() => {
      refreshDashboard();
      refreshAlerts();
    }, 30000); // 30 secondes

    return () => clearInterval(interval);
  }, [state.isAuthorized]);

  const value = {
    state,
    dispatch,
    refreshDashboard,
    refreshAlerts,
    resolveAlert,
  };

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

// Hook pour utiliser le contexte admin
export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin doit être utilisé dans un AdminProvider');
  }
  return context;
}

// Hook spécialisé pour vérifier si l'utilisateur est admin
export function useIsAdmin() {
  const context = useContext(AdminContext);
  return context?.state.isAuthorized || false;
}

export default AdminContext;