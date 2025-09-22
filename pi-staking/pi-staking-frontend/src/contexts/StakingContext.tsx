import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { stakingService, PerformanceData } from '../services/stakingService';
import { claimsService, ClaimableInvestment, ClaimStatistics, ClaimHistory } from '../services/claimsService';
import { useAuth } from './AuthContext';
import type { ApiComponents } from '../../../packages/shared-types/src';

type StakingPackage = ApiComponents['schemas']['StakingPackage'];
type Investment = ApiComponents['schemas']['Investment'];

// Types pour l'état de staking
interface StakingState {
  // Packages
  packages: StakingPackage[];
  packagesLoading: boolean;
  
  // Investissements
  investments: Investment[];
  investmentsLoading: boolean;
  
  // Réclamations
  claimableInvestments: ClaimableInvestment[];
  claimHistory: ClaimHistory[];
  claimStatistics: ClaimStatistics | null;
  claimHistoryLoading: boolean;
  claimableLoading: boolean;
  
  // Performance
  performanceData: PerformanceData[];
  performanceLoading: boolean;
  
  // État général
  isLoading: boolean;
  error: string | null;
  
  // Statistiques calculées
  totalInvested: number;
  totalEarned: number;
  totalClaimed: number;
  activeInvestments: number;
  totalClaimableNow: number;
  
  // Mise à jour automatique
  lastUpdate: number;
  autoRefreshInterval: NodeJS.Timeout | null;
}

// Actions pour le reducer
type StakingAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_PACKAGES'; payload: StakingPackage[] }
  | { type: 'SET_PACKAGES_LOADING'; payload: boolean }
  | { type: 'SET_INVESTMENTS'; payload: Investment[] }
  | { type: 'SET_INVESTMENTS_LOADING'; payload: boolean }
  | { type: 'ADD_INVESTMENT'; payload: Investment }
  | { type: 'UPDATE_INVESTMENT'; payload: { id: string; updates: Partial<Investment> } }
  | { type: 'SET_CLAIMABLE_INVESTMENTS'; payload: ClaimableInvestment[] }
  | { type: 'SET_CLAIMABLE_LOADING'; payload: boolean }
  | { type: 'SET_CLAIM_HISTORY'; payload: ClaimHistory[] }
  | { type: 'SET_CLAIM_HISTORY_LOADING'; payload: boolean }
  | { type: 'ADD_CLAIM_HISTORY'; payload: ClaimHistory }
  | { type: 'SET_CLAIM_STATISTICS'; payload: ClaimStatistics }
  | { type: 'SET_PERFORMANCE_DATA'; payload: PerformanceData[] }
  | { type: 'SET_PERFORMANCE_LOADING'; payload: boolean }
  | { type: 'UPDATE_CLAIMABLE_AMOUNT'; payload: { investmentId: string; newAmount: number } }
  | { type: 'MARK_INVESTMENT_CLAIMED'; payload: string }
  | { type: 'UPDATE_LAST_UPDATE' }
  | { type: 'SET_AUTO_REFRESH'; payload: NodeJS.Timeout | null }
  | { type: 'CALCULATE_TOTALS' };

// État initial
const initialState: StakingState = {
  packages: [],
  packagesLoading: false,
  investments: [],
  investmentsLoading: false,
  claimableInvestments: [],
  claimHistory: [],
  claimStatistics: null,
  claimHistoryLoading: false,
  claimableLoading: false,
  performanceData: [],
  performanceLoading: false,
  isLoading: false,
  error: null,
  totalInvested: 0,
  totalEarned: 0,
  totalClaimed: 0,
  activeInvestments: 0,
  totalClaimableNow: 0,
  lastUpdate: 0,
  autoRefreshInterval: null
};

