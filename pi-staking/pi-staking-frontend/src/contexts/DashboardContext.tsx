import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { dashboardService, DashboardData, FinancialSummary, PerformanceMetrics, Notification, ChartsData, AdminDashboardStats, AdminAnalytics } from '../services/dashboardService';
import { useAuth } from './AuthContext';

// Types pour l'état du dashboard
interface DashboardState {
  // Dashboard utilisateur
  dashboardData: DashboardData | null;
  financialSummary: FinancialSummary | null;
  performanceMetrics: PerformanceMetrics | null;
  chartsData: ChartsData | null;
  
  // Notifications
  notifications: Notification[];
  unreadCount: number;
  
  // Dashboard admin
  adminStats: AdminDashboardStats | null;
  adminAnalytics: AdminAnalytics | null;
  
  // États de chargement
  dashboardLoading: boolean;
  financialLoading: boolean;
  performanceLoading: boolean;
  chartsLoading: boolean;
  notificationsLoading: boolean;
  adminStatsLoading: boolean;
  adminAnalyticsLoading: boolean;
  
  // État général
  isLoading: boolean;
  error: string | null;
  
  // Mise à jour automatique
  lastUpdate: number;
  autoRefreshInterval: NodeJS.Timeout | null;
  
  // KPIs temps réel
  realTimeKPIs: {
    active_users_now: number;
    total_claimable_amount: number;
    pending_transactions: number;
    system_health_score: number;
    recent_registrations: number;
  } | null;
}

// Actions pour le reducer
type DashboardAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_DASHBOARD_DATA'; payload: DashboardData }
  | { type: 'SET_DASHBOARD_LOADING'; payload: boolean }
  | { type: 'SET_FINANCIAL_SUMMARY'; payload: FinancialSummary }
  | { type: 'SET_FINANCIAL_LOADING'; payload: boolean }
  | { type: 'SET_PERFORMANCE_METRICS'; payload: PerformanceMetrics }
  | { type: 'SET_PERFORMANCE_LOADING'; payload: boolean }
  | { type: 'SET_CHARTS_DATA'; payload: ChartsData }
  | { type: 'SET_CHARTS_LOADING'; payload: boolean }
  | { type: 'SET_NOTIFICATIONS'; payload: { notifications: Notification[]; unread_count: number } }
  | { type: 'SET_NOTIFICATIONS_LOADING'; payload: boolean }
  | { type: 'MARK_NOTIFICATION_READ'; payload: string }
  | { type: 'MARK_ALL_NOTIFICATIONS_READ' }
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'SET_ADMIN_STATS'; payload: AdminDashboardStats }
  | { type: 'SET_ADMIN_STATS_LOADING'; payload: boolean }
  | { type: 'SET_ADMIN_ANALYTICS'; payload: AdminAnalytics }
  | { type: 'SET_ADMIN_ANALYTICS_LOADING'; payload: boolean }
  | { type: 'SET_REAL_TIME_KPIS'; payload: any }
  | { type: 'UPDATE_LAST_UPDATE' }
  | { type: 'SET_AUTO_REFRESH'; payload: NodeJS.Timeout | null };

// État initial
const initialState: DashboardState = {
  dashboardData: null,
  financialSummary: null,
  performanceMetrics: null,
  chartsData: null,
  notifications: [],
  unreadCount: 0,
  adminStats: null,
  adminAnalytics: null,
  dashboardLoading: false,
  financialLoading: false,
  performanceLoading: false,
  chartsLoading: false,
  notificationsLoading: false,
  adminStatsLoading: false,
  adminAnalyticsLoading: false,
  isLoading: false,
  error: null,
  lastUpdate: 0,
  autoRefreshInterval: null,
  realTimeKPIs: null
};

