import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCNLqVlK4vZPAdjKJGDwTci-FlDsaQjvWE",
  authDomain: "neu-library-visitor-log-eefe3.firebaseapp.com",
  projectId: "neu-library-visitor-log-eefe3",
  storageBucket: "neu-library-visitor-log-eefe3.firebasestorage.app",
  messagingSenderId: "444499607905",
  appId: "1:444499607905:web:0277d54a8746bbf9290520"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);