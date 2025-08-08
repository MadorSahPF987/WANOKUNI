import React, { useState, useEffect } from 'react';
import { Home, ArrowLeft, ArrowRight, Grid, List, Search, X, Info } from 'lucide-react';
import ItemDetailModal from './ItemDetailModal';
import { useHiraganaInput, convertRomajiToHiragana } from '../utils/romajiConverter';

const LevelBrowser = ({ wanoKuniData, onBack, onNavigate, srs }) => {
  const [browseMode, setBrowseMode] = useState('levels'); // 'levels', 'types', or 'search'
  const [currentLevel, setCurrentLevel] = useState(1);
  const [selectedType, setSelectedType] = useState('all'); // 'all', 'radical', 'kanji', 'vocabulary'
  const [selectedItem, setSelectedItem] = useState(null); // Item sélectionné pour le modal
  const [displaySize, setDisplaySize] = useState('medium'); // 'small', 'medium', 'large'
  const [showLegend, setShowLegend] = useState(false); // Pour afficher/masquer la légende
  
  // Search states
  const [searchHiragana, handleSearchHiraganaChange, setSearchHiragana] = useHiraganaInput('');
  const [searchRomaji, setSearchRomaji] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  // Utiliser la fonction utilitaire pour la conversion
  const romajiToHiragana = React.useCallback((romaji) => {
    return convertRomajiToHiragana(romaji);
  }, []);

  // Fonction de recherche mémorisée
  const performSearch = React.useCallback(() => {
    if (!wanoKuniData) {
      setSearchResults([]);
      return;
    }

    if (!searchHiragana.trim() && !searchRomaji.trim()) {
      setSearchResults([]);
      return;
    }

    const allItems = [
      ...wanoKuniData.radicals.map(r => ({ ...r, category: 'radical' })),
      ...wanoKuniData.kanji.map(k => ({ ...k, category: 'kanji' })),
      ...wanoKuniData.vocabulary.map(v => ({ ...v, category: 'vocabulary' }))
    ];

    const results = [];

    // Recherche par hiragana
    if (searchHiragana.trim()) {
      const hiraganaQuery = searchHiragana.toLowerCase().trim();
      
      allItems.forEach(item => {
        // Recherche dans les lectures
        const readings = [
          ...(item.readings || []),
          ...(item.on_readings || []),
          ...(item.kun_readings || [])
        ].map(r => r.toLowerCase());
        
        if (readings.some(reading => reading.includes(hiraganaQuery))) {
          results.push({ ...item, matchType: 'hiragana' });
        }
      });
    }

    // Recherche par romaji (convertir en hiragana puis chercher)
    if (searchRomaji.trim()) {
      const romajiQuery = searchRomaji.toLowerCase().trim();
      const hiraganaFromRomaji = romajiToHiragana(romajiQuery);
      
      allItems.forEach(item => {
        const readings = [
          ...(item.readings || []),
          ...(item.on_readings || []),
          ...(item.kun_readings || [])
        ].map(r => r.toLowerCase());
        
        // Recherche directe en romaji dans les meanings si disponible
        const meanings = [
          ...(item.meanings || []),
          ...(typeof item.meaning === 'string' ? [item.meaning] : [])
        ].map(m => m.toLowerCase());
        
        if (readings.some(reading => reading.includes(hiraganaFromRomaji)) ||
            meanings.some(meaning => meaning.includes(romajiQuery))) {
          if (!results.some(r => r.id === item.id && r.category === item.category)) {
            results.push({ ...item, matchType: 'romaji' });
          }
        }
      });
    }

    // Éliminer les doublons et trier par type et niveau
    const uniqueResults = results.filter((item, index, self) => 
      index === self.findIndex(t => t.id === item.id && t.category === item.category)
    ).sort((a, b) => {
      // Trier par type puis par niveau
      const typeOrder = { radical: 1, kanji: 2, vocabulary: 3 };
      if (typeOrder[a.category] !== typeOrder[b.category]) {
        return typeOrder[a.category] - typeOrder[b.category];
      }
      return a.level - b.level;
    });

    setSearchResults(uniqueResults);
  }, [wanoKuniData, searchHiragana, searchRomaji, romajiToHiragana]);

  // Effect pour effectuer la recherche en temps réel
  useEffect(() => {
    if (browseMode === 'search') {
      performSearch();
    }
  }, [browseMode, performSearch]);

  // Gérer le changement de mode
  useEffect(() => {
    if (browseMode === 'types' && selectedType === 'all') {
      setSelectedType('radical'); // Type par défaut pour le mode types
    }
  }, [browseMode, selectedType]);

  if (!wanoKuniData) return null;

  // Obtenir tous les éléments du niveau actuel, organisés par type
  const getLevelItems = (level, type = 'all') => {
    const organized = {
      radical: [],
      kanji: [],
      vocabulary: []
    };
    
    if (type === 'all' || type === 'radical') {
      const radicals = wanoKuniData.radicals.filter(r => r.level === level);
      organized.radical = radicals.map(r => ({ ...r, category: 'radical' }));
    }
    
    if (type === 'all' || type === 'kanji') {
      const kanji = wanoKuniData.kanji.filter(k => k.level === level);
      organized.kanji = kanji.map(k => ({ ...k, category: 'kanji' }));
    }
    
    if (type === 'all' || type === 'vocabulary') {
      const vocabulary = wanoKuniData.vocabulary.filter(v => v.level === level);
      organized.vocabulary = vocabulary.map(v => ({ ...v, category: 'vocabulary' }));
    }
    
    if (type !== 'all') {
      // Si un type spécifique est sélectionné, retourner juste une liste plate
      return organized[type] || [];
    }
    
    return organized;
  };

  // Obtenir tous les éléments d'un type donné, groupés par niveau
  const getTypeItems = (type) => {
    let sourceArray = [];
    switch (type) {
      case 'radical':
        sourceArray = wanoKuniData.radicals;
        break;
      case 'kanji':
        sourceArray = wanoKuniData.kanji;
        break;
      case 'vocabulary':
        sourceArray = wanoKuniData.vocabulary;
        break;
      default:
        return {};
    }
    
    // Grouper par niveau
    const grouped = {};
    sourceArray.forEach(item => {
      if (!grouped[item.level]) {
        grouped[item.level] = [];
      }
      grouped[item.level].push({ ...item, category: type });
    });
    
    return grouped;
  };


  const levelItemsData = getLevelItems(currentLevel, selectedType);
  const typeItemsData = browseMode === 'types' ? getTypeItems(selectedType === 'all' ? 'radical' : selectedType) : {};
  
  const maxLevel = Math.max(
    ...wanoKuniData.radicals.map(r => r.level),
    ...wanoKuniData.kanji.map(k => k.level),
    ...wanoKuniData.vocabulary.map(v => v.level)
  );

  // Calculer le nombre d'éléments pour l'affichage
  const getCurrentItemCount = () => {
    if (browseMode === 'levels') {
      if (selectedType === 'all') {
        return levelItemsData.radical.length + levelItemsData.kanji.length + levelItemsData.vocabulary.length;
      } else {
        return levelItemsData.length;
      }
    } else {
      return Object.values(typeItemsData).reduce((total, items) => total + items.length, 0);
    }
  };

  const getItemColor = (category) => {
    switch (category) {
      case 'radical': return 'bg-blue-500';
      case 'kanji': return 'bg-pink-500';
      case 'vocabulary': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getItemTextColor = (category) => {
    switch (category) {
      case 'radical': return 'text-blue-600';
      case 'kanji': return 'text-pink-600';
      case 'vocabulary': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  // Fonction pour obtenir le statut SRS d'un élément
  const getItemSRSStatus = (item) => {
    if (!srs) return null;
    const key = `${item.category}_${item.id}`;
    const progress = srs.getUserProgress()[key];
    
    if (!progress) return 'not_started';
    
    if (progress.srs_stage === -1) {
      return progress.lesson_completed ? 'lesson_completed' : 'not_started';
    }
    
    if (progress.srs_stage >= 0 && progress.srs_stage <= 3) return 'apprentice';
    if (progress.srs_stage >= 4 && progress.srs_stage <= 5) return 'guru';
    if (progress.srs_stage === 6) return 'master';
    if (progress.srs_stage === 7) return 'enlightened';
    if (progress.srs_stage === 8) return 'burned';
    
    return 'not_started';
  };

  // Fonction pour détecter si un élément a un échec récent
  const hasRecentFailure = (item) => {
    if (!srs) return false;
    
    // Pour les kanji/vocabulary, vérifier les deux types de questions
    if (item.category === 'kanji' || item.category === 'vocabulary') {
      const meaningKey = `${item.category}_${item.id}_meaning`;
      const readingKey = `${item.category}_${item.id}_reading`;
      const meaningProgress = srs.getUserProgress()[meaningKey];
      const readingProgress = srs.getUserProgress()[readingKey];
      
      return (meaningProgress && meaningProgress.incorrect_count > 0 && meaningProgress.correct_streak === 0) ||
             (readingProgress && readingProgress.incorrect_count > 0 && readingProgress.correct_streak === 0);
    } else {
      // Pour les radicals, une seule question
      const key = `${item.category}_${item.id}`;
      const progress = srs.getUserProgress()[key];
      return progress && progress.incorrect_count > 0 && progress.correct_streak === 0;
    }
  };

  // Fonction pour obtenir les styles de bordure selon le statut SRS
  const getSRSBorderStyles = (status, hasFailure = false) => {
    if (hasFailure) {
      return 'border-4 border-red-600 ring-4 ring-red-500/70 heartbeat';
    }
    
    switch (status) {
      case 'not_started':
        return 'border-4 border-gray-400 border-dashed opacity-60';
      case 'lesson_completed':
        return 'border-4 border-yellow-400';
      case 'apprentice':
        return 'border-4 border-pink-400';
      case 'guru':
        return 'border-4 border-purple-400';
      case 'master':
        return 'border-4 border-blue-400';
      case 'enlightened':
        return 'border-4 border-yellow-500';
      case 'burned':
        return 'border-4 border-gray-700';
      default:
        return 'border-2 border-gray-300';
    }
  };

  // Fonction pour obtenir les styles de hachures pour les éléments non vus
  const getNotStartedOverlay = (status) => {
    if (status === 'not_started') {
      return (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-400/20 via-transparent to-gray-400/20 opacity-70"
             style={{
               backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 6px, rgba(0,0,0,0.1) 6px, rgba(0,0,0,0.1) 12px)'
             }}>
        </div>
      );
    }
    return null;
  };

  const TypeButton = ({ type, label, count }) => (
    <button
      onClick={() => setSelectedType(type)}
      className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
        selectedType === type
          ? 'bg-white text-purple-600 shadow-lg'
          : 'bg-white/20 text-white hover:bg-white/30'
      }`}
    >
      {label} ({count})
    </button>
  );

  // Helper component to display character
  const ItemCharacter = ({ item }) => {
    return item.character || item.characters;
  };

  // Helper functions for responsive sizes based on displaySize
  const getCharacterSize = () => {
    switch (displaySize) {
      case 'small': return 'text-2xl md:text-3xl lg:text-4xl';
      case 'medium': return 'text-4xl md:text-5xl lg:text-6xl';
      case 'large': return 'text-5xl md:text-6xl lg:text-7xl';
      default: return 'text-4xl md:text-5xl lg:text-6xl';
    }
  };

  const getCardCharacterSize = () => {
    switch (displaySize) {
      case 'small': return 'text-3xl md:text-4xl lg:text-5xl';
      case 'medium': return 'text-4xl md:text-5xl lg:text-6xl';
      case 'large': return 'text-5xl md:text-6xl lg:text-7xl';
      default: return 'text-4xl md:text-5xl lg:text-6xl';
    }
  };

  const getGridCols = () => {
    switch (displaySize) {
      case 'small': return 'grid-cols-3 md:grid-cols-5 lg:grid-cols-8';
      case 'medium': return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4';
      case 'large': return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
      default: return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4';
    }
  };

  const getCardPadding = () => {
    switch (displaySize) {
      case 'small': return 'p-3';
      case 'medium': return 'p-4';
      case 'large': return 'p-6';
      default: return 'p-4';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-800">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
              >
                <Home className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-white text-2xl font-bold">
                  {browseMode === 'levels' ? 'Navigateur par niveau' : 
                   browseMode === 'types' ? 'Navigateur par type' : 'Recherche'}
                </h1>
                <p className="text-white/70">Explorez tous les éléments WaniKani</p>
              </div>
            </div>
            
            {/* Mode Toggle */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setBrowseMode('levels')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all ${
                  browseMode === 'levels' 
                    ? 'bg-white text-purple-600 shadow-lg' 
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                <List className="w-4 h-4" />
                <span>Par niveau</span>
              </button>
              <button
                onClick={() => setBrowseMode('types')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all ${
                  browseMode === 'types' 
                    ? 'bg-white text-purple-600 shadow-lg' 
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                <Grid className="w-4 h-4" />
                <span>Par type</span>
              </button>
              <button
                onClick={() => setBrowseMode('search')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all ${
                  browseMode === 'search' 
                    ? 'bg-white text-purple-600 shadow-lg' 
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                <Search className="w-4 h-4" />
                <span>Recherche</span>
              </button>
            </div>
          </div>

          {/* Navigation */}
          {browseMode === 'levels' ? (
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => setCurrentLevel(Math.max(1, currentLevel - 1))}
                disabled={currentLevel <= 1}
                className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 disabled:bg-white/10 disabled:opacity-50 text-white px-4 py-2 rounded-full transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Niveau précédent</span>
              </button>

              <div className="text-center">
                <div className="text-4xl font-bold text-white mb-2">Niveau {currentLevel}</div>
                <div className="text-white/70">{getCurrentItemCount()} éléments</div>
              </div>

              <button
                onClick={() => setCurrentLevel(Math.min(maxLevel, currentLevel + 1))}
                disabled={currentLevel >= maxLevel}
                className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 disabled:bg-white/10 disabled:opacity-50 text-white px-4 py-2 rounded-full transition-all"
              >
                <span>Niveau suivant</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : browseMode === 'types' ? (
            <div className="text-center mb-6">
              <div className="text-4xl font-bold text-white mb-2">
                {selectedType === 'radical' ? 'Radicaux' : 
                 selectedType === 'kanji' ? 'Kanji' : 'Vocabulaire'}
              </div>
              <div className="text-white/70">{getCurrentItemCount()} éléments • Tous niveaux</div>
            </div>
          ) : (
            /* Search Interface */
            <div className="space-y-4 mb-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-white mb-2">Recherche</div>
                <div className="text-white/70">
                  {searchResults.length > 0 ? 
                    `${searchResults.length} résultat${searchResults.length > 1 ? 's' : ''} trouvé${searchResults.length > 1 ? 's' : ''}` : 
                    'Tapez dans les barres de recherche ci-dessous'
                  }
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Barre de recherche hiragana */}
                <div className="relative">
                  <label className="flex items-center text-white/80 text-sm font-medium mb-2">
                    🈹 Recherche hiragana
                    <div className="relative ml-2 group">
                      <Info className="w-4 h-4 text-white/60 cursor-help" />
                      <div className="absolute left-1/2 bottom-full mb-2 -translate-x-1/2 bg-gray-800 text-white text-xs rounded-lg px-3 py-2 min-w-max opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                        <div className="text-left">
                          <div className="font-semibold mb-1">Raccourcis clavier :</div>
                          <div>• ltsu, xtsu → っ</div>
                          <div>• lya, xya → ゃ</div>
                          <div>• lyu, xyu → ゅ</div>
                          <div>• lyo, xyo → ょ</div>
                          <div>• la, xa → ぁ</div>
                          <div>• li, xi → ぃ</div>
                          <div>• lu, xu → ぅ</div>
                          <div>• le, xe → ぇ</div>
                          <div>• lo, xo → ぉ</div>
                        </div>
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                      </div>
                    </div>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={searchHiragana}
                      onChange={(e) => handleSearchHiraganaChange(e.target.value)}
                      placeholder="Ex: hito, ltsu, xya, ひと..."
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:border-white/50 focus:outline-none focus:ring-2 focus:ring-white/20"
                    />
                    {searchHiragana && (
                      <button
                        onClick={() => setSearchHiragana('')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Barre de recherche romaji */}
                <div className="relative">
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    🔤 Recherche romaji
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={searchRomaji}
                      onChange={(e) => setSearchRomaji(e.target.value)}
                      placeholder="Ex: hito, person, konnichiwa..."
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:border-white/50 focus:outline-none focus:ring-2 focus:ring-white/20"
                    />
                    {searchRomaji && (
                      <button
                        onClick={() => setSearchRomaji('')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Clear all button */}
              {(searchHiragana || searchRomaji) && (
                <div className="text-center">
                  <button
                    onClick={() => {
                      setSearchHiragana('');
                      setSearchRomaji('');
                    }}
                    className="bg-red-500/20 hover:bg-red-500/30 text-red-200 px-4 py-2 rounded-full text-sm font-medium transition-all"
                  >
                    Effacer tout
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Type Filter */}
          {browseMode !== 'search' && (
            <div className="flex items-center justify-center space-x-4 mb-4">
              {browseMode === 'levels' ? (
              <>
                <TypeButton 
                  type="all" 
                  label="Tous" 
                  count={getCurrentItemCount()} 
                />
                <TypeButton 
                  type="radical" 
                  label="Radicaux" 
                  count={getLevelItems(currentLevel, 'radical').length} 
                />
                <TypeButton 
                  type="kanji" 
                  label="Kanji" 
                  count={getLevelItems(currentLevel, 'kanji').length} 
                />
                <TypeButton 
                  type="vocabulary" 
                  label="Vocabulaire" 
                  count={getLevelItems(currentLevel, 'vocabulary').length} 
                />
              </>
            ) : (
              <>
                <TypeButton 
                  type="radical" 
                  label="Radicaux" 
                  count={wanoKuniData.radicals.length} 
                />
                <TypeButton 
                  type="kanji" 
                  label="Kanji" 
                  count={wanoKuniData.kanji.length} 
                />
                <TypeButton 
                  type="vocabulary" 
                  label="Vocabulaire" 
                  count={wanoKuniData.vocabulary.length} 
                />
              </>
            )}
            </div>
          )}

          {/* Size Control Buttons */}
          <div className="flex items-center justify-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-white/70 text-sm mr-2">Taille:</span>
              <button
                onClick={() => setDisplaySize('small')}
                className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                  displaySize === 'small'
                    ? 'bg-white text-purple-600 shadow-lg'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                S
              </button>
              <button
                onClick={() => setDisplaySize('medium')}
                className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                  displaySize === 'medium'
                    ? 'bg-white text-purple-600 shadow-lg'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                M
              </button>
              <button
                onClick={() => setDisplaySize('large')}
                className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                  displaySize === 'large'
                    ? 'bg-white text-purple-600 shadow-lg'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                L
              </button>
            </div>
            
            {/* Legend Toggle */}
            <button
              onClick={() => setShowLegend(!showLegend)}
              className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                showLegend
                  ? 'bg-white text-purple-600 shadow-lg'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              Légende
            </button>
          </div>
          
          {/* Legend */}
          {showLegend && (
            <div className="mt-4 bg-white/20 backdrop-blur-sm rounded-xl p-4">
              <h4 className="text-white font-bold mb-3 text-center">Statuts SRS</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 text-xs">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-gray-400 border-dashed bg-white opacity-60"></div>
                  <span className="text-white">Pas vu</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-yellow-400 bg-white"></div>
                  <span className="text-white">Leçon faite</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-pink-400 bg-pink-100"></div>
                  <span className="text-white">Apprentice</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-purple-400 bg-purple-100"></div>
                  <span className="text-white">Guru</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-blue-400 bg-blue-100"></div>
                  <span className="text-white">Master</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-yellow-500 bg-yellow-100"></div>
                  <span className="text-white">Enlightened</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-gray-700 bg-gray-200"></div>
                  <span className="text-white">Burned</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-red-600 bg-red-100 ring-2 ring-red-500/70 heartbeat"></div>
                  <span className="text-white">Échec récent (animation)</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Items Display */}
        {browseMode === 'levels' ? (
          /* Mode Niveau - Organisé par type */
          selectedType === 'all' ? (
            <div className="space-y-8">
              {['radical', 'kanji', 'vocabulary'].map(type => {
                const items = levelItemsData[type];
                if (items.length === 0) return null;
                
                return (
                  <div key={type}>
                    <h3 className="text-white text-xl font-bold mb-4 flex items-center">
                      <div className={`w-4 h-4 rounded ${getItemColor(type)} mr-3`}></div>
                      {type === 'radical' ? 'Radicaux' : type === 'kanji' ? 'Kanji' : 'Vocabulaire'} ({items.length})
                    </h3>
                    
                    {/* Affichage en lignes pour vocabulaire, en grille pour radical/kanji */}
                    {type === 'vocabulary' ? (
                      <div className="space-y-2">
                        {items.map((item) => {
                          const srsStatus = getItemSRSStatus(item);
                          const itemHasFailure = hasRecentFailure(item);
                          return (
                            <div
                              key={`${item.category}_${item.id}`}
                              className={`${getItemColor(item.category)} rounded-xl ${getCardPadding()} cursor-pointer hover:shadow-lg transition-all flex items-center justify-between relative ${getSRSBorderStyles(srsStatus, itemHasFailure)}`}
                              onClick={() => setSelectedItem(item)}
                            >
                              {getNotStartedOverlay(srsStatus)}
                              {/* Vocabulaire japonais à gauche - Taille adaptive */}
                              <div className={`${getCharacterSize()} font-bold text-white`}>
                                <ItemCharacter item={item} />
                              </div>
                              
                              {/* Hiragana et traduction à droite */}
                              <div className="text-right">
                                {item.readings && (
                                  <div className={`text-white font-bold mb-1 ${
                                    displaySize === 'small' ? 'text-2xl' : displaySize === 'large' ? 'text-5xl' : 'text-4xl'
                                  }`}>
                                    {item.readings[0]}
                                  </div>
                                )}
                                <div className={`text-white/90 ${
                                  displaySize === 'small' ? 'text-sm' : displaySize === 'large' ? 'text-xl' : 'text-lg'
                                }`}>
                                  {Array.isArray(item.meanings) ? item.meanings[0] : item.meaning}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className={`grid ${getGridCols()} ${displaySize === 'small' ? 'gap-2' : displaySize === 'large' ? 'gap-8' : 'gap-4'}`}>
                        {items.map((item) => {
                          const srsStatus = getItemSRSStatus(item);
                          const itemHasFailure = hasRecentFailure(item);
                          return (
                            <div
                              key={`${item.category}_${item.id}`}
                              className={`bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transform hover:scale-105 transition-all cursor-pointer relative ${getSRSBorderStyles(srsStatus, itemHasFailure)}`}
                              onClick={() => setSelectedItem(item)}
                            >
                              {getNotStartedOverlay(srsStatus)}
                              <div className={`${getItemColor(item.category)} ${displaySize === 'small' ? 'p-2' : 'p-3'} text-center`}>
                                <span className={`text-white font-bold uppercase tracking-wide ${
                                  displaySize === 'small' ? 'text-xs' : 'text-sm'
                                }`}>
                                  {item.category}
                                </span>
                              </div>
                              <div className={getCardPadding() + ' text-center'}>
                                {/* Caractère - Taille adaptive */}
                                <div className={`mb-4 flex items-center justify-center ${displaySize === 'small' ? 'min-h-12' : displaySize === 'large' ? 'min-h-24' : 'min-h-16'}`}>
                                  <div className={`${getCardCharacterSize()} font-bold text-gray-800`}>
                                    <ItemCharacter item={item} />
                                  </div>
                                </div>
                                
                                {/* Hiragana adaptatif */}
                                {(item.on_readings || item.kun_readings || item.readings) && (
                                  <div className={`text-gray-600 font-bold mb-2 ${
                                    displaySize === 'small' ? 'text-xl' : displaySize === 'large' ? 'text-4xl' : 'text-3xl'
                                  }`}>
                                    {item.readings ? item.readings[0] :
                                     item.on_readings ? item.on_readings[0] :
                                     item.kun_readings ? item.kun_readings[0] : ''}
                                  </div>
                                )}
                                
                                {/* Signification */}
                                <div className={`${getItemTextColor(item.category)} font-bold ${
                                  displaySize === 'small' ? 'text-xs' : displaySize === 'large' ? 'text-lg' : 'text-base'
                                }`}>
                                  {Array.isArray(item.meanings) ? item.meanings[0] : item.meaning}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            /* Mode Niveau - Type spécifique */
            selectedType === 'vocabulary' ? (
              <div className="space-y-2">
                {levelItemsData.map((item) => {
                  const srsStatus = getItemSRSStatus(item);
                          const itemHasFailure = hasRecentFailure(item);
                  return (
                    <div
                      key={`${item.category}_${item.id}`}
                      className={`${getItemColor(item.category)} rounded-xl ${getCardPadding()} cursor-pointer hover:shadow-lg transition-all flex items-center justify-between relative ${getSRSBorderStyles(srsStatus, itemHasFailure)}`}
                      onClick={() => setSelectedItem(item)}
                    >
                      {getNotStartedOverlay(srsStatus)}
                      {/* Vocabulaire japonais à gauche - Taille adaptive */}
                      <div className={`${getCharacterSize()} font-bold text-white`}>
                        <ItemCharacter item={item} />
                      </div>
                      
                      {/* Hiragana et traduction à droite */}
                      <div className="text-right">
                        {item.readings && (
                          <div className={`text-white font-bold mb-1 ${
                            displaySize === 'small' ? 'text-2xl' : displaySize === 'large' ? 'text-5xl' : 'text-4xl'
                          }`}>
                            {item.readings[0]}
                          </div>
                        )}
                        <div className={`text-white/90 ${
                          displaySize === 'small' ? 'text-sm' : displaySize === 'large' ? 'text-xl' : 'text-lg'
                        }`}>
                          {Array.isArray(item.meanings) ? item.meanings[0] : item.meaning}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className={`grid ${getGridCols()} ${displaySize === 'small' ? 'gap-2' : displaySize === 'large' ? 'gap-8' : 'gap-4'}`}>
                {levelItemsData.map((item) => {
                  const srsStatus = getItemSRSStatus(item);
                          const itemHasFailure = hasRecentFailure(item);
                  return (
                    <div
                      key={`${item.category}_${item.id}`}
                      className={`bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transform hover:scale-105 transition-all cursor-pointer relative ${getSRSBorderStyles(srsStatus, itemHasFailure)}`}
                      onClick={() => setSelectedItem(item)}
                    >
                      {getNotStartedOverlay(srsStatus)}
                      <div className={`${getItemColor(item.category)} ${displaySize === 'small' ? 'p-2' : 'p-3'} text-center`}>
                        <span className={`text-white font-bold uppercase tracking-wide ${
                          displaySize === 'small' ? 'text-xs' : 'text-sm'
                        }`}>
                          {item.category}
                        </span>
                      </div>
                      <div className={getCardPadding() + ' text-center'}>
                        {/* Caractère - Taille adaptive */}
                        <div className={`mb-4 flex items-center justify-center ${displaySize === 'small' ? 'min-h-12' : displaySize === 'large' ? 'min-h-24' : 'min-h-16'}`}>
                          <div className={`${getCardCharacterSize()} font-bold text-gray-800`}>
                            <ItemCharacter item={item} />
                          </div>
                        </div>
                        
                        {/* Hiragana adaptatif */}
                        {(item.on_readings || item.kun_readings || item.readings) && (
                          <div className={`text-gray-600 font-bold mb-2 ${
                            displaySize === 'small' ? 'text-xl' : displaySize === 'large' ? 'text-4xl' : 'text-3xl'
                          }`}>
                            {item.readings ? item.readings[0] :
                             item.on_readings ? item.on_readings[0] :
                             item.kun_readings ? item.kun_readings[0] : ''}
                          </div>
                        )}
                        
                        {/* Signification */}
                        <div className={`${getItemTextColor(item.category)} font-bold ${
                          displaySize === 'small' ? 'text-xs' : displaySize === 'large' ? 'text-lg' : 'text-base'
                        }`}>
                          {Array.isArray(item.meanings) ? item.meanings[0] : item.meaning}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )
        ) : (
          /* Mode Type - Organisé par niveau */
          <div className="space-y-8">
            {Object.keys(typeItemsData).sort((a, b) => parseInt(a) - parseInt(b)).map(level => {
              const items = typeItemsData[level];
              if (!items || items.length === 0) return null;
              
              return (
                <div key={level}>
                  <h3 className="text-white text-xl font-bold mb-4 flex items-center">
                    <div className="w-4 h-4 rounded bg-white/30 mr-3"></div>
                    Niveau {level} ({items.length})
                  </h3>
                  
                  {/* Affichage en lignes pour vocabulaire, en grille pour radical/kanji */}
                  {selectedType === 'vocabulary' ? (
                    <div className="space-y-2">
                      {items.map((item) => {
                        const srsStatus = getItemSRSStatus(item);
                          const itemHasFailure = hasRecentFailure(item);
                        return (
                          <div
                            key={`${item.category}_${item.id}`}
                            className={`${getItemColor(item.category)} rounded-xl ${getCardPadding()} cursor-pointer hover:shadow-lg transition-all flex items-center justify-between relative ${getSRSBorderStyles(srsStatus, itemHasFailure)}`}
                            onClick={() => setSelectedItem(item)}
                          >
                            {getNotStartedOverlay(srsStatus)}
                            {/* Vocabulaire japonais à gauche - Taille adaptive */}
                            <div className={`${getCharacterSize()} font-bold text-white`}>
                              <ItemCharacter item={item} />
                            </div>
                            
                            {/* Hiragana et traduction au centre */}
                            <div className="text-right flex-1 ml-8">
                              {item.readings && (
                                <div className={`text-white font-bold mb-1 ${
                                  displaySize === 'small' ? 'text-2xl' : displaySize === 'large' ? 'text-5xl' : 'text-4xl'
                                }`}>
                                  {item.readings[0]}
                                </div>
                              )}
                              <div className={`text-white/90 ${
                                displaySize === 'small' ? 'text-sm' : displaySize === 'large' ? 'text-xl' : 'text-lg'
                              }`}>
                                {Array.isArray(item.meanings) ? item.meanings[0] : item.meaning}
                              </div>
                            </div>
                            
                            {/* Niveau à droite */}
                            <div className={`text-white/70 font-bold ml-4 ${
                              displaySize === 'small' ? 'text-xs' : 'text-sm'
                            }`}>
                              Niv. {item.level}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className={`grid ${getGridCols()} ${displaySize === 'small' ? 'gap-2' : displaySize === 'large' ? 'gap-8' : 'gap-4'}`}>
                      {items.map((item) => {
                        const srsStatus = getItemSRSStatus(item);
                          const itemHasFailure = hasRecentFailure(item);
                        return (
                          <div
                            key={`${item.category}_${item.id}`}
                            className={`bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transform hover:scale-105 transition-all cursor-pointer relative ${getSRSBorderStyles(srsStatus, itemHasFailure)}`}
                            onClick={() => setSelectedItem(item)}
                          >
                            {getNotStartedOverlay(srsStatus)}
                            <div className={`${getItemColor(item.category)} ${displaySize === 'small' ? 'p-2' : 'p-3'} text-center`}>
                              <span className={`text-white font-bold uppercase tracking-wide ${
                                displaySize === 'small' ? 'text-xs' : 'text-sm'
                              }`}>
                                Niveau {item.level}
                              </span>
                            </div>
                            <div className={getCardPadding() + ' text-center'}>
                              {/* Caractère - Taille adaptive */}
                              <div className={`mb-4 flex items-center justify-center ${displaySize === 'small' ? 'min-h-12' : displaySize === 'large' ? 'min-h-24' : 'min-h-16'}`}>
                                <div className={`${getCardCharacterSize()} font-bold text-gray-800`}>
                                  <ItemCharacter item={item} />
                                </div>
                              </div>
                              
                              {/* Hiragana adaptatif */}
                              {(item.on_readings || item.kun_readings || item.readings) && (
                                <div className={`text-gray-600 font-bold mb-2 ${
                                  displaySize === 'small' ? 'text-xl' : displaySize === 'large' ? 'text-4xl' : 'text-3xl'
                                }`}>
                                  {item.readings ? item.readings[0] :
                                   item.on_readings ? item.on_readings[0] :
                                   item.kun_readings ? item.kun_readings[0] : ''}
                                </div>
                              )}
                              
                              {/* Signification */}
                              <div className={`${getItemTextColor(item.category)} font-bold ${
                                displaySize === 'small' ? 'text-xs' : displaySize === 'large' ? 'text-lg' : 'text-base'
                              }`}>
                                {Array.isArray(item.meanings) ? item.meanings[0] : item.meaning}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {browseMode !== 'search' && getCurrentItemCount() === 0 && (
          <div className="text-center py-12">
            <div className="text-white/50 text-6xl mb-4">🔍</div>
            <div className="text-white text-xl mb-2">Aucun élément trouvé</div>
            <div className="text-white/70">
              {browseMode === 'levels' 
                ? 'Ce niveau ne contient pas d\'éléments du type sélectionné.' 
                : 'Aucun élément de ce type trouvé.'}
            </div>
          </div>
        )}
        
        {/* Search Results */}
        {browseMode === 'search' && (
          <div className="space-y-8">
            {searchResults.length > 0 ? (
              // Grouper les résultats par type
              ['radical', 'kanji', 'vocabulary'].map(type => {
                const items = searchResults.filter(item => item.category === type);
                if (items.length === 0) return null;
                
                return (
                  <div key={type}>
                    <h3 className="text-white text-xl font-bold mb-4 flex items-center">
                      <div className={`w-4 h-4 rounded ${getItemColor(type)} mr-3`}></div>
                      {type === 'radical' ? 'Radicaux' : type === 'kanji' ? 'Kanji' : 'Vocabulaire'} ({items.length})
                    </h3>
                    
                    {/* Affichage en lignes pour vocabulaire, en grille pour radical/kanji */}
                    {type === 'vocabulary' ? (
                      <div className="space-y-2">
                        {items.map((item) => {
                          const srsStatus = getItemSRSStatus(item);
                          const itemHasFailure = hasRecentFailure(item);
                          return (
                            <div
                              key={`${item.category}_${item.id}`}
                              className={`${getItemColor(item.category)} rounded-xl ${getCardPadding()} cursor-pointer hover:shadow-lg transition-all flex items-center justify-between relative ${getSRSBorderStyles(srsStatus, itemHasFailure)}`}
                              onClick={() => setSelectedItem(item)}
                            >
                              {getNotStartedOverlay(srsStatus)}
                              <div className={`${getCharacterSize()} font-bold text-white`}>
                                <ItemCharacter item={item} />
                              </div>
                              <div className="text-right flex-1 ml-8">
                                {item.readings && (
                                  <div className={`text-white font-bold mb-1 ${
                                    displaySize === 'small' ? 'text-2xl' : displaySize === 'large' ? 'text-5xl' : 'text-4xl'
                                  }`}>
                                    {item.readings[0]}
                                  </div>
                                )}
                                <div className={`text-white/90 ${
                                  displaySize === 'small' ? 'text-sm' : displaySize === 'large' ? 'text-xl' : 'text-lg'
                                }`}>
                                  {Array.isArray(item.meanings) ? item.meanings[0] : item.meaning}
                                </div>
                                <div className="text-white/60 text-xs mt-1">
                                  Niveau {item.level}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className={`grid ${getGridCols()} ${displaySize === 'small' ? 'gap-2' : displaySize === 'large' ? 'gap-8' : 'gap-4'}`}>
                        {items.map((item) => {
                          const srsStatus = getItemSRSStatus(item);
                          const itemHasFailure = hasRecentFailure(item);
                          return (
                            <div
                              key={`${item.category}_${item.id}`}
                              className={`bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transform hover:scale-105 transition-all cursor-pointer relative ${getSRSBorderStyles(srsStatus, itemHasFailure)}`}
                              onClick={() => setSelectedItem(item)}
                            >
                              {getNotStartedOverlay(srsStatus)}
                              <div className={`${getItemColor(item.category)} ${displaySize === 'small' ? 'p-2' : 'p-3'} text-center`}>
                                <span className={`text-white font-bold uppercase tracking-wide ${
                                  displaySize === 'small' ? 'text-xs' : 'text-sm'
                                }`}>
                                  {item.category} • Niveau {item.level}
                                </span>
                              </div>
                              <div className={getCardPadding() + ' text-center'}>
                                <div className={`mb-4 flex items-center justify-center ${displaySize === 'small' ? 'min-h-12' : displaySize === 'large' ? 'min-h-24' : 'min-h-16'}`}>
                                  <div className={`${getCardCharacterSize()} font-bold text-gray-800`}>
                                    <ItemCharacter item={item} />
                                  </div>
                                </div>
                                {(item.on_readings || item.kun_readings || item.readings) && (
                                  <div className={`text-gray-600 font-bold mb-2 ${
                                    displaySize === 'small' ? 'text-xl' : displaySize === 'large' ? 'text-4xl' : 'text-3xl'
                                  }`}>
                                    {item.readings ? item.readings[0] :
                                     item.on_readings ? item.on_readings[0] :
                                     item.kun_readings ? item.kun_readings[0] : ''}
                                  </div>
                                )}
                                <div className={`${getItemTextColor(item.category)} font-bold ${
                                  displaySize === 'small' ? 'text-xs' : displaySize === 'large' ? 'text-lg' : 'text-base'
                                }`}>
                                  {Array.isArray(item.meanings) ? item.meanings[0] : item.meaning}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (searchHiragana || searchRomaji) ? (
              <div className="text-center py-12">
                <div className="text-white/50 text-6xl mb-4">🤔</div>
                <div className="text-white text-xl mb-2">Aucun résultat trouvé</div>
                <div className="text-white/70">
                  Essayez avec d'autres termes de recherche
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* Quick Navigation - Only in levels mode */}
        {browseMode === 'levels' && (
          <div className="mt-8 text-center">
            <div className="inline-flex bg-white/10 backdrop-blur-lg rounded-full p-2 space-x-2">
              {Array.from({ length: Math.min(maxLevel, 10) }, (_, i) => i + 1).map(level => (
                <button
                  key={level}
                  onClick={() => setCurrentLevel(level)}
                  className={`w-10 h-10 rounded-full font-bold transition-all ${
                    level === currentLevel
                      ? 'bg-white text-purple-600'
                      : 'text-white hover:bg-white/20'
                  }`}
                >
                  {level}
                </button>
              ))}
              {maxLevel > 10 && (
                <span className="text-white/50 flex items-center px-2">...</span>
              )}
            </div>
          </div>
        )}

        {/* Item Detail Modal */}
        {selectedItem && (
          <ItemDetailModal 
            item={selectedItem}
            wanoKuniData={wanoKuniData}
            onClose={() => setSelectedItem(null)}
            onNavigateToItem={(item) => setSelectedItem(item)}
          />
        )}

      </div>
    </div>
  );
};

export default LevelBrowser;