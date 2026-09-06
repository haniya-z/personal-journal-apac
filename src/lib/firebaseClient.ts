import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as fbSignOut, 
  signInAnonymously,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from './firebaseConfig';

// Initialize Firebase client app
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);

// Use the designated Firestore Database ID if present
const dbId = (firebaseConfig as any).firestoreDatabaseId;
export const db = dbId 
  ? getFirestore(app, dbId)
  : getFirestore(app);

export const googleProvider = new GoogleAuthProvider();

// Auth helper functions
export async function signInWithGoogle() {
  return await signInWithPopup(auth, googleProvider);
}

export async function loginWithEmail(email: string, pass: string) {
  return await signInWithEmailAndPassword(auth, email, pass);
}

export async function registerWithEmail(email: string, pass: string) {
  return await createUserWithEmailAndPassword(auth, email, pass);
}

export async function loginAsGuest() {
  return await signInAnonymously(auth);
}

export async function logoutUser() {
  return await fbSignOut(auth);
}

// Get the current user's ID token for authenticating backend API calls
export async function getAuthToken(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;
  return await user.getIdToken();
}

export { onAuthStateChanged };
export type { User };
