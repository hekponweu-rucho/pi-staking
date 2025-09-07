import axios from 'axios';
import { toast } from 'sonner';
import { config, debugLog } from './config';

const API_BASE_URL = config.api.baseUrl + config.api.prefix;
const SANCTUM_BASE_URL = config.api.baseUrl;

// Instance Axios principale
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  }
});

// Instance pour Sanctum CSRF
export const sanctumClient = axios.create({
  baseURL: SANCTUM_BASE_URL,
  withCredentials: true
});

// Intercepteur pour gestion automatique des tokens
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercepteur pour gestion des erreurs
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || 'Erreur réseau';
    
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    } else if (error.response?.status === 422) {
      // Erreurs de validation - affichées par les composants
      console.log('Validation errors:', error.response.data.errors);
    } else {
      toast.error(message);
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
