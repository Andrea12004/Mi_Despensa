import { initializeApp } from "firebase/app";
import { initializeFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra || {};
const firebaseConfig = {
  apiKey: extra.apiKey,
  authDomain: extra.authDomain,
  projectId: extra.projectId,
  storageBucket: extra.storageBucket,
  messagingSenderId: extra.messagingSenderId,
  appId: extra.appId
};

function validateConfig(cfg) {
  const missing = Object.entries(cfg).filter(([k, v]) => !v).map(([k]) => k);
  if (missing.length) {
    console.error('Firebase config missing keys:', missing);
    console.error('Por favor verifica tu app.config.js o variables de entorno');
    // No lanzar error, solo advertir
    console.warn(`Faltan estas claves: ${missing.join(', ')}`);
  }
}

validateConfig(firebaseConfig);

const app = initializeApp(firebaseConfig);

export const database = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  useFetchStreams: false,
});

export const auth = getAuth(app);

console.log('[fb] Firebase initialized');