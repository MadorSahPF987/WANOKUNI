import { useState, useCallback, useEffect } from 'react';
import { calculateNextReview, shuffleArray } from '../utils/srs';
import { saveToStorage, loadFromStorage } from '../utils/storage';
import { 
  loadProgressFromFirestore, 
  saveProgressToFirestore, 
  migrateToFirestore,
  subscribeToProgressUpdates,
  syncData 
} from '../utils/firestoreSync';

export const useSRS = (wanoKuniData, userId = null) => {
  const [userProgress, setUserProgress] = useState({});
  const [currentLevel, setCurrentLevel] = useState(1);
  const [isLoadingFromCloud, setIsLoadingFromCloud] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);

  // Load progress - priorité Firestore puis localStorage
  useEffect(() => {
    const loadUserProgress = async () => {
      if (!userId) {
        // Mode anonyme - utiliser localStorage uniquement
        const savedProgress = loadFromStorage('wanokuni_progress');
        const savedLevel = loadFromStorage('wanokuni_level');
        
        if (savedProgress) setUserProgress(savedProgress);
        if (savedLevel) setCurrentLevel(savedLevel);
        return;
      }

      setIsLoadingFromCloud(true);
      
      try {
        // 1. Essayer de charger depuis Firestore
        const cloudData = await loadProgressFromFirestore(userId);
        
        if (cloudData && cloudData.progress && Object.keys(cloudData.progress).length > 0) {
          // Données cloud trouvées
          setUserProgress(cloudData.progress);
          setCurrentLevel(cloudData.currentLevel || 1);
          setLastSyncTime(cloudData.lastUpdated);
          console.log('✅ Données chargées depuis Firestore');
          
          // Sauvegarder localement pour cache
          saveToStorage('wanokuni_progress', cloudData.progress, userId);
          saveToStorage('wanokuni_level', cloudData.currentLevel || 1, userId);
        } else {
          // Pas de données cloud - charger localStorage et migrer
          const savedProgress = loadFromStorage('wanokuni_progress', userId);
          const savedLevel = loadFromStorage('wanokuni_level', userId);
          
          if (savedProgress && Object.keys(savedProgress).length > 0) {
            setUserProgress(savedProgress);
            setCurrentLevel(savedLevel || 1);
            
            // Migrer vers Firestore en arrière-plan
            migrateToFirestore(userId);
          }
        }
      } catch (error) {
        console.error('❌ Erreur chargement cloud, fallback localStorage:', error);
        // Fallback vers localStorage
        const savedProgress = loadFromStorage('wanokuni_progress', userId);
        const savedLevel = loadFromStorage('wanokuni_level', userId);
        
        if (savedProgress) setUserProgress(savedProgress);
        if (savedLevel) setCurrentLevel(savedLevel || 1);
      } finally {
        setIsLoadingFromCloud(false);
      }
    };

    loadUserProgress();
  }, [userId]);

  // Synchronisation automatique vers Firestore
  useEffect(() => {
    const performSync = async () => {
      if (!userId || Object.keys(userProgress).length === 0) return;
      
      try {
        await syncData(userId, { progress: userProgress, currentLevel });
        setLastSyncTime(new Date());
      } catch (error) {
        console.error('❌ Erreur synchronisation:', error);
      }
    };

    // Débounce pour éviter trop d'appels
    const timeoutId = setTimeout(performSync, 2000);
    return () => clearTimeout(timeoutId);
  }, [userProgress, currentLevel, userId]);

  // Écoute en temps réel des changements (optionnel - pour synchronisation multi-appareils)
  useEffect(() => {
    if (!userId) return;

    console.log('🔄 Activation de la synchronisation en temps réel');
    const unsubscribe = subscribeToProgressUpdates(userId, (cloudData) => {
      // Vérifier si les données cloud sont plus récentes
      if (cloudData.lastUpdated && lastSyncTime) {
        const cloudTime = cloudData.lastUpdated.toDate ? cloudData.lastUpdated.toDate() : new Date(cloudData.lastUpdated);
        const localTime = new Date(lastSyncTime);
        
        if (cloudTime > localTime) {
          console.log('📥 Mise à jour depuis un autre appareil détectée');
          setUserProgress(cloudData.progress);
          setCurrentLevel(cloudData.currentLevel || 1);
          setLastSyncTime(cloudTime);
          
          // Mettre à jour le cache local
          saveToStorage('wanokuni_progress', cloudData.progress, userId);
          saveToStorage('wanokuni_level', cloudData.currentLevel || 1, userId);
        }
      }
    });

    return unsubscribe;
  }, [userId, lastSyncTime]);

  // Initialize user progress with level 1 items in lesson state
  useEffect(() => {
    if (!wanoKuniData || Object.keys(userProgress).length > 0) return;

    const initialProgress = {};
    
    // Initialize level 1 radicals as lesson items (not reviewable yet)
    const level1Radicals = wanoKuniData.radicals.filter(r => r.level === 1);
    level1Radicals.forEach(radical => {
      const key = `radical_${radical.id}`;
      initialProgress[key] = {
        item_id: radical.id,
        item_type: 'radical',
        question_type: 'meaning',
        srs_stage: -1, // -1 = lesson state, not yet reviewed
        next_review_at: null, // No review scheduled until lesson completed
        incorrect_count: 0,
        correct_streak: 0,
        lesson_completed: false
      };
    });

    setUserProgress(initialProgress);
  }, [wanoKuniData, userProgress]);

  // Get review statistics
  const getStats = useCallback(() => {
    const stats = { apprentice: 0, guru: 0, master: 0, enlightened: 0, burned: 0, total: 0 };

    Object.values(userProgress).forEach(progress => {
      const stage = progress.srs_stage;
      stats.total++;
      
      if (stage >= 0 && stage <= 3) stats.apprentice++;
      else if (stage >= 4 && stage <= 5) stats.guru++;
      else if (stage === 6) stats.master++;
      else if (stage === 7) stats.enlightened++;
      else if (stage === 8) stats.burned++;
    });

    return stats;
  }, [userProgress]);

  // Get current level function (needed by getDetailedStats)
  const getCurrentLevel = useCallback(() => currentLevel, [currentLevel]);

  // Get detailed stats with breakdown by type and level
  const getDetailedStats = useCallback(() => {
    if (!wanoKuniData) return null;

    const stats = {
      byStage: {
        lessons: { radical: 0, kanji: 0, vocabulary: 0, total: 0 },
        apprentice: { 
          total: 0,
          stage1: { radical: 0, kanji: 0, vocabulary: 0, total: 0 },
          stage2: { radical: 0, kanji: 0, vocabulary: 0, total: 0 },
          stage3: { radical: 0, kanji: 0, vocabulary: 0, total: 0 },
          stage4: { radical: 0, kanji: 0, vocabulary: 0, total: 0 }
        },
        guru: { 
          total: 0,
          stage1: { radical: 0, kanji: 0, vocabulary: 0, total: 0 },
          stage2: { radical: 0, kanji: 0, vocabulary: 0, total: 0 }
        },
        master: { radical: 0, kanji: 0, vocabulary: 0, total: 0 },
        enlightened: { radical: 0, kanji: 0, vocabulary: 0, total: 0 },
        burned: { radical: 0, kanji: 0, vocabulary: 0, total: 0 }
      },
      currentLevel: {
        radical: { lessons: 0, apprentice: 0, guru: 0, master: 0, enlightened: 0, burned: 0 },
        kanji: { lessons: 0, apprentice: 0, guru: 0, master: 0, enlightened: 0, burned: 0 },
        vocabulary: { lessons: 0, apprentice: 0, guru: 0, master: 0, enlightened: 0, burned: 0 }
      }
    };

    const currentLevel = getCurrentLevel();

    Object.entries(userProgress).forEach(([key, progress]) => {
      const [type, id] = key.split('_');
      const stage = progress.srs_stage;
      
      // Find item to get level
      let item = null;
      if (type === 'radical') {
        item = wanoKuniData.radicals.find(r => r.id === parseInt(id));
      } else if (type === 'kanji') {
        item = wanoKuniData.kanji.find(k => k.id === parseInt(id));
      } else if (type === 'vocabulary') {
        item = wanoKuniData.vocabulary.find(v => v.id === parseInt(id));
      }

      if (!item) return;

      // Current level stats
      if (item.level === currentLevel) {
        if (stage === -1) {
          stats.currentLevel[type].lessons++;
        } else if (stage >= 0 && stage <= 3) {
          stats.currentLevel[type].apprentice++;
        } else if (stage >= 4 && stage <= 5) {
          stats.currentLevel[type].guru++;
        } else if (stage === 6) {
          stats.currentLevel[type].master++;
        } else if (stage === 7) {
          stats.currentLevel[type].enlightened++;
        } else if (stage === 8) {
          stats.currentLevel[type].burned++;
        }
      }

      // By stage stats
      if (stage === -1) {
        stats.byStage.lessons[type]++;
        stats.byStage.lessons.total++;
      } else if (stage === 0) {
        stats.byStage.apprentice.stage1[type]++;
        stats.byStage.apprentice.stage1.total++;
        stats.byStage.apprentice.total++;
      } else if (stage === 1) {
        stats.byStage.apprentice.stage2[type]++;
        stats.byStage.apprentice.stage2.total++;
        stats.byStage.apprentice.total++;
      } else if (stage === 2) {
        stats.byStage.apprentice.stage3[type]++;
        stats.byStage.apprentice.stage3.total++;
        stats.byStage.apprentice.total++;
      } else if (stage === 3) {
        stats.byStage.apprentice.stage4[type]++;
        stats.byStage.apprentice.stage4.total++;
        stats.byStage.apprentice.total++;
      } else if (stage === 4) {
        stats.byStage.guru.stage1[type]++;
        stats.byStage.guru.stage1.total++;
        stats.byStage.guru.total++;
      } else if (stage === 5) {
        stats.byStage.guru.stage2[type]++;
        stats.byStage.guru.stage2.total++;
        stats.byStage.guru.total++;
      } else if (stage === 6) {
        stats.byStage.master[type]++;
        stats.byStage.master.total++;
      } else if (stage === 7) {
        stats.byStage.enlightened[type]++;
        stats.byStage.enlightened.total++;
      } else if (stage === 8) {
        stats.byStage.burned[type]++;
        stats.byStage.burned.total++;
      }
    });

    return stats;
  }, [userProgress, wanoKuniData, getCurrentLevel]);

  // Get count of items ready for review
  const getReviewCount = useCallback(() => {
    const now = Date.now();
    return Object.values(userProgress).filter(progress => 
      progress.next_review_at && progress.next_review_at <= now && progress.srs_stage >= 0 && progress.srs_stage < 8
    ).length;
  }, [userProgress]);

  // Get count of items ready for lessons
  const getLessonCount = useCallback(() => {
    return Object.values(userProgress).filter(progress => 
      progress.srs_stage === -1 && !progress.lesson_completed
    ).length;
  }, [userProgress]);

  // Get next review time
  const getNextReviewTime = useCallback(() => {
    const now = Date.now();
    const futureReviews = Object.values(userProgress)
      .filter(progress => progress.next_review_at && progress.next_review_at > now)
      .map(progress => progress.next_review_at)
      .sort((a, b) => a - b);

    if (futureReviews.length === 0) return 'Aucune';

    const nextReview = futureReviews[0];
    const diffMinutes = Math.ceil((nextReview - now) / (1000 * 60));
    
    if (diffMinutes < 60) return `${diffMinutes}min`;
    if (diffMinutes < 1440) return `${Math.ceil(diffMinutes / 60)}h`;
    return `${Math.ceil(diffMinutes / 1440)}j`;
  }, [userProgress]);

  // Start a review session
  const startReviewSession = useCallback(() => {
    const now = Date.now();
    const reviewItems = [];

    // Group items by base key (without question type)
    const itemGroups = {};
    
    Object.entries(userProgress).forEach(([key, progress]) => {
      if (progress.next_review_at && progress.next_review_at <= now && progress.srs_stage >= 0 && progress.srs_stage < 8) {
        const [type, id, questionType] = key.split('_');
        const baseKey = `${type}_${id}`;
        
        if (!itemGroups[baseKey]) {
          itemGroups[baseKey] = {
            type,
            id: parseInt(id),
            questions: {}
          };
        }
        
        itemGroups[baseKey].questions[questionType || 'meaning'] = {
          key,
          progress
        };
      }
    });

    // Create review items - separate each question to randomize order
    Object.entries(itemGroups).forEach(([baseKey, group]) => {
      let item;
      
      if (group.type === 'radical') {
        item = wanoKuniData?.radicals.find(r => r.id === group.id);
      } else if (group.type === 'kanji') {
        item = wanoKuniData?.kanji.find(k => k.id === group.id);
      } else if (group.type === 'vocabulary') {
        item = wanoKuniData?.vocabulary.find(v => v.id === group.id);
      }

      if (item) {
        if (item.type === 'radical') {
          // Radicals only have meaning questions
          reviewItems.push({
            baseKey,
            item,
            questions: group.questions,
            questionType: 'meaning',
            needsBothQuestions: false
          });
        } else {
          // For kanji/vocabulary, create separate review items for each question type
          if (group.questions.meaning) {
            reviewItems.push({
              baseKey,
              item,
              questions: group.questions,
              questionType: 'meaning',
              needsBothQuestions: true
            });
          }
          if (group.questions.reading) {
            reviewItems.push({
              baseKey,
              item,
              questions: group.questions,
              questionType: 'reading', 
              needsBothQuestions: true
            });
          }
        }
      }
    });

    return shuffleArray(reviewItems);
  }, [userProgress, wanoKuniData]);

  // Start a lesson session
  const startLessonSession = useCallback(() => {
    const lessonItems = [];
    const itemGroups = {};

    // Group items by base key (without question type) - similar to reviews
    Object.entries(userProgress).forEach(([key, progress]) => {
      if (progress.srs_stage === -1 && !progress.lesson_completed) {
        const [type, id, questionType] = key.split('_');
        const baseKey = `${type}_${id}`;
        
        if (!itemGroups[baseKey]) {
          itemGroups[baseKey] = {
            type,
            id: parseInt(id),
            questions: {}
          };
        }
        
        itemGroups[baseKey].questions[questionType || 'meaning'] = {
          key,
          progress
        };
      }
    });

    // Create lesson items - separate each question to randomize order
    Object.entries(itemGroups).forEach(([baseKey, group]) => {
      let item;
      
      if (group.type === 'radical') {
        item = wanoKuniData?.radicals.find(r => r.id === group.id);
      } else if (group.type === 'kanji') {
        item = wanoKuniData?.kanji.find(k => k.id === group.id);
      } else if (group.type === 'vocabulary') {
        item = wanoKuniData?.vocabulary.find(v => v.id === group.id);
      }

      if (item) {
        if (item.type === 'radical') {
          // Radicals only have meaning questions
          lessonItems.push({
            baseKey,
            item,
            questions: group.questions,
            questionType: 'meaning',
            needsBothQuestions: false,
            key: group.questions.meaning?.key,
            progress: group.questions.meaning?.progress
          });
        } else {
          // For kanji/vocabulary, create separate lesson items for each question type
          if (group.questions.meaning) {
            lessonItems.push({
              baseKey,
              item,
              questions: group.questions,
              questionType: 'meaning',
              needsBothQuestions: true,
              key: group.questions.meaning.key,
              progress: group.questions.meaning.progress
            });
          }
          if (group.questions.reading) {
            lessonItems.push({
              baseKey,
              item,
              questions: group.questions,
              questionType: 'reading', 
              needsBothQuestions: true,
              key: group.questions.reading.key,
              progress: group.questions.reading.progress
            });
          }
        }
      }
    });

    return shuffleArray(lessonItems);
  }, [userProgress, wanoKuniData]);

  // Enhanced answer checking with reading hints
  // Check answer for a specific question type
  const checkAnswer = useCallback((reviewItem, questionType, userAnswer) => {
    const { item } = reviewItem;
    const answer = userAnswer.toLowerCase().trim();
    
    if (questionType === 'reading') {
      // For kanji with separate on/kun readings
      if (item.on_readings || item.kun_readings) {
        const onReadings = item.on_readings || [];
        const kunReadings = item.kun_readings || [];
        const allReadings = [...onReadings, ...kunReadings];
        
        // Check if answer matches any reading
        const isCorrectReading = allReadings.some(reading => 
          reading && reading.toLowerCase() === answer
        );
        
        if (!isCorrectReading) {
          return { correct: false, hint: null };
        }
        
        // Check which type of reading the user provided
        const isOnReading = onReadings.some(reading => reading && reading.toLowerCase() === answer);
        const isKunReading = kunReadings.some(reading => reading && reading.toLowerCase() === answer);
        
        // Get primary readings
        const primaryOn = item.primary_on_reading;
        const primaryKun = item.primary_kun_reading;
        
        // If we have primary readings, enforce them
        if (primaryOn && primaryOn.trim() !== '') {
          // Primary ON exists, only accept ON readings
          if (isKunReading && !isOnReading) {
            return { correct: false, hint: 'on_yomi' };
          }
        }
        
        if (primaryKun && primaryKun.trim() !== '') {
          // Primary KUN exists, only accept KUN readings
          if (isOnReading && !isKunReading) {
            return { correct: false, hint: 'kun_yomi' };
          }
        }
        
        // If no primary readings defined, accept any valid reading
        // If primary readings exist but user provided the right type, accept
        return { correct: true, hint: null };
      }
      
      // For vocabulary or single reading items
      const correctAnswers = item.readings || [];
      const isCorrect = correctAnswers.some(correct => 
        correct && correct.toLowerCase() === answer
      );
      return { correct: isCorrect, hint: null };
    } else {
      // Meaning questions - exact match required
      const correctAnswers = Array.isArray(item.meanings) ? item.meanings : [item.meaning];
      console.log('🎯 MEANING CHECK:', {
        itemChar: item.character || item.characters,
        correctAnswers,
        userAnswer: answer,
        comparisons: correctAnswers.map(correct => ({
          expected: correct?.toLowerCase()?.trim(),
          user: answer,
          match: correct && correct.toLowerCase().trim() === answer
        }))
      });
      
      const isCorrect = correctAnswers.some(correct => 
        correct && correct.toLowerCase().trim() === answer
      );
      return { correct: isCorrect, hint: null };
    }
  }, []);

  // Complete a lesson (move from lesson state to first SRS stage)
  const completeLesson = useCallback((key) => {
    setUserProgress(prev => {
      const currentProgress = prev[key];
      if (!currentProgress || currentProgress.srs_stage !== -1) return prev;

      const updatedProgress = {
        ...currentProgress,
        lesson_completed: true,
        srs_stage: 0, // Move to Apprentice I
        next_review_at: Date.now() + (4 * 60 * 60 * 1000) // First review in 4 hours
      };

      return {
        ...prev,
        [key]: updatedProgress
      };
    });
  }, []);

  // Submit answer and update SRS
  const submitAnswer = useCallback((key, isCorrect, options = {}) => {
    setUserProgress(prev => {
      const currentProgress = prev[key];
      if (!currentProgress) return prev;

      // Handle partial correct (wrong then correct) - advance by 1 level only
      if (options.isPartialCorrect) {
        const newStage = Math.min(8, currentProgress.srs_stage + 1); // Advance by 1 level only
        const nextReviewAt = calculateNextReview(currentProgress.srs_stage, true).nextReviewAt; // Use normal timing
        
        const updatedProgress = {
          ...currentProgress,
          srs_stage: newStage,
          next_review_at: nextReviewAt,
          incorrect_count: currentProgress.incorrect_count + 1, // Count the mistake
          correct_streak: 0 // Reset streak due to initial mistake
        };

        // Check for unlocks if item reached Guru
        if (newStage >= 4 && currentProgress.srs_stage < 4) {
          setTimeout(() => checkForUnlocks(key), 100);
          
          // Check for level progression if this is a radical
          if (key.startsWith('radical_')) {
            setTimeout(() => checkLevelProgression(), 200);
          }
        }

        return {
          ...prev,
          [key]: updatedProgress
        };
      }

      const { newStage, nextReviewAt } = calculateNextReview(currentProgress.srs_stage, isCorrect);

      const updatedProgress = {
        ...currentProgress,
        srs_stage: newStage,
        next_review_at: nextReviewAt,
        incorrect_count: currentProgress.incorrect_count + (isCorrect ? 0 : 1),
        correct_streak: isCorrect ? currentProgress.correct_streak + 1 : 0
      };

      // Check for unlocks if item reached Guru
      if (isCorrect && newStage >= 4 && currentProgress.srs_stage < 4) {
        setTimeout(() => checkForUnlocks(key), 100);
        
        // Check for level progression if this is a radical
        if (key.startsWith('radical_')) {
          setTimeout(() => checkLevelProgression(), 200);
        }
      }

      return {
        ...prev,
        [key]: updatedProgress
      };
    });
  }, []);

  // Submit both answers for a double question item (kanji/vocabulary)
  const submitDoubleAnswer = useCallback((reviewItem, meaningCorrect, readingCorrect, options = {}) => {
    if (!reviewItem.needsBothQuestions) {
      // For radicals, just submit the meaning
      const meaningKey = reviewItem.questions.meaning?.key;
      if (meaningKey) {
        submitAnswer(meaningKey, meaningCorrect, options);
      }
      return;
    }

    // For kanji/vocabulary, both must be correct to advance SRS
    const meaningKey = reviewItem.questions.meaning?.key;
    const readingKey = reviewItem.questions.reading?.key;
    
    const bothCorrect = meaningCorrect && readingCorrect;
    
    // Update both questions with the same result
    if (meaningKey) {
      submitAnswer(meaningKey, bothCorrect, options);
    }
    if (readingKey) {
      submitAnswer(readingKey, bothCorrect, options);
    }
  }, [submitAnswer]);

  // Check for unlocks when items reach Guru
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const checkForUnlocks = useCallback((itemKey) => {
    if (!wanoKuniData) return;

    const [type, id] = itemKey.split('_');
    
    if (type === 'radical') {
      // Unlock kanji that use this radical
      const radicalId = parseInt(id);
      const kanjiToUnlock = wanoKuniData.kanji.filter(k => 
        k.component_radical_ids.includes(radicalId) &&
        k.level <= currentLevel
      );

      const newUnlocks = {};
      kanjiToUnlock.forEach(kanji => {
        const allRadicalsGuru = kanji.component_radical_ids.every(rId => {
          const progress = userProgress[`radical_${rId}`];
          return progress && progress.srs_stage >= 4;
        });

        if (allRadicalsGuru) {
          const meaningKey = `kanji_${kanji.id}_meaning`;
          const readingKey = `kanji_${kanji.id}_reading`;
          
          if (!userProgress[meaningKey]) {
            newUnlocks[meaningKey] = {
              item_id: kanji.id,
              item_type: 'kanji',
              question_type: 'meaning',
              srs_stage: -1, // Start as lesson
              next_review_at: null,
              incorrect_count: 0,
              correct_streak: 0,
              lesson_completed: false
            };
          }
          
          if (!userProgress[readingKey] && (kanji.on_readings?.length > 0 || kanji.kun_readings?.length > 0)) {
            newUnlocks[readingKey] = {
              item_id: kanji.id,
              item_type: 'kanji',
              question_type: 'reading',
              srs_stage: -1, // Start as lesson
              next_review_at: null,
              incorrect_count: 0,
              correct_streak: 0,
              lesson_completed: false
            };
          }
        }
      });

      if (Object.keys(newUnlocks).length > 0) {
        setUserProgress(prev => ({ ...prev, ...newUnlocks }));
      }
    } else if (type === 'kanji') {
      // Unlock vocabulary that use this kanji
      const kanjiId = parseInt(id);
      const vocabularyToUnlock = wanoKuniData.vocabulary.filter(v => 
        v.component_kanji_ids?.includes(kanjiId) ||
        (v.character && wanoKuniData.kanji.find(k => k.id === kanjiId)?.character === v.character) ||
        (v.characters && v.characters.includes(wanoKuniData.kanji.find(k => k.id === kanjiId)?.character))
      );

      const newUnlocks = {};
      vocabularyToUnlock.forEach(vocabulary => {
        // Check if the main kanji for this vocabulary is at Guru+
        const mainKanjiGuru = userProgress[`kanji_${kanjiId}_meaning`]?.srs_stage >= 4 ||
                              userProgress[`kanji_${kanjiId}_reading`]?.srs_stage >= 4;

        if (mainKanjiGuru) {
          const meaningKey = `vocabulary_${vocabulary.id}_meaning`;
          const readingKey = `vocabulary_${vocabulary.id}_reading`;
          
          if (!userProgress[meaningKey]) {
            newUnlocks[meaningKey] = {
              item_id: vocabulary.id,
              item_type: 'vocabulary',
              question_type: 'meaning',
              srs_stage: -1, // Start as lesson
              next_review_at: null,
              incorrect_count: 0,
              correct_streak: 0,
              lesson_completed: false
            };
          }
          
          if (!userProgress[readingKey] && vocabulary.readings?.length > 0) {
            newUnlocks[readingKey] = {
              item_id: vocabulary.id,
              item_type: 'vocabulary',
              question_type: 'reading',
              srs_stage: -1, // Start as lesson
              next_review_at: null,
              incorrect_count: 0,
              correct_streak: 0,
              lesson_completed: false
            };
          }
        }
      });

      if (Object.keys(newUnlocks).length > 0) {
        setUserProgress(prev => ({ ...prev, ...newUnlocks }));
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wanoKuniData, currentLevel, userProgress]);

  // Check if user should level up (WanoKuni logic: 90% of radicals at Guru+)
  const checkLevelProgression = useCallback(() => {
    if (!wanoKuniData) return;
    
    const currentLevelRadicals = wanoKuniData.radicals.filter(r => r.level === currentLevel);
    if (currentLevelRadicals.length === 0) return;
    
    // Count radicals at Guru or higher
    const guruRadicals = currentLevelRadicals.filter(radical => {
      const progress = userProgress[`radical_${radical.id}`];
      return progress && progress.srs_stage >= 4; // Guru = stage 4+
    });
    
    const progressionRate = guruRadicals.length / currentLevelRadicals.length;
    
    // Level up if 90% of radicals are at Guru+
    if (progressionRate >= 0.9) {
      const nextLevel = currentLevel + 1;
      const maxLevel = Math.max(
        ...wanoKuniData.radicals.map(r => r.level),
        ...wanoKuniData.kanji.map(k => k.level),
        ...wanoKuniData.vocabulary.map(v => v.level)
      );
      
      if (nextLevel <= maxLevel) {
        setCurrentLevel(nextLevel);
        console.log(`🎉 Level up! Now at level ${nextLevel}`);
        
        // Unlock kanji for the new level if any exist
        const nextLevelKanji = wanoKuniData.kanji.filter(k => k.level === nextLevel);
        const newUnlocks = {};
        
        nextLevelKanji.forEach(kanji => {
          const meaningKey = `kanji_${kanji.id}_meaning`;
          const readingKey = `kanji_${kanji.id}_reading`;
          
          if (!userProgress[meaningKey]) {
            newUnlocks[meaningKey] = {
              item_id: kanji.id,
              item_type: 'kanji',
              question_type: 'meaning',
              srs_stage: -1,
              next_review_at: null,
              incorrect_count: 0,
              correct_streak: 0,
              lesson_completed: false
            };
          }
          
          if (!userProgress[readingKey] && (kanji.on_readings?.length > 0 || kanji.kun_readings?.length > 0)) {
            newUnlocks[readingKey] = {
              item_id: kanji.id,
              item_type: 'kanji',
              question_type: 'reading',
              srs_stage: -1,
              next_review_at: null,
              incorrect_count: 0,
              correct_streak: 0,
              lesson_completed: false
            };
          }
        });

        if (Object.keys(newUnlocks).length > 0) {
          setUserProgress(prev => ({ ...prev, ...newUnlocks }));
        }
      }
    }
  }, [wanoKuniData, currentLevel, userProgress]);

  const getUserProgress = useCallback(() => userProgress, [userProgress]);

  return {
    getStats,
    getDetailedStats,
    getReviewCount,
    getLessonCount,
    getNextReviewTime,
    startReviewSession,
    startLessonSession,
    checkAnswer,
    submitAnswer,
    submitDoubleAnswer,
    completeLesson,
    getCurrentLevel,
    getUserProgress,
    checkLevelProgression,
    // Informations de synchronisation
    isLoadingFromCloud,
    lastSyncTime
  };
};