// Reducer pour gérer l'état du dashboard
const dashboardReducer = (state: DashboardState, action: DashboardAction): DashboardState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    
    case 'SET_DASHBOARD_DATA':
      return { ...state, dashboardData: action.payload };
    
    case 'SET_DASHBOARD_LOADING':
      return { ...state, dashboardLoading: action.payload };
    
    case 'SET_FINANCIAL_SUMMARY':
      return { ...state, financialSummary: action.payload };
    
    case 'SET_FINANCIAL_LOADING':
      return { ...state, financialLoading: action.payload };
    
    case 'SET_PERFORMANCE_METRICS':
      return { ...state, performanceMetrics: action.payload };
    
    case 'SET_PERFORMANCE_LOADING':
      return { ...state, performanceLoading: action.payload };
    
    case 'SET_CHARTS_DATA':
      return { ...state, chartsData: action.payload };
    
    case 'SET_CHARTS_LOADING':
      return { ...state, chartsLoading: action.payload };
    
    case 'SET_NOTIFICATIONS':
      return { 
        ...state, 
        notifications: action.payload.notifications,
        unreadCount: action.payload.unread_count
      };
    
    case 'SET_NOTIFICATIONS_LOADING':
      return { ...state, notificationsLoading: action.payload };
    
    case 'MARK_NOTIFICATION_READ':
      return {
        ...state,
        notifications: state.notifications.map(notif =>
          notif.id === action.payload ? { ...notif, is_read: true } : notif
        ),
        unreadCount: Math.max(0, state.unreadCount - 1)
      };
    
    case 'MARK_ALL_NOTIFICATIONS_READ':
      return {
        ...state,
        notifications: state.notifications.map(notif => ({ ...notif, is_read: true })),
        unreadCount: 0
      };
    
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [action.payload, ...state.notifications],
        unreadCount: action.payload.is_read ? state.unreadCount : state.unreadCount + 1
      };
    
    case 'SET_ADMIN_STATS':
      return { ...state, adminStats: action.payload };
    
    case 'SET_ADMIN_STATS_LOADING':
      return { ...state, adminStatsLoading: action.payload };
    
    case 'SET_ADMIN_ANALYTICS':
      return { ...state, adminAnalytics: action.payload };
    
    case 'SET_ADMIN_ANALYTICS_LOADING':
      return { ...state, adminAnalyticsLoading: action.payload };
    
    case 'SET_REAL_TIME_KPIS':
      return { ...state, realTimeKPIs: action.payload };
    
    case 'UPDATE_LAST_UPDATE':
      return { ...state, lastUpdate: Date.now() };
    
    case 'SET_AUTO_REFRESH':
      return { ...state, autoRefreshInterval: action.payload };
    
    default:
      return state;
  }
};

// Interface du contexte
interface DashboardContextType {
  // État
  state: DashboardState;
  
  // Actions dashboard utilisateur
  loadDashboardData: () => Promise<void>;
  loadFinancialSummary: () => Promise<void>;
  loadPerformanceMetrics: () => Promise<void>;
  loadChartsData: (period?: 'week' | 'month' | 'year') => Promise<void>;
  
  // Actions notifications
  loadNotifications: (unreadOnly?: boolean) => Promise<void>;
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  addNotification: (notification: Notification) => void;
  
  // Actions dashboard admin
  loadAdminStats: () => Promise<void>;
  loadAdminAnalytics: (period?: 'week' | 'month' | 'year') => Promise<void>;
  
  // KPIs temps réel
  loadRealTimeKPIs: () => Promise<void>;
  
  // Utilitaires
  refreshAllData: (isAdmin?: boolean) => Promise<void>;
  startAutoRefresh: (isAdmin?: boolean) => void;
  stopAutoRefresh: () => void;
  clearError: () => void;
}

// Créer le contexte
const DashboardContext = createContext<DashboardContextType | null>(null);

// Provider du contexte dashboard
interface DashboardProviderProps {
  children: ReactNode;
}

