import { useState, useCallback, useEffect } from 'react';
import { loadFromStorage, saveToStorage, removeFromStorage } from '../utils/storage';
import { loadUserDataFromFirestore, saveUserDataToFirestore } from '../utils/firestoreSync';

export const useWanoKuniData = (userId = null) => {
  const [wanoKuniData, setWanoKuniData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load data from Firestore, localStorage, or fetch from JSON file
  useEffect(() => {
    const loadStoredData = async () => {
      try {
        // 1. Essayer de charger depuis localStorage d'abord (plus rapide)
        const storedData = loadFromStorage('wanokuni_data', userId);
        if (storedData) {
          setWanoKuniData(storedData);
          setIsLoading(false);
          return;
        }

        // 2. Si connecté, essayer Firestore (peut être lent)
        if (userId) {
          try {
            const cloudData = await loadUserDataFromFirestore(userId);
            if (cloudData) {
              setWanoKuniData(cloudData);
              saveToStorage('wanokuni_data', cloudData, userId);
              setIsLoading(false);
              return;
            }
          } catch (error) {
            console.warn('⚠️ Pas de données cloud, chargement depuis JSON');
          }
        }

        // 3. Fallback: charger depuis le fichier JSON
        const response = await fetch('/wanokuni_structured_data.json');
        if (response.ok) {
          const realData = await response.json();
          console.log(`🐊 Loaded complete WanoKuni data: ${realData.metadata.total_items} items`);
          setWanoKuniData(realData);
          saveToStorage('wanokuni_data', realData, userId);
          
          // Si connecté, sauvegarder en arrière-plan dans Firestore
          if (userId) {
            saveUserDataToFirestore(userId, realData).catch(console.warn);
          }
        } else {
          console.error('Failed to load WanoKuni data file');
          // Create minimal fallback data
          const fallbackData = {
            metadata: { total_items: 0, levels: 1 },
            radicals: [],
            kanji: [],
            vocabulary: []
          };
          setWanoKuniData(fallbackData);
        }
      } catch (error) {
        console.error('Error loading WanoKuni data:', error);
        // Create minimal fallback data
        const fallbackData = {
          metadata: { total_items: 0, levels: 1 },
          radicals: [],
          kanji: [],
          vocabulary: []
        };
        setWanoKuniData(fallbackData);
      } finally {
        setIsLoading(false);
      }
    };

    loadStoredData();
  }, [userId]);

  const loadData = useCallback((data) => {
    setWanoKuniData(data);
    saveToStorage('wanokuni_data', data, userId);
    
    // Si connecté, sauvegarder aussi dans Firestore
    if (userId) {
      saveUserDataToFirestore(userId, data).catch(console.warn);
    }
  }, [userId]);

  const clearData = useCallback(() => {
    setWanoKuniData(null);
    removeFromStorage('wanokuni_data', userId);
  }, [userId]);

  return {
    wanoKuniData,
    loadData,
    clearData,
    isLoading
  };
};