// Safe Firebase Configuration Loader
// Supports both firebase-applet-config.json (when present) and VITE_ environment variables.
// Safely falls back to placeholders so building from a clean git clone never errors out.

const meta = import.meta as any;
const appletConfigs = (meta.glob ? meta.glob('/firebase-applet-config.json', { eager: true }) : {}) as Record<
  string,
  { default?: any }
>;
const localConfig = appletConfigs['/firebase-applet-config.json']?.default || {};

export interface FirebaseAppConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
  firestoreDatabaseId?: string;
  oAuthClientId?: string;
}

const env = meta.env || {};

export const firebaseConfig: FirebaseAppConfig = {
  apiKey:
    env.VITE_FIREBASE_API_KEY ||
    localConfig.apiKey ||
    'AIzaSy-placeholder-for-public-repo',
  authDomain:
    env.VITE_FIREBASE_AUTH_DOMAIN ||
    localConfig.authDomain ||
    'placeholder-project.firebaseapp.com',
  projectId:
    env.VITE_FIREBASE_PROJECT_ID ||
    localConfig.projectId ||
    'placeholder-project',
  storageBucket:
    env.VITE_FIREBASE_STORAGE_BUCKET ||
    localConfig.storageBucket ||
    'placeholder-project.firebasestorage.app',
  messagingSenderId:
    env.VITE_FIREBASE_MESSAGING_SENDER_ID ||
    localConfig.messagingSenderId ||
    '123456789012',
  appId:
    env.VITE_FIREBASE_APP_ID ||
    localConfig.appId ||
    '1:123456789012:web:abcdef123456',
  measurementId:
    env.VITE_FIREBASE_MEASUREMENT_ID ||
    localConfig.measurementId ||
    '',
  firestoreDatabaseId:
    env.VITE_FIREBASE_DATABASE_ID ||
    localConfig.firestoreDatabaseId ||
    undefined,
  oAuthClientId:
    env.VITE_GOOGLE_OAUTH_CLIENT_ID ||
    localConfig.oAuthClientId ||
    '',
};