// Reducer pour gérer l'état de staking
const stakingReducer = (state: StakingState, action: StakingAction): StakingState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    
    case 'SET_PACKAGES':
      return { ...state, packages: action.payload };
    
    case 'SET_PACKAGES_LOADING':
      return { ...state, packagesLoading: action.payload };
    
    case 'SET_INVESTMENTS':
      return { ...state, investments: action.payload };
    
    case 'SET_INVESTMENTS_LOADING':
      return { ...state, investmentsLoading: action.payload };
    
    case 'ADD_INVESTMENT':
      return { 
        ...state, 
        investments: [...state.investments, action.payload] 
      };
    
    case 'UPDATE_INVESTMENT':
      return {
        ...state,
        investments: state.investments.map(inv =>
          inv.id === action.payload.id 
            ? { ...inv, ...action.payload.updates }
            : inv
        )
      };
    
    case 'SET_CLAIMABLE_INVESTMENTS':
      return { ...state, claimableInvestments: action.payload };
    
    case 'SET_CLAIMABLE_LOADING':
      return { ...state, claimableLoading: action.payload };
    
    case 'SET_CLAIM_HISTORY':
      return { ...state, claimHistory: action.payload };
    
    case 'SET_CLAIM_HISTORY_LOADING':
      return { ...state, claimHistoryLoading: action.payload };
    
    case 'ADD_CLAIM_HISTORY':
      return { 
        ...state, 
        claimHistory: [action.payload, ...state.claimHistory] 
      };
    
    case 'SET_CLAIM_STATISTICS':
      return { ...state, claimStatistics: action.payload };
    
    case 'SET_PERFORMANCE_DATA':
      return { ...state, performanceData: action.payload };
    
    case 'SET_PERFORMANCE_LOADING':
      return { ...state, performanceLoading: action.payload };
    
    case 'UPDATE_CLAIMABLE_AMOUNT':
      return {
        ...state,
        claimableInvestments: state.claimableInvestments.map(inv =>
          inv.investment_id === action.payload.investmentId
            ? { ...inv, claimable_amount: action.payload.newAmount }
            : inv
        )
      };
    
    case 'MARK_INVESTMENT_CLAIMED':
      return {
        ...state,
        claimableInvestments: state.claimableInvestments.map(inv =>
          inv.investment_id === action.payload
            ? { ...inv, can_claim: false, claimable_amount: 0 }
            : inv
        )
      };
    
    case 'UPDATE_LAST_UPDATE':
      return { ...state, lastUpdate: Date.now() };
    
    case 'SET_AUTO_REFRESH':
      return { ...state, autoRefreshInterval: action.payload };
    
    case 'CALCULATE_TOTALS':
      const safeInvestments = Array.isArray(state.investments) ? state.investments : [];
      const safeClaimable = Array.isArray(state.claimableInvestments) ? state.claimableInvestments : [];
      const totalInvested = safeInvestments.reduce((sum, inv) => sum + inv.amount, 0);
      const totalEarned = safeInvestments.reduce((sum, inv) => sum + inv.total_earned, 0);
      const totalClaimed = safeInvestments.reduce((sum, inv) => sum + inv.total_claimed, 0);
      const activeInvestments = safeInvestments.filter(inv => inv.status === 'active').length;
      const totalClaimableNow = safeClaimable.reduce((sum, inv) => 
        inv.can_claim ? sum + inv.claimable_amount : sum, 0
      );
      
      return {
        ...state,
        totalInvested,
        totalEarned,
        totalClaimed,
        activeInvestments,
        totalClaimableNow
      };
    
    default:
      return state;
  }
};

// Interface du contexte
interface StakingContextType {
  // État
  state: StakingState;
  
  // Actions des packages
  loadPackages: () => Promise<void>;
  
  // Actions des investissements
  loadInvestments: () => Promise<void>;
  createInvestment: (packageId: string, amount: number, source?: 'funds' | 'bonus') => Promise<boolean>;
  getInvestmentDetails: (investmentId: string) => Promise<any>;
  calculateEarnings: (packageId: string, amount: number, duration?: number) => Promise<any>;
  
  // Actions des réclamations
  loadClaimableInvestments: () => Promise<void>;
  claimInvestment: (investmentId: string) => Promise<boolean>;
  bulkClaim: () => Promise<boolean>;
  loadClaimHistory: (page?: number) => Promise<void>;
  loadClaimStatistics: () => Promise<void>;
  
  // Actions de performance
  loadPerformanceData: (period?: 'week' | 'month' | 'year') => Promise<void>;
  
  // Utilitaires
  refreshAllData: () => Promise<void>;
  startAutoRefresh: () => void;
  stopAutoRefresh: () => void;
  clearError: () => void;
  
