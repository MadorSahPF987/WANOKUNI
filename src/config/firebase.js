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
  apiKey: "AIzaSyCxm7U3O2dBBPdthlE-6QE4ZV4v8bRbXmU",
  authDomain: "wanokuni-d5fae.firebaseapp.com",
  projectId: "wanokuni-d5fae",
  storageBucket: "wanokuni-d5fae.firebasestorage.app",
  messagingSenderId: "751544647589",
  appId: "1:751544647589:web:0dffd49d3990114dd9b24c",
  measurementId: "G-GGJFH432XX"
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