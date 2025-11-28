import { initializeApp } from "firebase/app";
import { initializeFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import Constants from "expo-constants";

// SIEMPRE tomar las variables desde Constants
const extra = Constants.expoConfig?.extra;

if (!extra) {
  throw new Error("Expo extra config is missing. app.config.js no está siendo leído.");
}

const firebaseConfig = {
  apiKey: extra.apiKey,
  authDomain: extra.authDomain,
  projectId: extra.projectId,
  storageBucket: extra.storageBucket,
  messagingSenderId: extra.messagingSenderId,
  appId: extra.appId,
};

// Validación de claves
function validateConfig(cfg) {
  const missing = Object.entries(cfg)
    .filter(([k, v]) => !v)
    .map(([k]) => k);

  if (missing.length > 0) {
    console.error("Firebase config missing keys:", missing);
    throw new Error(`Firebase config missing keys: ${missing.join(", ")}`);
  }
}

validateConfig(firebaseConfig);

// Inicialización de Firebase
const app = initializeApp(firebaseConfig);

// Firestore con configuración para Expo
export const database = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  useFetchStreams: false,
});

// Auth
export const auth = getAuth(app);

console.log("[Firebase] Inicializado con projectId:", firebaseConfig.projectId);