  // Getters calculés
  getPackageById: (id: string) => StakingPackage | undefined;
  getInvestmentById: (id: string) => Investment | undefined;
  getClaimableByInvestmentId: (investmentId: string) => ClaimableInvestment | undefined;
  getTotalROI: () => number;
  getAverageDailyReturn: () => number;
  getNextClaimTime: () => Date | null;
}

// Créer le contexte
const StakingContext = createContext<StakingContextType | null>(null);

// Provider du contexte de staking
interface StakingProviderProps {
  children: ReactNode;
}

export const StakingProvider: React.FC<StakingProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(stakingReducer, initialState);
  const { state: authState } = useAuth();

  // Charger les données initiales quand l'utilisateur est authentifié
  useEffect(() => {
    if (authState.isAuthenticated && authState.user) {
      loadInitialData();
    }
  }, [authState.isAuthenticated]);

  // Calculer les totaux quand les données changent
  useEffect(() => {
    dispatch({ type: 'CALCULATE_TOTALS' });
  }, [state.investments, state.claimableInvestments]);

  // Nettoyer l'intervalle au démontage
  useEffect(() => {
    return () => {
      if (state.autoRefreshInterval) {
        clearInterval(state.autoRefreshInterval);
      }
    };
  }, [state.autoRefreshInterval]);

  // Charger les données initiales
  const loadInitialData = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Charger toutes les données en parallèle
      await Promise.all([
        loadPackages(),
        loadInvestments(),
        loadClaimableInvestments(),
        loadClaimStatistics()
      ]);
      
      dispatch({ type: 'UPDATE_LAST_UPDATE' });
    } catch (error) {
      console.error('Erreur lors du chargement initial:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Erreur de chargement des données' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Charger les packages
  const loadPackages = async (): Promise<void> => {
    try {
      dispatch({ type: 'SET_PACKAGES_LOADING', payload: true });
      const response = await stakingService.getPackages();
      
      if (response.success) {
        dispatch({ type: 'SET_PACKAGES', payload: response.data });
      } else {
        throw new Error('Erreur de chargement des packages');
      }
    } catch (error) {
      console.error('Erreur lors du chargement des packages:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Erreur de chargement des packages' });
    } finally {
      dispatch({ type: 'SET_PACKAGES_LOADING', payload: false });
    }
  };

  // Charger les investissements
  const loadInvestments = async (): Promise<void> => {
    try {
      dispatch({ type: 'SET_INVESTMENTS_LOADING', payload: true });
      const response = await stakingService.getUserInvestments();
      
      if (response.success) {
        dispatch({ type: 'SET_INVESTMENTS', payload: response.data });
      } else {
        throw new Error('Erreur de chargement des investissements');
      }
    } catch (error) {
      console.error('Erreur lors du chargement des investissements:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Erreur de chargement des investissements' });
    } finally {
      dispatch({ type: 'SET_INVESTMENTS_LOADING', payload: false });
    }
  };

  // Créer un investissement
  const createInvestment = async (packageId: string, amount: number, source: 'funds' | 'bonus' = 'funds'): Promise<boolean> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await stakingService.createInvestment(packageId, amount, source);
      
      if (response.success) {
        if (response.data) {
          dispatch({ type: 'ADD_INVESTMENT', payload: response.data });
        }
        
        // Recharger les données liées
        await Promise.all([
          loadClaimableInvestments(),
          loadClaimStatistics()
        ]);
        
        return true;
      } else {
        dispatch({ type: 'SET_ERROR', payload: response.message });
        return false;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur de création d\'investissement';
      dispatch({ type: 'SET_ERROR', payload: message });
      return false;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Obtenir les détails d'un investissement
  const getInvestmentDetails = async (investmentId: string) => {
    try {
      const response = await stakingService.getInvestmentDetails(investmentId);
      if (response.success) {
        // Mettre à jour l'investissement dans l'état
        dispatch({
          type: 'UPDATE_INVESTMENT',
          payload: {
            id: investmentId,
            updates: response.data ?? {}
          }
        });
        return response.data;
      } else {
        throw new Error('Erreur lors de la récupération des détails');
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des détails:', error);
      throw error;
    }
  };

  // Calculer les gains
  const calculateEarnings = async (packageId: string, amount: number, duration?: number) => {
    try {
      const response = await stakingService.calculateEarnings(packageId, amount, duration);
      return response.success ? response.data : null;
    } catch (error) {
      console.error('Erreur lors du calcul des gains:', error);
      return null;
    }
  };

  // Charger les investissements réclamables
  const loadClaimableInvestments = async (): Promise<void> => {
    try {
      dispatch({ type: 'SET_CLAIMABLE_LOADING', payload: true });
      const response = await claimsService.getClaimableInvestments();
      
      if (response.success) {
        dispatch({ type: 'SET_CLAIMABLE_INVESTMENTS', payload: response.data });
      } else {
        throw new Error('Erreur de chargement des réclamations');
      }
    } catch (error) {
      console.error('Erreur lors du chargement des réclamations:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Erreur de chargement des réclamations' });
    } finally {
      dispatch({ type: 'SET_CLAIMABLE_LOADING', payload: false });
    }
  };

  // Réclamer un investissement
  const claimInvestment = async (investmentId: string): Promise<boolean> => {
    try {
      const response = await claimsService.claimInvestment(investmentId);
      
      if (response.success) {
        // Marquer l'investissement comme réclamé
        dispatch({ type: 'MARK_INVESTMENT_CLAIMED', payload: investmentId });
        
        // Ajouter à l'historique des réclamations
        const newClaim: ClaimHistory = {
          id: response.data.claim_id,
          user_id: authState.user?.id?.toString() || '',
          investment_id: investmentId,
          final_amount: response.data.amount,
          claimed_at: new Date().toISOString(),
          status: 'processed',
          transaction_hash: response.data.transaction_hash,
          investment: {
            id: investmentId,
            package: {
              name: 'Package',
              level: 'bronze'
            }
          }
        };
        
        dispatch({ type: 'ADD_CLAIM_HISTORY', payload: newClaim });
        
        // Recharger les statistiques
        await loadClaimStatistics();
        
        return true;
      } else {
        dispatch({ type: 'SET_ERROR', payload: response.message });
        return false;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur de réclamation';
      dispatch({ type: 'SET_ERROR', payload: message });
      return false;
    }
  };

  // Réclamation en masse
  const bulkClaim = async (): Promise<boolean> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await claimsService.bulkClaim();
      
      if (response.success) {
        // Recharger toutes les données de réclamation
        await Promise.all([
          loadClaimableInvestments(),
          loadClaimHistory(),
          loadClaimStatistics()
        ]);
        
        return true;
      } else {
        dispatch({ type: 'SET_ERROR', payload: response.message });
        return false;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur de réclamation en masse';
      dispatch({ type: 'SET_ERROR', payload: message });
      return false;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Charger l'historique des réclamations
  const loadClaimHistory = async (page: number = 1): Promise<void> => {
    try {
      dispatch({ type: 'SET_CLAIM_HISTORY_LOADING', payload: true });
      const response = await claimsService.getClaimHistory(page);
      
      if (response.success) {
        dispatch({ type: 'SET_CLAIM_HISTORY', payload: response.data.claims });
      } else {
        throw new Error('Erreur de chargement de l\'historique');
      }
    } catch (error) {
      console.error('Erreur lors du chargement de l\'historique:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Erreur de chargement de l\'historique' });
    } finally {
      dispatch({ type: 'SET_CLAIM_HISTORY_LOADING', payload: false });
    }
  };

  // Charger les statistiques de réclamation
  const loadClaimStatistics = async (): Promise<void> => {
    try {
      const response = await claimsService.getClaimStatistics();
      
      if (response.success) {
        dispatch({ type: 'SET_CLAIM_STATISTICS', payload: response.data });
      }
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    }
  };

  // Charger les données de performance
  const loadPerformanceData = async (period: 'week' | 'month' | 'year' = 'month'): Promise<void> => {
    try {
      dispatch({ type: 'SET_PERFORMANCE_LOADING', payload: true });
      const response = await stakingService.getPerformanceHistory(period);
      
      if (response.success) {
        dispatch({ type: 'SET_PERFORMANCE_DATA', payload: response.data });
      } else {
        throw new Error('Erreur de chargement de la performance');
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la performance:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Erreur de chargement de la performance' });
    } finally {
      dispatch({ type: 'SET_PERFORMANCE_LOADING', payload: false });
    }
  };

  // Actualiser toutes les données
  const refreshAllData = async (): Promise<void> => {
    if (!authState.isAuthenticated) return;
    
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      await Promise.all([
        loadInvestments(),
        loadClaimableInvestments(),
        loadClaimStatistics(),
        loadPerformanceData()
      ]);
      
      dispatch({ type: 'UPDATE_LAST_UPDATE' });
    } catch (error) {
      console.error('Erreur lors de l\'actualisation:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Erreur d\'actualisation des données' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Démarrer l'actualisation automatique
  const startAutoRefresh = (): void => {
    if (state.autoRefreshInterval) return;
    
    const interval = setInterval(() => {
      if (authState.isAuthenticated) {
        refreshAllData();
      }
    }, 30000); // Actualiser toutes les 30 secondes
    
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

  // Getters calculés
  const getPackageById = (id: string): StakingPackage | undefined => {
    return state.packages.find(pkg => pkg.id === id);
  };

  const getInvestmentById = (id: string): Investment | undefined => {
    return state.investments.find(inv => inv.id === id);
  };

  const getClaimableByInvestmentId = (investmentId: string): ClaimableInvestment | undefined => {
    return state.claimableInvestments.find(claim => claim.investment_id === investmentId);
  };

  const getTotalROI = (): number => {
    if (state.totalInvested === 0) return 0;
    return (state.totalEarned / state.totalInvested) * 100;
  };

  const getAverageDailyReturn = (): number => {
    if (state.activeInvestments === 0) return 0;
    
    const totalDailyReturns = state.investments
      .filter(inv => inv.status === 'active')
      .reduce((sum, inv) => sum + (inv.amount * inv.daily_rate), 0);
    
    return totalDailyReturns / state.activeInvestments;
  };

  const getNextClaimTime = (): Date | null => {
    const nextClaimDates = state.claimableInvestments
      .filter(inv => !inv.can_claim)
      .map(inv => new Date(inv.next_claim_at))
      .sort((a, b) => a.getTime() - b.getTime());
    
    return nextClaimDates[0] || null;
  };

  // Valeur du contexte
  const contextValue: StakingContextType = {
    state,
    loadPackages,
    loadInvestments,
    createInvestment,
    getInvestmentDetails,
    calculateEarnings,
    loadClaimableInvestments,
    claimInvestment,
    bulkClaim,
    loadClaimHistory,
    loadClaimStatistics,
    loadPerformanceData,
    refreshAllData,
    startAutoRefresh,
    stopAutoRefresh,
    clearError,
    getPackageById,
    getInvestmentById,
    getClaimableByInvestmentId,
    getTotalROI,
    getAverageDailyReturn,
    getNextClaimTime
  };

  return (
    <StakingContext.Provider value={contextValue}>
      {children}
    </StakingContext.Provider>
  );
};

// Hook pour utiliser le contexte de staking
export const useStaking = (): StakingContextType => {
  const context = useContext(StakingContext);
  if (!context) {
    throw new Error('useStaking doit être utilisé dans un StakingProvider');
  }
  return context;
};

// Hooks utilitaires spécialisés
export const usePackages = () => {
  const { state, loadPackages } = useStaking();
  return {
    packages: state.packages,
    loading: state.packagesLoading,
    loadPackages
  };
};

export const useInvestments = () => {
  const { state, loadInvestments } = useStaking();
  return {
    investments: state.investments,
    loading: state.investmentsLoading,
    totalInvested: state.totalInvested,
    activeInvestments: state.activeInvestments,
    loadInvestments
  };
};

export const useClaimable = () => {
  const { state, loadClaimableInvestments, claimInvestment, bulkClaim } = useStaking();
  return {
    claimableInvestments: state.claimableInvestments,
    loading: state.claimableLoading,
    totalClaimableNow: state.totalClaimableNow,
    loadClaimableInvestments,
    claimInvestment,
    bulkClaim
  };
};

export const useStakingStats = () => {
  const { state, getTotalROI, getAverageDailyReturn } = useStaking();
  return {
    totalInvested: state.totalInvested,
    totalEarned: state.totalEarned,
    totalClaimed: state.totalClaimed,
    activeInvestments: state.activeInvestments,
    totalClaimableNow: state.totalClaimableNow,
    totalROI: getTotalROI(),
    averageDailyReturn: getAverageDailyReturn(),
    statistics: state.claimStatistics
  };
};

export default StakingProvider;