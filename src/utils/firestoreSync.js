import { 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot, 
  serverTimestamp,
  collection,
  query,
  where,
  writeBatch
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { loadFromStorage, saveToStorage, clearUserStorage } from './storage';

// Structure des documents Firestore pour chaque utilisateur
const getUserProgressDoc = (userId) => doc(db, 'userProgress', userId);
const getUserDataDoc = (userId) => doc(db, 'userData', userId);

// Sauvegarde des données de progression SRS dans Firestore
export const saveProgressToFirestore = async (userId, progressData, currentLevel) => {
  if (!userId) {
    console.warn('⚠️ saveProgressToFirestore: pas d\'userId');
    return;
  }
  
  try {
    console.log('🔄 Sauvegarde Firestore...', { userId, itemCount: Object.keys(progressData).length, currentLevel });
    const progressDoc = getUserProgressDoc(userId);
    await setDoc(progressDoc, {
      progress: progressData,
      currentLevel: currentLevel,
      lastUpdated: serverTimestamp()
    }, { merge: true });
    
    console.log('✅ Progression sauvegardée dans Firestore');
  } catch (error) {
    console.error('❌ Erreur sauvegarde Firestore:', error);
    console.error('❌ Details:', { userId, progressDataSize: JSON.stringify(progressData).length });
    throw error;
  }
};

// Chargement des données de progression depuis Firestore
export const loadProgressFromFirestore = async (userId) => {
  if (!userId) {
    console.warn('⚠️ loadProgressFromFirestore: pas d\'userId');
    return null;
  }
  
  try {
    console.log('🔄 Chargement Firestore...', { userId });
    const progressDoc = getUserProgressDoc(userId);
    const docSnapshot = await getDoc(progressDoc);
    
    if (docSnapshot.exists()) {
      const data = docSnapshot.data();
      console.log('✅ Progression chargée depuis Firestore', { 
        itemCount: Object.keys(data.progress || {}).length,
        currentLevel: data.currentLevel 
      });
      return {
        progress: data.progress || {},
        currentLevel: data.currentLevel || 1,
        lastUpdated: data.lastUpdated
      };
    } else {
      console.log('ℹ️ Aucune donnée Firestore trouvée pour cet utilisateur');
    }
    
    return null;
  } catch (error) {
    console.error('❌ Erreur chargement Firestore:', error);
    console.error('❌ Details:', { userId, error: error.message, code: error.code });
    return null;
  }
};

// Sauvegarde des données WanoKuni dans Firestore (optionnel - peut être lourd)
export const saveUserDataToFirestore = async (userId, wanoKuniData) => {
  if (!userId || !wanoKuniData) return;
  
  try {
    const userDataDoc = getUserDataDoc(userId);
    await setDoc(userDataDoc, {
      wanoKuniData: wanoKuniData,
      lastUpdated: serverTimestamp()
    }, { merge: true });
    
    console.log('✅ Données utilisateur sauvegardées dans Firestore');
  } catch (error) {
    console.error('❌ Erreur sauvegarde données utilisateur:', error);
    // Ne pas bloquer l'app si la sauvegarde échoue
  }
};

// Chargement des données utilisateur depuis Firestore
export const loadUserDataFromFirestore = async (userId) => {
  if (!userId) return null;
  
  try {
    const userDataDoc = getUserDataDoc(userId);
    const docSnapshot = await getDoc(userDataDoc);
    
    if (docSnapshot.exists()) {
      const data = docSnapshot.data();
      console.log('✅ Données utilisateur chargées depuis Firestore');
      return data.wanoKuniData;
    }
    
    return null;
  } catch (error) {
    console.error('❌ Erreur chargement données utilisateur:', error);
    return null;
  }
};

// Migration des données localStorage vers Firestore lors de la première connexion
export const migrateToFirestore = async (userId) => {
  if (!userId) return;
  
  try {
    console.log('🔄 Migration vers Firestore...');
    
    // Vérifier s'il y a déjà des données dans Firestore
    const existingProgress = await loadProgressFromFirestore(userId);
    if (existingProgress) {
      console.log('✅ Données Firestore existantes trouvées, migration ignorée');
      return;
    }
    
    // Charger les données localStorage
    const localProgress = loadFromStorage('wanokuni_progress');
    const localLevel = loadFromStorage('wanokuni_level');
    const localData = loadFromStorage('wanokuni_data');
    
    if (localProgress && Object.keys(localProgress).length > 0) {
      // Migrer la progression SRS
      await saveProgressToFirestore(userId, localProgress, localLevel || 1);
      console.log('✅ Progression migrée vers Firestore');
    }
    
    if (localData) {
      // Migrer les données WanoKuni (optionnel)
      await saveUserDataToFirestore(userId, localData);
      console.log('✅ Données WanoKuni migrées vers Firestore');
    }
    
    // Nettoyer le localStorage après migration réussie
    setTimeout(() => {
      clearUserStorage(userId);
      console.log('✅ LocalStorage nettoyé après migration');
    }, 1000);
    
  } catch (error) {
    console.error('❌ Erreur migration Firestore:', error);
  }
};

// Écoute en temps réel des changements de progression (pour synchro multi-appareils)
export const subscribeToProgressUpdates = (userId, onUpdate) => {
  if (!userId) return () => {};
  
  const progressDoc = getUserProgressDoc(userId);
  
  return onSnapshot(progressDoc, (doc) => {
    if (doc.exists()) {
      const data = doc.data();
      onUpdate({
        progress: data.progress || {},
        currentLevel: data.currentLevel || 1,
        lastUpdated: data.lastUpdated
      });
    }
  }, (error) => {
    console.error('❌ Erreur écoute Firestore:', error);
  });
};

// Fonction de synchronisation hybride (localStorage + Firestore)
export const syncData = async (userId, localData, syncToCloud = true) => {
  if (!userId) return localData;
  
  try {
    // Toujours sauvegarder localement pour performance
    if (localData.progress) {
      saveToStorage('wanokuni_progress', localData.progress, userId);
    }
    if (localData.currentLevel) {
      saveToStorage('wanokuni_level', localData.currentLevel, userId);
    }
    
    // Synchroniser avec Firestore si demandé
    if (syncToCloud && localData.progress && Object.keys(localData.progress).length > 0) {
      await saveProgressToFirestore(userId, localData.progress, localData.currentLevel);
    }
    
    return localData;
  } catch (error) {
    console.error('❌ Erreur synchronisation:', error);
    return localData;
  }
};