import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { appConfig } from './config'

// Initialisation de Sentry si activé
if (appConfig.sentry.enabled) {
  import('@sentry/react').then((Sentry) => {
    Sentry.init({
      dsn: appConfig.sentry.dsn,
      environment: appConfig.isProd ? 'production' : 'development',
      tracesSampleRate: appConfig.isProd ? 0.1 : 1.0,
    });
  }).catch(error => {
    console.error('Erreur lors de l\'initialisation de Sentry:', error);
  });
}

// Initialisation des analytics si activé
if (appConfig.analytics.enabled) {
  console.log('Analytics activé avec ID:', appConfig.analytics.id);
  // Ici vous pouvez ajouter l'initialisation de Google Analytics
  // ou autre service d'analytics
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)