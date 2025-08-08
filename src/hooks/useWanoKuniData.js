import { useState, useCallback, useEffect } from 'react';
import { loadFromStorage, saveToStorage, removeFromStorage } from '../utils/storage';

export const useWanoKuniData = (userId = null) => {
  const [wanoKuniData, setWanoKuniData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load data from localStorage or fetch from JSON file
  useEffect(() => {
    const loadStoredData = async () => {
      try {
        const storedData = loadFromStorage('wanokuni_data', userId);
        if (storedData) {
          setWanoKuniData(storedData);
        } else {
          // Load from the real WanoKuni JSON file
          const response = await fetch('/wanokuni_structured_data.json');
          if (response.ok) {
            const realData = await response.json();
            console.log(`🐊 Loaded complete WanoKuni data: ${realData.metadata.total_items} items`);
            setWanoKuniData(realData);
            saveToStorage('wanokuni_data', realData, userId);
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