import {
  auth,
  db,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  doc,
  getDoc
} from "./firebaseConfig.js";

// Elementos del DOM
const form = document.getElementById("loginForm");
const loginBtn = document.getElementById("loginBtn");
const errorDiv = document.getElementById("errorMsg");

// Verificar si el usuario ya está autenticado
onAuthStateChanged(auth, async (user) => {
  if (user) {
    // El usuario ya está logueado, verificar su rol y redirigir
    try {
      const userDocRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userDocRef);
      
      if (userSnap.exists()) {
        const { role } = userSnap.data();
        
        // Redirigir según rol
        redirectByRole(role);
      } else {
        // Usuario autenticado pero sin documento en Firestore
        console.error("Usuario sin perfil en la base de datos");
        showError("Usuario sin perfil asignado. Contacte al administrador.");
      }
    } catch (err) {
      console.error("Error al verificar rol:", err);
      showError("Error al verificar credenciales. Intente nuevamente.");
    }
  }
});

// Manejar envío del formulario
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearError();
  setLoading(true);
  
  const email = form.email.value.trim();
  const password = form.password.value;
  
  try {
    // 1) Autenticar con Firebase
    const { user } = await signInWithEmailAndPassword(auth, email, password);
    
    // 2) Obtener documento de usuario desde Firestore
    const userDocRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userDocRef);
    
    if (!userSnap.exists()) {
      throw new Error("Perfil de usuario no encontrado");
    }
    
    const { role } = userSnap.data();
    
    // 3) Redirigir según rol
    redirectByRole(role);
    
  } catch (err) {
    console.error("Error en autenticación:", err);
    
    // Traducir mensajes de error comunes
    if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
      showError("Correo electrónico o contraseña incorrectos");
    } else if (err.code === 'auth/too-many-requests') {
      showError("Demasiados intentos fallidos. Intente más tarde");
    } else if (err.code === 'auth/invalid-credential') {
      showError("Credenciales inválidas");
    } else {
      showError(err.message || "Error al iniciar sesión");
    }
    
    setLoading(false);
  }
});

// Función para redirigir según el rol
function redirectByRole(role) {
  // Redirigir a todos los usuarios al frontend primero, independientemente del rol
  window.location.href = "index.html";
  
  // Nota: Ya no hacemos redirección directa al panel de admin
  // El enlace al panel estará visible sólo para admins en el frontend
}

// Funciones auxiliares
function showError(message) {
  errorDiv.textContent = message;
  errorDiv.classList.add("show");
}

function clearError() {
  errorDiv.textContent = "";
  errorDiv.classList.remove("show");
}

function setLoading(isLoading) {
  if (isLoading) {
    loginBtn.classList.add("loading");
    loginBtn.disabled = true;
  } else {
    loginBtn.classList.remove("loading");
    loginBtn.disabled = false;
  }
} 