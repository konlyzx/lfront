import { 
    auth, 
    db, 
    signInWithEmailAndPassword,
    doc, 
    setDoc,
    collection,
    getDocs,
    updateDoc,
    deleteDoc
} from "../js/firebaseConfig.js";

// Configuración de la URL del backend
// Si estamos en desarrollo local, usamos localhost, sino la URL de producción
const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const BACKEND_URL = isLocalDev ? 'https://api.legaly.space' : 'https://api.legaly.space';
console.log('🔌 Conectando con el backend en:', BACKEND_URL);

// URLs de API
const API_URLS = {
    CREATE_USER: `${BACKEND_URL}/crear-usuario`,
    UPDATE_ROLE: `${BACKEND_URL}/actualizar-rol`,
    DELETE_USER: `${BACKEND_URL}/eliminar-usuario`,
    HEALTH: `${BACKEND_URL}/health`,
};

// Función para mostrar notificaciones
function showNotification(message, type = 'info') {
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Añadir al DOM
    document.body.appendChild(notification);
    
    // Auto-eliminar después de 5 segundos
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

// Función para verificar la conexión con el backend
async function checkBackendConnection() {
    console.log(`Intentando conectar con: ${API_URLS.HEALTH}`);
    
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos de timeout
        
        const response = await fetch(API_URLS.HEALTH, {
            signal: controller.signal,
            headers: {
                'Accept': 'application/json'
            }
        });
        
        clearTimeout(timeoutId);
        
        console.log('Respuesta recibida:', response.status, response.statusText);
        console.log('Content-Type:', response.headers.get('content-type'));
        
        // Verificar que la respuesta sea JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            console.error('La respuesta no es JSON:', contentType);
            const text = await response.text();
            console.error('Contenido de la respuesta:', text.substring(0, 200) + '...');
            showNotification('⚠️ El servidor respondió con formato incorrecto, no es JSON', 'warning');
            return false;
        }
        
        const data = await response.json();
        console.log('Datos recibidos:', data);
        
        if (data && data.status === 'ok') {
            return true;
        } else {
            console.warn('Respuesta inesperada:', data);
            return false;
        }
    } catch (error) {
        if (error.name === 'AbortError') {
            console.error('Timeout al conectar con el backend');
        } else if (error.name === 'SyntaxError') {
            console.error('Error al procesar la respuesta JSON:', error);
        } else {
            console.error('Error al conectar con el backend:', error);
        }
        return false;
    }
}

