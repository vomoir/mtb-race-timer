// firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// --- Firebase Configuration ---
const firebaseConfig = {
  //   apiKey: import.meta.env.REACT_APP_FIREBASE_API_KEY,
  //   authDomain: import.meta.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  //   projectId: import.meta.env.REACT_APP_FIREBASE_PROJECT_ID,
  //   storageBucket: import.meta.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  //   messagingSenderId: import.meta.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  //   appId: import.meta.env.REACT_APP_FIREBASE_APP_ID,
  //   measurementId: import.meta.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
  apiKey: "AIzaSyBBRlw9TPYBf9pmSSw25yW_VDYPFIY0vZo",
  authDomain: "mtb-race-timer-a3453.firebaseapp.com",
  projectId: "mtb-race-timer-a3453",
  storageBucket: "mtb-race-timer-a3453.firebasestorage.app",
  messagingSenderId: "612454539416",
  appId: "1:612454539416:web:619cb0fe16cad484ad70ed",
  measurementId: "G-FGWWBVV5JN",
};

// Initialize once
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// App ID fallback (if you still need a separate identifier)
export const appId = firebaseConfig.appId;
