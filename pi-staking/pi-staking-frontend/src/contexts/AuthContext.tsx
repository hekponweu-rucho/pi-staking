import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { authService, LoginCredentials, RegisterCredentials } from '../services/authService';
import { securityService, TwoFactorStatus, AccountSecurityStatus } from '../services/securityService';
import { emailVerificationService, EmailVerificationResponse } from '../services/emailVerificationService';
import type { ApiComponents } from '../../../packages/shared-types/src';

type User = ApiComponents['schemas']['User'];

// Types pour l'état d'authentification
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  twoFactorStatus: TwoFactorStatus | null;
  securityStatus: AccountSecurityStatus | null;
  welcomeBonusClaimed: boolean;
}

// Actions pour le reducer
type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: User }
  | { type: 'AUTH_ERROR'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'AUTH_INITIALIZED' }
  | { type: 'UPDATE_USER'; payload: Partial<User> }
  | { type: 'UPDATE_2FA_STATUS'; payload: TwoFactorStatus }
  | { type: 'UPDATE_SECURITY_STATUS'; payload: AccountSecurityStatus }
  | { type: 'CLAIM_WELCOME_BONUS' }
  | { type: 'CLEAR_ERROR' };

// État initial
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
  error: null,
  twoFactorStatus: null,
  securityStatus: null,
  welcomeBonusClaimed: false
};

// Reducer pour gérer l'état d'authentification
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null
      };
    
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        welcomeBonusClaimed: (action.payload as any).welcome_bonus_claimed || false
      };
    
    case 'AUTH_ERROR':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload
      };
    
    case 'AUTH_LOGOUT':
      return {
        ...initialState,
        isInitialized: true
      };
    
    case 'AUTH_INITIALIZED':
      return {
        ...state,
        isInitialized: true,
        isLoading: false
      };
    
    case 'UPDATE_USER':
      return {
        ...state,
        user: state.user ? { ...state.user, ...action.payload } : null
      };
    
    case 'UPDATE_2FA_STATUS':
      return {
        ...state,
        twoFactorStatus: action.payload
      };
    
    case 'UPDATE_SECURITY_STATUS':
      return {
        ...state,
        securityStatus: action.payload
      };
    
    case 'CLAIM_WELCOME_BONUS':
      return {
        ...state,
        welcomeBonusClaimed: true,
        user: state.user ? { ...state.user } as any : null
      };
    
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      };
    
    default:
      return state;
  }
};

// Interface du contexte
interface AuthContextType {
  // État
  state: AuthState;
  
  // Actions d'authentification
  login: (credentials: LoginCredentials) => Promise<boolean>;
  register: (credentials: RegisterCredentials) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  
  // Actions utilisateur
  updateProfile: (updates: Partial<User>) => Promise<boolean>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  
  // Sécurité
  setup2FA: () => Promise<any>;
  confirm2FA: (code: string, setupKey: string) => Promise<boolean>;
  disable2FA: (password: string, code?: string) => Promise<boolean>;
  refreshSecurityStatus: () => Promise<void>;
  
  // Vérification Email
  sendEmailVerification: (email?: string) => Promise<EmailVerificationResponse>;
  verifyEmail: (token: string, hash: string) => Promise<EmailVerificationResponse>;
  checkEmailVerified: () => boolean;
  refreshUser: () => Promise<void>;
  
  // Bonus
  claimWelcomeBonus: () => Promise<boolean>;
  
  // Utilitaires
  clearError: () => void;
  checkAuthentication: () => Promise<void>;
}

// Créer le contexte
const AuthContext = createContext<AuthContextType | null>(null);

