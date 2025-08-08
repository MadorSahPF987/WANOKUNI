// Utilitaire pour convertir romaji en hiragana en temps réel
import React from 'react';

// Table de conversion romaji -> hiragana plus complète
export const romajiToHiraganaMap = {
  // Voyelles de base
  'a': 'あ', 'i': 'い', 'u': 'う', 'e': 'え', 'o': 'お',
  
  // Petites voyelles (avec "l" ou "x")
  'la': 'ぁ', 'xa': 'ぁ',
  'li': 'ぃ', 'xi': 'ぃ', 'lyi': 'ぃ', 'xyi': 'ぃ',
  'lu': 'ぅ', 'xu': 'ぅ',
  'le': 'ぇ', 'xe': 'ぇ', 'lye': 'ぇ', 'xye': 'ぇ',
  'lo': 'ぉ', 'xo': 'ぉ',
  
  // Petites consonnes combinées
  'lya': 'ゃ', 'xya': 'ゃ',
  'lyu': 'ゅ', 'xyu': 'ゅ', 
  'lyo': 'ょ', 'xyo': 'ょ',
  
  // Petit tsu (sokuon - consonne géminée)
  'ltsu': 'っ', 'xtsu': 'っ', 'ltu': 'っ', 'xtu': 'っ',
  
  // Petit wa
  'lwa': 'ゎ', 'xwa': 'ゎ',
  
  // K
  'ka': 'か', 'ki': 'き', 'ku': 'く', 'ke': 'け', 'ko': 'こ',
  'kya': 'きゃ', 'kyu': 'きゅ', 'kyo': 'きょ',
  
  // G
  'ga': 'が', 'gi': 'ぎ', 'gu': 'ぐ', 'ge': 'げ', 'go': 'ご',
  'gya': 'ぎゃ', 'gyu': 'ぎゅ', 'gyo': 'ぎょ',
  
  // S
  'sa': 'さ', 'shi': 'し', 'su': 'す', 'se': 'せ', 'so': 'そ',
  'sha': 'しゃ', 'shu': 'しゅ', 'sho': 'しょ',
  'sya': 'しゃ', 'syu': 'しゅ', 'syo': 'しょ', // variantes
  
  // Z
  'za': 'ざ', 'ji': 'じ', 'zu': 'ず', 'ze': 'ぜ', 'zo': 'ぞ',
  'ja': 'じゃ', 'ju': 'じゅ', 'jo': 'じょ',
  'zya': 'じゃ', 'zyu': 'じゅ', 'zyo': 'じょ', // variantes
  
  // T
  'ta': 'た', 'chi': 'ち', 'tsu': 'つ', 'te': 'て', 'to': 'と',
  'cha': 'ちゃ', 'chu': 'ちゅ', 'cho': 'ちょ',
  'tya': 'ちゃ', 'tyu': 'ちゅ', 'tyo': 'ちょ', // variantes
  'ti': 'ち', 'tu': 'つ', // variantes courantes
  
  // D
  'da': 'だ', 'di': 'ぢ', 'du': 'づ', 'de': 'で', 'do': 'ど',
  'dya': 'ぢゃ', 'dyu': 'ぢゅ', 'dyo': 'ぢょ',
  
  // N
  'na': 'な', 'ni': 'に', 'nu': 'ぬ', 'ne': 'ね', 'no': 'の',
  'nya': 'にゃ', 'nyu': 'にゅ', 'nyo': 'にょ',
  
  // H
  'ha': 'は', 'hi': 'ひ', 'fu': 'ふ', 'he': 'へ', 'ho': 'ほ',
  'hya': 'ひゃ', 'hyu': 'ひゅ', 'hyo': 'ひょ',
  'hu': 'ふ', // variante courante
  
  // B
  'ba': 'ば', 'bi': 'び', 'bu': 'ぶ', 'be': 'べ', 'bo': 'ぼ',
  'bya': 'びゃ', 'byu': 'びゅ', 'byo': 'びょ',
  
  // P
  'pa': 'ぱ', 'pi': 'ぴ', 'pu': 'ぷ', 'pe': 'ぺ', 'po': 'ぽ',
  'pya': 'ぴゃ', 'pyu': 'ぴゅ', 'pyo': 'ぴょ',
  
  // M
  'ma': 'ま', 'mi': 'み', 'mu': 'む', 'me': 'め', 'mo': 'も',
  'mya': 'みゃ', 'myu': 'みゅ', 'myo': 'みょ',
  
  // Y
  'ya': 'や', 'yu': 'ゆ', 'yo': 'よ',
  
  // R
  'ra': 'ら', 'ri': 'り', 'ru': 'る', 're': 'れ', 'ro': 'ろ',
  'rya': 'りゃ', 'ryu': 'りゅ', 'ryo': 'りょ',
  
  // W
  'wa': 'わ', 'wo': 'を', 'we': 'ゑ', 'wi': 'ゐ',
  
  // N
  'n': 'ん', 'nn': 'ん'
};

