import React, { useState, useEffect, useCallback } from 'react';
import { Home, ChevronRight, Volume2, BookOpen, CheckCircle, ArrowRight, Users, Info } from 'lucide-react';
import { useBatchLearning } from '../hooks/useBatchLearning';
import { FormattedText } from '../utils/textFormatting';
import { useHiraganaInput, getFinalHiraganaValue } from '../utils/romajiConverter';

const LessonSession = ({ srs, wanoKuniData, onComplete, onBack }) => {
  const [allLessons, setAllLessons] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionPhase, setSessionPhase] = useState('teaching'); // 'teaching', 'batch-quiz'
  // Input states for double questions in quiz phase
  const [userAnswer, setUserAnswer] = useState('');
  const [userAnswerHiragana, handleUserAnswerHiraganaChange, setUserAnswerHiragana] = useHiraganaInput('');
  const [currentQuestionType, setCurrentQuestionType] = useState('meaning'); // 'meaning' or 'reading'
  const [showResult, setShowResult] = useState(false);
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState(null);
  const [currentQuestionItem, setCurrentQuestionItem] = useState(null);
  const [answerHint, setAnswerHint] = useState(null);
  const [, setQuizResults] = useState([]);
  const [quizBatchSize, setQuizBatchSize] = useState(null); // Taille fixe du batch pendant le quiz
  const [quizItems, setQuizItems] = useState(null); // Éléments fixes du quiz
  const [attemptCount, setAttemptCount] = useState(0);
  const [hasUsedSecondChance, setHasUsedSecondChance] = useState(false);

  // Utiliser le système de batch learning
  const batchLearning = useBatchLearning(allLessons, 5);

  // Variables dérivées - définies AVANT les useCallback
  const currentBatch = batchLearning.currentBatch;
  const currentItem = sessionPhase === 'batch-quiz' && quizItems ? quizItems[currentIndex] : currentBatch[currentIndex];
  const progress = batchLearning.getProgress();

  // Initialize lesson session
  useEffect(() => {
    const session = srs.startLessonSession();
    if (session.length === 0) {
      onComplete();
      return;
    }
    setAllLessons(session);
  }, [srs, onComplete]);

  // Fonctions définies APRÈS les variables
  const handleSubmitAnswer = useCallback(() => {
    if (!currentItem) return;
    
    // Vérifier la réponse selon le type de question
    const questionType = currentItem.questionType || 'meaning';
    const hasAnswer = questionType === 'reading' 
      ? getFinalHiraganaValue(userAnswerHiragana).trim() 
      : userAnswer.trim();
    
    if (!hasAnswer) return;

    // Capturer l'élément actuel IMMÉDIATEMENT
    const itemBeingTested = currentItem;
    const answerToCheck = questionType === 'reading' ? getFinalHiraganaValue(userAnswerHiragana) : userAnswer.trim();
    
    console.log('🎯 SUBMIT - Index:', currentIndex, 'Element testé:', itemBeingTested.item.character || itemBeingTested.item.characters, 'Type:', questionType, 'Réponse:', answerToCheck);
    setCurrentQuestionItem(itemBeingTested);
    const answerResult = srs.checkAnswer(itemBeingTested, questionType, answerToCheck);
    const isCorrect = answerResult.correct || answerResult === true; // Handle both new and old format
    const hint = answerResult.hint || null;
    
    setAttemptCount(prev => prev + 1);
    setLastAnswerCorrect(isCorrect);
    setAnswerHint(hint);
    
    // If we have a hint, don't mark as incorrect in SRS, just show hint
    if (hint) {
      if (currentItem?.questionType === 'reading') {
        setUserAnswerHiragana(''); // Clear the hiragana input
      } else {
        setUserAnswer(''); // Clear the regular input
      }
      return; // Don't proceed to show result
    }
    
    // Handle incorrect answer on first attempt in quiz - give second chance
    if (sessionPhase === 'batch-quiz' && !isCorrect && attemptCount === 0) {
      setHasUsedSecondChance(true);
      if (currentItem?.questionType === 'reading') {
        setUserAnswerHiragana(''); // Clear hiragana input for retry
      } else {
        setUserAnswer(''); // Clear regular input for retry
      }
      setAnswerHint('retry'); // Set special hint for retry message
      return; // Don't show result, let them try again
    }
    
    // Determine final result for SRS progression
    let finalCorrect;
    if (isCorrect && attemptCount === 0) {
      // Correct on first try
      finalCorrect = true;
    } else if (isCorrect && attemptCount === 1) {
      // Correct on second try - treat as partially correct
      finalCorrect = 'partial';
    } else {
      // Wrong after both attempts
      finalCorrect = false;
    }
    
    // Update SRS with appropriate result
    if (finalCorrect === 'partial') {
      // For partial correct, don't advance SRS stage (just reset incorrect streak)
      srs.submitAnswer(itemBeingTested.key, false, { isPartialCorrect: true });
    } else {
      srs.submitAnswer(itemBeingTested.key, finalCorrect);
    }
    
    setShowResult(true);
  }, [currentItem, userAnswer, userAnswerHiragana, srs, currentIndex, sessionPhase, attemptCount]);

  const handleNextFromTeaching = useCallback(() => {
    if (currentIndex < currentBatch.length - 1) {
      setCurrentIndex(prev => prev + 1);
      console.log('📚 TEACHING - Passage à l\'élément suivant, index:', currentIndex + 1);
    } else {
      console.log('🎯 TEACHING FINI - Passage en mode QUIZ, reset index à 0');
      console.log('🎯 BATCH ACTUEL:', currentBatch.map(item => item.item.character || item.item.characters));
      setQuizBatchSize(currentBatch.length); // Capturer la taille fixe du batch
      setQuizItems([...currentBatch]); // Capturer les éléments fixes du quiz
      setSessionPhase('batch-quiz');
      setCurrentIndex(0);
      setQuizResults([]);
    }
    setUserAnswer('');
    setUserAnswerHiragana('');
    setShowResult(false);
    setAnswerHint(null);
  }, [currentIndex, currentBatch.length, setQuizResults, currentBatch]);

  const handleBatchComplete = useCallback(() => {
    // Utiliser les éléments du quiz (fixes) pour marquer comme complété
    const itemsToComplete = quizItems || currentBatch;
    console.log('🏁 BATCH COMPLETE - Completing items:', itemsToComplete.map(item => item.item.character || item.item.characters));
    itemsToComplete.forEach(item => srs.completeLesson(item.key));
    
    const isLastBatch = progress.currentBatchNumber >= progress.totalBatches;
    console.log('🏁 BATCH COMPLETE - isLastBatch:', isLastBatch, 'Current batch number:', progress.currentBatchNumber, 'Total batches:', progress.totalBatches);
    
    if (isLastBatch) {
      console.log('🏁 All lessons completed, calling onComplete');
      onComplete();
    } else {
      console.log('🏁 Moving to next batch');
      batchLearning.completeBatch();
      setSessionPhase('teaching');
      setCurrentIndex(0);
      setQuizResults([]);
      setUserAnswer('');
      setUserAnswerHiragana('');
      setShowResult(false);
      setLastAnswerCorrect(null);
      setAnswerHint(null);
      setQuizBatchSize(null); // Réinitialiser pour le prochain batch
      setQuizItems(null); // Réinitialiser les éléments du quiz
      setAttemptCount(0);
      setHasUsedSecondChance(false);
    }
  }, [quizItems, currentBatch, srs, progress.currentBatchNumber, progress.totalBatches, batchLearning, onComplete, setQuizResults]);

  const handleNextInQuiz = useCallback(() => {
    const fixedBatchSize = quizBatchSize || currentBatch.length;
    console.log('📊 QUIZ - handleNextInQuiz - Index actuel:', currentIndex, 'Fixed batch size:', fixedBatchSize, 'Dynamic batch size:', currentBatch.length);
    
    const result = { item: currentQuestionItem, correct: lastAnswerCorrect };
    setQuizResults(prev => [...prev, result]);
    
    if (currentIndex < fixedBatchSize - 1) {
      const nextIndex = currentIndex + 1;
      console.log('📊 QUIZ - Passage à l\'index:', nextIndex);
      setCurrentIndex(nextIndex);
      setUserAnswer('');
      setUserAnswerHiragana('');
      setShowResult(false);
      setLastAnswerCorrect(null);
      setAnswerHint(null);
      setCurrentQuestionItem(null); // Réinitialiser pour la question suivante
      // Reset attempt tracking for next question
      setAttemptCount(0);
      setHasUsedSecondChance(false);
    } else {
      console.log('📊 QUIZ - Fin du batch, completion');
      handleBatchComplete();
    }
  }, [currentQuestionItem, lastAnswerCorrect, currentIndex, quizBatchSize, currentBatch.length, setQuizResults, handleBatchComplete]);


  // Support global de la touche Entrée
  const handleGlobalKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      
      if (sessionPhase === 'teaching') {
        handleNextFromTeaching();
      } else if (sessionPhase === 'batch-quiz') {
        if (!showResult) {
          const hasAnswer = currentItem?.questionType === 'reading' 
            ? getFinalHiraganaValue(userAnswerHiragana).trim() 
            : userAnswer.trim();
          if (hasAnswer) {
            handleSubmitAnswer();
          }
        } else {
          handleNextInQuiz();
        }
      }
    }
  }, [sessionPhase, showResult, userAnswer, userAnswerHiragana, currentItem, handleNextFromTeaching, handleSubmitAnswer, handleNextInQuiz]);

  // Event listener pour la touche Entrée
  useEffect(() => {
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [handleGlobalKeyDown]);

  const playAudio = useCallback(() => {
    if (currentItem?.item.audio_urls?.length > 0) {
      const audio = new Audio(currentItem.item.audio_urls[0].url);
      audio.play().catch(() => console.log('Audio playback failed'));
    }
  }, [currentItem]);

  const playQuestionAudio = useCallback(() => {
    if (currentQuestionItem?.item.audio_urls?.length > 0) {
      const audio = new Audio(currentQuestionItem.item.audio_urls[0].url);
      audio.play().catch(() => console.log('Audio playback failed'));
    }
  }, [currentQuestionItem]);

  if (!allLessons || !currentItem) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-blue-900 to-purple-800 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-xl">Préparation des leçons...</p>
        </div>
      </div>
    );
  }

  const { item } = currentItem;
  
  // Use the appropriate item for display based on phase
  const displayItem = (sessionPhase === 'batch-quiz' && showResult) ? (currentQuestionItem?.item || item) : item;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-blue-900 to-purple-800">
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
                <h1 className="text-white text-xl font-bold">Session de leçons</h1>
                <p className="text-white/70">
                  Batch {progress.currentBatchNumber}/{progress.totalBatches} • 
                  {sessionPhase === 'teaching' ? 'Apprentissage' : 'Quiz'} ({currentIndex + 1}/{currentBatch.length})
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="text-center">
                <div className="text-green-400 font-bold text-lg">{progress.completedItems}</div>
                <div className="text-white/70 text-xs">Complétées</div>
              </div>
              <div className="text-center">
                <div className="text-blue-400 font-bold text-lg">{progress.totalItems - progress.completedItems}</div>
                <div className="text-white/70 text-xs">Restantes</div>
              </div>
              <div className="text-center">
                <div className="text-purple-400 font-bold text-lg">{progress.currentBatchSize}</div>
                <div className="text-white/70 text-xs">Batch actuel</div>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="bg-white/20 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-green-400 to-blue-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${(progress.completedItems / progress.totalItems) * 100}%` }}
            />
          </div>
        </div>

        {/* Lesson Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-4xl mx-auto">
          {/* Item Type Header */}
          <div className={`p-3 text-center ${
            displayItem.type === 'radical' ? 'bg-blue-500' :
            displayItem.type === 'kanji' ? 'bg-purple-500' : 'bg-green-500'
          }`}>
            <span className="text-white font-bold text-sm uppercase tracking-wide">
              {sessionPhase === 'teaching' ? `Leçon : ${displayItem.type}` : `Quiz : ${displayItem.type}`} • Batch {progress.currentBatchNumber}
            </span>
          </div>

          <div className="p-8">
            {sessionPhase === 'teaching' ? (
              /* Teaching Mode */
              <div className="space-y-8">
                {/* Character Display */}
                <div className="text-center mb-8">
                  <div className="text-8xl md:text-9xl mb-6 text-gray-800 font-bold hover:scale-110 transition-transform cursor-pointer select-none">
                    {item.character || item.characters}
                  </div>
                  
                  <div className="text-3xl text-purple-600 font-bold mb-4">
                    {Array.isArray(item.meanings) ? item.meanings[0] : item.meaning}
                  </div>

                  {(item.readings || item.on_readings || item.kun_readings) && (
                    <div className="text-4xl text-gray-600 mb-4 font-bold">
                      Lecture: {item.readings ? item.readings.join(', ') :
                               [...(item.on_readings || []), ...(item.kun_readings || [])].join(', ')}
                    </div>
                  )}
                </div>

                {/* Audio button for vocabulary */}
                {item.type === 'vocabulary' && item.audio_urls?.length > 0 && (
                  <div className="text-center mb-6">
                    <button
                      onClick={playAudio}
                      className="bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-full transition-colors shadow-lg hover:shadow-xl transform hover:scale-105"
                      title="Écouter la prononciation"
                    >
                      <Volume2 className="w-6 h-6" />
                    </button>
                  </div>
                )}

                {/* Mnemonic */}
                <div className="bg-yellow-50 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
                    <BookOpen className="w-5 h-5 mr-2" />
                    Mnémotechnique
                  </h3>
                  <div className="text-gray-700 leading-relaxed">
                    <FormattedText itemType={item.type}>
                      {item.meaning_mnemonic || item.mnemonic || "Mémorisez ce caractère et sa signification."}
                    </FormattedText>
                  </div>
                </div>

                {/* Reading Mnemonic for kanji/vocabulary */}
                {(item.type === 'kanji' || item.type === 'vocabulary') && (item.reading_mnemonic || item.mnemonic) && (
                  <div className="bg-blue-50 rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-3">
                      Mnémotechnique de lecture
                    </h3>
                    <div className="text-gray-700 leading-relaxed">
                      <FormattedText itemType={item.type}>
                        {item.reading_mnemonic || item.mnemonic}
                      </FormattedText>
                    </div>
                  </div>
                )}

                {/* Context sentences for vocabulary */}
                {item.type === 'vocabulary' && item.context_sentences?.length > 0 && (
                  <div className="bg-green-50 rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-3">
                      Exemple d'usage
                    </h3>
                    <div className="space-y-2">
                      <p className="text-lg text-gray-800">{item.context_sentences[0].japanese}</p>
                      <p className="text-sm text-gray-600">{item.context_sentences[0].english}</p>
                    </div>
                  </div>
                )}

                {/* Next Button */}
                <div className="text-center">
                  <button
                    onClick={handleNextFromTeaching}
                    className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-8 py-4 rounded-full font-bold text-lg hover:shadow-lg transform hover:scale-105 transition-all flex items-center mx-auto"
                  >
                    {currentIndex < currentBatch.length - 1 ? (
                      <>Suivant <ArrowRight className="ml-2 w-5 h-5" /></>
                    ) : (
                      <>Quiz du batch <Users className="ml-2 w-5 h-5" /></>
                    )}
                  </button>
                  <p className="text-white/60 text-sm mt-2">ou appuyez sur Entrée</p>
                </div>
              </div>
            ) : (
              /* Quiz Mode */
              <div className="space-y-8">
                {!showResult && (
                  /* Question phase - show character and question type */
                  <div className="text-center mb-8">
                    <div className="text-8xl md:text-9xl mb-6 text-gray-800 font-bold hover:scale-110 transition-transform cursor-pointer select-none">
                      {currentItem?.item.character || currentItem?.item.characters || "?"}
                    </div>
                    
                    {/* Question type indicator */}
                    <div className={`inline-block px-6 py-2 rounded-full text-white font-bold mb-4 ${
                      currentItem?.questionType === 'reading' ? 'bg-purple-500' : 'bg-blue-500'
                    }`}>
                      {currentItem?.questionType === 'reading' ? 'Lecture' : 'Signification'}
                    </div>

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
                )}

                {!showResult ? (
                  /* Answer Input */
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="relative flex-1">
                        {currentItem?.questionType === 'reading' ? (
                          <input
                            type="text"
                            value={userAnswerHiragana}
                            onChange={handleUserAnswerHiraganaChange}
                            placeholder="Votre réponse en hiragana (tapez en romaji...)"
                            className="w-full text-center text-2xl p-6 border-2 border-gray-300 rounded-2xl focus:border-purple-500 focus:outline-none focus:ring-4 focus:ring-purple-200 transition-all pr-14"
                            autoFocus
                          />
                        ) : (
                          <input
                            type="text"
                            value={userAnswer}
                            onChange={(e) => setUserAnswer(e.target.value)}
                            placeholder="Votre réponse (ex: tree, person, water...)"
                            className="w-full text-center text-2xl p-6 border-2 border-gray-300 rounded-2xl focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-200 transition-all pr-14"
                            autoFocus
                          />
                        )}
                        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 group">
                          <Info className="w-5 h-5 text-gray-400 cursor-help" />
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
                      </div>
                      
                      {/* Audio button for vocabulary - next to input */}
                      {currentItem?.item.type === 'vocabulary' && currentItem?.item.audio_urls?.length > 0 && (
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
                        disabled={currentItem?.questionType === 'reading' ? !getFinalHiraganaValue(userAnswerHiragana).trim() : !userAnswer.trim()}
                        className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-8 py-4 rounded-full font-bold text-lg hover:shadow-lg transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                      >
                        Vérifier
                      </button>
                      <p className="text-gray-500 text-sm">ou appuyez sur Entrée</p>
                    </div>
                  </div>
                ) : (
                  /* Quiz Result */
                  <div className="space-y-8">
                    {/* Feedback */}
                    <div className="text-center">
                      <div className="text-8xl mb-4">
                        {lastAnswerCorrect ? '🎉' : '📚'}
                      </div>
                      <div className={`text-2xl font-bold mb-2 ${lastAnswerCorrect ? 'text-green-600' : 'text-orange-600'}`}>
                        {lastAnswerCorrect ? 'Parfait !' : 'Presque !'}
                      </div>
                      <p className="text-gray-600">
                        {lastAnswerCorrect 
                          ? 'Vous avez bien mémorisé cette leçon !' 
                          : 'Pas de souci, c\'est en pratiquant qu\'on apprend !'}
                      </p>
                    </div>

                    {/* Answer Details */}
                    <div className="bg-gray-50 rounded-2xl p-6">
                      <div className="text-center mb-4">
                        <div className="text-6xl mb-4 text-gray-800 font-bold">
                          {currentQuestionItem?.item.character || currentQuestionItem?.item.characters}
                        </div>
                        <div className="text-2xl font-bold text-purple-600 mb-4">
                          {currentQuestionItem ? 
                            (Array.isArray(currentQuestionItem.item.meanings) ? currentQuestionItem.item.meanings.join(', ') : currentQuestionItem.item.meaning) :
                            'Erreur : pas de données'
                          }
                        </div>
                        
                        {/* Show readings if available */}
                        {currentQuestionItem && (currentQuestionItem.item.readings || currentQuestionItem.item.on_readings || currentQuestionItem.item.kun_readings) && (
                          <div className="text-xl text-gray-700 font-bold mb-4">
                            Lecture: {currentQuestionItem.item.readings ? currentQuestionItem.item.readings.join(', ') :
                                     [...(currentQuestionItem.item.on_readings || []), ...(currentQuestionItem.item.kun_readings || [])].join(', ')}
                          </div>
                        )}
                        
                        {/* Audio button for vocabulary in results */}
                        {currentQuestionItem?.item.type === 'vocabulary' && currentQuestionItem?.item.audio_urls?.length > 0 && (
                          <div className="mt-4">
                            <button
                              onClick={playQuestionAudio}
                              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-full transition-colors shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2 mx-auto"
                              title="Écouter la prononciation"
                            >
                              <Volume2 className="w-5 h-5" />
                              <span className="text-sm">Écouter</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Enhanced details for failed answers */}
                      {!lastAnswerCorrect && currentQuestionItem && (
                        <div className="space-y-4 border-t pt-4">
                          {/* Mnemonic */}
                          {(currentQuestionItem.item.meaning_mnemonic || currentQuestionItem.item.mnemonic) && (
                            <div>
                              <p className="text-sm text-gray-500 mb-2 font-semibold">💡 Mnémotechnique (à retenir!)</p>
                              <div className="bg-red-50 border border-red-200 p-4 rounded-xl">
                                <div className="text-sm text-gray-700">
                                  <FormattedText itemType={currentQuestionItem.item.type}>
                                    {currentQuestionItem.item.meaning_mnemonic || currentQuestionItem.item.mnemonic}
                                  </FormattedText>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Reading mnemonic for kanji/vocabulary */}
                          {(currentQuestionItem.item.type === 'kanji' || currentQuestionItem.item.type === 'vocabulary') && 
                           (currentQuestionItem.item.reading_mnemonic) && (
                            <div>
                              <p className="text-sm text-gray-500 mb-2 font-semibold">📚 Mnémotechnique de lecture</p>
                              <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl">
                                <div className="text-sm text-gray-700">
                                  <FormattedText itemType={currentQuestionItem.item.type}>
                                    {currentQuestionItem.item.reading_mnemonic}
                                  </FormattedText>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Context sentences for vocabulary */}
                          {currentQuestionItem.item.type === 'vocabulary' && currentQuestionItem.item.context_sentences?.length > 0 && (
                            <div>
                              <p className="text-sm text-gray-500 mb-2 font-semibold">📝 Exemple d'usage</p>
                              <div className="bg-green-50 border border-green-200 p-4 rounded-xl">
                                <p className="text-lg text-gray-800 mb-1">{currentQuestionItem.item.context_sentences[0].japanese}</p>
                                <p className="text-sm text-gray-600">{currentQuestionItem.item.context_sentences[0].english}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="text-center space-y-4">
                      <button
                        onClick={handleNextInQuiz}
                        className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-8 py-4 rounded-full font-bold text-lg hover:shadow-lg transform hover:scale-105 transition-all flex items-center mx-auto"
                      >
                        {currentIndex < currentBatch.length - 1 ? (
                          <>Question suivante <ChevronRight className="ml-2 w-5 h-5" /></>
                        ) : batchLearning.isLastBatch ? (
                          <>Terminer les leçons <CheckCircle className="ml-2 w-5 h-5" /></>
                        ) : (
                          <>Batch suivant <Users className="ml-2 w-5 h-5" /></>
                        )}
                      </button>
                      <p className="text-gray-500 text-sm">ou appuyez sur Entrée</p>
                    </div>
                  </div>
                )}
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
            <Home className="w-4 h-4 mr-2" />
            Retour au tableau de bord
          </button>
        </div>

      </div>
    </div>
  );
};

export default LessonSession;