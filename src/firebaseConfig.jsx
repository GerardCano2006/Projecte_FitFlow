import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth"; 
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDuFHo8CCPui5NZ-TQZVTZq_cHbvF6Ep3M",
  authDomain: "fitflow-2839c.firebaseapp.com",
  projectId: "fitflow-2839c",
  storageBucket: "fitflow-2839c.firebasestorage.app",
  messagingSenderId: "363448656051",
  appId: "1:363448656051:web:24b1b4ab8911b1d03450c6",
  measurementId: "G-5HS77D64RP"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();