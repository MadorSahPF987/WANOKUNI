// Utilitaire pour créer une clé avec l'ID utilisateur
const getUserKey = (userId, key) => {
  return userId ? `${userId}_${key}` : key;
};

export const saveToStorage = (key, data, userId = null) => {
  try {
    const storageKey = getUserKey(userId, key);
    localStorage.setItem(storageKey, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

export const loadFromStorage = (key, userId = null) => {
  try {
    const storageKey = getUserKey(userId, key);
    const item = localStorage.getItem(storageKey);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error('Error loading from localStorage:', error);
    return null;
  }
};

export const removeFromStorage = (key, userId = null) => {
  try {
    const storageKey = getUserKey(userId, key);
    localStorage.removeItem(storageKey);
  } catch (error) {
    console.error('Error removing from localStorage:', error);
  }
};

// Fonction pour nettoyer toutes les données d'un utilisateur
export const clearUserStorage = (userId) => {
  try {
    const keys = Object.keys(localStorage);
    const userPrefix = `${userId}_`;
    
    keys.forEach(key => {
      if (key.startsWith(userPrefix)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error('Error clearing user storage:', error);
  }
};

// Fonction pour migrer les données anonymes vers un utilisateur connecté
export const migrateAnonymousData = (userId) => {
  try {
    const commonKeys = ['srs_data', 'user_progress', 'settings', 'review_history'];
    
    commonKeys.forEach(key => {
      const anonymousData = localStorage.getItem(key);
      if (anonymousData) {
        // Sauvegarder sous la clé utilisateur
        localStorage.setItem(`${userId}_${key}`, anonymousData);
        // Supprimer l'ancienne clé anonyme
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error('Error migrating anonymous data:', error);
  }
};