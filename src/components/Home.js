import React from 'react';

const Home = ({ onNavigate, hasData }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-red-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 max-w-lg w-full text-center">
        <div className="text-6xl mb-6">🐊</div>
        <h1 className="text-4xl font-bold text-white mb-4">WanoKuni SRS</h1>
        <p className="text-white/80 mb-8 text-lg">
          Système de révision espacée authentique pour l'apprentissage des kanji japonais
        </p>
        
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-blue-50/10 p-4 rounded-xl">
            <div className="text-3xl mb-2">📚</div>
            <p className="text-sm font-semibold text-blue-200">Données complètes</p>
          </div>
          <div className="bg-green-50/10 p-4 rounded-xl">
            <div className="text-3xl mb-2">🧠</div>
            <p className="text-sm font-semibold text-green-200">SRS Authentique</p>
          </div>
        </div>
        
        {!hasData ? (
          <button
            onClick={() => onNavigate('data-upload')}
            className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8 py-4 rounded-full text-xl font-bold hover:shadow-lg transform hover:scale-105 transition-all w-full"
          >
            Charger les données
          </button>
        ) : (
          <button
            onClick={() => onNavigate('dashboard')}
            className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-8 py-4 rounded-full text-xl font-bold hover:shadow-lg transform hover:scale-105 transition-all w-full"
          >
            Accéder au tableau de bord
          </button>
        )}
      </div>
    </div>
  );
};

export default Home;