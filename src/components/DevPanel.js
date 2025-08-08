import React, { useState } from 'react';
import { Clock, Plus, RotateCcw, ArrowUp, Zap, BookOpen, Target, Code } from 'lucide-react';
import { advanceTime, addLessonsForType, addReviewsForType, unlockNextLevel, resetAllData, createRealisticScenario, simulateStudySession } from '../utils/devTools';

const DevPanel = ({ srs, wanoKuniData, onRefresh }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [timeHours, setTimeHours] = useState(4);
  const [itemCount, setItemCount] = useState(5);

  const handleAdvanceTime = () => {
    advanceTime(timeHours);
    onRefresh();
  };

  const handleAddLessons = (type) => {
    addLessonsForType(wanoKuniData, type, itemCount);
    onRefresh();
  };

  const handleAddReviews = (type) => {
    addReviewsForType(wanoKuniData, type, itemCount);
    onRefresh();
  };

  const handleUnlockLevel = () => {
    unlockNextLevel();
    onRefresh();
  };

  const handleReset = () => {
    if (window.confirm('Êtes-vous sûr de vouloir tout effacer ?')) {
      resetAllData();
    }
  };

  const handleRealisticScenario = () => {
    createRealisticScenario(wanoKuniData);
    onRefresh();
  };

  const handleStudySession = () => {
    simulateStudySession(wanoKuniData);
    onRefresh();
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsOpen(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
          title="Outils de développement"
        >
          <Code className="w-6 h-6" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white/95 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-purple-200 w-80">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-800 flex items-center">
          <Code className="w-5 h-5 mr-2 text-purple-600" />
          Dev Tools
        </h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
        >
          ✕
        </button>
      </div>

      <div className="space-y-4">
        {/* Time Controls */}
        <div className="bg-blue-50 rounded-xl p-4">
          <h4 className="font-semibold text-blue-800 mb-3 flex items-center">
            <Clock className="w-4 h-4 mr-2" />
            Contrôles temporels
          </h4>
          <div className="flex items-center space-x-2 mb-3">
            <input
              type="number"
              value={timeHours}
              onChange={(e) => setTimeHours(parseInt(e.target.value) || 1)}
              className="w-16 px-2 py-1 border rounded text-center"
              min="1"
              max="168"
            />
            <span className="text-sm text-gray-600">heures</span>
            <button
              onClick={handleAdvanceTime}
              className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 transition-colors"
            >
              Avancer
            </button>
          </div>
          <p className="text-xs text-blue-600">
            Réduire les temps d'attente pour les révisions
          </p>
        </div>

        {/* Content Controls */}
        <div className="bg-green-50 rounded-xl p-4">
          <h4 className="font-semibold text-green-800 mb-3 flex items-center">
            <Plus className="w-4 h-4 mr-2" />
            Ajouter du contenu
          </h4>
          <div className="flex items-center space-x-2 mb-3">
            <input
              type="number"
              value={itemCount}
              onChange={(e) => setItemCount(parseInt(e.target.value) || 1)}
              className="w-16 px-2 py-1 border rounded text-center"
              min="1"
              max="20"
            />
            <span className="text-sm text-gray-600">items</span>
          </div>

          {/* Add Lessons */}
          <div className="space-y-2 mb-3">
            <p className="text-xs font-medium text-green-700">Ajouter leçons:</p>
            <div className="grid grid-cols-3 gap-1">
              <button
                onClick={() => handleAddLessons('radical')}
                className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600"
              >
                部 Rad
              </button>
              <button
                onClick={() => handleAddLessons('kanji')}
                className="bg-purple-500 text-white px-2 py-1 rounded text-xs hover:bg-purple-600"
              >
                漢 Kan
              </button>
              <button
                onClick={() => handleAddLessons('vocabulary')}
                className="bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600"
              >
                語 Voc
              </button>
            </div>
          </div>

          {/* Add Reviews */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-green-700">Ajouter révisions:</p>
            <div className="grid grid-cols-3 gap-1">
              <button
                onClick={() => handleAddReviews('radical')}
                className="bg-blue-400 text-white px-2 py-1 rounded text-xs hover:bg-blue-500"
              >
                部 Rev
              </button>
              <button
                onClick={() => handleAddReviews('kanji')}
                className="bg-purple-400 text-white px-2 py-1 rounded text-xs hover:bg-purple-500"
              >
                漢 Rev
              </button>
              <button
                onClick={() => handleAddReviews('vocabulary')}
                className="bg-green-400 text-white px-2 py-1 rounded text-xs hover:bg-green-500"
              >
                語 Rev
              </button>
            </div>
          </div>
        </div>

        {/* Level Controls */}
        <div className="bg-yellow-50 rounded-xl p-4">
          <h4 className="font-semibold text-yellow-800 mb-3 flex items-center">
            <ArrowUp className="w-4 h-4 mr-2" />
            Progression
          </h4>
          <div className="space-y-2">
            <button
              onClick={handleUnlockLevel}
              className="w-full bg-yellow-500 text-white py-2 rounded text-sm font-medium hover:bg-yellow-600 transition-colors"
            >
              Débloquer niveau suivant
            </button>
            <p className="text-xs text-yellow-600">
              Niveau actuel: {srs.getCurrentLevel()}
            </p>
          </div>
        </div>

        {/* Stats Info */}
        <div className="bg-gray-50 rounded-xl p-4">
          <h4 className="font-semibold text-gray-800 mb-2 flex items-center">
            <Target className="w-4 h-4 mr-2" />
            Stats actuelles
          </h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-gray-600">Leçons:</span>
              <span className="font-bold ml-1">{srs.getLessonCount()}</span>
            </div>
            <div>
              <span className="text-gray-600">Révisions:</span>
              <span className="font-bold ml-1">{srs.getReviewCount()}</span>
            </div>
            <div>
              <span className="text-gray-600">Apprentice:</span>
              <span className="font-bold ml-1">{srs.getStats().apprentice}</span>
            </div>
            <div>
              <span className="text-gray-600">Guru:</span>
              <span className="font-bold ml-1">{srs.getStats().guru}</span>
            </div>
          </div>
        </div>

        {/* Quick Scenarios */}
        <div className="bg-purple-50 rounded-xl p-4">
          <h4 className="font-semibold text-purple-800 mb-3 flex items-center">
            <Zap className="w-4 h-4 mr-2" />
            Scénarios rapides
          </h4>
          <div className="space-y-2">
            <button
              onClick={handleRealisticScenario}
              className="w-full bg-purple-500 text-white py-2 rounded text-sm font-medium hover:bg-purple-600 transition-colors"
            >
              🎯 Progression réaliste
            </button>
            <button
              onClick={handleStudySession}
              className="w-full bg-indigo-500 text-white py-2 rounded text-sm font-medium hover:bg-indigo-600 transition-colors"
            >
              📚 Session d'étude
            </button>
          </div>
          <p className="text-xs text-purple-600 mt-2">
            Crée des données de test réalistes
          </p>
        </div>

        {/* Danger Zone */}
        <div className="bg-red-50 rounded-xl p-4">
          <h4 className="font-semibold text-red-800 mb-3 flex items-center">
            <RotateCcw className="w-4 h-4 mr-2" />
            Zone dangereuse
          </h4>
          <button
            onClick={handleReset}
            className="w-full bg-red-500 text-white py-2 rounded text-sm font-medium hover:bg-red-600 transition-colors"
          >
            Reset complet
          </button>
        </div>
      </div>
    </div>
  );
};

export default DevPanel;