import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, 
  createUserWithEmailAndPassword, signInWithEmailAndPassword, 
  sendPasswordResetEmail, signOut, updateProfile, User } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore, connectFirestoreEmulator, collection, getDocs, query, orderBy, limit, where, DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

// Firebase Konfiguration aus google-services.json
const firebaseConfig = {
  apiKey: "AIzaSyCXrVktQjL0yHjUF5_iRgfWjs4R7PY1dxw",
  authDomain: "promptpilot-c7030.firebaseapp.com",
  projectId: "promptpilot-c7030",
  storageBucket: "promptpilot-c7030.firebasestorage.app",
  messagingSenderId: "787709099132",
  appId: "1:787709099132:android:66ca83e6ed562d192cddf9"
};

// Firebase App initialisieren (nur einmal)
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Firebase-Auth initialisieren (vereinfachte Version ohne spezielle Persistenz)
export const auth = getAuth(app);

// Hinweis: Für eine vollständige Lösung mit Persistenz müsste ein anderer Ansatz gewählt werden
// Die aktuelle Firebase-Version hat Probleme mit dem React Native Persistenz-Import
export const firestore = getFirestore(app);
export const storage = getStorage(app);

// Re-export wichtiger Firebase-Funktionen für einfachen Zugriff
export { 
  signInAnonymously, 
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  updateProfile,
  type User,
  // Firestore Funktionen
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  where,
  // TypeScript-Typen für Firestore
  type DocumentData,
  type QueryDocumentSnapshot
};

export default app;
