import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Test des variables d'environnement au démarrage
console.log('=== TEST VARIABLES ENVIRONNEMENT ===');
console.log('REACT_APP_FIREBASE_PROJECT_ID:', process.env.REACT_APP_FIREBASE_PROJECT_ID);
console.log('REACT_APP_FIREBASE_API_KEY présent:', !!process.env.REACT_APP_FIREBASE_API_KEY);

if (!process.env.REACT_APP_FIREBASE_PROJECT_ID || process.env.REACT_APP_FIREBASE_PROJECT_ID === 'ton-projet-id') {
  console.error('🚨 ERREUR: Variables d\'environnement Firebase non configurées !');
  console.error('📝 Action requise: Modifie .env.local avec tes vraies clés Firebase');
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);