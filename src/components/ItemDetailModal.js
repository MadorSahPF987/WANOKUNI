import React, { useState } from 'react';
import { X, Volume2, BookOpen, Lightbulb, MessageSquare } from 'lucide-react';
import { FormattedText } from '../utils/textFormatting';
import { getItemRelations } from '../utils/itemRelations';

const ItemDetailModal = ({ item, wanoKuniData, onClose, onNavigateToItem }) => {
  const [activeTab, setActiveTab] = useState('mnemonics');

  // ALL HOOKS MUST BE BEFORE ANY RETURN!
  
  // Prepare data safely
  const character = item?.character || item?.characters;
  const meaning = Array.isArray(item?.meanings) ? item.meanings[0] : (item?.meaning || 'Pas de signification');
  const category = item?.category || item?.type;
  
  // Get item relations (with null check)
  const relations = React.useMemo(() => {
    if (!wanoKuniData || !item) return {};
    
    // Force manual calculation for vocabulary
    if (item.type === 'vocabulary' && item.component_kanji_ids) {
      const componentKanji = item.component_kanji_ids
        .map(id => wanoKuniData.kanji?.find(k => k.id === parseInt(id)))
        .filter(Boolean);
      
      
      return { componentKanji };
    }
    
    return getItemRelations(wanoKuniData, item);
  }, [wanoKuniData, item]);
  
  // Available tabs
  const availableTabs = React.useMemo(() => [
    'mnemonics',
    ...(category === 'vocabulary' && item?.context_sentences?.length > 0 ? ['examples'] : []),
    'info'
  ], [category, item]);

  // Keyboard navigation
  const handleKeyDown = React.useCallback((e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const currentIndex = availableTabs.indexOf(activeTab);
      const nextIndex = (currentIndex + 1) % availableTabs.length;
      setActiveTab(availableTabs[nextIndex]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  }, [activeTab, availableTabs, onClose]);

  // Focus management
  React.useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // NOW we can do conditional returns
  if (!item) return null;
  
  if (!character || !category) {
    console.error('🚨 Modal: Invalid item data', item);
    return null;
  }

  const playAudio = () => {
    if (item.audio_urls?.length > 0) {
      const audio = new Audio(item.audio_urls[0].url);
      audio.play().catch(() => console.log('Audio playback failed'));
    }
  };

  const getTypeColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'radical': return 'bg-blue-500';
      case 'kanji': return 'bg-pink-500';
      case 'vocabulary': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getTypeTextColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'radical': return 'text-blue-600';
      case 'kanji': return 'text-pink-600';
      case 'vocabulary': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const TabButton = ({ id, label, icon: Icon, isActive, onClick }) => (
    <button
      onClick={onClick}
      className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
        isActive 
          ? 'bg-white text-gray-800 shadow-md' 
          : 'text-white/70 hover:text-white hover:bg-white/10'
      }`}
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
    </button>
  );

  const ItemChip = ({ item, type, onClick, size = 'normal' }) => {
    const getChipColor = (itemType) => {
      switch (itemType?.toLowerCase()) {
        case 'radical': return 'bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200 hover:border-blue-400';
        case 'kanji': return 'bg-pink-100 text-pink-800 border-pink-300 hover:bg-pink-200 hover:border-pink-400';
        case 'vocabulary': return 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200 hover:border-green-400';
        default: return 'bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-200 hover:border-gray-400';
      }
    };

    const character = item.character || item.characters;
    const meaning = Array.isArray(item.meanings) ? item.meanings[0] : (item.meaning || '?');

    const getSizeClasses = () => {
      switch (size) {
        case 'large':
          return {
            container: 'px-4 py-3 rounded-xl gap-3',
            character: 'text-3xl',
            meaning: 'text-base max-w-32'
          };
        case 'medium':
          return {
            container: 'px-3 py-2 rounded-lg gap-2',
            character: 'text-xl',
            meaning: 'text-sm max-w-24'
          };
        default:
          return {
            container: 'px-3 py-2 rounded-lg gap-2',
            character: 'text-lg',
            meaning: 'text-xs max-w-20'
          };
      }
    };

    const sizeClasses = getSizeClasses();

    return (
      <div 
        className={`inline-flex items-center ${sizeClasses.container} border cursor-pointer hover:shadow-lg transform hover:scale-105 transition-all duration-200 ${getChipColor(type)}`}
        onClick={() => onClick && onClick(item)}
        title={`Cliquer pour voir: ${character} - ${meaning}`}
      >
        <span className={`${sizeClasses.character} font-bold`}>{character}</span>
        <span className={`${sizeClasses.meaning} truncate font-medium`}>{meaning}</span>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className={`${getTypeColor(category)} p-6 text-white`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="text-6xl font-bold">
                {character}
              </div>
              <div>
                <h2 className="text-2xl font-bold">
                  {meaning}
                </h2>
                <p className="text-white/80 capitalize">
                  {category} • Niveau {item.level}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Navigation hint */}
              <div className="hidden md:flex items-center space-x-2 bg-white/20 px-3 py-2 rounded-full">
                <div className="text-white/80 text-xs font-medium">
                  <kbd className="bg-white/20 px-2 py-1 rounded text-xs">Entrée</kbd>
                  <span className="ml-1">pour naviguer</span>
                </div>
              </div>

              {/* Audio button for vocabulary */}
              {category === 'vocabulary' && item.audio_urls?.length > 0 && (
                <button
                  onClick={playAudio}
                  className="bg-white/20 hover:bg-white/30 p-3 rounded-full transition-colors"
                  title="Écouter la prononciation"
                >
                  <Volume2 className="w-6 h-6" />
                </button>
              )}
              
              <button
                onClick={onClose}
                className="bg-white/20 hover:bg-white/30 p-3 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Readings */}
          {(item.readings || item.on_readings || item.kun_readings) && (
            <div className="bg-white/20 rounded-2xl p-4">
              {category === 'kanji' && (item.on_readings || item.kun_readings) ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Onyomi */}
                  {item.on_readings?.length > 0 && (
                    <div>
                      <p className="text-white/80 text-xs mb-1">ON'YOMI (lecture chinoise)</p>
                      <div className="flex flex-wrap gap-2">
                        {item.on_readings.map((reading, index) => {
                          const isPrimary = item.primary_on_reading === reading;
                          return (
                            <span 
                              key={index}
                              className={`px-3 py-2 rounded text-3xl font-bold ${
                                isPrimary 
                                  ? 'bg-white text-pink-600 ring-2 ring-pink-300' 
                                  : 'bg-white/70 text-pink-700'
                              }`}
                            >
                              {reading}
                              {isPrimary && <span className="ml-1 text-xs">★</span>}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  {/* Kunyomi */}
                  {item.kun_readings?.length > 0 && (
                    <div>
                      <p className="text-white/80 text-xs mb-1">KUN'YOMI (lecture japonaise)</p>
                      <div className="flex flex-wrap gap-2">
                        {item.kun_readings.map((reading, index) => {
                          const isPrimary = item.primary_kun_reading === reading;
                          return (
                            <span 
                              key={index}
                              className={`px-3 py-2 rounded text-3xl font-bold ${
                                isPrimary 
                                  ? 'bg-white text-pink-600 ring-2 ring-pink-300' 
                                  : 'bg-white/70 text-pink-700'
                              }`}
                            >
                              {reading}
                              {isPrimary && <span className="ml-1 text-xs">★</span>}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <p className="text-white/80 text-sm mb-1">Lecture</p>
                  <p className="text-4xl font-bold">
                    {item.readings ? item.readings.join(', ') :
                     [...(item.on_readings || []), ...(item.kun_readings || [])].join(', ')}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className={`${getTypeColor(category)} px-6 pb-6`}>
          <div className="flex space-x-2">
            <TabButton
              id="mnemonics"
              label="Mnémotechniques"
              icon={Lightbulb}
              isActive={activeTab === 'mnemonics'}
              onClick={() => setActiveTab('mnemonics')}
            />
            {category === 'vocabulary' && item.context_sentences?.length > 0 && (
              <TabButton
                id="examples"
                label="Exemples"
                icon={MessageSquare}
                isActive={activeTab === 'examples'}
                onClick={() => setActiveTab('examples')}
              />
            )}
            <TabButton
              id="info"
              label="Informations"
              icon={BookOpen}
              isActive={activeTab === 'info'}
              onClick={() => setActiveTab('info')}
            />
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
          {activeTab === 'mnemonics' && (
            <div className="space-y-6">
              {/* Meaning mnemonic */}
              {(item.meaning_mnemonic || item.mnemonic) && (
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
                    <Lightbulb className="w-5 h-5 mr-2 text-yellow-500" />
                    Mnémotechnique de signification
                  </h3>
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-xl">
                    <FormattedText itemType={category}>
                      {item.meaning_mnemonic || item.mnemonic}
                    </FormattedText>
                  </div>
                </div>
              )}

              {/* Reading mnemonic */}
              {(category === 'kanji' || category === 'vocabulary') && (item.reading_mnemonic || item.mnemonic) && (
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
                    <BookOpen className="w-5 h-5 mr-2 text-blue-500" />
                    Mnémotechnique de lecture
                  </h3>
                  <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-xl">
                    <FormattedText itemType={category}>
                      {item.reading_mnemonic || item.mnemonic}
                    </FormattedText>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'examples' && category === 'vocabulary' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Exemples d'usage</h3>
              {item.context_sentences?.map((sentence, index) => (
                <div key={index} className="bg-gray-50 rounded-xl p-6 border-l-4 border-green-400">
                  <div className="text-xl text-gray-800 mb-3 font-medium">
                    {sentence.japanese}
                  </div>
                  <div className="text-gray-600">
                    {sentence.english}
                  </div>
                  {sentence.french && (
                    <div className="text-gray-500 text-sm mt-2">
                      {sentence.french}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'info' && (
            <div className="space-y-6">
              {/* Relations et composants */}
              <div className="space-y-6">
                {/* Radicaux composants (pour kanji) */}
                {category === 'kanji' && relations.componentRadicals?.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
                      <span className="text-blue-500 mr-2">部</span>
                      Radicaux composants
                    </h3>
                    <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-xl">
                      <div className="flex flex-wrap gap-3">
                        {relations.componentRadicals.map((radical, index) => (
                          <ItemChip 
                            key={index}
                            item={radical}
                            type="radical"
                            size="large"
                            onClick={(item) => onNavigateToItem && onNavigateToItem(item)}
                          />
                        ))}
                      </div>
                      <p className="text-blue-700 text-sm mt-2">
                        Ce kanji est formé par la combinaison de {relations.componentRadicals.length} radical(aux)
                      </p>
                    </div>
                  </div>
                )}

                {/* Vocabulaire débloqué (pour kanji) */}
                {category === 'kanji' && relations.unlockedVocabulary?.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
                      <span className="text-green-500 mr-2">語</span>
                      Vocabulaire débloqué
                    </h3>
                    <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-r-xl">
                      <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                        {relations.unlockedVocabulary.map((vocab, index) => (
                          <ItemChip 
                            key={index}
                            item={vocab}
                            type="vocabulary"
                            size="medium"
                            onClick={(item) => onNavigateToItem && onNavigateToItem(item)}
                          />
                        ))}
                      </div>
                      <p className="text-green-700 text-sm mt-2">
                        Apprendre ce kanji débloque {relations.unlockedVocabulary.length} mot(s) de vocabulaire
                        {item.unlocked_vocabulary_ids?.length > relations.unlockedVocabulary.length && 
                          ` (${relations.unlockedVocabulary.length}/${item.unlocked_vocabulary_ids.length} montrés)`
                        }
                      </p>
                    </div>
                  </div>
                )}

                {/* Kanji visuellement similaires */}
                {category === 'kanji' && relations.visuallySimilar?.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
                      <span className="text-purple-500 mr-2">👁️</span>
                      Kanji similaires visuellement
                    </h3>
                    <div className="bg-purple-50 border-l-4 border-purple-400 p-4 rounded-r-xl">
                      <div className="flex flex-wrap gap-3">
                        {relations.visuallySimilar.map((similarKanji, index) => (
                          <ItemChip 
                            key={index}
                            item={similarKanji}
                            type="kanji"
                            size="large"
                            onClick={(item) => onNavigateToItem && onNavigateToItem(item)}
                          />
                        ))}
                      </div>
                      <p className="text-purple-700 text-sm mt-2">
                        ⚠️ Attention à ne pas confondre avec ces kanji qui se ressemblent
                      </p>
                    </div>
                  </div>
                )}


                {/* Relations inverses pour radicaux */}
                {category === 'radical' && relations.usedInKanji?.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
                      <span className="text-pink-500 mr-2">漢</span>
                      Kanji utilisant ce radical
                    </h3>
                    <div className="bg-pink-50 border-l-4 border-pink-400 p-4 rounded-r-xl">
                      <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                        {relations.usedInKanji.map((kanji, index) => (
                          <ItemChip 
                            key={index}
                            item={kanji}
                            type="kanji"
                            size="medium"
                            onClick={(item) => onNavigateToItem && onNavigateToItem(item)}
                          />
                        ))}
                      </div>
                      <p className="text-pink-700 text-sm mt-2">
                        Ce radical est utilisé dans {relations.usedInKanji.length} kanji
                        {relations.usedInKanji.length >= 15 && ' (15 premiers montrés)'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Vocabulaire utilisant ce kanji */}
                {category === 'kanji' && relations.usedInVocabulary?.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
                      <span className="text-green-500 mr-2">語</span>
                      Vocabulaire utilisant ce kanji
                    </h3>
                    <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-r-xl">
                      <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                        {relations.usedInVocabulary.map((vocab, index) => (
                          <ItemChip 
                            key={index}
                            item={vocab}
                            type="vocabulary"
                            size="medium"
                            onClick={(item) => onNavigateToItem && onNavigateToItem(item)}
                          />
                        ))}
                      </div>
                      <p className="text-green-700 text-sm mt-2">
                        Ce kanji est utilisé dans {relations.usedInVocabulary.length} mots de vocabulaire
                        {relations.usedInVocabulary.length >= 10 && ' (10 premiers montrés)'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Lectures spéciales pour kanji */}
                {category === 'kanji' && (item.on_readings?.length > 0 || item.kun_readings?.length > 0) && (
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-3">Détails des lectures</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {item.on_readings?.length > 0 && (
                        <div className="bg-orange-50 border-l-4 border-orange-400 p-4 rounded-r-xl">
                          <h4 className="font-semibold text-orange-800 mb-2">ON'YOMI (音読み)</h4>
                          <div className="space-y-2">
                            {item.on_readings.map((reading, index) => (
                              <div key={index} className="flex justify-between items-center">
                                <span className="font-bold text-lg">{reading}</span>
                                {item.primary_on_reading === reading && (
                                  <span className="text-orange-600 text-xs bg-orange-200 px-2 py-1 rounded">Primaire</span>
                                )}
                              </div>
                            ))}
                          </div>
                          <p className="text-orange-700 text-xs mt-2">Lecture d'origine chinoise</p>
                        </div>
                      )}
                      
                      {item.kun_readings?.length > 0 && (
                        <div className="bg-teal-50 border-l-4 border-teal-400 p-4 rounded-r-xl">
                          <h4 className="font-semibold text-teal-800 mb-2">KUN'YOMI (訓読み)</h4>
                          <div className="space-y-2">
                            {item.kun_readings.map((reading, index) => (
                              <div key={index} className="flex justify-between items-center">
                                <span className="font-bold text-lg">{reading}</span>
                                {item.primary_kun_reading === reading && (
                                  <span className="text-teal-600 text-xs bg-teal-200 px-2 py-1 rounded">Primaire</span>
                                )}
                              </div>
                            ))}
                          </div>
                          <p className="text-teal-700 text-xs mt-2">Lecture d'origine japonaise</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Kanji Composition (pour vocabulaire) */}
              {category === 'vocabulary' && relations.componentKanji?.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
                    <span className="text-pink-500 mr-2">漢</span>
                    Kanji Composition
                  </h3>
                  <div className="bg-pink-50 border-l-4 border-pink-400 p-4 rounded-r-xl">
                    <div className="flex flex-wrap gap-3">
                      {relations.componentKanji.map((kanji, index) => (
                        <ItemChip 
                          key={index}
                          item={kanji}
                          type="kanji"
                          size="large"
                          onClick={(item) => onNavigateToItem && onNavigateToItem(item)}
                        />
                      ))}
                    </div>
                    <p className="text-pink-700 text-sm mt-2">
                      Ce vocabulaire est composé de {relations.componentKanji.length} kanji
                    </p>
                  </div>
                </div>
              )}

              {/* Significations alternatives */}
              {item.auxiliary_meanings?.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-3">Significations alternatives</h3>
                  <div className="flex flex-wrap gap-2">
                    {item.auxiliary_meanings.map((meaning, index) => (
                      <span key={index} className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-sm">
                        {typeof meaning === 'string' ? meaning : meaning.meaning}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Détails techniques - en bas */}
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-3">Détails techniques</h3>
                <div className="bg-gray-50 border-l-4 border-gray-400 p-4 rounded-r-xl">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    <div className="text-gray-600">Type :</div>
                    <div className={`font-medium ${getTypeTextColor(category)} capitalize text-right`}>
                      {category}
                    </div>
                    
                    <div className="text-gray-600">Niveau :</div>
                    <div className="font-medium text-right">{item.level}</div>
                    
                    {item.id && (
                      <>
                        <div className="text-gray-600">ID :</div>
                        <div className="font-mono text-sm text-gray-500 text-right">{item.id}</div>
                      </>
                    )}
                    
                    {item.slug && (
                      <>
                        <div className="text-gray-600">Slug :</div>
                        <div className="font-mono text-sm text-gray-500 text-right">{item.slug}</div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ItemDetailModal;