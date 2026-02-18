import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCNIcLz5VrRRlNobwIXNgoI-ZKpyQEqW1Y",
  authDomain: "scan-montre-vintage.firebaseapp.com",
  projectId: "scan-montre-vintage",
  storageBucket: "scan-montre-vintage.firebasestorage.app",
  messagingSenderId: "86633904601",
  appId: "1:86633904601:web:f7d112a33bd5153ec0c1c8",
  measurementId: "G-33PSM9S2F4"
};

// Initialisation de Firebase
const app = initializeApp(firebaseConfig);

// Export de la base de données
export const db = getFirestore(app);