import { saveToStorage, loadFromStorage } from './storage';

// Avancer le temps (en heures) pour simuler des révisions
export const advanceTime = (hours) => {
  const savedProgress = loadFromStorage('wanokuni_progress') || {};
  const currentTime = Date.now();
  const hoursInMs = hours * 60 * 60 * 1000;
  
  const updatedProgress = { ...savedProgress };
  
  Object.keys(updatedProgress).forEach(key => {
    const progress = updatedProgress[key];
    if (progress.next_review_at && progress.next_review_at > currentTime) {
      // Réduire le temps de révision
      updatedProgress[key] = {
        ...progress,
        next_review_at: Math.max(currentTime, progress.next_review_at - hoursInMs)
      };
    }
  });
  
  saveToStorage('wanokuni_progress', updatedProgress);
  console.log(`⏰ Avancé de ${hours}h - Nouvelles révisions disponibles`);
  return updatedProgress;
};

// Ajouter des leçons pour un type spécifique
export const addLessonsForType = (wanoKuniData, type, count = 5) => {
  if (!wanoKuniData) return {};
  
  const savedProgress = loadFromStorage('wanokuni_progress') || {};
  const currentLevel = loadFromStorage('wanokuni_level') || 1;
  
  let items = [];
  if (type === 'radical') {
    items = wanoKuniData.radicals.filter(r => r.level <= currentLevel + 1);
  } else if (type === 'kanji') {
    items = wanoKuniData.kanji.filter(k => k.level <= currentLevel + 1);
  } else if (type === 'vocabulary') {
    items = wanoKuniData.vocabulary.filter(v => v.level <= currentLevel + 1);
  }
  
  // Filtrer les items qui n'ont pas encore de progression
  const availableItems = items.filter(item => {
    const meaningKey = `${type}_${item.id}_meaning`;
    const readingKey = `${type}_${item.id}_reading`;
    return !savedProgress[meaningKey] && !savedProgress[readingKey];
  });
  
  const updatedProgress = { ...savedProgress };
  const itemsToAdd = availableItems.slice(0, count);
  
  itemsToAdd.forEach(item => {
    // Ajouter la signification
    const meaningKey = `${type}_${item.id}_meaning`;
    updatedProgress[meaningKey] = {
      item_id: item.id,
      item_type: type,
      question_type: 'meaning',
      srs_stage: -1, // Leçon
      next_review_at: null,
      incorrect_count: 0,
      correct_streak: 0,
      lesson_completed: false
    };
    
    // Ajouter la lecture pour kanji et vocabulary
    if ((type === 'kanji' || type === 'vocabulary') && 
        (item.readings?.length > 0 || item.on_readings?.length > 0 || item.kun_readings?.length > 0)) {
      const readingKey = `${type}_${item.id}_reading`;
      updatedProgress[readingKey] = {
        item_id: item.id,
        item_type: type,
        question_type: 'reading',
        srs_stage: -1, // Leçon
        next_review_at: null,
        incorrect_count: 0,
        correct_streak: 0,
        lesson_completed: false
      };
    }
  });
  
  saveToStorage('wanokuni_progress', updatedProgress);
  console.log(`📚 Ajouté ${itemsToAdd.length} ${type}(s) en leçons`);
  return updatedProgress;
};

