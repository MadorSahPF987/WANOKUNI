import React, { useState, useEffect, useCallback } from 'react';
import { Home, ChevronRight, Volume2, RotateCcw, CheckCircle, Info } from 'lucide-react';
import { FormattedText } from '../utils/textFormatting';
import { useHiraganaInput, getFinalHiraganaValue } from '../utils/romajiConverter';

const ReviewSession = ({ srs, wanoKuniData, onComplete, onBack }) => {
  const [fixedReviewItems, setFixedReviewItems] = useState(null); // Items fixes de la session
  const [currentIndex, setCurrentIndex] = useState(0);
  const [failedItems, setFailedItems] = useState([]); // Items échoués à répéter
  
  // Double question system states
  const [currentQuestionType, setCurrentQuestionType] = useState('meaning'); // 'meaning' or 'reading'
  const [meaningAnswer, setMeaningAnswer] = useState('');
  const [readingAnswer, setReadingAnswer] = useState('');
  const [meaningResult, setMeaningResult] = useState(null); // { correct, hint }
  const [readingResult, setReadingResult] = useState(null); // { correct, hint }
  
  // Input states - use hiragana conversion only for reading questions
  const [userAnswer, setUserAnswer] = useState('');
  const [userAnswerHiragana, handleUserAnswerHiraganaChange, setUserAnswerHiragana] = useHiraganaInput('');
  const [showAnswer, setShowAnswer] = useState(false);
  const [sessionStats, setSessionStats] = useState({ correct: 0, incorrect: 0 });
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState(null);
  const [answerHint, setAnswerHint] = useState(null);
  const [attemptCount, setAttemptCount] = useState(0);
  const [hasUsedSecondChance, setHasUsedSecondChance] = useState(false);

  // Initialize review session ONCE only
  useEffect(() => {
    if (!fixedReviewItems) { // Only initialize once
      const session = srs.startReviewSession();
      if (session.length === 0) {
        onComplete();
        return;
      }
      console.log('🎯 INITIALIZING REVIEW SESSION:', session.map(item => item.item?.character || item.item?.characters));
      setFixedReviewItems([...session]); // Capturer les items fixes UNE SEULE FOIS
    }
  }, [srs, onComplete, fixedReviewItems]);

  const currentItem = fixedReviewItems?.[currentIndex];
  
  // Debug: log current item info
  useEffect(() => {
    if (currentItem) {
      console.log('📊 REVIEW DEBUG - Index:', currentIndex, 'Item:', currentItem.item?.character || currentItem.item?.characters, 'Type:', currentItem.item?.type, 'QuestionType:', currentItem.questionType);
    }
  }, [currentIndex, currentItem]);

  const handleSubmitAnswer = useCallback(() => {
    // Get question type from current item (for randomized questions)
    const questionType = currentItem?.questionType || currentQuestionType;
    const isReadingQuestion = questionType === 'reading';
    const shouldUseHiragana = currentItem?.item.type !== 'radical' && isReadingQuestion;
    
    // Get the final answer with proper 'n' conversion for hiragana
    let currentAnswer;
    if (shouldUseHiragana) {
      currentAnswer = getFinalHiraganaValue(userAnswerHiragana);
    } else {
      currentAnswer = userAnswer;
    }
    if (!currentItem || !currentAnswer.trim()) return;

    // Check answer for current question type
    console.log('🔍 ANSWER CHECK:', {
      item: currentItem.item?.character || currentItem.item?.characters,
      questionType: questionType,
      userAnswer: currentAnswer.trim(),
      expectedMeanings: currentItem.item?.meanings || currentItem.item?.meaning,
      expectedReadings: currentItem.item?.readings || [currentItem.item?.on_readings, currentItem.item?.kun_readings].filter(Boolean).flat()
    });
    
    const answerResult = srs.checkAnswer(currentItem, questionType, currentAnswer.trim());
    const isCorrect = answerResult.correct || answerResult === true;
    const hint = answerResult.hint || null;
    
    console.log('✅ ANSWER RESULT:', { isCorrect, hint, fullResult: answerResult });
    
    setAttemptCount(prev => prev + 1);
    setAnswerHint(hint);
    
    // If we have a hint, don't proceed, just show hint
    if (hint) {
      if (isReading) {
        setUserAnswerHiragana('');
      } else {
        setUserAnswer('');
      }
      return;
    }
    
    // Handle incorrect answer on first attempt - give second chance
    if (!isCorrect && attemptCount === 0) {
      setHasUsedSecondChance(true);
      if (shouldUseHiragana) {
        setUserAnswerHiragana('');
      } else {
        setUserAnswer('');
      }
      setAnswerHint('retry');
      return;
    }
    
    // Determine final result for this question type
    let finalCorrect;
    if (isCorrect && attemptCount === 0) {
      finalCorrect = true;
    } else if (isCorrect && attemptCount === 1) {
      finalCorrect = 'partial';
    } else {
      finalCorrect = false;
    }
    
    // Submit answer directly since each review item is now a single question
    const questionKey = currentItem.questions[questionType]?.key;
    if (questionKey) {
      srs.submitAnswer(questionKey, finalCorrect);
    }
    
    // If failed after 2 attempts, add to failed items for immediate repetition
    if (finalCorrect === false) {
      const itemKey = `${currentItem.baseKey}_${questionType}`;
      setFailedItems(prev => {
        // Don't add duplicates
        const exists = prev.some(item => `${item.baseKey}_${item.questionType}` === itemKey);
        if (exists) return prev;
        return [...prev, { ...currentItem }];
      });
      
      // Add failed item immediately after current position for immediate retry
      setFixedReviewItems(prev => {
        const newItems = [...prev];
        newItems.splice(currentIndex + 1, 0, { ...currentItem });
        return newItems;
      });
    }
    
    // Update session stats
    setSessionStats(prev => ({
      correct: prev.correct + (finalCorrect === true ? 1 : 0),
      incorrect: prev.incorrect + (finalCorrect === true ? 0 : 1)
    }));
    
    setLastAnswerCorrect(finalCorrect === true);

    // Always show result screen - user controls progression with Enter/button
    setShowAnswer(true);
  }, [currentItem, userAnswer, userAnswerHiragana, srs, attemptCount, currentIndex, fixedReviewItems, onComplete, setUserAnswerHiragana]);

  const handleNext = useCallback(() => {
    if (currentIndex < fixedReviewItems.length - 1) {
      setCurrentIndex(prev => prev + 1);
      
      // Reset states for next question
      setUserAnswer('');
      setUserAnswerHiragana('');
      setShowAnswer(false);
      setLastAnswerCorrect(null);
      setAnswerHint(null);
      setAttemptCount(0);
      setHasUsedSecondChance(false);
    } else {
      // End of initial items - check if we have failed items to repeat
      if (failedItems.length > 0) {
        console.log('🔄 Adding failed items to review:', failedItems.length);
        // Add failed items to the end and continue
        setFixedReviewItems(prev => [...prev, ...failedItems]);
        setFailedItems([]); // Clear failed items list
        setCurrentIndex(prev => prev + 1); // Move to first failed item
        
        // Reset states for next question
        setUserAnswer('');
        setUserAnswerHiragana('');
        setShowAnswer(false);
        setLastAnswerCorrect(null);
        setAnswerHint(null);
        setAttemptCount(0);
        setHasUsedSecondChance(false);
      } else {
        // No failed items, session is complete
        onComplete();
      }
    }
  }, [currentIndex, fixedReviewItems, failedItems, onComplete, setUserAnswerHiragana]);

  const playAudio = useCallback(() => {
    if (currentItem?.item.audio_urls?.length > 0) {
      const audio = new Audio(currentItem.item.audio_urls[0].url);
      audio.play().catch(() => console.log('Audio playback failed'));
    }
  }, [currentItem]);


  // Support global de la touche Entrée
  const handleGlobalKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      
      if (!showAnswer) {
        // Si on est dans la phase de réponse et qu'il y a une réponse
        const itemQuestionType = currentItem?.questionType || 'meaning';
        const isReadingQuestion = itemQuestionType === 'reading';
        const shouldUseHiragana = currentItem?.item.type !== 'radical' && isReadingQuestion;
        const currentAnswer = shouldUseHiragana ? getFinalHiraganaValue(userAnswerHiragana) : userAnswer;
        if (currentAnswer.trim()) {
          handleSubmitAnswer();
        }
      } else {
        // Si on est dans la phase de résultat, passer au suivant
        handleNext();
      }
    }
  }, [showAnswer, userAnswer, userAnswerHiragana, currentItem, handleSubmitAnswer, handleNext]);

  // Event listener pour la touche Entrée
  useEffect(() => {
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [handleGlobalKeyDown]);

  if (!fixedReviewItems || !currentItem) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-xl">Préparation de la session...</p>
        </div>
      </div>
    );
  }

  const { item } = currentItem;
  const questionType = currentItem?.questionType || 'meaning';
  // Radicals never have reading questions, even if questionType says so
  const isReading = currentItem?.item.type !== 'radical' && questionType === 'reading';
  const progress = fixedReviewItems ? ((currentIndex + 1) / fixedReviewItems.length) * 100 : 0;
  
  // Use the appropriate item for display - make sure it's the correct item
  const displayItem = currentItem?.item;
  
  // Determine colors based on item type (header) and input type (input field)
  const getHeaderColor = (type) => {
    switch(type) {
      case 'radical': return 'bg-blue-500';
      case 'kanji': return 'bg-purple-600';
      case 'vocabulary': return 'bg-green-600';
      default: return 'bg-blue-500';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
              >
                <Home className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-white text-xl font-bold">Session de révision</h1>
                <p className="text-white/70">{currentIndex + 1} / {fixedReviewItems?.length || 0}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="text-center">
                <div className="text-green-400 font-bold text-lg">{sessionStats.correct}</div>
                <div className="text-white/70 text-xs">Correct</div>
              </div>
              <div className="text-center">
                <div className="text-red-400 font-bold text-lg">{sessionStats.incorrect}</div>
                <div className="text-white/70 text-xs">Incorrect</div>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="bg-white/20 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-blue-400 to-purple-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Review Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-4xl mx-auto">
          {/* Item Type Header */}
          <div className={`p-3 text-center ${getHeaderColor(displayItem.type)}`}>
            <span className="text-white font-bold text-sm uppercase tracking-wide">
              {displayItem.type} • {isReading ? 'Lecture (hiragana)' : 'Signification (romaji)'}
            </span>
          </div>

          <div className="p-8">
            {!showAnswer ? (
              /* Question phase - show character only */
              <div className="text-center mb-8">
                <div className="text-8xl md:text-9xl mb-6 text-gray-800 font-bold hover:scale-110 transition-transform cursor-pointer select-none">
                  {displayItem.character || displayItem.characters}
                </div>
                
                {/* Ne pas afficher la signification lors des questions de lecture pour éviter que ce soit trop facile */}

                {/* Hint display */}
                {answerHint && (
                  <div className={`border-l-4 p-4 mb-6 rounded-r-lg ${
                    answerHint === 'retry' ? 'bg-blue-100 border-blue-400' : 'bg-orange-100 border-orange-400'
                  }`}>
                    <p className={`font-medium ${
                      answerHint === 'retry' ? 'text-blue-700' : 'text-orange-700'
                    }`}>
                      {answerHint === 'retry' ? 
                        "Réessayez ! C'est sûrement l'orthographe 😊" :
                        answerHint === 'on_yomi' ? 
                          "Essayez la lecture ON'YOMI (chinoise) au lieu de KUN'YOMI" :
                          "Essayez la lecture KUN'YOMI (japonaise) au lieu d'ON'YOMI"
                      }
                    </p>
                  </div>
                )}
              </div>
            ) : null}


            {!showAnswer ? (
              /* Answer Input */
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="relative flex-1">
                    {/* Use yellow for meaning, black for reading, but only show hiragana conversion for non-radicals reading */}
                    <div className={`border-2 rounded-2xl ${
                      isReading ? 'border-gray-800 bg-gray-50' : 'border-yellow-500 bg-yellow-50'
                    }`}>
                      <input
                        type="text"
                        value={(currentItem?.item.type !== 'radical' && isReading) ? userAnswerHiragana : userAnswer}
                        onChange={(e) => {
                          if (currentItem?.item.type !== 'radical' && isReading) {
                            handleUserAnswerHiraganaChange(e.target.value);
                          } else {
                            setUserAnswer(e.target.value);
                          }
                        }}
                        placeholder={
                          currentItem?.item.type === 'radical' ? 
                            "Réponse en romaji normal (ex: tree, person, water...)" :
                            isReading ? 
                              "Réponse en hiragana (romaji → hiragana: shi, ltsu, xya...)" :
                              "Réponse en romaji normal (ex: tree, person, water...)"
                        }
                        className={`w-full text-center text-2xl p-6 rounded-2xl focus:outline-none transition-all pr-14 ${
                          isReading ? 
                            'bg-gray-50 focus:bg-white border-0' : 
                            'bg-yellow-50 focus:bg-yellow-100 border-0'
                        }`}
                        autoFocus
                      />
                      {(currentItem?.item.type !== 'radical' && isReading) && (
                        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 group">
                          <Info className="w-5 h-5 text-gray-600 cursor-help" />
                          <div className="absolute right-0 bottom-full mb-2 bg-gray-800 text-white text-xs rounded-lg px-3 py-2 min-w-max opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
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
                            <div className="absolute top-full right-6 border-4 border-transparent border-t-gray-800"></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Audio button for vocabulary - next to input */}
                  {displayItem.type === 'vocabulary' && displayItem.audio_urls?.length > 0 && (
                    <button
                      onClick={playAudio}
                      className="bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-full transition-colors shadow-lg hover:shadow-xl transform hover:scale-105 flex-shrink-0"
                      title="Écouter la prononciation"
                    >
                      <Volume2 className="w-6 h-6" />
                    </button>
                  )}
                </div>
                
                <div className="text-center space-y-4">
                  <button
                    onClick={handleSubmitAnswer}
                    disabled={!((currentItem?.item.type !== 'radical' && isReading) ? getFinalHiraganaValue(userAnswerHiragana).trim() : userAnswer.trim())}
                    className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8 py-4 rounded-full font-bold text-lg hover:shadow-lg transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    Valider
                  </button>
                  <p className="text-gray-500 text-sm">ou appuyez sur Entrée</p>
                </div>
              </div>
            ) : (
              /* Answer Review */
              <div className="space-y-8">
                {/* Feedback */}
                <div className="text-center">
                  <div className="text-8xl mb-4">
                    {lastAnswerCorrect ? '🎉' : '💪'}
                  </div>
                  <div className={`text-2xl font-bold mb-2 ${lastAnswerCorrect ? 'text-green-600' : 'text-red-600'}`}>
                    {lastAnswerCorrect ? 'Correct !' : 'Incorrect'}
                  </div>
                  {!lastAnswerCorrect && (
                    <p className="text-gray-600">Continuez, vous allez y arriver !</p>
                  )}
                </div>

                {/* Item Details */}
                <div className="bg-gray-50 rounded-2xl p-6">
                  <div className="grid grid-cols-1 gap-6">
                    <div className="text-center">
                      <div className="text-6xl mb-4 text-gray-800 font-bold">
                        {displayItem.character || displayItem.characters}
                      </div>
                    </div>
                    
                    {/* Show result based on context */}
                    <div className="space-y-4">
                      {/* For radicals or failed questions: show full result */}
                      {(displayItem.type === 'radical' || lastAnswerCorrect !== true) && (
                        <div className={`border-l-4 p-4 rounded-r-xl ${
                          isReading ? 'bg-gray-900 border-gray-700' : 'bg-yellow-100 border-yellow-500'
                        }`}>
                          <div className="flex justify-between items-center">
                            <div>
                              <p className={`text-sm font-semibold mb-1 ${
                                isReading ? 'text-gray-300' : 'text-yellow-800'
                              }`}>
                                {isReading ? 'Lecture (hiragana)' : 'Signification (romaji)'}
                              </p>
                              <p className={`text-xl font-bold ${
                                isReading ? 'text-white' : 'text-yellow-900'
                              }`}>
                                {isReading ? 
                                  (displayItem.readings ? displayItem.readings.join(', ') :
                                   [...(displayItem.on_readings || []), ...(displayItem.kun_readings || [])].join(', ')) :
                                  (Array.isArray(displayItem.meanings) ? displayItem.meanings.join(', ') : displayItem.meaning)
                                }
                              </p>
                            </div>
                            <div className="text-right">
                              <p className={`text-sm ${
                                isReading ? 'text-gray-400' : 'text-yellow-700'
                              }`}>Votre réponse:</p>
                              <p className={`text-lg font-bold ${
                                isReading ? 'text-gray-200' : 'text-yellow-800'
                              }`}>
                                {(isReading ? userAnswerHiragana : userAnswer) || '—'}
                              </p>
                              <span className={`px-2 py-1 rounded text-xs ${
                                lastAnswerCorrect === true ? 'bg-green-200 text-green-800' : 
                                lastAnswerCorrect === 'partial' ? 'bg-orange-200 text-orange-800' : 
                                'bg-red-200 text-red-800'
                              }`}>
                                {lastAnswerCorrect === true ? 'Correct' : 
                                 lastAnswerCorrect === 'partial' ? 'Partiellement correct' : 
                                 'Incorrect'}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* For successful kanji/vocabulary questions: just show minimal feedback */}
                      {displayItem.type !== 'radical' && lastAnswerCorrect === true && (
                        <div className="text-center">
                          <div className="text-6xl mb-4">✅</div>
                          <div className="text-2xl font-bold text-green-600 mb-2">Correct !</div>
                          <div className="text-gray-600">Appuyez sur Entrée pour continuer</div>
                        </div>
                      )}
                    </div>

                    {/* Audio button for vocabulary - only show when wrong and has audio */}
                    {!lastAnswerCorrect && displayItem.type === 'vocabulary' && displayItem.audio_urls?.length > 0 && (
                      <div className="text-center mb-6">
                        <button
                          onClick={playAudio}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-full transition-colors shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2 mx-auto"
                          title="Écouter la prononciation"
                        >
                          <Volume2 className="w-5 h-5" />
                          <span className="text-sm">Écouter</span>
                        </button>
                      </div>
                    )}

                    {/* Context sentences for vocabulary */}
                    {displayItem.type === 'vocabulary' && displayItem.context_sentences?.length > 0 && (
                      <div>
                        <p className="text-sm text-gray-500 mb-2">Exemple d'usage</p>
                        <div className="bg-blue-50 p-4 rounded-xl">
                          <p className="text-lg text-gray-800 mb-1">{displayItem.context_sentences[0].japanese}</p>
                          <p className="text-sm text-gray-600">{displayItem.context_sentences[0].english}</p>
                        </div>
                      </div>
                    )}

                    {/* Mnemonic - show both meaning and reading if failed */}
                    {displayItem && (displayItem.meaning_mnemonic || displayItem.mnemonic) && (
                      <div>
                        <p className="text-sm text-gray-500 mb-2">Mnémotechnique{!lastAnswerCorrect ? ' (à retenir!)' : ''}</p>
                        <div className={`p-4 rounded-xl ${!lastAnswerCorrect ? 'bg-red-50 border border-red-200' : 'bg-yellow-50'}`}>
                          <div className="text-sm text-gray-700">
                            <FormattedText itemType={displayItem.type}>
                              {displayItem.meaning_mnemonic || displayItem.mnemonic}
                            </FormattedText>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Reading mnemonic for failed kanji/vocabulary */}
                    {!lastAnswerCorrect && displayItem && (displayItem.type === 'kanji' || displayItem.type === 'vocabulary') && 
                     displayItem.reading_mnemonic && (
                      <div>
                        <p className="text-sm text-gray-500 mb-2">Mnémotechnique de lecture</p>
                        <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl">
                          <div className="text-sm text-gray-700">
                            <FormattedText itemType={displayItem.type}>
                              {displayItem.reading_mnemonic}
                            </FormattedText>
                          </div>
                        </div>
                      </div>
                    )}

                  </div>
                </div>

                {/* Next Button */}
                <div className="text-center space-y-2">
                  <button
                    onClick={handleNext}
                    className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-8 py-4 rounded-full font-bold text-lg hover:shadow-lg transform hover:scale-105 transition-all flex items-center mx-auto"
                  >
                    {currentIndex < fixedReviewItems.length - 1 ? (
                      <>Suivant <ChevronRight className="ml-2 w-5 h-5" /></>
                    ) : (
                      <>Terminer la session <CheckCircle className="ml-2 w-5 h-5" /></>
                    )}
                  </button>
                  <p className="text-gray-500 text-sm">ou appuyez sur Entrée</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="text-center mt-6">
          <button
            onClick={onBack}
            className="text-white/60 hover:text-white text-sm flex items-center mx-auto transition-colors"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Abandonner la session
          </button>
        </div>

      </div>
    </div>
  );
};

export default ReviewSession;