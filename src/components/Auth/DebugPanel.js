import React, { useState } from 'react';
import { Bug } from 'lucide-react';
import { auth, db } from '../../config/firebase';

const DebugPanel = () => {
  const [showDebug, setShowDebug] = useState(false);

  if (!showDebug) {
    return (
      <button
        onClick={() => setShowDebug(true)}
        className="fixed bottom-4 right-4 z-50 bg-red-600 text-white p-2 rounded-full shadow-lg hover:bg-red-700 transition-colors"
        title="Debug Firebase"
      >
        <Bug className="w-5 h-5" />
      </button>
    );
  }

  const checkFirebaseConfig = () => {
    const config = {
      apiKey: process.env.REACT_APP_FIREBASE_API_KEY || 'NON DÉFINI',
      authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || 'NON DÉFINI',
      projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || 'NON DÉFINI',
      storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || 'NON DÉFINI',
      messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || 'NON DÉFINI',
      appId: process.env.REACT_APP_FIREBASE_APP_ID || 'NON DÉFINI',
      measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || 'NON DÉFINI'
    };

    return config;
  };

  const config = checkFirebaseConfig();
  const currentUser = auth.currentUser;

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white border-2 border-red-500 rounded-lg p-4 shadow-xl max-w-md">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-red-600 flex items-center gap-2">
          <Bug className="w-4 h-4" />
          Debug Firebase
        </h3>
        <button
          onClick={() => setShowDebug(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      <div className="space-y-2 text-xs">
        <div>
          <strong>🔐 Utilisateur connecté:</strong>
          <div className="ml-2">
            {currentUser ? (
              <>
                <div>✅ {currentUser.email}</div>
                <div>ID: {currentUser.uid}</div>
              </>
            ) : (
              <div>❌ Aucun utilisateur</div>
            )}
          </div>
        </div>

        <div>
          <strong>⚙️ Configuration Firebase:</strong>
          <div className="ml-2">
            {Object.entries(config).map(([key, value]) => (
              <div key={key} className={value === 'NON DÉFINI' ? 'text-red-600' : 'text-green-600'}>
                {key}: {value === 'NON DÉFINI' ? '❌ NON DÉFINI' : '✅ Défini'}
              </div>
            ))}
          </div>
        </div>

        <div>
          <strong>🔥 Firestore:</strong>
          <div className="ml-2">
            {db ? '✅ Initialisé' : '❌ Non initialisé'}
          </div>
        </div>

        <div className="pt-2 border-t">
          <div className="text-xs text-gray-600">
            Ouvre la console pour voir les logs détaillés
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebugPanel;