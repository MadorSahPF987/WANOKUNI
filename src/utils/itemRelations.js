// Utilitaires pour résoudre les relations entre les éléments WanoKuni

// Trouver un élément par ID et type
export const findItemById = (wanoKuniData, type, id) => {
  if (!wanoKuniData || !id) return null;
  
  // Fix the collection name mapping
  const collectionName = type === 'vocabulary' ? 'vocabulary' : type + 's';
  const collection = wanoKuniData[collectionName];
  
  return collection?.find(item => item.id === parseInt(id)) || null;
};

// Résoudre les radicaux composants d'un kanji
export const resolveComponentRadicals = (wanoKuniData, kanji) => {
  if (!kanji.component_radical_ids) return [];
  
  return kanji.component_radical_ids
    .map(id => findItemById(wanoKuniData, 'radical', id))
    .filter(Boolean);
};

// Résoudre le vocabulaire débloqué par un kanji
export const resolveUnlockedVocabulary = (wanoKuniData, kanji) => {
  if (!kanji.unlocked_vocabulary_ids) return [];
  
  return kanji.unlocked_vocabulary_ids
    .map(id => findItemById(wanoKuniData, 'vocabulary', id))
    .filter(Boolean)
    .slice(0, 20); // Limiter pour éviter l'encombrement
};

// Résoudre les kanji visuellement similaires
export const resolveVisuallySimilarKanji = (wanoKuniData, kanji) => {
  if (!kanji.visually_similar_ids) return [];
  
  return kanji.visually_similar_ids
    .map(id => findItemById(wanoKuniData, 'kanji', id))
    .filter(Boolean);
};

// Résoudre les kanji composants d'un vocabulaire
export const resolveComponentKanji = (wanoKuniData, vocabulary) => {
  if (!vocabulary.component_kanji_ids) return [];
  
  return vocabulary.component_kanji_ids
    .map(id => findItemById(wanoKuniData, 'kanji', id))
    .filter(Boolean);
};

// Trouver les kanji qui utilisent un radical donné (relation inverse)
export const findKanjiUsingRadical = (wanoKuniData, radical) => {
  if (!wanoKuniData?.kanji) return [];
  
  return wanoKuniData.kanji
    .filter(kanji => kanji.component_radical_ids?.includes(radical.id))
    .slice(0, 15); // Limiter pour la performance
};

// Trouver le vocabulaire qui utilise un kanji donné (relation inverse)
export const findVocabularyUsingKanji = (wanoKuniData, kanji) => {
  if (!wanoKuniData?.vocabulary) return [];
  
  return wanoKuniData.vocabulary
    .filter(vocab => vocab.component_kanji_ids?.includes(kanji.id))
    .slice(0, 10); // Limiter pour la performance
};

// Obtenir toutes les relations d'un élément
export const getItemRelations = (wanoKuniData, item) => {
  const relations = {};
  
  switch (item.type) {
    case 'radical':
      relations.usedInKanji = findKanjiUsingRadical(wanoKuniData, item);
      break;
      
    case 'kanji':
      relations.componentRadicals = resolveComponentRadicals(wanoKuniData, item);
      relations.unlockedVocabulary = resolveUnlockedVocabulary(wanoKuniData, item);
      relations.visuallySimilar = resolveVisuallySimilarKanji(wanoKuniData, item);
      relations.usedInVocabulary = findVocabularyUsingKanji(wanoKuniData, item);
      break;
      
    case 'vocabulary':
      relations.componentKanji = resolveComponentKanji(wanoKuniData, item);
      break;
  }
  
  return relations;
};