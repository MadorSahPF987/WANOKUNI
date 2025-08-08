export const SRS_STAGES = {
  0: { name: "Apprentice I", interval: 4 * 60 * 60 * 1000, color: "bg-pink-500" },
  1: { name: "Apprentice II", interval: 8 * 60 * 60 * 1000, color: "bg-pink-500" },
  2: { name: "Apprentice III", interval: 23 * 60 * 60 * 1000, color: "bg-pink-500" },
  3: { name: "Apprentice IV", interval: 47 * 60 * 60 * 1000, color: "bg-pink-500" },
  4: { name: "Guru I", interval: 7 * 24 * 60 * 60 * 1000, color: "bg-purple-500" },
  5: { name: "Guru II", interval: 14 * 24 * 60 * 60 * 1000, color: "bg-purple-500" },
  6: { name: "Master", interval: 30 * 24 * 60 * 60 * 1000, color: "bg-blue-500" },
  7: { name: "Enlightened", interval: 120 * 24 * 60 * 60 * 1000, color: "bg-yellow-500" },
  8: { name: "Burned", interval: null, color: "bg-gray-700" }
};

export const calculateNextReview = (currentStage, isCorrect) => {
  let newStage = currentStage;

  if (isCorrect) {
    if (newStage < 8) {
      newStage += 1;
    }
  } else {
    if (newStage >= 0 && newStage <= 3) {
      newStage = 0; // Apprentice stages → retour à 0
    } else if (newStage >= 4 && newStage <= 7) {
      newStage = Math.max(0, newStage - 2); // Guru+ stages → retour à stage-2 (minimum 0)
    } else if (newStage === 8) {
      newStage = 0; // Burned → retour à 0
    }
  }

  // Sécurité : vérifier que SRS_STAGES[newStage] existe
  if (!SRS_STAGES[newStage]) {
    console.error('🚨 SRS_STAGES[' + newStage + '] is undefined! currentStage:', currentStage, 'isCorrect:', isCorrect);
    newStage = 0; // Fallback sécurisé
  }

  const nextReviewAt = newStage === 8 ? null : Date.now() + (SRS_STAGES[newStage]?.interval || 0);

  return { newStage, nextReviewAt };
};

export const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};