// Ajouter des révisions pour un type spécifique
export const addReviewsForType = (wanoKuniData, type, count = 5) => {
  if (!wanoKuniData) return {};
  
  const savedProgress = loadFromStorage('wanokuni_progress') || {};
  const currentLevel = loadFromStorage('wanokuni_level') || 1;
  
  let items = [];
  if (type === 'radical') {
    items = wanoKuniData.radicals.filter(r => r.level <= currentLevel);
  } else if (type === 'kanji') {
    items = wanoKuniData.kanji.filter(k => k.level <= currentLevel);
  } else if (type === 'vocabulary') {
    items = wanoKuniData.vocabulary.filter(v => v.level <= currentLevel);
  }
  
  const updatedProgress = { ...savedProgress };
  const currentTime = Date.now();
  let addedCount = 0;
  
  // Trouver des items qui peuvent être mis en révision
  items.forEach(item => {
    if (addedCount >= count) return;
    
    const meaningKey = `${type}_${item.id}_meaning`;
    const readingKey = `${type}_${item.id}_reading`;
    
    // Si l'item n'existe pas du tout, le créer en révision directement
    if (!savedProgress[meaningKey]) {
      updatedProgress[meaningKey] = {
        item_id: item.id,
        item_type: type,
        question_type: 'meaning',
        srs_stage: Math.floor(Math.random() * 4), // Apprentice aléatoire
        next_review_at: currentTime - 1000, // Révision immédiate
        incorrect_count: 0,
        correct_streak: 1,
        lesson_completed: true
      };
      addedCount++;
    } else if (savedProgress[meaningKey].srs_stage >= 0 && savedProgress[meaningKey].next_review_at > currentTime) {
      // Si l'item existe mais n'est pas prêt pour révision, le rendre disponible
      updatedProgress[meaningKey] = {
        ...savedProgress[meaningKey],
        next_review_at: currentTime - 1000
      };
      addedCount++;
    }
    
    // Faire pareil pour la lecture
    if (addedCount < count && (type === 'kanji' || type === 'vocabulary') && 
        (item.readings?.length > 0 || item.on_readings?.length > 0 || item.kun_readings?.length > 0)) {
      
      if (!savedProgress[readingKey]) {
        updatedProgress[readingKey] = {
          item_id: item.id,
          item_type: type,
          question_type: 'reading',
          srs_stage: Math.floor(Math.random() * 4), // Apprentice aléatoire
          next_review_at: currentTime - 1000, // Révision immédiate
          incorrect_count: 0,
          correct_streak: 1,
          lesson_completed: true
        };
        addedCount++;
      } else if (savedProgress[readingKey].srs_stage >= 0 && savedProgress[readingKey].next_review_at > currentTime) {
        updatedProgress[readingKey] = {
          ...savedProgress[readingKey],
          next_review_at: currentTime - 1000
        };
        addedCount++;
      }
    }
  });
  
  saveToStorage('wanokuni_progress', updatedProgress);
  console.log(`🔄 Ajouté/activé ${addedCount} révisions de ${type}(s)`);
  return updatedProgress;
};

// Débloquer le niveau suivant
export const unlockNextLevel = () => {
  const currentLevel = loadFromStorage('wanokuni_level') || 1;
  const newLevel = currentLevel + 1;
  saveToStorage('wanokuni_level', newLevel);
  console.log(`🆙 Niveau débloqué: ${newLevel}`);
  return newLevel;
};