/**
 * Convertit du romaji en hiragana avec gestion intelligente du 'n'
 * @param {string} romaji - Texte en romaji
 * @param {boolean} finalConversion - Si true, convertit aussi le 'n' final
 * @returns {string} - Texte converti en hiragana
 */
export const convertRomajiToHiragana = (romaji, finalConversion = false) => {
  if (!romaji) return '';
  
  // S'assurer que romaji est une chaîne
  const inputStr = typeof romaji === 'string' ? romaji : String(romaji);
  let result = inputStr.toLowerCase();
  
  // Première passe: gérer les 'nn' en 'ん'
  result = result.replace(/nn/g, 'ん');
  
  // Trier les clés par longueur décroissante pour éviter les conflits
  // (ex: "cha" doit être converti avant "ch" ou "a")
  // Exclure 'n' et 'nn' de la liste car on les traite séparément
  const sortedKeys = Object.keys(romajiToHiraganaMap)
    .filter(key => key !== 'n' && key !== 'nn')
    .sort((a, b) => b.length - a.length);
  
  // Appliquer les conversions
  for (const key of sortedKeys) {
    const regex = new RegExp(key, 'g');
    result = result.replace(regex, romajiToHiraganaMap[key]);
  }
  
  // Gérer les 'n' restants
  if (finalConversion) {
    // Conversion finale: convertir tous les 'n' restants (y compris à la fin)
    result = result.replace(/n(?=[bcdfghjklmpqrstvwxz]|$)/g, 'ん');
  } else {
    // Conversion en temps réel: ne pas convertir le 'n' à la fin
    result = result.replace(/n(?=[bcdfghjklmpqrstvwxz])/g, 'ん');
  }
  
  return result;
};

/**
 * Hook personnalisé pour la conversion automatique romaji -> hiragana
 * @param {string} initialValue - Valeur initiale
 * @returns {[string, function]} - [valeur convertie, fonction de mise à jour]
 */
export const useHiraganaInput = (initialValue = '') => {
  const [value, setValue] = React.useState(initialValue);
  
  const handleChange = React.useCallback((eventOrValue) => {
    // Gérer à la fois les events React et les valeurs directes
    const newValue = eventOrValue?.target?.value ?? eventOrValue;
    // Convertir automatiquement le romaji en hiragana
    const converted = convertRomajiToHiragana(newValue);
    setValue(converted);
  }, []);
  
  return [value, handleChange, setValue];
};

/**
 * Fonction pour obtenir la version finale avec conversion du 'n' final
 * @param {string} value - Valeur hiragana en cours
 * @returns {string} - Valeur avec 'n' final converti en 'ん'
 */
export const getFinalHiraganaValue = (value) => {
  if (!value) return '';
  // Appliquer la conversion finale sur la valeur actuelle
  return convertRomajiToHiragana(value, true);
};