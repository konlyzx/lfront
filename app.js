document.addEventListener('DOMContentLoaded', () => {
    // --- Protección básica del lado del cliente y bienvenida ---
    const token = localStorage.getItem('token');
    if (!token) {
        // Si no hay token, y el servidor no nos ha redirigido ya,
        // lo hacemos desde el cliente para mayor seguridad o en caso de error del server.
        // Esto es una doble capa, la principal es el middleware requireAuth del servidor.
        console.log('No hay token, redirigiendo a login desde app.js');
        // window.location.href = '/login.html'; // Descomentar si quieres forzar redirección aquí también
    } else {
        // Podrías aquí decodificar el token (con una librería como jwt-decode si es necesario)
        // para personalizar el saludo, pero requireAuth en el servidor ya lo validó.
        console.log('Token encontrado. El usuario debería estar autenticado.');
        // Ejemplo: obtener el email del token si lo guardaste allí durante el login en el backend
        // (Tendrías que modificar /api/login para devolver el email o decodificar el token aquí)
    }

    // --- Botón de Cerrar Sesión ---
    // Asume que tienes un botón con id="logoutButton" en tu frontend/index.html
    // Si no lo tienes, puedes añadirlo o vincularlo a un elemento existente.
    // Ejemplo de botón que podrías añadir en tu sidebar o header:
    // <button id="logoutButton" class="button-logout">Cerrar Sesión</button>
    const logoutButton = document.getElementById('logoutButton'); // CAMBIA 'logoutButton' SI TU ID ES DIFERENTE
    if (logoutButton) {
        logoutButton.onclick = () => {
            localStorage.removeItem('token');
            // Opcionalmente, también puedes borrar otra información de sesión que hayas guardado
            // localStorage.removeItem('userRole'); 
            window.location.href = '/login.html'; // Redirigir a la página de login
        };
    } else {
        console.warn('Elemento con id "logoutButton" no encontrado. La funcionalidad de cerrar sesión no estará activa.');
    }

    // --- Botón para Probar API Secreta ---
    // Asume que tienes un botón con id="callApiButton" y un pre con id="apiResponseOutput"
    // Ejemplo:
    // <button id="callApiButton">Llamar API Protegida</button>
    // <pre id="apiResponseOutput"></pre>
    const callApiButton = document.getElementById('callApiButton'); // CAMBIA 'callApiButton'
    const apiResponseOutput = document.getElementById('apiResponseOutput'); // CAMBIA 'apiResponseOutput'

    if (callApiButton && apiResponseOutput) {
        callApiButton.onclick = async () => {
            const currentToken = localStorage.getItem('token'); // Re-leer el token por si acaso
            apiResponseOutput.textContent = 'Llamando a la API...';
            apiResponseOutput.style.color = 'black';

            if (!currentToken) {
                apiResponseOutput.textContent = 'Error: No hay token en localStorage. Por favor, inicia sesión de nuevo.';
                apiResponseOutput.style.color = 'red';
                // Opcional: Redirigir a login si no hay token al intentar llamar API protegida
                // window.location.href = '/login.html';
                return;
            }

            try {
                const res = await fetch('/api/secret', {
                    headers: { 'Authorization': `Bearer ${currentToken}` }
                });
                const data = await res.json(); // Intentar parsear como JSON siempre

                if (!res.ok) {
                    apiResponseOutput.textContent = `Error ${res.status}: ${data.error || res.statusText || 'Error desconocido al llamar a la API.'}`;
                    apiResponseOutput.style.color = 'red';
                } else {
                    apiResponseOutput.textContent = JSON.stringify(data, null, 2);
                    apiResponseOutput.style.color = 'green';
                }
            } catch (err) {
                apiResponseOutput.textContent = `Error en la petición: ${err.message}`;
                apiResponseOutput.style.color = 'red';
            }
        };
    } else {
        if (!callApiButton) console.warn('Elemento con id "callApiButton" no encontrado.');
        if (!apiResponseOutput) console.warn('Elemento con id "apiResponseOutput" no encontrado.');
    }

    // --- URLs y Estado de Backend --- 
    const BASE_PORTS = [3001, 3002, 3003, 3004, 3005]; 
    let API_BASE_URL = ''; 
    let API_SEND_FIRMA_UPLOAD_URL = ''; 

    // --- Elementos del DOM --- 
    const firmaForm = document.getElementById('firma-form');
    const phoneInput = document.getElementById('phone');
    const param1Input = document.getElementById('param1');
    const param2Input = document.getElementById('param2');
    const pdfFileInput = document.getElementById('pdf-file');
    const fileNameDisplay = document.getElementById('file-name-display');
    const sendButton = document.getElementById('sendBtn');
    const statusDiv = document.getElementById('status');
    const formCard = document.getElementById('form-card');
    const fileUploadArea = document.getElementById('file-upload-area');
    const fileUploadLabel = document.querySelector('.file-upload-label');
    const successAnimation = document.getElementById('success-animation');
    const recipientName = document.getElementById('recipient-name');
    const recipientPhone = document.getElementById('recipient-phone');
    const mainContent = document.getElementById('main-content');
    // const optionalMessageInput = document.getElementById('optional-message'); // Si se usa en el futuro

    // --- Asegurar que el contenido sea visible inicialmente ---
    document.body.style.opacity = 1;
    document.body.style.visibility = 'visible';
    mainContent.style.opacity = 1;
    formCard.style.opacity = 1;
    formCard.style.display = 'block';
    
    // --- Inicialización de GSAP ---
    let formGroups = document.querySelectorAll('.form-group');
    
    // Timeline para la animación inicial - La iniciamos después de todo el código
    let initialTimeline;

    // --- Funciones para View Transitions API ---
    const supportsViewTransitions = !!document.startViewTransition;
    
    // Función para navegar con transiciones
    function navigateWithTransition(url) {
        if (!supportsViewTransitions) {
            window.location.href = url;
            return;
        }

        document.startViewTransition(() => {
            // Guardar la posición del scroll
            sessionStorage.setItem('scrollPosition', window.scrollY);
            window.location.href = url;
        });
    }

    // Aplicar a enlaces del sidebar
    document.querySelectorAll('.sidebar-nav a').forEach(link => {
        link.addEventListener('click', (e) => {
            if (link.getAttribute('href') !== '#') {
                e.preventDefault();
                navigateWithTransition(link.getAttribute('href'));
            }
        });
    });

    // --- Funciones Auxiliares --- 

    // Mostrar mensajes de estado
    function showStatus(message, type) {
        // Guardar el estado actual para GSAP Flip
        const state = Flip.getState(statusDiv);
        
        statusDiv.textContent = message;
        statusDiv.className = `status-notification ${type}`;
        statusDiv.style.display = 'block';
        
        // Animar con GSAP Flip
        Flip.from(state, {
            duration: 0.5,
            ease: "back.out(1.7)",
            onComplete: () => {
                if (type === 'success' || type === 'error') {
                    // Desaparecer después de un tiempo
                    gsap.to(statusDiv, {
                        delay: 5,
                        opacity: 0,
                        y: -10,
                        onComplete: () => {
                            statusDiv.style.display = 'none';
                            gsap.set(statusDiv, { opacity: 1, y: 0 });
                        }
                    });
                }
            }
        });
    }

    // Limpiar mensajes de estado
    function clearStatus() {
        gsap.to(statusDiv, {
            opacity: 0,
            y: -10,
            duration: 0.3,
            onComplete: () => {
                statusDiv.style.display = 'none';
                statusDiv.textContent = '';
                gsap.set(statusDiv, { opacity: 1, y: 0 });
            }
        });
    }

    // Validar número de teléfono
    function validatePhone(phone) {
        return /^\+?\d{10,}$/.test(phone); // Permitir + opcional, mínimo 10 dígitos
    }
    
    // Mostrar nombre de archivo seleccionado
    function displayFileName() {
        if (pdfFileInput.files && pdfFileInput.files.length > 0) {
            // Guardar estado para GSAP Flip
            const state = Flip.getState(fileNameDisplay);
            
            fileNameDisplay.textContent = pdfFileInput.files[0].name;
            fileUploadLabel.classList.add('has-file');
            
            // Aplicar animación con GSAP Flip
            Flip.from(state, {
                duration: 0.4,
                ease: "back.out(1.5)",
            });
            
            // Animar el icono
            gsap.to('.upload-icon', {
                scale: 1.2,
                duration: 0.3,
                yoyo: true,
                repeat: 1
            });
        } else {
            fileNameDisplay.textContent = 'Ningún archivo seleccionado';
            fileUploadLabel.classList.remove('has-file');
        }
    }

    // Animar éxito de envío
    function showSuccessAnimation(name, phone) {
        recipientName.textContent = `Nombre: ${name}`;
        recipientPhone.textContent = `Teléfono: ${phone}`;
        
        // Ocultar el formulario con GSAP
        gsap.to(formCard, {
            opacity: 0,
            y: 30,
            duration: 0.5,
            ease: "power2.inOut",
            onComplete: () => {
                formCard.style.display = 'none';
                
                // Mostrar y animar la pantalla de éxito
                successAnimation.style.display = 'flex';
                gsap.fromTo(successAnimation,
                    { opacity: 0, scale: 0.9 },
                    { 
                        opacity: 1, 
                        scale: 1, 
                        duration: 0.6, 
                        ease: "elastic.out(0.7, 0.5)",
                        onComplete: () => {
                            // Animar el ícono de éxito
                            gsap.to('.success-icon', {
                                rotation: "+=360",
                                duration: 0.8,
                                ease: "power1.inOut"
                            });
                            
                            // Animar los detalles
                            gsap.fromTo('.success-details', 
                                { opacity: 0, y: 20 },
                                { 
                                    opacity: 1, 
                                    y: 0, 
                                    duration: 0.5,
                                    delay: 0.2
                                }
                            );
                            
                            // Reiniciar después de 5 segundos
                            setTimeout(resetForm, 5000);
                        }
                    }
                );
            }
        });
    }

    // Resetear formulario y animaciones
    function resetForm() {
        // Ocultar pantalla de éxito
        gsap.to(successAnimation, {
            opacity: 0,
            scale: 0.9,
            duration: 0.4,
            onComplete: () => {
                successAnimation.style.display = 'none';
                formCard.style.display = 'block';
                
                // Reiniciar formulario
                firmaForm.reset();
                displayFileName();
                
                // Mostrar formulario con animación
                gsap.fromTo(formCard,
                    { opacity: 0, y: 30 },
                    { 
                        opacity: 1, 
                        y: 0, 
                        duration: 0.5, 
                        ease: "power2.out",
                        onComplete: () => {
                            // Animar los campos individuales
                            gsap.fromTo(formGroups, 
                                { opacity: 0, y: 20 },
                                { 
                                    opacity: 1, 
                                    y: 0, 
                                    stagger: 0.1, 
                                    duration: 0.3
                                }
                            );
                        }
                    }
                );
            }
        });
    }

    // Manejar respuestas de API
    async function processApiResponse(response) {
        let data;
        const responseText = await response.text();
        try {
            data = JSON.parse(responseText);
        } catch (e) {
            console.error('Error al parsear JSON:', e, responseText);
            throw new Error('Respuesta inválida del servidor.');
        }
        if (!response.ok) {
            const errorMsg = data.error || `Error ${response.status}`;
            console.error('Error API:', data);
            throw new Error(errorMsg);
        }
        return data;
    }

    // --- Lógica Principal --- 

    // Encontrar backend activo
    async function findActiveBackend() {
        for (const port of BASE_PORTS) {
            try {
                const url = `https://api.legaly.space`;
                const response = await fetch(url, { method: 'GET', signal: AbortSignal.timeout(1000) });
                if (response.ok) {
                    API_BASE_URL = url;
                    API_SEND_FIRMA_UPLOAD_URL = `${API_BASE_URL}/api/send-firma-with-upload`;
                    console.log(`Backend encontrado en ${API_BASE_URL}`);
                    return true;
                }
            } catch (error) { /* Ignorar errores de conexión */ }
        }
        return false;
    }

    // Inicializar la aplicación
    async function initApp() {
        // Iniciar animaciones de entrada
        startEntryAnimations();
        
        showStatus('Conectando con el servidor...', 'loading');
        const backendFound = await findActiveBackend();
        if (backendFound) {
            showStatus('Conectado al servidor - Listo para enviar invitaciones.', 'success');
        } else {
            showStatus('Error: No se pudo conectar al servidor backend.', 'error');
        }
        
        // Configurar eventos de arrastrar y soltar para el área de carga de archivos
        setupDragAndDrop();
    }
    
    // Iniciar animaciones de entrada
    function startEntryAnimations() {
        // Asegurar que los elementos sean visibles
        formCard.style.opacity = 1;
        
        // Crear timeline
        initialTimeline = gsap.timeline({ 
            defaults: { 
                duration: 0.5, 
                ease: "power2.out" 
            }
        });
        
        // Animaciones de entrada
        initialTimeline
            .from(formCard, { 
                y: 30, 
                opacity: 0, 
                duration: 0.7, 
                clearProps: "all" 
            })
            .from(formGroups, { 
                y: 20, 
                opacity: 0, 
                stagger: 0.1, 
                duration: 0.4,
                clearProps: "all"
            }, "-=0.3");
    }
    
    // Configurar Drag and Drop para subida de archivos
    function setupDragAndDrop() {
        const dropZone = fileUploadLabel;
        
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });
        
        ['dragleave', 'dragend'].forEach(eventName => {
            dropZone.addEventListener(eventName, (e) => {
                e.preventDefault();
                dropZone.classList.remove('drag-over');
            });
        });
        
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
            
            if (e.dataTransfer.files.length) {
                pdfFileInput.files = e.dataTransfer.files;
                displayFileName();
                // Animar áreas afectadas
                gsap.fromTo(fileUploadArea,
                    { scale: 1.02 },
                    { scale: 1, duration: 0.3, ease: "elastic.out(1, 0.5)" }
                );
            }
        });
    }

    // Enviar la invitación de firma (Plantilla 'firma' con PDF)
    async function sendSignatureRequest(event) {
        event.preventDefault(); // Prevenir envío normal del formulario
        clearStatus(); // Limpiar estado previo

        if (!API_SEND_FIRMA_UPLOAD_URL) {
            showStatus('Error: Aún no hay conexión con el servidor.', 'error');
            return;
        }

        // Obtener y validar datos
        const phone = phoneInput.value.trim();
        const param1 = param1Input.value.trim();
        const param2 = param2Input.value.trim();
        const pdfFile = pdfFileInput.files[0];

        if (!phone || !validatePhone(phone)) {
            showStatus('Ingresa un número de WhatsApp válido (con código de país).', 'error');
            
            // Animar campo de teléfono con error
            gsap.to(phoneInput, {
                x: [-5, 5, -5, 5, 0],
                duration: 0.4,
                ease: "power1.inOut",
                borderColor: "#ef4444"
            });
            return;
        }
        if (!param1) {
            showStatus('Ingresa el nombre del destinatario.', 'error');
            // Animar campo con error
            gsap.to(param1Input, {
                x: [-5, 5, -5, 5, 0],
                duration: 0.4,
                ease: "power1.inOut",
                borderColor: "#ef4444"
            });
            return;
        }
        if (!param2) {
            showStatus('Ingresa el nombre del remitente.', 'error');
            // Animar campo con error
            gsap.to(param2Input, {
                x: [-5, 5, -5, 5, 0],
                duration: 0.4,
                ease: "power1.inOut",
                borderColor: "#ef4444"
            });
            return;
        }
        if (!pdfFile) {
            showStatus('Selecciona el archivo PDF para la firma.', 'error');
            // Animar área de carga de archivo con error
            gsap.to(fileUploadLabel, {
                scale: [1, 1.03, 1],
                duration: 0.5,
                borderColor: "#ef4444",
                ease: "power1.inOut"
            });
            return;
        }
        if (pdfFile.type !== 'application/pdf') {
            showStatus('El archivo debe ser de tipo PDF.', 'error');
            // Animar área de carga de archivo con error
            gsap.to(fileUploadLabel, {
                scale: [1, 1.03, 1],
                duration: 0.5,
                borderColor: "#ef4444",
                ease: "power1.inOut"
            });
            return;
        }

        // Construir FormData
        const formData = new FormData();
        formData.append('to', phone.replace('+', '')); // Enviar sin el +
        formData.append('template', 'firma'); // Plantilla específica
        formData.append('language', 'es_CO'); // Idioma específico
        formData.append('param1', param1);
        formData.append('param2', param2);
        formData.append('pdfFile', pdfFile, pdfFile.name);
        // formData.append('optionalMessage', optionalMessageInput.value.trim()); // Si se usa en el futuro

        // Enviar datos
        sendButton.disabled = true;
        
        // Animar botón de envío
        gsap.to(sendButton, {
            scale: 0.95,
            duration: 0.2
        });
        
        showStatus('Enviando invitación de firma...', 'loading');

        try {
            console.log(`Enviando invitación (firma) a: ${phone}`);
            const authToken = localStorage.getItem('token');
            const response = await fetch(API_SEND_FIRMA_UPLOAD_URL, {
                method: 'POST',
                body: formData,
                headers: {
                    ...(authToken && { 'Authorization': `Bearer ${authToken}` })
                }
            });

            const data = await processApiResponse(response);
            
            // Mostrar la animación de éxito
            showSuccessAnimation(param1, phone);
            
            console.log('Respuesta del servidor:', data);

        } catch (error) {
            showStatus(`Error al enviar: ${error.message}`, 'error');
            console.error('Error completo al enviar:', error);
            
            // Animar botón de envío para indicar error
            gsap.to(sendButton, {
                scale: 1,
                duration: 0.2
            });
        } finally {
            sendButton.disabled = false;
        }
    }

    // --- Event Listeners --- 
    firmaForm.addEventListener('submit', sendSignatureRequest);
    pdfFileInput.addEventListener('change', displayFileName);
    
    // Animación en el focus de los campos
    document.querySelectorAll('input[type="text"], textarea').forEach(input => {
        input.addEventListener('focus', () => {
            gsap.to(input, {
                scale: 1.01,
                duration: 0.2,
                ease: "power1.out",
                transformOrigin: "left center"
            });
        });
        
        input.addEventListener('blur', () => {
            gsap.to(input, {
                scale: 1,
                duration: 0.2,
                ease: "power1.in",
                clearProps: "borderColor"
            });
        });
    });
    
    // Limpiar estado al escribir en cualquier input
    [phoneInput, param1Input, param2Input, pdfFileInput].forEach(input => {
        input.addEventListener('input', clearStatus);
        input.addEventListener('change', clearStatus); // Para file input
    });
    // optionalMessageInput.addEventListener('input', clearStatus); // Si se usa

    // --- Inicialización --- 
    // Comprobar si venimos desde otra página
    window.addEventListener('pageshow', function(event) {
        if (event.persisted) {
            // La página fue cargada desde la caché de navegación hacia atrás/adelante
            console.log('Página restaurada desde caché - reiniciando animaciones');
            startEntryAnimations();
        }
    });
    
    // Iniciar la aplicación
    initApp();

    // --- NUEVO: Lógica para Panel de Administrador y Perfil ---
    const adminPanel = document.getElementById('adminPanel'); // Necesitarás añadir <div id="adminPanel"></div> en index.html
    const profileDisplay = document.getElementById('profileDisplay'); // <div id="profileDisplay"></div>
    const viewProfileButton = document.getElementById('viewProfileButton'); // <button id="viewProfileButton">Ver Perfil</button>
    const fetchAdminDataButton = document.getElementById('fetchAdminDataButton'); // <button id="fetchAdminDataButton">Ver Datos Admin</button>

    // Función para mostrar/ocultar panel de admin según el rol
    function setupAdminFeatures() {
        const storedRole = localStorage.getItem('userRole'); // Asumimos que guardas el rol tras el login
        if (storedRole === 'owner' && adminPanel && fetchAdminDataButton) {
            adminPanel.style.display = 'block'; // Muestra el panel
            fetchAdminDataButton.style.display = 'inline-block';
            fetchAdminDataButton.onclick = async () => {
                const currentToken = localStorage.getItem('token');
                if (!currentToken) { adminPanel.innerHTML = '<p>Error: No autenticado.</p>'; return; }
                try {
                    const res = await fetch('/api/admin-data', { headers: { 'Authorization': `Bearer ${currentToken}` } });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || 'Error al cargar datos de admin');
                    adminPanel.innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
                } catch (err) {
                    adminPanel.innerHTML = `<p style="color:red;">Error: ${err.message}</p>`;
                }
            };
        } else {
            if (adminPanel) adminPanel.style.display = 'none';
            if (fetchAdminDataButton) fetchAdminDataButton.style.display = 'none';
        }
    }

    // Lógica para el botón de ver perfil
    if (viewProfileButton && profileDisplay) {
        viewProfileButton.onclick = async () => {
            const currentToken = localStorage.getItem('token');
            if (!currentToken) { profileDisplay.innerHTML = '<p>Error: No autenticado.</p>'; return; }
            profileDisplay.innerHTML = '<p>Cargando perfil...</p>';
            try {
                const res = await fetch('/api/profile', { headers: { 'Authorization': `Bearer ${currentToken}` } });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Error al cargar perfil');
                profileDisplay.innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
            } catch (err) {
                profileDisplay.innerHTML = `<p style="color:red;">Error: ${err.message}</p>`;
            }
        };
    }

    // Guardar el rol del usuario en localStorage después del login exitoso.
    // Esto necesita modificar tu frontend/login.js
    // En login.js, donde haces localStorage.setItem('token', data.token);
    // Añade: localStorage.setItem('userRole', data.role);
    // Y asegúrate que /api/login en backend devuelve 'role' en su JSON de respuesta (ya lo hace).

    // Inicializar funcionalidades de admin/perfil si el usuario ya está logueado
    if (token) {
        setupAdminFeatures(); // Llama a esto para configurar la visibilidad del panel de admin
    }
}); 
