// Import the functions you need from the SDKs you need
import { getAnalytics } from "firebase/analytics";
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA8r9k0YqKUJhsRAGJZTmlGWzh738x-ZFM",
  authDomain: "foundit-fd4bf.firebaseapp.com",
  projectId: "foundit-fd4bf",
  storageBucket: "foundit-fd4bf.firebasestorage.app",
  messagingSenderId: "537878915875",
  appId: "1:537878915875:web:4dd5a5e2c13d61c8cffa96",
  measurementId: "G-9VT2VQLWZR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize Analytics (optional - only works on web)
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export default app; 