export const DashboardProvider: React.FC<DashboardProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(dashboardReducer, initialState);
  const { state: authState } = useAuth();

  // Charger les données initiales quand l'utilisateur est authentifié
  useEffect(() => {
    if (authState.isAuthenticated && authState.user) {
      const isAdmin = authState.user.role === 'admin';
      loadInitialData(isAdmin);
    }
  }, [authState.isAuthenticated, authState.user?.role]);

  // Nettoyer l'intervalle au démontage
  useEffect(() => {
    return () => {
      if (state.autoRefreshInterval) {
        clearInterval(state.autoRefreshInterval);
      }
    };
  }, [state.autoRefreshInterval]);

  // Charger les données initiales
  const loadInitialData = async (isAdmin: boolean = false) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      if (isAdmin) {
        // Charger les données admin
        await Promise.all([
          loadDashboardData(),
          loadNotifications(),
          loadAdminStats(),
          loadRealTimeKPIs()
        ]);
      } else {
        // Charger les données utilisateur
        await Promise.all([
          loadDashboardData(),
          loadFinancialSummary(),
          loadNotifications(),
          loadRealTimeKPIs()
        ]);
      }
      
      dispatch({ type: 'UPDATE_LAST_UPDATE' });
    } catch (error) {
      console.error('Erreur lors du chargement initial du dashboard:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Erreur de chargement des données' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Charger les données principales du dashboard
  const loadDashboardData = async (): Promise<void> => {
    try {
      dispatch({ type: 'SET_DASHBOARD_LOADING', payload: true });
      const response = await dashboardService.getDashboardData();
      
      if (response.success) {
        dispatch({ type: 'SET_DASHBOARD_DATA', payload: response.data });
      } else {
        throw new Error('Erreur de chargement du dashboard');
      }
    } catch (error) {
      console.error('Erreur lors du chargement du dashboard:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Erreur de chargement du dashboard' });
    } finally {
      dispatch({ type: 'SET_DASHBOARD_LOADING', payload: false });
    }
  };

  // Charger le résumé financier
  const loadFinancialSummary = async (): Promise<void> => {
    try {
      dispatch({ type: 'SET_FINANCIAL_LOADING', payload: true });
      const response = await dashboardService.getFinancialSummary();
      
      if (response.success) {
        dispatch({ type: 'SET_FINANCIAL_SUMMARY', payload: response.data });
      } else {
        throw new Error('Erreur de chargement du résumé financier');
      }
    } catch (error) {
      console.error('Erreur lors du chargement du résumé financier:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Erreur de chargement du résumé financier' });
    } finally {
      dispatch({ type: 'SET_FINANCIAL_LOADING', payload: false });
    }
  };

  // Charger les métriques de performance
  const loadPerformanceMetrics = async (): Promise<void> => {
    try {
      dispatch({ type: 'SET_PERFORMANCE_LOADING', payload: true });
      const response = await dashboardService.getPerformanceMetrics();
      
      if (response.success) {
        dispatch({ type: 'SET_PERFORMANCE_METRICS', payload: response.data });
      } else {
        throw new Error('Erreur de chargement des métriques');
      }
    } catch (error) {
      console.error('Erreur lors du chargement des métriques:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Erreur de chargement des métriques' });
    } finally {
      dispatch({ type: 'SET_PERFORMANCE_LOADING', payload: false });
    }
  };

  // Charger les données des graphiques
  const loadChartsData = async (period: 'week' | 'month' | 'year' = 'month'): Promise<void> => {
    try {
      dispatch({ type: 'SET_CHARTS_LOADING', payload: true });
      const response = await dashboardService.getChartsData(period);
      
      if (response.success) {
        dispatch({ type: 'SET_CHARTS_DATA', payload: response.data });
      } else {
        throw new Error('Erreur de chargement des graphiques');
      }
    } catch (error) {
      console.error('Erreur lors du chargement des graphiques:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Erreur de chargement des graphiques' });
    } finally {
      dispatch({ type: 'SET_CHARTS_LOADING', payload: false });
    }
  };

  // Charger les notifications
  const loadNotifications = async (unreadOnly: boolean = false): Promise<void> => {
    try {
      dispatch({ type: 'SET_NOTIFICATIONS_LOADING', payload: true });
      const response = await dashboardService.getNotifications(unreadOnly);
      
      if (response.success) {
        dispatch({ type: 'SET_NOTIFICATIONS', payload: response.data });
      } else {
        throw new Error('Erreur de chargement des notifications');
      }
    } catch (error) {
      console.error('Erreur lors du chargement des notifications:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Erreur de chargement des notifications' });
    } finally {
      dispatch({ type: 'SET_NOTIFICATIONS_LOADING', payload: false });
    }
  };

  // Marquer une notification comme lue
  const markNotificationAsRead = async (notificationId: string): Promise<void> => {
    try {
      const response = await dashboardService.markNotificationAsRead(notificationId);
      
      if (response.success) {
        dispatch({ type: 'MARK_NOTIFICATION_READ', payload: notificationId });
      }
    } catch (error) {
      console.error('Erreur lors du marquage de la notification:', error);
    }
  };

  // Marquer toutes les notifications comme lues
  const markAllNotificationsAsRead = async (): Promise<void> => {
    try {
      const response = await dashboardService.markAllNotificationsAsRead();
      
      if (response.success) {
        dispatch({ type: 'MARK_ALL_NOTIFICATIONS_READ' });
      }
    } catch (error) {
      console.error('Erreur lors du marquage des notifications:', error);
    }
  };

  // Ajouter une notification
  const addNotification = (notification: Notification): void => {
    dispatch({ type: 'ADD_NOTIFICATION', payload: notification });
  };

  // Charger les statistiques admin
  const loadAdminStats = async (): Promise<void> => {
    try {
      dispatch({ type: 'SET_ADMIN_STATS_LOADING', payload: true });
      const response = await dashboardService.getAdminDashboardStats();
      
      if (response.success) {
        dispatch({ type: 'SET_ADMIN_STATS', payload: response.data });
      } else {
        throw new Error('Erreur de chargement des statistiques admin');
      }
    } catch (error) {
      console.error('Erreur lors du chargement des stats admin:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Erreur de chargement des statistiques admin' });
    } finally {
      dispatch({ type: 'SET_ADMIN_STATS_LOADING', payload: false });
    }
  };

  // Charger les analytics admin
  const loadAdminAnalytics = async (period: 'week' | 'month' | 'year' = 'month'): Promise<void> => {
    try {
      dispatch({ type: 'SET_ADMIN_ANALYTICS_LOADING', payload: true });
      const response = await dashboardService.getAdminAnalytics(period);
      
      if (response.success) {
        dispatch({ type: 'SET_ADMIN_ANALYTICS', payload: response.data });
      } else {
        throw new Error('Erreur de chargement des analytics admin');
      }
    } catch (error) {
      console.error('Erreur lors du chargement des analytics admin:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Erreur de chargement des analytics admin' });
    } finally {
      dispatch({ type: 'SET_ADMIN_ANALYTICS_LOADING', payload: false });
    }
  };

  // Charger les KPIs temps réel
  const loadRealTimeKPIs = async (): Promise<void> => {
    try {
      const kpis = await dashboardService.getRealTimeKPIs();
      dispatch({ type: 'SET_REAL_TIME_KPIS', payload: kpis });
    } catch (error) {
      console.error('Erreur lors du chargement des KPIs temps réel:', error);
    }
  };

  // Actualiser toutes les données
  const refreshAllData = async (isAdmin: boolean = false): Promise<void> => {
    if (!authState.isAuthenticated) return;
    
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const promises = [
        loadDashboardData(),
        loadNotifications(),
        loadRealTimeKPIs()
      ];

      if (isAdmin) {
        promises.push(
          loadAdminStats(),
          loadAdminAnalytics()
        );
      } else {
        promises.push(
          loadFinancialSummary(),
          loadPerformanceMetrics(),
          loadChartsData()
        );
      }
      
      await Promise.all(promises);
      
      dispatch({ type: 'UPDATE_LAST_UPDATE' });
    } catch (error) {
      console.error('Erreur lors de l\'actualisation:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Erreur d\'actualisation des données' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Démarrer l'actualisation automatique
  const startAutoRefresh = (isAdmin: boolean = false): void => {
    if (state.autoRefreshInterval) return;
    
    const interval = setInterval(() => {
      if (authState.isAuthenticated) {
        refreshAllData(isAdmin);
      }
    }, 60000); // Actualiser toutes les minutes
    
    dispatch({ type: 'SET_AUTO_REFRESH', payload: interval });
  };

  // Arrêter l'actualisation automatique
  const stopAutoRefresh = (): void => {
    if (state.autoRefreshInterval) {
      clearInterval(state.autoRefreshInterval);
      dispatch({ type: 'SET_AUTO_REFRESH', payload: null });
    }
  };

  // Effacer l'erreur
  const clearError = (): void => {
    dispatch({ type: 'SET_ERROR', payload: null });
  };

  // Valeur du contexte
  const contextValue: DashboardContextType = {
    state,
    loadDashboardData,
    loadFinancialSummary,
    loadPerformanceMetrics,
    loadChartsData,
    loadNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    addNotification,
    loadAdminStats,
    loadAdminAnalytics,
    loadRealTimeKPIs,
    refreshAllData,
    startAutoRefresh,
    stopAutoRefresh,
    clearError
  };

  return (
    <DashboardContext.Provider value={contextValue}>
      {children}
    </DashboardContext.Provider>
  );
};

// Hook pour utiliser le contexte dashboard
export const useDashboard = (): DashboardContextType => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard doit être utilisé dans un DashboardProvider');
  }
  return context;
};

