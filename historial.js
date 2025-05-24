document.addEventListener('DOMContentLoaded', () => {
    // --- URLs y Estado de Backend --- 
    const BASE_PORTS = [3001, 3002, 3003, 3004, 3005]; 
    let API_BASE_URL = ''; 
    let API_HISTORIAL_URL = ''; 

    // --- Elementos del DOM --- 
    const statusDiv = document.getElementById('status');
    const historialTable = document.getElementById('historial-table');
    const historialBody = document.getElementById('historial-body');
    const emptyState = document.getElementById('empty-state');
    const filterBar = document.getElementById('filter-bar');
    const pagination = document.getElementById('pagination');
    const statusFilter = document.getElementById('status-filter');
    const dateFilter = document.getElementById('date-filter');
    const searchFilter = document.getElementById('search-filter');
    const applyFilterBtn = document.getElementById('apply-filter');
    const clearFilterBtn = document.getElementById('clear-filter');

    // --- Variables de Estado --- 
    let historialData = [];
    let filteredData = [];
    let currentPage = 1;
    let itemsPerPage = 10;
    let totalPages = 0;

    // --- View Transitions API ---
    const supportsViewTransitions = !!document.startViewTransition;
    
    // Función para navegar con transiciones
    function navigateWithTransition(url) {
        if (!supportsViewTransitions) {
            window.location.href = url;
            return;
        }

        document.startViewTransition(() => {
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

    // Formatear fecha para mostrar
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // Obtener clase de estado para badges
    function getStatusClass(status) {
        if (!status) return 'status-error';
        
        status = status.toLowerCase();
        if (status.includes('firmado')) return 'status-firmado';
        if (status.includes('esperando')) return 'status-esperando';
        if (status.includes('enviado')) return 'status-enviado';
        if (status.includes('rechazado')) return 'status-rechazado';
        if (status.includes('error')) return 'status-error';
        
        return 'status-enviado';
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

    async function checkBackend() {
        try {
            const response = await fetch('https://api.legaly.space', { method: 'GET', signal: AbortSignal.timeout(1000) });
            if (response.ok) {
                console.log('Backend funcionando en https://api.legaly.space');
                return true;
            }
        } catch (error) {
            console.log('No response from backend:', error.message);
        }
        return false;
    }
    
    

    // Cargar datos del historial
    async function loadHistorialData() {
        try {
            const response = await fetch(API_HISTORIAL_URL);
            const data = await processApiResponse(response);
            
            if (data.success && Array.isArray(data.data)) {
                historialData = data.data;
                filteredData = [...historialData];
                totalPages = Math.ceil(filteredData.length / itemsPerPage);
                
                // Mostrar datos con animación
                renderHistorialTable();
                renderPagination();
                
                // Animar entrada de elementos
                animateHistorialElements();
                
                return true;
            } else {
                throw new Error('Formato de respuesta incorrecto');
            }
        } catch (error) {
            showStatus(`Error al cargar historial: ${error.message}`, 'error');
            return false;
        }
    }

    // Filtrar datos
    function filterData() {
        const statusValue = statusFilter.value;
        const dateValue = dateFilter.value;
        const searchValue = searchFilter.value.toLowerCase();
        
        filteredData = historialData.filter(item => {
            // Filtro de estado
            if (statusValue && item.firma && item.firma.status !== statusValue) {
                return false;
            }
            
            // Filtro de fecha
            if (dateValue) {
                const itemDate = new Date(item.fecha).toISOString().split('T')[0];
                if (itemDate !== dateValue) {
                    return false;
                }
            }
            
            // Filtro de búsqueda
            if (searchValue) {
                const cedula = item.cedula ? item.cedula.toLowerCase() : '';
                const nombreDest = item.firma && item.firma.recipient_name ? 
                    item.firma.recipient_name.toLowerCase() : '';
                const nombreRemit = item.firma && item.firma.sender_name ? 
                    item.firma.sender_name.toLowerCase() : '';
                
                if (!cedula.includes(searchValue) && 
                    !nombreDest.includes(searchValue) && 
                    !nombreRemit.includes(searchValue)) {
                    return false;
                }
            }
            
            return true;
        });
        
        totalPages = Math.ceil(filteredData.length / itemsPerPage);
        currentPage = 1; // Resetear a primera página
        
        renderHistorialTable();
        renderPagination();
    }

    // Renderizar tabla
    function renderHistorialTable() {
        // Guardar estado para GSAP Flip
        const state = Flip.getState(historialTable);
        
        // Limpiar contenido actual
        historialBody.innerHTML = '';
        
        // Mostrar estado vacío si no hay datos
        if (filteredData.length === 0) {
            historialTable.style.display = 'none';
            
            // Mostrar estado vacío con animación
            emptyState.style.display = 'block';
            gsap.fromTo(emptyState, 
                { opacity: 0, y: 20 },
                { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }
            );
            
            return;
        }
        
        // Ocultar estado vacío y mostrar tabla
        emptyState.style.display = 'none';
        historialTable.style.display = 'table';
        
        // Calcular rango de datos para la página actual
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, filteredData.length);
        const pageData = filteredData.slice(startIndex, endIndex);
        
        // Crear filas
        pageData.forEach(item => {
            const row = document.createElement('tr');
            
            // Extraer datos del JSON
            const fecha = formatDate(item.fecha);
            const telefono = item.cedula || 'N/A';
            const nombreDest = item.firma?.recipient_name || 'N/A';
            const nombreRemit = item.firma?.sender_name || 'N/A';
            const estado = item.firma?.status || 'Error';
            
            // Crear celdas
            row.innerHTML = `
                <td>${fecha}</td>
                <td>${telefono}</td>
                <td>${nombreDest}</td>
                <td>${nombreRemit}</td>
                <td><span class="status-badge ${getStatusClass(estado)}">${estado}</span></td>
                <td>
                    <button class="action-button view-details" data-id="${item.id}" title="Ver detalles">
                        <i class="fas fa-info-circle"></i>
                    </button>
                    ${item.firma?.modified_pdf_url ? 
                    `<a href="${item.firma.modified_pdf_url}" target="_blank" class="action-button download-pdf" title="Descargar PDF">
                        <i class="fas fa-file-pdf"></i>
                    </a>` : ''}
                </td>
            `;
            
            historialBody.appendChild(row);
        });
        
        // Animar con GSAP Flip
        Flip.from(state, {
            duration: 0.5,
            ease: "power1.out",
            stagger: 0.05,
            absolute: true
        });
    }

    // Renderizar paginación
    function renderPagination() {
        // Guardar estado para GSAP Flip
        const state = Flip.getState(pagination);
        
        pagination.innerHTML = '';
        
        if (totalPages <= 1) {
            pagination.style.display = 'none';
            return;
        }
        
        pagination.style.display = 'flex';
        
        // Botón anterior
        const prevBtn = document.createElement('button');
        prevBtn.className = `pagination-button ${currentPage === 1 ? 'disabled' : ''}`;
        prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
        prevBtn.disabled = currentPage === 1;
        prevBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                renderHistorialTable();
                renderPagination();
                
                // Scroll al inicio de la tabla
                gsap.to(window, {
                    duration: 0.5,
                    scrollTo: { y: historialTable, offsetY: 100 },
                    ease: "power2.out"
                });
            }
        });
        pagination.appendChild(prevBtn);
        
        // Botones de página
        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
        
        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }
        
        for (let i = startPage; i <= endPage; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.className = `pagination-button ${i === currentPage ? 'active' : ''}`;
            pageBtn.textContent = i;
            pageBtn.addEventListener('click', () => {
                if (i !== currentPage) {
                    currentPage = i;
                    renderHistorialTable();
                    renderPagination();
                    
                    // Scroll al inicio de la tabla
                    gsap.to(window, {
                        duration: 0.5,
                        scrollTo: { y: historialTable, offsetY: 100 },
                        ease: "power2.out"
                    });
                }
            });
            pagination.appendChild(pageBtn);
        }
        
        // Botón siguiente
        const nextBtn = document.createElement('button');
        nextBtn.className = `pagination-button ${currentPage === totalPages ? 'disabled' : ''}`;
        nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
        nextBtn.disabled = currentPage === totalPages;
        nextBtn.addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++;
                renderHistorialTable();
                renderPagination();
                
                // Scroll al inicio de la tabla
                gsap.to(window, {
                    duration: 0.5,
                    scrollTo: { y: historialTable, offsetY: 100 },
                    ease: "power2.out"
                });
            }
        });
        pagination.appendChild(nextBtn);
        
        // Animar con GSAP Flip
        Flip.from(state, {
            duration: 0.5,
            ease: "power1.out",
            stagger: 0.05,
            absolute: true
        });
    }

    // Animar elementos de la interfaz
    function animateHistorialElements() {
        // Animar barra de filtros
        gsap.to(filterBar, {
            opacity: 1,
            y: 0,
            duration: 0.5,
            ease: "power2.out"
        });
        
        // Animar tabla
        gsap.to(historialTable, {
            opacity: 1,
            y: 0,
            duration: 0.6,
            delay: 0.2,
            ease: "power2.out"
        });
        
        // Animar paginación
        gsap.to(pagination, {
            opacity: 1,
            y: 0,
            duration: 0.5,
            delay: 0.4,
            ease: "power2.out"
        });
    }

    // Inicializar la aplicación
    async function initApp() {
        showStatus('Conectando con el servidor...', 'loading');
        const backendFound = await findActiveBackend();
        
        if (backendFound) {
            showStatus('Cargando historial...', 'loading');
            const dataLoaded = await loadHistorialData();
            
            if (dataLoaded) {
                clearStatus();
            }
        } else {
            showStatus('Error: No se pudo conectar al servidor backend.', 'error');
        }
        
        // Configurar listeners
        setupEventListeners();
    }
    
    // Configurar event listeners
    function setupEventListeners() {
        // Botón aplicar filtro
        applyFilterBtn.addEventListener('click', () => {
            filterData();
            
            // Animar botón
            gsap.fromTo(applyFilterBtn,
                { scale: 0.95 },
                { 
                    scale: 1, 
                    duration: 0.3, 
                    ease: "elastic.out(1, 0.5)"
                }
            );
        });
        
        // Botón limpiar filtro
        clearFilterBtn.addEventListener('click', () => {
            statusFilter.value = '';
            dateFilter.value = '';
            searchFilter.value = '';
            
            filteredData = [...historialData];
            totalPages = Math.ceil(filteredData.length / itemsPerPage);
            currentPage = 1;
            
            renderHistorialTable();
            renderPagination();
            
            // Animar botón
            gsap.fromTo(clearFilterBtn,
                { scale: 0.95 },
                { 
                    scale: 1, 
                    duration: 0.3, 
                    ease: "elastic.out(1, 0.5)"
                }
            );
        });
        
        // Delegación de eventos para botones de acción
        historialBody.addEventListener('click', (e) => {
            // Detectar botón de ver detalles
            if (e.target.closest('.view-details')) {
                const button = e.target.closest('.view-details');
                const itemId = button.dataset.id;
                
                // Animar botón
                gsap.fromTo(button,
                    { scale: 0.8, rotation: 0 },
                    { 
                        scale: 1, 
                        rotation: 360,
                        duration: 0.5, 
                        ease: "elastic.out(1, 0.5)"
                    }
                );
                
                // Mostrar mensaje para demo
                showStatus(`Ver detalles del registro ID: ${itemId}`, 'success');
            }
        });
        
        // Animación en el focus de los campos de filtro
        document.querySelectorAll('#filter-bar input, #filter-bar select').forEach(input => {
            input.addEventListener('focus', () => {
                gsap.to(input, {
                    scale: 1.02,
                    duration: 0.2,
                    ease: "power1.out",
                    transformOrigin: "left center"
                });
            });
            
            input.addEventListener('blur', () => {
                gsap.to(input, {
                    scale: 1,
                    duration: 0.2,
                    ease: "power1.in"
                });
            });
        });
    }

    // Comprobar si venimos desde otra página
    window.addEventListener('pageshow', function(event) {
        if (event.persisted) {
            // La página fue cargada desde la caché de navegación hacia atrás/adelante
            console.log('Página restaurada desde caché - reiniciando animaciones');
            animateHistorialElements();
        }
    });

    // --- Inicialización --- 
    initApp();
});