// Créer un scénario réaliste de progression
export const createRealisticScenario = (wanoKuniData) => {
  if (!wanoKuniData) return {};
  
  const savedProgress = loadFromStorage('wanokuni_progress') || {};
  const updatedProgress = { ...savedProgress };
  const currentTime = Date.now();
  
  // Niveau 1: Radicals déjà maîtrisés (Guru+)
  const level1Radicals = wanoKuniData.radicals.filter(r => r.level === 1).slice(0, 8);
  level1Radicals.forEach(radical => {
    const key = `radical_${radical.id}`;
    updatedProgress[key] = {
      item_id: radical.id,
      item_type: 'radical',
      question_type: 'meaning',
      srs_stage: Math.floor(Math.random() * 2) + 4, // Guru 1-2
      next_review_at: currentTime + Math.random() * 24 * 60 * 60 * 1000, // Dans les 24h
      incorrect_count: Math.floor(Math.random() * 3),
      correct_streak: Math.floor(Math.random() * 5) + 3,
      lesson_completed: true
    };
  });
  
  // Quelques Kanji niveau 1 en apprentissage
  const level1Kanji = wanoKuniData.kanji.filter(k => k.level === 1).slice(0, 6);
  level1Kanji.forEach(kanji => {
    const meaningKey = `kanji_${kanji.id}_meaning`;
    const readingKey = `kanji_${kanji.id}_reading`;
    const stage = Math.floor(Math.random() * 4); // Apprentice 1-4
    
    updatedProgress[meaningKey] = {
      item_id: kanji.id,
      item_type: 'kanji',
      question_type: 'meaning',
      srs_stage: stage,
      next_review_at: currentTime - Math.random() * 60 * 60 * 1000, // Révisions disponibles
      incorrect_count: Math.floor(Math.random() * 2),
      correct_streak: Math.floor(Math.random() * 3) + 1,
      lesson_completed: true
    };
    
    if (kanji.on_readings?.length > 0 || kanji.kun_readings?.length > 0) {
      updatedProgress[readingKey] = {
        item_id: kanji.id,
        item_type: 'kanji',
        question_type: 'reading',
        srs_stage: Math.max(0, stage - 1),
        next_review_at: currentTime - Math.random() * 2 * 60 * 60 * 1000,
        incorrect_count: Math.floor(Math.random() * 3),
        correct_streak: Math.floor(Math.random() * 2) + 1,
        lesson_completed: true
      };
    }
  });
  
  // Quelques vocabulaires en leçons
  const level1Vocabulary = wanoKuniData.vocabulary.filter(v => v.level === 1).slice(0, 10);
  level1Vocabulary.forEach((vocab, index) => {
    const meaningKey = `vocabulary_${vocab.id}_meaning`;
    const readingKey = `vocabulary_${vocab.id}_reading`;
    
    if (index < 5) {
      // En leçon
      updatedProgress[meaningKey] = {
        item_id: vocab.id,
        item_type: 'vocabulary',
        question_type: 'meaning',
        srs_stage: -1,
        next_review_at: null,
        incorrect_count: 0,
        correct_streak: 0,
        lesson_completed: false
      };
      
      if (vocab.readings?.length > 0) {
        updatedProgress[readingKey] = {
          item_id: vocab.id,
          item_type: 'vocabulary',
          question_type: 'reading',
          srs_stage: -1,
          next_review_at: null,
          incorrect_count: 0,
          correct_streak: 0,
          lesson_completed: false
        };
      }
    } else {
      // En révision
      const stage = Math.floor(Math.random() * 3); // Apprentice 1-3
      updatedProgress[meaningKey] = {
        item_id: vocab.id,
        item_type: 'vocabulary',
        question_type: 'meaning',
        srs_stage: stage,
        next_review_at: currentTime - Math.random() * 30 * 60 * 1000, // Révision dans les 30min
        incorrect_count: Math.floor(Math.random() * 2),
        correct_streak: Math.floor(Math.random() * 2) + 1,
        lesson_completed: true
      };
      
      if (vocab.readings?.length > 0) {
        updatedProgress[readingKey] = {
          item_id: vocab.id,
          item_type: 'vocabulary',
          question_type: 'reading',
          srs_stage: Math.max(0, stage - 1),
          next_review_at: currentTime - Math.random() * 60 * 60 * 1000,
          incorrect_count: Math.floor(Math.random() * 3),
          correct_streak: Math.floor(Math.random() * 2),
          lesson_completed: true
        };
      }
    }
  });
  
  saveToStorage('wanokuni_progress', updatedProgress);
  saveToStorage('wanokuni_level', 1);
  console.log('🎯 Scénario réaliste créé: radicals maîtrisés, kanji en cours, vocabulaire mixte');
  return updatedProgress;
};

// Simuler une session d'étude intensive
export const simulateStudySession = (wanoKuniData) => {
  if (!wanoKuniData) return {};
  
  // Ajouter des leçons variées
  addLessonsForType(wanoKuniData, 'radical', 3);
  addLessonsForType(wanoKuniData, 'kanji', 5);
  addLessonsForType(wanoKuniData, 'vocabulary', 8);
  
  // Ajouter quelques révisions
  addReviewsForType(wanoKuniData, 'radical', 4);
  addReviewsForType(wanoKuniData, 'kanji', 6);
  addReviewsForType(wanoKuniData, 'vocabulary', 10);
  
  console.log('📚 Session d\'étude simulée: leçons + révisions ajoutées');
};

// Reset complet (déjà existant mais on l'importe ici pour cohérence)
export const resetAllData = () => {
  localStorage.removeItem('wanokuni_progress');
  localStorage.removeItem('wanokuni_level');
  console.log('🔄 Reset complet effectué');
  window.location.reload();
};