// Esperamos a que el DOM esté completamente cargado
window.addEventListener('DOMContentLoaded', async () => {
    console.log("DOM completamente cargado");
    
    // Verificar conexión con el backend
    const isBackendConnected = await checkBackendConnection();
    if (!isBackendConnected) {
        console.error('No se pudo conectar con el backend');
        return;
    }
    
    // Referencias DOM - formulario y campos
    const userForm = document.getElementById('userForm');
    const nameInput = document.getElementById('userName');
    const emailInput = document.getElementById('userEmail');
    const passwordInput = document.getElementById('userPassword');
    const roleSelect = document.getElementById('userRole');
    const resetBtn = document.getElementById('resetBtn');
    const saveUserBtn = document.getElementById('saveUserBtn');
    
    // Referencias DOM - notificaciones y tablas
    const notification = document.getElementById('notification');
    const notificationMessage = document.getElementById('notification-message');
    const loadingUsers = document.getElementById('loadingUsers');
    const usersTableContainer = document.getElementById('usersTableContainer');
    const noUsersMessage = document.getElementById('noUsersMessage');
    const usersTableBody = document.getElementById('usersTableBody');
    
    // Referencias DOM - modal de eliminación
    const deleteModalOverlay = document.getElementById('deleteModalOverlay');
    const deleteUserName = document.getElementById('deleteUserName');
    const closeDeleteModal = document.getElementById('closeDeleteModal');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    
    // Referencias DOM - modal de edición
    const editRoleModalOverlay = document.getElementById('editRoleModalOverlay');
    const editUserName = document.getElementById('editUserName');
    const editUserRole = document.getElementById('editUserRole');
    const closeEditRoleModal = document.getElementById('closeEditRoleModal');
    const cancelEditRoleBtn = document.getElementById('cancelEditRoleBtn');
    const confirmEditRoleBtn = document.getElementById('confirmEditRoleBtn');
    
    // --------------- VERIFICACIÓN DE ELEMENTOS ---------------
    const domElements = [
        ['userForm', userForm],
        ['userName', nameInput],
        ['userEmail', emailInput],
        ['userPassword', passwordInput],
        ['userRole', roleSelect],
        ['resetBtn', resetBtn],
        ['saveUserBtn', saveUserBtn],
        ['notification', notification],
        ['notification-message', notificationMessage],
        ['loadingUsers', loadingUsers],
        ['usersTableContainer', usersTableContainer],
        ['noUsersMessage', noUsersMessage],
        ['usersTableBody', usersTableBody],
        ['deleteModalOverlay', deleteModalOverlay],
        ['deleteUserName', deleteUserName],
        ['closeDeleteModal', closeDeleteModal],
        ['cancelDeleteBtn', cancelDeleteBtn],
        ['confirmDeleteBtn', confirmDeleteBtn],
        ['editRoleModalOverlay', editRoleModalOverlay],
        ['editUserName', editUserName],
        ['editUserRole', editUserRole],
        ['closeEditRoleModal', closeEditRoleModal],
        ['cancelEditRoleBtn', cancelEditRoleBtn],
        ['confirmEditRoleBtn', confirmEditRoleBtn]
    ];
    
    // Verificamos que todos los elementos existan
    let elementsValid = true;
    domElements.forEach(([id, element]) => {
        if (!element) {
            console.error(`⚠️ Error: No se encontró el elemento con id="${id}" en el DOM`);
            elementsValid = false;
        }
    });
    
    // Si falta algún elemento, detenemos la ejecución
    if (!elementsValid) {
        console.error("❌ No se puede continuar. Faltan elementos en el DOM.");
        return;
    }
    
    console.log("✅ Todos los elementos del DOM verificados correctamente");
    
    // Variables para operaciones
    let currentUserToDelete = null;
    let currentUserToEdit = null;
    
    // Cargar usuarios desde Firestore
    loadUsers();
    
    // --------------- EVENT LISTENERS ---------------
    userForm.addEventListener('submit', handleCreateUser);
    resetBtn.addEventListener('click', () => userForm.reset());
    
    // Modal de eliminación
    closeDeleteModal.addEventListener('click', hideDeleteModal);
    cancelDeleteBtn.addEventListener('click', hideDeleteModal);
    confirmDeleteBtn.addEventListener('click', confirmDeleteUser);
    
    // Modal de edición
    closeEditRoleModal.addEventListener('click', hideEditRoleModal);
    cancelEditRoleBtn.addEventListener('click', hideEditRoleModal);
    confirmEditRoleBtn.addEventListener('click', confirmEditUserRole);
    
    // --------------- FUNCIONES PRINCIPALES ---------------
    
    // Crear usuario usando el backend con Firebase Admin
    async function handleCreateUser(e) {
        e.preventDefault();
        
        // Obtenemos los elementos usando selectores más específicos de formulario
        const formNameInput = document.querySelector('form#userForm #userName');
        const formEmailInput = document.querySelector('form#userForm #userEmail');
        const formPasswordInput = document.querySelector('form#userForm #userPassword');
        const formRoleSelect = document.querySelector('form#userForm #userRole');
        
        console.log('Elementos del formulario:', { 
            nameInput: formNameInput, 
            emailInput: formEmailInput, 
            passwordInput: formPasswordInput, 
            roleSelect: formRoleSelect 
        });
        
        // Validación de elementos DOM
        if (!formNameInput || !formEmailInput || !formPasswordInput || !formRoleSelect) {
            console.error('Error: Algún elemento del formulario es undefined');
            showNotification('Error en el formulario. Recarga la página e intenta de nuevo.', 'error');
            return;
        }
        
        // Debugging de tipos de elementos
        console.log('Tipo de nameInput:', formNameInput.tagName);
        console.log('Tipo de emailInput:', formEmailInput.tagName);
        console.log('Tipo de passwordInput:', formPasswordInput.tagName);
        console.log('Tipo de roleSelect:', formRoleSelect.tagName);
        
        // Extraer valores directamente de los inputs
        const name = formNameInput.value.trim();
        const email = formEmailInput.value.trim();
        const password = formPasswordInput.value.trim();
        const role = formRoleSelect.value;
        
        console.log('Valores extraídos:', { name, email, role }); // No logueamos password por seguridad
        
        // Validación de campos
        if (!name || !email || !password || !role) {
            showNotification('Por favor completa todos los campos', 'error');
            return;
        }
        
        try {
            // Deshabilitar botón mientras se procesa
            saveUserBtn.disabled = true;
            saveUserBtn.innerHTML = '<div class="spinner" style="width: 20px; height: 20px;"></div>';
            
            console.log(`Enviando petición a: ${API_URLS.CREATE_USER}`);
            
            // Timeout para la petición
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout
            
            // Llamar al backend para crear usuario con Firebase Admin
            const response = await fetch(API_URLS.CREATE_USER, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    name,
                    email,
                    password,
                    role
                }),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            console.log('Respuesta recibida:', response.status, response.statusText);
            console.log('Content-Type:', response.headers.get('content-type'));
            
            // Verificar que la respuesta sea JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                console.error('La respuesta no es JSON:', contentType);
                const text = await response.text();
                console.error('Contenido de la respuesta:', text.substring(0, 500));
                
                // Detalles adicionales para debugging
                console.error('URL completa:', API_URLS.CREATE_USER);
                console.error('Status:', response.status, response.statusText);
                console.error('Headers:', [...response.headers.entries()]);
                
                // Si es una respuesta HTML, podría ser un 404 o una redirección
                if (text.includes('<!DOCTYPE html>') || text.includes('<html>')) {
                    if (response.status === 404) {
                        throw new Error('Endpoint no encontrado (404). Verifica que el servidor tenga la ruta /crear-usuario correctamente definida');
                    } else if ([301, 302, 307, 308].includes(response.status)) {
                        throw new Error(`Redirección detectada (${response.status}). El servidor está intentando redirigir la petición`);
                    }
                }
                
                throw new Error('El servidor respondió con formato no válido (no es JSON)');
            }
            
            const data = await response.json();
            console.log('Datos de respuesta:', data);
            
            if (!response.ok) {
                throw new Error(data.error || `Error ${response.status}: ${response.statusText}`);
            }
            
            showNotification(`Usuario ${name} creado con éxito`, 'success');
            userForm.reset();
            loadUsers(); // Recargar la lista de usuarios
            
        } catch (error) {
            console.error("Error al crear usuario:", error);
            
            // Traducir mensajes de error comunes
            if (error.name === 'AbortError') {
                showNotification('La petición tomó demasiado tiempo. Verifica la conexión al servidor.', 'error');
            } else if (error.message.includes('already-in-use') || error.message.includes('email-already-exists')) {
                showNotification('El correo electrónico ya está en uso', 'error');
            } else if (error.message.includes('invalid-email')) {
                showNotification('Formato de correo electrónico inválido', 'error');
            } else if (error.message.includes('weak-password')) {
                showNotification('La contraseña es demasiado débil', 'error');
            } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                showNotification('No se pudo conectar con el servidor. Verifica que esté en ejecución.', 'error');
            } else {
                showNotification(`Error: ${error.message}`, 'error');
            }
        } finally {
            saveUserBtn.disabled = false;
            saveUserBtn.innerHTML = '<i class="fas fa-save"></i> Guardar Usuario';
        }
    }
    
    // Cargar usuarios desde Firestore
    async function loadUsers() {
        try {
            // Mostrar spinner de carga
            loadingUsers.style.display = 'flex';
            usersTableContainer.style.display = 'none';
            noUsersMessage.style.display = 'none';
            
            // Obtener todos los usuarios de Firestore
            const usersCollection = collection(db, "users");
            const usersSnapshot = await getDocs(usersCollection);
            
            // Limpiar tabla primero
            usersTableBody.innerHTML = '';
            
            if (usersSnapshot.empty) {
                // No hay usuarios
                loadingUsers.style.display = 'none';
                noUsersMessage.style.display = 'block';
                return;
            }
            
            // Poblar tabla con usuarios
            usersSnapshot.forEach(doc => {
                const userData = doc.data();
                const userId = doc.id;
                
                // Crear fila para el usuario
                const row = document.createElement('tr');
                
                // Crear celdas
                row.innerHTML = `
                    <td>${userData.name || 'Sin nombre'}</td>
                    <td>${userData.email}</td>
                    <td>
                        <span class="user-role ${userData.role === 'admin' ? 'role-admin' : 'role-user'}">
                            ${userData.role === 'admin' ? 'Administrador' : 'Usuario'}
                        </span>
                    </td>
                    <td class="user-actions">
                        <button class="user-action-btn edit-btn" data-id="${userId}" data-name="${userData.name || 'Usuario'}" data-role="${userData.role}">
                            <i class="fas fa-user-edit"></i>
                        </button>
                        <button class="user-action-btn delete-btn" data-id="${userId}" data-name="${userData.name || 'Usuario'}" data-email="${userData.email}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
                
                // Añadir fila a la tabla
                usersTableBody.appendChild(row);
            });
            
            // Añadir event listeners para los botones de acción
            document.querySelectorAll('.edit-btn').forEach(btn => {
                btn.addEventListener('click', showEditRoleModal);
            });
            
            document.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', showDeleteModal);
            });
            
            // Mostrar tabla
            loadingUsers.style.display = 'none';
            usersTableContainer.style.display = 'block';
            
        } catch (error) {
            console.error("Error al cargar usuarios:", error);
            loadingUsers.style.display = 'none';
            showNotification('Error al cargar usuarios', 'error');
        }
    }
    
    // Mostrar modal para eliminar usuario
    function showDeleteModal() {
        const userId = this.getAttribute('data-id');
        const userName = this.getAttribute('data-name');
        const userEmail = this.getAttribute('data-email');
        
        // Guardar usuario a eliminar
        currentUserToDelete = {
            id: userId,
            name: userName,
            email: userEmail
        };
        
        // Actualizar modal
        deleteUserName.textContent = `${userName} (${userEmail})`;
        
        // Mostrar modal
        deleteModalOverlay.style.display = 'flex';
    }
    
    // Ocultar modal de eliminación
    function hideDeleteModal() {
        deleteModalOverlay.style.display = 'none';
        currentUserToDelete = null;
    }
    
    // Confirmar eliminación de usuario usando el backend
    async function confirmDeleteUser() {
        if (!currentUserToDelete) return;
        
        try {
            // Deshabilitar botón mientras se procesa
            confirmDeleteBtn.disabled = true;
            confirmDeleteBtn.innerHTML = '<div class="spinner" style="width: 20px; height: 20px;"></div>';
            
            // Llamar al backend para eliminar usuario
            const response = await fetch(`${API_URLS.DELETE_USER}/${currentUserToDelete.id}`, {
                method: 'DELETE'
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Error al eliminar usuario');
            }
            
            showNotification(`Usuario ${currentUserToDelete.name} eliminado correctamente`, 'success');
            
            // Ocultar modal y recargar usuarios
            hideDeleteModal();
            loadUsers();
            
        } catch (error) {
            console.error("Error al eliminar usuario:", error);
            showNotification(`Error: ${error.message}`, 'error');
        } finally {
            confirmDeleteBtn.disabled = false;
            confirmDeleteBtn.innerHTML = '<i class="fas fa-trash"></i> Eliminar';
        }
    }
    
    // Mostrar modal para editar rol de usuario
    function showEditRoleModal() {
        const userId = this.getAttribute('data-id');
        const userName = this.getAttribute('data-name');
        const userRole = this.getAttribute('data-role');
        
        // Guardar usuario a editar
        currentUserToEdit = {
            id: userId,
            name: userName,
            role: userRole
        };
        
        // Actualizar modal
        editUserName.textContent = userName;
        editUserRole.value = userRole;
        
        // Mostrar modal
        editRoleModalOverlay.style.display = 'flex';
    }
    
    // Ocultar modal de edición de rol
    function hideEditRoleModal() {
        editRoleModalOverlay.style.display = 'none';
        currentUserToEdit = null;
    }
    
    // Confirmar cambio de rol de usuario usando el backend
    async function confirmEditUserRole() {
        if (!currentUserToEdit) return;
        
        const newRole = editUserRole.value;
        
        try {
            // Deshabilitar botón mientras se procesa
            confirmEditRoleBtn.disabled = true;
            confirmEditRoleBtn.innerHTML = '<div class="spinner" style="width: 20px; height: 20px;"></div>';
            
            // Llamar al backend para actualizar rol
            const response = await fetch(`${API_URLS.UPDATE_ROLE}/${currentUserToEdit.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    role: newRole
                })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Error al actualizar rol');
            }
            
            showNotification(`Rol de ${currentUserToEdit.name} actualizado a ${newRole === 'admin' ? 'Administrador' : 'Usuario'}`, 'success');
            
            // Ocultar modal y recargar usuarios
            hideEditRoleModal();
            loadUsers();
            
        } catch (error) {
            console.error("Error al actualizar rol:", error);
            showNotification(`Error: ${error.message}`, 'error');
        } finally {
            confirmEditRoleBtn.disabled = false;
            confirmEditRoleBtn.innerHTML = '<i class="fas fa-save"></i> Guardar Cambios';
        }
    }
}); 
