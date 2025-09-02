import axios from 'axios';
import { appConfig } from '../config';

/**
 * Instance axios unifiée pour toutes les requêtes API
 */
export const api = axios.create({
  baseURL: appConfig.apiUrl,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 secondes
});

// Intercepteur de requête pour logging en dev
api.interceptors.request.use(
  (config) => {
    if (appConfig.isDev) {
      console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    }
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

// Intercepteur de réponse pour gestion d'erreurs
api.interceptors.response.use(
  (response) => {
    if (appConfig.isDev) {
      console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    }
    return response;
  },
  (error) => {
    if (appConfig.isDev) {
      console.error(`❌ API Error: ${error.response?.status} ${error.config?.url}`, error.response?.data);
    }
    
    // Gestion des erreurs communes
    if (error.response?.status === 401) {
      // Redirection vers login si nécessaire
      console.warn('Non autorisé - redirection vers login requise');
    }
    
    if (error.response?.status >= 500) {
      console.error('Erreur serveur - veuillez réessayer plus tard');
    }
    
    return Promise.reject(error);
  }
);

export default api;