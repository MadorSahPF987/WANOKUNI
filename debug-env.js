// Test des variables d'environnement
console.log('=== TEST VARIABLES ENVIRONNEMENT ===');
console.log('REACT_APP_FIREBASE_API_KEY:', process.env.REACT_APP_FIREBASE_API_KEY);
console.log('REACT_APP_FIREBASE_AUTH_DOMAIN:', process.env.REACT_APP_FIREBASE_AUTH_DOMAIN);
console.log('REACT_APP_FIREBASE_PROJECT_ID:', process.env.REACT_APP_FIREBASE_PROJECT_ID);
console.log('REACT_APP_FIREBASE_STORAGE_BUCKET:', process.env.REACT_APP_FIREBASE_STORAGE_BUCKET);
console.log('REACT_APP_FIREBASE_MESSAGING_SENDER_ID:', process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID);
console.log('REACT_APP_FIREBASE_APP_ID:', process.env.REACT_APP_FIREBASE_APP_ID);
console.log('REACT_APP_FIREBASE_MEASUREMENT_ID:', process.env.REACT_APP_FIREBASE_MEASUREMENT_ID);

// Test si les valeurs sont encore les valeurs d'exemple
const isExample = process.env.REACT_APP_FIREBASE_PROJECT_ID === 'ton-projet-id' || 
                  !process.env.REACT_APP_FIREBASE_PROJECT_ID;

if (isExample) {
  console.error('🚨 ERREUR: Les variables d\'environnement sont toujours les valeurs d\'exemple !');
  console.error('✅ Solution: Modifie ton fichier .env.local avec tes vraies clés Firebase');
} else {
  console.log('✅ Variables d\'environnement configurées correctement');
}