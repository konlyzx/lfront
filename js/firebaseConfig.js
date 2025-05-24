// frontend/js/firebaseConfig.js
// Importa sólo los módulos que uses
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
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
  where
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCONpN36OA2HMkMQ8Uz7CwjiXKCIfCzH9k",
    authDomain: "legalysite.firebaseapp.com",
    projectId: "legalysite",
    storageBucket: "legalysite.firebasestorage.app",
    messagingSenderId: "889729650109",
    appId: "1:889729650109:web:1f16b3b4016c60200e16d4"
  };

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Función para verificar si el usuario está autenticado
function checkAuth(callback, adminRequired = false) {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            // Usuario autenticado, verificar rol si es necesario
            if (adminRequired) {
                try {
                    const userDoc = await getDoc(doc(db, "users", user.uid));
                    const userData = userDoc.data();
                    
                    if (userData && userData.role === 'admin') {
                        // Es administrador, permitir acceso
                        callback(user, userData);
                    } else {
                        // No es administrador, redirigir
                        window.location.href = "/frontend/index.html";
                    }
                } catch (error) {
                    console.error("Error al verificar rol:", error);
                    window.location.href = "/frontend/login.html";
                }
            } else {
                // No se requiere rol de admin, permitir acceso
                callback(user);
            }
        } else {
            // No autenticado, redirigir a login
            window.location.href = "/frontend/login.html";
        }
    });
}

// Función para cerrar sesión
async function logoutUser() {
    try {
        await signOut(auth);
        window.location.href = "/frontend/login.html";
    } catch (error) {
        console.error("Error al cerrar sesión:", error);
    }
}

export {
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
  checkAuth,
  logoutUser
}; 