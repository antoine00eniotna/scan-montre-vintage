import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: "scan-montre-vintage.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: "scan-montre-vintage.firebasestorage.app",
  messagingSenderId: "86633904601",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialisation de Firebase
const app = initializeApp(firebaseConfig);

// Export de la base de données
export const db = getFirestore(app);