// Hooks utilitaires spécialisés
export const useDashboardData = () => {
  const { state, loadDashboardData } = useDashboard();
  return {
    data: state.dashboardData,
    loading: state.dashboardLoading,
    loadDashboardData
  };
};

export const useFinancialSummary = () => {
  const { state, loadFinancialSummary } = useDashboard();
  return {
    summary: state.financialSummary,
    loading: state.financialLoading,
    loadFinancialSummary
  };
};

export const usePerformanceMetrics = () => {
  const { state, loadPerformanceMetrics } = useDashboard();
  return {
    metrics: state.performanceMetrics,
    loading: state.performanceLoading,
    loadPerformanceMetrics
  };
};

export const useChartsData = () => {
  const { state, loadChartsData } = useDashboard();
  return {
    charts: state.chartsData,
    loading: state.chartsLoading,
    loadChartsData
  };
};

export const useNotifications = () => {
  const { 
    state, 
    loadNotifications, 
    markNotificationAsRead, 
    markAllNotificationsAsRead,
    addNotification 
  } = useDashboard();
  
  return {
    notifications: state.notifications,
    unreadCount: state.unreadCount,
    loading: state.notificationsLoading,
    loadNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    addNotification
  };
};

export const useAdminDashboard = () => {
  const { state, loadAdminStats, loadAdminAnalytics } = useDashboard();
  return {
    stats: state.adminStats,
    analytics: state.adminAnalytics,
    statsLoading: state.adminStatsLoading,
    analyticsLoading: state.adminAnalyticsLoading,
    loadAdminStats,
    loadAdminAnalytics
  };
};

export const useRealTimeKPIs = () => {
  const { state, loadRealTimeKPIs } = useDashboard();
  return {
    kpis: state.realTimeKPIs,
    loadRealTimeKPIs
  };
};

export default DashboardProvider;