// Provider du contexte d'authentification
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialiser l'authentification au démarrage
  useEffect(() => {
    initializeAuth();
  }, []);

  // Initialiser l'authentification
  const initializeAuth = async () => {
    try {
      dispatch({ type: 'AUTH_START' });
      
      const token = authService.getStoredToken();
      if (token) {
        // Vérifier la validité du token et récupérer l'utilisateur
        const userResponse = await authService.getCurrentUser();
        if (userResponse.success && userResponse.data) {
          dispatch({ type: 'AUTH_SUCCESS', payload: userResponse.data });
          
          // Charger les informations de sécurité
          await loadSecurityInfo();
        } else {
          // Token invalide, nettoyer
          authService.removeStoredToken();
          dispatch({ type: 'AUTH_ERROR', payload: 'Session expirée' });
        }
      }
    } catch (error) {
      console.error('Erreur d\'initialisation de l\'authentification:', error);
      authService.removeStoredToken();
      dispatch({ type: 'AUTH_ERROR', payload: 'Erreur d\'initialisation' });
    } finally {
      dispatch({ type: 'AUTH_INITIALIZED' });
    }
  };

  // Charger les informations de sécurité
  const loadSecurityInfo = async () => {
    try {
      const [twoFactorResponse, securityResponse] = await Promise.all([
        securityService.get2FAStatus(),
        securityService.getAccountSecurityStatus()
      ]);

      if (twoFactorResponse.success) {
        dispatch({ type: 'UPDATE_2FA_STATUS', payload: twoFactorResponse.data });
      }

      if (securityResponse.success) {
        dispatch({ type: 'UPDATE_SECURITY_STATUS', payload: securityResponse.data });
      }
    } catch (error) {
      console.error('Erreur lors du chargement des infos de sécurité:', error);
    }
  };

  // Connexion
  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      dispatch({ type: 'AUTH_START' });

      const response = await authService.login(credentials);
      if (response.success && response.data) {
        dispatch({ type: 'AUTH_SUCCESS', payload: response.data.user });
        
        // Charger les informations de sécurité
        await loadSecurityInfo();
        
        return true;
      } else {
        dispatch({ type: 'AUTH_ERROR', payload: response.message || 'Erreur de connexion' });
        return false;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur de connexion';
      dispatch({ type: 'AUTH_ERROR', payload: message });
      return false;
    }
  };

  // Inscription
  const register = async (credentials: RegisterCredentials): Promise<boolean> => {
    try {
      dispatch({ type: 'AUTH_START' });

      const response = await authService.register(credentials);
      if (response.success && response.data) {
        dispatch({ type: 'AUTH_SUCCESS', payload: response.data.user });
        
        // Charger les informations de sécurité
        await loadSecurityInfo();
        
        return true;
      } else {
        dispatch({ type: 'AUTH_ERROR', payload: response.message || 'Erreur d\'inscription' });
        return false;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur d\'inscription';
      dispatch({ type: 'AUTH_ERROR', payload: message });
      return false;
    }
  };

  // Déconnexion
  const logout = async (): Promise<void> => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    } finally {
      dispatch({ type: 'AUTH_LOGOUT' });
    }
  };

  // Actualiser le token
  const refreshToken = async (): Promise<boolean> => {
    try {
      const response = await authService.refreshToken();
      if (response.success) {
        const userResponse = await authService.getCurrentUser();
        if (userResponse.success && userResponse.data) {
          dispatch({ type: 'AUTH_SUCCESS', payload: userResponse.data });
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Erreur lors de l\'actualisation du token:', error);
      dispatch({ type: 'AUTH_ERROR', payload: 'Session expirée' });
      return false;
    }
  };

  // Mettre à jour le profil
  const updateProfile = async (updates: Partial<User>): Promise<boolean> => {
    try {
      const response = await authService.updateProfile(updates);
      if (response.success) {
        dispatch({ type: 'UPDATE_USER', payload: updates });
        return true;
      } else {
        dispatch({ type: 'AUTH_ERROR', payload: response.message || 'Erreur de mise à jour' });
        return false;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur de mise à jour';
      dispatch({ type: 'AUTH_ERROR', payload: message });
      return false;
    }
  };

  // Changer le mot de passe
  const changePassword = async (currentPassword: string, newPassword: string): Promise<boolean> => {
    try {
      const response = await authService.changePassword(currentPassword, newPassword);
      if (response.success) {
        return true;
      } else {
        dispatch({ type: 'AUTH_ERROR', payload: response.message || 'Erreur de changement de mot de passe' });
        return false;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur de changement de mot de passe';
      dispatch({ type: 'AUTH_ERROR', payload: message });
      return false;
    }
  };

  // Configurer la 2FA
  const setup2FA = async () => {
    try {
      const response = await securityService.setup2FA();
      if (response.success) {
        return response.data;
      } else {
        dispatch({ type: 'AUTH_ERROR', payload: response.message || 'Erreur de configuration 2FA' });
        return null;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur de configuration 2FA';
      dispatch({ type: 'AUTH_ERROR', payload: message });
      return null;
    }
  };

  // Confirmer la 2FA
  const confirm2FA = async (code: string, setupKey: string): Promise<boolean> => {
    try {
      const response = await securityService.confirm2FA(code, setupKey);
      if (response.success) {
        // Actualiser le statut 2FA
        const statusResponse = await securityService.get2FAStatus();
        if (statusResponse.success) {
          dispatch({ type: 'UPDATE_2FA_STATUS', payload: statusResponse.data });
        }
        return true;
      } else {
        dispatch({ type: 'AUTH_ERROR', payload: response.message || 'Code 2FA invalide' });
        return false;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur de confirmation 2FA';
      dispatch({ type: 'AUTH_ERROR', payload: message });
      return false;
    }
  };

  // Désactiver la 2FA
  const disable2FA = async (password: string, code?: string): Promise<boolean> => {
    try {
      const response = await securityService.disable2FA(password, code);
      if (response.success) {
        // Actualiser le statut 2FA
        const statusResponse = await securityService.get2FAStatus();
        if (statusResponse.success) {
          dispatch({ type: 'UPDATE_2FA_STATUS', payload: statusResponse.data });
        }
        return true;
      } else {
        dispatch({ type: 'AUTH_ERROR', payload: response.message || 'Erreur de désactivation 2FA' });
        return false;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur de désactivation 2FA';
      dispatch({ type: 'AUTH_ERROR', payload: message });
      return false;
    }
  };

  // Actualiser le statut de sécurité
  const refreshSecurityStatus = async (): Promise<void> => {
    await loadSecurityInfo();
  };

  // Réclamer le bonus de bienvenue
  const claimWelcomeBonus = async (): Promise<boolean> => {
    try {
      const response = await authService.claimWelcomeBonus();
      if (response.success) {
        dispatch({ type: 'CLAIM_WELCOME_BONUS' });
        return true;
      } else {
        dispatch({ type: 'AUTH_ERROR', payload: response.message || 'Erreur de réclamation du bonus' });
        return false;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur de réclamation du bonus';
      dispatch({ type: 'AUTH_ERROR', payload: message });
      return false;
    }
  };

  // Effacer l'erreur
  const clearError = (): void => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  // Vérifier l'authentification
  const checkAuthentication = async (): Promise<void> => {
    if (!state.isInitialized) {
      await initializeAuth();
    }
  };

  // Envoyer un email de vérification
  const sendEmailVerification = async (email?: string): Promise<EmailVerificationResponse> => {
    try {
      const userEmail = email || state.user?.email;
      if (!userEmail) {
        return {
          success: false,
          message: 'Aucune adresse email disponible'
        };
      }
      
      const result = await emailVerificationService.sendRegistrationVerification(userEmail);
      return result;
    } catch (error) {
      return {
        success: false,
        message: 'Erreur lors de l\'envoi de l\'email de vérification'
      };
    }
  };

  // Vérifier l'email avec token
  const verifyEmail = async (token: string, hash: string): Promise<EmailVerificationResponse> => {
    try {
      const result = await emailVerificationService.verifyEmail(token, hash);
      
      if (result.success) {
        // Actualiser les données utilisateur après vérification
        await refreshUser();
      }
      
      return result;
    } catch (error) {
      return {
        success: false,
        message: 'Erreur lors de la vérification de l\'email'
      };
    }
  };

  // Vérifier si l'email est vérifié
  const checkEmailVerified = (): boolean => {
    return !!state.user?.email_verified_at;
  };

  // Actualiser les données utilisateur
  const refreshUser = async (): Promise<void> => {
    try {
      if (state.user) {
        const userResponse = await authService.getCurrentUser();
        if (userResponse.success && userResponse.data) {
          dispatch({ type: 'UPDATE_USER', payload: userResponse.data });
        }
      }
    } catch (error) {
      console.error('Erreur lors de l\'actualisation de l\'utilisateur:', error);
    }
  };

  // Valeur du contexte
  const contextValue: AuthContextType = {
    state,
    login,
    register,
    logout,
    refreshToken,
    updateProfile,
    changePassword,
    setup2FA,
    confirm2FA,
    disable2FA,
    refreshSecurityStatus,
    sendEmailVerification,
    verifyEmail,
    checkEmailVerified,
    refreshUser,
    claimWelcomeBonus,
    clearError,
    checkAuthentication
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook pour utiliser le contexte d'authentification
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
};

// Hooks utilitaires
export const useAuthUser = (): User | null => {
  const { state } = useAuth();
  return state.user;
};

export const useIsAuthenticated = (): boolean => {
  const { state } = useAuth();
  return state.isAuthenticated;
};

export const useAuthLoading = (): boolean => {
  const { state } = useAuth();
  return state.isLoading;
};

export const useAuthError = (): string | null => {
  const { state } = useAuth();
  return state.error;
};

export const use2FAStatus = (): TwoFactorStatus | null => {
  const { state } = useAuth();
  return state.twoFactorStatus;
};

export const useSecurityStatus = (): AccountSecurityStatus | null => {
  const { state } = useAuth();
  return state.securityStatus;
};

export default AuthProvider;