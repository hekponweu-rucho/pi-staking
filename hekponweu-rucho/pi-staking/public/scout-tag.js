/**
 * Scout Tag - Stub pour éviter les erreurs 404
 * Ce fichier peut être étendu avec la logique d'analytics si nécessaire
 */

(function() {
  'use strict';
  
  // Stub minimal pour éviter les erreurs
  console.log('Scout Tag loaded (stub version)');
  
  // Si vous avez besoin d'ajouter de la logique d'analytics, 
  // vous pouvez l'ajouter ici
  
  // Exemple d'API stub
  window.ScoutTag = {
    track: function(event, data) {
      if (console && console.log) {
        console.log('Scout Track:', event, data);
      }
    },
    
    identify: function(userId, traits) {
      if (console && console.log) {
        console.log('Scout Identify:', userId, traits);
      }
    },
    
    page: function(name, properties) {
      if (console && console.log) {
        console.log('Scout Page:', name, properties);
      }
    }
  };
  
})();