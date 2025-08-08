// Utilitaire pour formater les textes avec les couleurs WanoKuni

export const formatMnemonic = (text, currentItemType) => {
  if (!text) return text;

  // SEULEMENT remplacer les balises explicites <radical>, <kanji>, <vocabulary>
  // Ne PAS parcourir toute la base de données pour éviter la récursion infinie
  let formattedText = text
    // Radical en bleu
    .replace(/<radical>(.*?)<\/radical>/gi, '<span class="text-blue-600 font-bold bg-blue-100 px-1 rounded">$1</span>')
    // Kanji en rouge/rose
    .replace(/<kanji>(.*?)<\/kanji>/gi, '<span class="text-pink-600 font-bold bg-pink-100 px-1 rounded">$1</span>')
    // Vocabulaire en vert
    .replace(/<vocabulary>(.*?)<\/vocabulary>/gi, '<span class="text-green-600 font-bold bg-green-100 px-1 rounded">$1</span>')
    // Reading en violet (pour les lectures)
    .replace(/<reading>(.*?)<\/reading>/gi, '<span class="text-purple-600 font-bold bg-purple-100 px-1 rounded">$1</span>');

  // Mots importants génériques seulement
  formattedText = formattedText
    .replace(/\b(remember|imagine|think|look|see|sounds like|looks like)\b/gi, 
      '<span class="font-semibold text-gray-700 underline">$1</span>');

  return formattedText;
};

export const getTypeColor = (type) => {
  switch (type?.toLowerCase()) {
    case 'radical':
      return 'text-blue-600 bg-blue-100';
    case 'kanji':
      return 'text-pink-600 bg-pink-100';
    case 'vocabulary':
      return 'text-green-600 bg-green-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
};

// Composant React pour afficher du texte formaté
export const FormattedText = ({ children, itemType }) => {
  const formattedText = formatMnemonic(children, itemType);
  
  return (
    <div 
      className="formatted-mnemonic"
      dangerouslySetInnerHTML={{ __html: formattedText }}
    />
  );
};