// Configuration Firebase pour WanoKuni SRS
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Configuration Firebase
// 🚨 REMPLACE CES VALEURS par celles de ton projet Firebase :
// 1. Va sur https://console.firebase.google.com/
// 2. Sélectionne ton projet 
// 3. Paramètres du projet → Tes applications → Config
const firebaseConfig = {
  apiKey: "REMPLACE_PAR_TA_VRAIE_API_KEY",
  authDomain: "REMPLACE_PAR_TON_PROJET.firebaseapp.com",
  projectId: "REMPLACE_PAR_TON_PROJECT_ID",
  storageBucket: "REMPLACE_PAR_TON_PROJET.appspot.com", 
  messagingSenderId: "REMPLACE_PAR_TON_SENDER_ID",
  appId: "REMPLACE_PAR_TON_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service  
export const db = getFirestore(app);

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();

export default app;