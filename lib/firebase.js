import { initializeApp, getApps } from "firebase/app";
import {
    getAuth,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
} from "firebase/auth";
import {
    getFirestore,
    doc,
    getDoc,
    setDoc,
    collection,
    getDocs,
    updateDoc,
    deleteDoc,
    query,
    where,
} from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyCONpN36OA2HMkMQ8Uz7CwjiXKCIfCzH9k",
    authDomain: "legalysite.firebaseapp.com",
    projectId: "legalysite",
    storageBucket: "legalysite.firebasestorage.app",
    messagingSenderId: "889729650109",
    appId: "1:889729650109:web:1f16b3b4016c60200e16d4",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);

export {
    app,
    auth,
    db,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    doc,
    getDoc,
    setDoc,
    collection,
    getDocs,
    updateDoc,
    deleteDoc,
    query,
    where,
};
