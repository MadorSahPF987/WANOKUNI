import { useState, useCallback, useMemo } from 'react';

export const useBatchLearning = (lessonItems, batchSize = 5) => {
  const [currentBatchIndex, setCurrentBatchIndex] = useState(0);
  const [completedBatches, setCompletedBatches] = useState(new Set());

  // Diviser les leçons en batches
  const batches = useMemo(() => {
    if (!lessonItems || lessonItems.length === 0) return [];
    
    const result = [];
    for (let i = 0; i < lessonItems.length; i += batchSize) {
      result.push(lessonItems.slice(i, i + batchSize));
    }
    return result;
  }, [lessonItems, batchSize]);

  const currentBatch = batches[currentBatchIndex] || [];
  const isLastBatch = currentBatchIndex >= batches.length - 1;
  const totalBatches = batches.length;

  // Marquer le batch actuel comme complété et passer au suivant
  const completeBatch = useCallback(() => {
    setCompletedBatches(prev => new Set([...prev, currentBatchIndex]));
    
    if (!isLastBatch) {
      setCurrentBatchIndex(prev => prev + 1);
    }
  }, [currentBatchIndex, isLastBatch]);

  // Vérifier si toutes les leçons sont terminées
  const isAllCompleted = completedBatches.size === totalBatches && totalBatches > 0;

  // Reset pour une nouvelle session
  const reset = useCallback(() => {
    setCurrentBatchIndex(0);
    setCompletedBatches(new Set());
  }, []);

  // Statistiques
  const getProgress = useCallback(() => {
    const completedItems = completedBatches.size * batchSize;
    const totalItems = lessonItems?.length || 0;
    return {
      completedBatches: completedBatches.size,
      totalBatches,
      completedItems: Math.min(completedItems, totalItems),
      totalItems,
      currentBatchSize: currentBatch.length,
      currentBatchNumber: currentBatchIndex + 1
    };
  }, [completedBatches.size, batchSize, lessonItems?.length, totalBatches, currentBatch.length, currentBatchIndex]);

  return {
    currentBatch,
    currentBatchIndex,
    isLastBatch,
    isAllCompleted,
    completeBatch,
    reset,
    getProgress,
    batches
  };
};