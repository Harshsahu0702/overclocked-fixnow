import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
    apiKey: "AIzaSyAYJJ2mW12gybSB2z5ZJvIBzB9yL4BXP4A",
    authDomain: "fixnow-b7e61.firebaseapp.com",
    projectId: "fixnow-b7e61",
    storageBucket: "fixnow-b7e61.firebasestorage.app",
    messagingSenderId: "613585560584",
    appId: "1:613585560584:web:247af5dbb18cfbb7d9ddbd",
    measurementId: "G-W6VZLTZ5W4"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
