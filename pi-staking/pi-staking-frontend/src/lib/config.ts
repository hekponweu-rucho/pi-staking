/**
 * Configuration centrale pour l'application Pi Staking
 * Gère toutes les variables d'environnement et configurations
 */

export interface AppConfig {
  // API Configuration
  api: {
    baseUrl: string;
    prefix: string;
    timeout: number;
    retries: number;
    rateLimit: number;
    rateWindow: number;
  };
  
  // App Configuration
  app: {
    name: string;
    version: string;
    environment: 'development' | 'production' | 'staging';
    url: string;
  };
  
  // Pi Network Configuration
  piNetwork: {
    url: string;
    testnet: boolean;
  };
  
  // Security Configuration
  security: {
    enable2FA: boolean;
    sessionTimeout: number;
    csrfTokenName: string;
  };
  
  // Features Configuration
  features: {
    socialLogin: boolean;
    emailVerification: boolean;
    smsVerification: boolean;
    welcomeBonus: boolean;
    pwa: boolean;
    darkMode: boolean;
  };
  
  // Analytics Configuration
  analytics: {
    enabled: boolean;
    analyticsId?: string;
    sentryDsn?: string;
  };
  
  // PWA Configuration
  pwa: {
    enabled: boolean;
    name: string;
    shortName: string;
  };
  
  // UI Configuration
  ui: {
    primaryColor: string;
    secondaryColor: string;
    defaultLanguage: string;
  };
  
  // Development Configuration
  development: {
    devTools: boolean;
    mockApi: boolean;
    debugLogs: boolean;
  };
}

// Fonction utilitaire pour obtenir les variables d'environnement
function getEnvVar(name: string, defaultValue?: string): string {
  const value = import.meta.env[name] || defaultValue;
  if (!value && !defaultValue) {
    console.warn(`Variable d'environnement manquante: ${name}`);
  }
  return value || '';
}

function getEnvBool(name: string, defaultValue: boolean = false): boolean {
  const value = import.meta.env[name];
  if (value === undefined) return defaultValue;
  return value === 'true' || value === '1';
}

function getEnvNumber(name: string, defaultValue: number): number {
  const value = import.meta.env[name];
  if (value === undefined) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

// Configuration principale
export const config: AppConfig = {
  api: {
    baseUrl: getEnvVar('VITE_API_BASE_URL', 'http://localhost:8000'),
    prefix: getEnvVar('VITE_API_PREFIX', '/api'),
    timeout: getEnvNumber('VITE_API_TIMEOUT', 10000),
    retries: getEnvNumber('VITE_API_RETRIES', 3),
    rateLimit: getEnvNumber('VITE_API_RATE_LIMIT', 100),
    rateWindow: getEnvNumber('VITE_API_RATE_WINDOW', 60000),
  },
  
  app: {
    name: getEnvVar('VITE_APP_NAME', 'Pi Staking Platform'),
    version: getEnvVar('VITE_APP_VERSION', '1.0.0'),
    environment: (getEnvVar('VITE_APP_ENVIRONMENT', 'development') as any) || 'development',
    url: getEnvVar('VITE_APP_URL', window.location.origin),
  },
  
  piNetwork: {
    url: getEnvVar('VITE_PI_NETWORK_URL', 'https://minepi.com'),
    testnet: getEnvBool('VITE_PI_NETWORK_TESTNET', true),
  },
  
  security: {
    enable2FA: getEnvBool('VITE_ENABLE_2FA', true),
    sessionTimeout: getEnvNumber('VITE_SESSION_TIMEOUT', 3600000),
    csrfTokenName: getEnvVar('VITE_CSRF_TOKEN_NAME', 'XSRF-TOKEN'),
  },
  
  features: {
    socialLogin: getEnvBool('VITE_ENABLE_SOCIAL_LOGIN', false),
    emailVerification: getEnvBool('VITE_ENABLE_EMAIL_VERIFICATION', true),
    smsVerification: getEnvBool('VITE_ENABLE_SMS_VERIFICATION', false),
    welcomeBonus: getEnvBool('VITE_ENABLE_WELCOME_BONUS', true),
    pwa: getEnvBool('VITE_ENABLE_PWA', true),
    darkMode: getEnvBool('VITE_ENABLE_DARK_MODE', true),
  },
  
  analytics: {
    enabled: getEnvBool('VITE_ENABLE_ANALYTICS', false),
    analyticsId: getEnvVar('VITE_ANALYTICS_ID'),
    sentryDsn: getEnvVar('VITE_SENTRY_DSN'),
  },
  
  pwa: {
    enabled: getEnvBool('VITE_ENABLE_PWA', true),
    name: getEnvVar('VITE_PWA_NAME', 'Pi Staking'),
    shortName: getEnvVar('VITE_PWA_SHORT_NAME', 'PiStaking'),
  },
  
  ui: {
    primaryColor: getEnvVar('VITE_THEME_PRIMARY', '#6f42c1'),
    secondaryColor: getEnvVar('VITE_THEME_SECONDARY', '#fd7e14'),
    defaultLanguage: getEnvVar('VITE_DEFAULT_LANGUAGE', 'fr'),
  },
  
  development: {
    devTools: getEnvBool('VITE_ENABLE_DEV_TOOLS', import.meta.env.DEV),
    mockApi: getEnvBool('VITE_ENABLE_MOCK_API', false),
    debugLogs: getEnvBool('VITE_ENABLE_DEBUG_LOGS', import.meta.env.DEV),
  },
};

// Utilitaires pour vérifier l'environnement
export const isDevelopment = () => config.app.environment === 'development';
export const isProduction = () => config.app.environment === 'production';
export const isStaging = () => config.app.environment === 'staging';

// Utilitaire pour les logs de debug
export const debugLog = (...args: any[]) => {
  if (config.development.debugLogs) {
    console.log('[Pi Staking Debug]', ...args);
  }
};

// Validation de la configuration au démarrage
export const validateConfig = () => {
  const errors: string[] = [];
  
  if (!config.api.baseUrl) {
    errors.push('VITE_API_BASE_URL is required');
  }
  
  if (!config.app.name) {
    errors.push('VITE_APP_NAME is required');
  }
  
  if (config.analytics.enabled && !config.analytics.analyticsId) {
    errors.push('VITE_ANALYTICS_ID is required when analytics is enabled');
  }
  
  if (errors.length > 0) {
    console.error('Configuration validation failed:');
    errors.forEach(error => console.error(`- ${error}`));
    throw new Error('Invalid configuration');
  }
  
  debugLog('Configuration loaded successfully:', config);
};

// Initialiser la validation lors de l'import
try {
  validateConfig();
} catch (error) {
  console.error('Failed to validate configuration:', error);
}

export default config;