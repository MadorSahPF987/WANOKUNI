import React from 'react';

const VercelDebug = () => {
  const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID,
    measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
  };

  const checkConfig = () => {
    const results = {};
    Object.entries(firebaseConfig).forEach(([key, value]) => {
      results[key] = value ? '✅ Défini' : '❌ Manquant';
    });
    return results;
  };

  const configStatus = checkConfig();

  return (
    <div className="fixed top-0 left-0 right-0 bg-yellow-100 border-b-2 border-yellow-500 p-4 z-50">
      <h3 className="font-bold text-yellow-800 mb-2">🔧 Debug Vercel - Variables Firebase</h3>
      <div className="grid grid-cols-2 gap-2 text-sm">
        {Object.entries(configStatus).map(([key, status]) => (
          <div key={key} className={status.includes('✅') ? 'text-green-700' : 'text-red-700'}>
            <strong>{key}:</strong> {status}
          </div>
        ))}
      </div>
      {!firebaseConfig.projectId && (
        <div className="mt-3 p-2 bg-red-100 border border-red-400 rounded text-red-800">
          🚨 <strong>ERREUR CRITIQUE:</strong> REACT_APP_FIREBASE_PROJECT_ID manquant !<br/>
          ➡️ Vercel Settings → Environment Variables → Ajouter cette variable
        </div>
      )}
    </div>
  );
};

export default VercelDebug;