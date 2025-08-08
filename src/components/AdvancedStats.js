import React, { useMemo } from 'react';
import { Clock, Target, TrendingUp, Book, Zap, Award } from 'lucide-react';

const AdvancedStats = ({ srs, wanoKuniData }) => {
  // Calculer les statistiques avancées
  const advancedStats = useMemo(() => {
    if (!srs || !wanoKuniData) return null;
    
    const currentLevel = srs.getCurrentLevel();
    const detailedStats = srs.getDetailedStats();
    const userProgress = srs.getUserProgress();
    const stats = srs.getStats();
    
    // Calculer les totaux par type dans les données complètes
    const totals = {
      radical: wanoKuniData.radicals.length,
      kanji: wanoKuniData.kanji.length,
      vocabulary: wanoKuniData.vocabulary.length
    };
    
    // Calculer les éléments vus (avec progression) par type
    const seen = {
      radical: 0,
      kanji: 0,
      vocabulary: 0
    };
    
    Object.values(userProgress).forEach(progress => {
      if (progress.srs_stage >= 0) { // Stages positifs = déjà vus
        if (progress.item_type === 'radical') seen.radical++;
        else if (progress.item_type === 'kanji') seen.kanji++;
        else if (progress.item_type === 'vocabulary') seen.vocabulary++;
      }
    });
    
    // Calculer le temps estimé pour différents objectifs (en jours)
    const estimateTimeToLevel = (targetLevel) => {
      if (targetLevel <= currentLevel) return 0;
      
      // Calcul plus précis basé sur le rythme WaniKani réel
      const levelsToGo = targetLevel - currentLevel;
      
      // Estimation basée sur le système WaniKani :
      // - Niveau 1-2 : ~7-10 jours par niveau (apprentissage)
      // - Niveau 3-10 : ~10-14 jours par niveau 
      // - Niveau 11+ : ~7-10 jours par niveau (plus efficace)
      
      let totalDays = 0;
      for (let level = currentLevel + 1; level <= targetLevel; level++) {
        if (level <= 2) totalDays += 9; // Début plus lent
        else if (level <= 10) totalDays += 12; // Phase intermédiaire  
        else totalDays += 8; // Rythme de croisière
      }
      
      // Ajuster selon la progression actuelle
      const progressionRate = Math.max(stats.guru + stats.master + stats.enlightened + stats.burned, 1) / Math.max(stats.total, 1);
      const speedModifier = 0.7 + (progressionRate * 0.6); // Entre 0.7x et 1.3x
      
      return Math.ceil(totalDays * speedModifier);
    };
    
    return {
      currentLevel,
      detailedStats,
      totals,
      seen,
      timeEstimates: {
        nextLevel: estimateTimeToLevel(currentLevel + 1),
        next5Levels: estimateTimeToLevel(currentLevel + 5),
        next10Levels: estimateTimeToLevel(currentLevel + 10),
        level60: estimateTimeToLevel(60) // WaniKani max level
      }
    };
  }, [srs, wanoKuniData]);

  // Fonction pour formater le temps avec plus de détails
  const formatTime = (days) => {
    if (days === 0) return { main: "Atteint !", sub: "🎉" };
    if (days === 1) return { main: "1 jour", sub: "Demain !" };
    if (days < 7) return { main: `${days} jours`, sub: "Cette semaine" };
    if (days < 14) return { main: `${Math.ceil(days / 7)} semaine`, sub: `${days} jours` };
    if (days < 30) return { main: `${Math.ceil(days / 7)} semaines`, sub: `~${days} jours` };
    if (days < 90) return { main: `${Math.ceil(days / 30)} mois`, sub: `~${Math.ceil(days / 7)} semaines` };
    if (days < 365) return { main: `${Math.ceil(days / 30)} mois`, sub: `~${Math.ceil(days / 7)} semaines` };
    
    const years = Math.floor(days / 365);
    const remainingMonths = Math.ceil((days % 365) / 30);
    return { 
      main: `${years} an${years > 1 ? 's' : ''}`, 
      sub: remainingMonths > 0 ? `+${remainingMonths} mois` : ""
    };
  };

  // Fonction pour calculer le pourcentage
  const getPercentage = (current, total) => {
    return total > 0 ? Math.round((current / total) * 100) : 0;
  };

  if (!advancedStats) return null;

  const { currentLevel, detailedStats, totals, seen, timeEstimates } = advancedStats;

  return (
    <div className="space-y-6">
      {/* Progression par type */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center mb-6">
          <Book className="w-6 h-6 mr-3 text-blue-600" />
          <h3 className="text-xl font-bold text-gray-800">Progression par Type</h3>
        </div>
        
        <div className="space-y-6">
          {/* Radicals */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-blue-500 rounded-full mr-3"></div>
                <span className="font-semibold text-gray-700">Radicaux</span>
              </div>
              <span className="text-sm text-gray-600">
                {seen.radical} / {totals.radical} ({getPercentage(seen.radical, totals.radical)}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-blue-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${getPercentage(seen.radical, totals.radical)}%` }}
              ></div>
            </div>
          </div>

          {/* Kanji */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-purple-500 rounded-full mr-3"></div>
                <span className="font-semibold text-gray-700">Kanji</span>
              </div>
              <span className="text-sm text-gray-600">
                {seen.kanji} / {totals.kanji} ({getPercentage(seen.kanji, totals.kanji)}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-purple-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${getPercentage(seen.kanji, totals.kanji)}%` }}
              ></div>
            </div>
          </div>

          {/* Vocabulary */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-green-500 rounded-full mr-3"></div>
                <span className="font-semibold text-gray-700">Vocabulaire</span>
              </div>
              <span className="text-sm text-gray-600">
                {seen.vocabulary} / {totals.vocabulary} ({getPercentage(seen.vocabulary, totals.vocabulary)}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-green-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${getPercentage(seen.vocabulary, totals.vocabulary)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Projections temporelles */}
      <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-6 text-white">
        <div className="flex items-center mb-4">
          <Target className="w-6 h-6 mr-3" />
          <h3 className="text-xl font-bold">Projections Temporelles</h3>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between bg-white/25 backdrop-blur-sm rounded-xl p-4 hover:bg-white/30 transition-all">
            <div className="flex items-center">
              <Clock className="w-5 h-5 mr-3 text-yellow-300" />
              <span className="text-lg font-semibold">Niveau {currentLevel + 1}</span>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold">{formatTime(timeEstimates.nextLevel).main}</div>
              <div className="text-sm opacity-90">{formatTime(timeEstimates.nextLevel).sub}</div>
            </div>
          </div>
          
          <div className="flex items-center justify-between bg-white/25 backdrop-blur-sm rounded-xl p-4 hover:bg-white/30 transition-all">
            <div className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-3 text-green-300" />
              <span className="text-lg font-semibold">Niveau {currentLevel + 5}</span>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold">{formatTime(timeEstimates.next5Levels).main}</div>
              <div className="text-sm opacity-90">{formatTime(timeEstimates.next5Levels).sub}</div>
            </div>
          </div>
          
          <div className="flex items-center justify-between bg-white/25 backdrop-blur-sm rounded-xl p-4 hover:bg-white/30 transition-all">
            <div className="flex items-center">
              <Zap className="w-5 h-5 mr-3 text-orange-300" />
              <span className="text-lg font-semibold">Niveau {currentLevel + 10}</span>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold">{formatTime(timeEstimates.next10Levels).main}</div>
              <div className="text-sm opacity-90">{formatTime(timeEstimates.next10Levels).sub}</div>
            </div>
          </div>
          
          <div className="flex items-center justify-between bg-white/25 backdrop-blur-sm rounded-xl p-4 hover:bg-white/30 transition-all">
            <div className="flex items-center">
              <Award className="w-5 h-5 mr-3 text-pink-300" />
              <span className="text-lg font-semibold">Niveau 60 (MAX)</span>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold">{formatTime(timeEstimates.level60).main}</div>
              <div className="text-sm opacity-90">{formatTime(timeEstimates.level60).sub}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedStats;