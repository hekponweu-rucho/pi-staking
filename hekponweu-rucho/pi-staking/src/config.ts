/**
 * Helper pour récupérer les variables d'environnement de manière tolérante
 */
const getEnvVar = (key: string, opts?: { required?: boolean; default?: string }) => {
  const value = import.meta.env[key as keyof ImportMetaEnv];
  
  if (!value || value === "") {
    if (opts?.required) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
    return opts?.default ?? "";
  }
  
  return value;
};

// Configuration de l'API avec fallback
export const API_BASE_URL = getEnvVar("VITE_API_BASE_URL") || 
                           getEnvVar("VITE_API_URL") || 
                           "http://localhost:8000";

// Configuration optionnelle de Sentry
const SENTRY_DSN = getEnvVar("VITE_SENTRY_DSN", { required: false, default: "" });
export const enableSentry = !!SENTRY_DSN && import.meta.env.PROD;
export const sentryConfig = {
  dsn: SENTRY_DSN,
  enabled: enableSentry
};

// Configuration optionnelle d'Analytics
const ANALYTICS_ID = getEnvVar("VITE_ANALYTICS_ID", { required: false, default: "" });
export const enableAnalytics = !!ANALYTICS_ID && import.meta.env.PROD;
export const analyticsConfig = {
  id: ANALYTICS_ID,
  enabled: enableAnalytics
};

// Configuration générale de l'application
export const appConfig = {
  apiUrl: API_BASE_URL,
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
  sentry: sentryConfig,
  analytics: analyticsConfig
};

// Logs de développement
if (import.meta.env.DEV) {
  console.group("🔧 Configuration de l'application");
  console.log("API URL:", API_BASE_URL);
  console.log("Sentry activé:", enableSentry);
  console.log("Analytics activé:", enableAnalytics);
  console.groupEnd();
  
  // Warnings pour les variables manquantes
  if (!SENTRY_DSN) {
    console.warn("⚠️ VITE_SENTRY_DSN non définie - Sentry désactivé");
  }
  
  if (!ANALYTICS_ID) {
    console.warn("⚠️ VITE_ANALYTICS_ID non définie - Analytics désactivé");
  }
}