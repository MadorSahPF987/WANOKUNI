// Utilitaire pour reset les données localStorage
export const resetAllData = () => {
  // Clear all WanoKuni related data
  localStorage.removeItem('wanokuni_data');
  localStorage.removeItem('wanokuni_progress');
  localStorage.removeItem('wanokuni_level');
  
  // Clear any other potential keys
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('wanokuni')) {
      keysToRemove.push(key);
    }
  }
  
  keysToRemove.forEach(key => localStorage.removeItem(key));
  
  console.log('🧹 All WanoKuni data cleared from localStorage');
  console.log('📚 Ready for fresh start with integrated data');
};

// Fonction pour réinitialiser complètement l'application
export const hardReset = () => {
  if (window.confirm('🚨 Reset complet ?\n\nCeci va effacer TOUTE ta progression et redémarrer avec les 8 leçons de niveau 1.\n\nContinuer ?')) {
    resetAllData();
    window.location.reload();
  }
};

// Reset silencieux pour développement
export const devReset = () => {
  resetAllData();
  window.location.reload();
};