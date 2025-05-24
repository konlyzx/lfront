// historial.js

document.addEventListener('DOMContentLoaded', () => {
    // --- URLs y Estado de Backend --- 
    let API_BASE_URL = ''; 
    let API_HISTORIAL_URL = ''; 

    // --- Elementos del DOM --- 
    const statusDiv       = document.getElementById('status');
    const historialTable  = document.getElementById('historial-table');
    const historialBody   = document.getElementById('historial-body');
    const emptyState      = document.getElementById('empty-state');
    const filterBar       = document.getElementById('filter-bar');
    const pagination      = document.getElementById('pagination');
    const statusFilter    = document.getElementById('status-filter');
    const dateFilter      = document.getElementById('date-filter');
    const searchFilter    = document.getElementById('search-filter');
    const applyFilterBtn  = document.getElementById('apply-filter');
    const clearFilterBtn  = document.getElementById('clear-filter');

    // --- Variables de Estado --- 
    let historialData = [];
    let filteredData = [];
    let currentPage = 1;
    const itemsPerPage = 10;
    let totalPages = 0;

    // --- View Transitions API ---
    const supportsViewTransitions = !!document.startViewTransition;
    function navigateWithTransition(url) {
        if (!supportsViewTransitions) {
            window.location.href = url;
            return;
        }
        document.startViewTransition(() => {
            window.location.href = url;
        });
    }
    document.querySelectorAll('.sidebar-nav a').forEach(link => {
        link.addEventListener('click', e => {
            if (link.getAttribute('href') !== '#') {
                e.preventDefault();
                navigateWithTransition(link.getAttribute('href'));
            }
        });
    });

    // --- Funciones Auxiliares --- 
    function showStatus(message, type) {
        const state = Flip.getState(statusDiv);
        statusDiv.textContent = message;
        statusDiv.className = `status-notification ${type}`;
        statusDiv.style.display = 'block';
        Flip.from(state, {
            duration: 0.5,
            ease: "back.out(1.7)",
            onComplete: () => {
                if (type === 'success' || type === 'error') {
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
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', { 
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    }
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
    async function processApiResponse(response) {
        const responseText = await response.text();
        let data;
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

    // --- Detección del backend activo --- 
    async function findActiveBackend() {
        const TEST_URL = 'https://api.legaly.space';
        try {
            const res = await fetch(TEST_URL, { method: 'GET', signal: AbortSignal.timeout(1000) });
            if (res.ok) {
                API_BASE_URL = TEST_URL;
                API_HISTORIAL_URL = `${API_BASE_URL}/api/historial`;
                console.log('Backend encontrado en', API_BASE_URL);
                return true;
            }
        } catch (err) {
            console.log('No response from backend:', err.message);
        }
        return false;
    }

    // --- Carga y render de historial --- 
    async function loadHistorialData() {
        try {
            const response = await fetch(API_HISTORIAL_URL);
            const data = await processApiResponse(response);
            if (data.success && Array.isArray(data.data)) {
                historialData = data.data;
                filteredData = [...historialData];
                totalPages = Math.ceil(filteredData.length / itemsPerPage);
                renderHistorialTable();
                renderPagination();
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

    function filterData() {
        const statusValue = statusFilter.value;
        const dateValue = dateFilter.value;
        const searchValue = searchFilter.value.toLowerCase();

        filteredData = historialData.filter(item => {
            if (statusValue && item.firma?.status !== statusValue) return false;
            if (dateValue) {
                const itemDate = new Date(item.fecha).toISOString().split('T')[0];
                if (itemDate !== dateValue) return false;
            }
            if (searchValue) {
                const ced = item.cedula?.toLowerCase() || '';
                const dest = item.firma?.recipient_name?.toLowerCase() || '';
                const remit = item.firma?.sender_name?.toLowerCase() || '';
                if (![ced, dest, remit].some(str => str.includes(searchValue))) return false;
            }
            return true;
        });

        totalPages = Math.ceil(filteredData.length / itemsPerPage);
        currentPage = 1;
        renderHistorialTable();
        renderPagination();
    }

    function renderHistorialTable() {
        const state = Flip.getState(historialTable);
        historialBody.innerHTML = '';

        if (filteredData.length === 0) {
            historialTable.style.display = 'none';
            emptyState.style.display = 'block';
            gsap.fromTo(emptyState,
                { opacity: 0, y: 20 },
                { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }
            );
            return;
        }

        emptyState.style.display = 'none';
        historialTable.style.display = 'table';

        const start = (currentPage - 1) * itemsPerPage;
        const end = Math.min(start + itemsPerPage, filteredData.length);
        const pageData = filteredData.slice(start, end);

        pageData.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${formatDate(item.fecha)}</td>
                <td>${item.cedula || 'N/A'}</td>
                <td>${item.firma?.recipient_name || 'N/A'}</td>
                <td>${item.firma?.sender_name || 'N/A'}</td>
                <td>
                  <span class="status-badge ${getStatusClass(item.firma?.status)}">
                    ${item.firma?.status || 'Error'}
                  </span>
                </td>
                <td>
                  <button class="action-button view-details" data-id="${item.id}" title="Ver detalles">
                    <i class="fas fa-info-circle"></i>
                  </button>
                  ${item.firma?.modified_pdf_url 
                    ? `<a href="${item.firma.modified_pdf_url}" target="_blank" class="action-button download-pdf" title="Descargar PDF">
                         <i class="fas fa-file-pdf"></i>
                       </a>`
                    : ''}
                </td>`;
            historialBody.appendChild(row);
        });

        Flip.from(state, {
            duration: 0.5,
            ease: "power1.out",
            stagger: 0.05
        });
    }

    function renderPagination() {
        const state = Flip.getState(pagination);
        pagination.innerHTML = '';

        if (totalPages <= 1) {
            pagination.style.display = 'none';
            return;
        }
        pagination.style.display = 'flex';

        // Anterior
        const prev = document.createElement('button');
        prev.className = `pagination-button ${currentPage === 1 ? 'disabled' : ''}`;
        prev.innerHTML = '<i class="fas fa-chevron-left"></i>';
        prev.disabled = currentPage === 1;
        prev.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                renderHistorialTable();
                renderPagination();
                gsap.to(window, { duration: 0.5, scrollTo: { y: historialTable, offsetY: 100 }, ease: "power2.out" });
            }
        });
        pagination.appendChild(prev);

        // Páginas
        const maxVis = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVis/2));
        let endPage = Math.min(totalPages, startPage + maxVis - 1);
        if (endPage - startPage + 1 < maxVis) {
            startPage = Math.max(1, endPage - maxVis + 1);
        }
        for (let i = startPage; i <= endPage; i++) {
            const btn = document.createElement('button');
            btn.className = `pagination-button ${i === currentPage ? 'active' : ''}`;
            btn.textContent = i;
            btn.addEventListener('click', () => {
                currentPage = i;
                renderHistorialTable();
                renderPagination();
                gsap.to(window, { duration: 0.5, scrollTo: { y: historialTable, offsetY: 100 }, ease: "power2.out" });
            });
            pagination.appendChild(btn);
        }

        // Siguiente
        const next = document.createElement('button');
        next.className = `pagination-button ${currentPage === totalPages ? 'disabled' : ''}`;
        next.innerHTML = '<i class="fas fa-chevron-right"></i>';
        next.disabled = currentPage === totalPages;
        next.addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++;
                renderHistorialTable();
                renderPagination();
                gsap.to(window, { duration: 0.5, scrollTo: { y: historialTable, offsetY: 100 }, ease: "power2.out" });
            }
        });
        pagination.appendChild(next);

        Flip.from(state, {
            duration: 0.5,
            ease: "power1.out",
            stagger: 0.05
        });
    }

    function animateHistorialElements() {
        gsap.to(filterBar, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" });
        gsap.to(historialTable, { opacity: 1, y: 0, duration: 0.6, delay: 0.2, ease: "power2.out" });
        gsap.to(pagination, { opacity: 1, y: 0, duration: 0.5, delay: 0.4, ease: "power2.out" });
    }

    function setupEventListeners() {
        applyFilterBtn.addEventListener('click', filterData);
        clearFilterBtn.addEventListener('click', () => {
            statusFilter.value = '';
            dateFilter.value = '';
            searchFilter.value = '';
            filterData();
        });
        historialBody.addEventListener('click', e => {
            if (e.target.closest('.view-details')) {
                const btn = e.target.closest('.view-details');
                const id  = btn.dataset.id;
                gsap.fromTo(btn, { scale: 0.8 }, { scale: 1, rotation: 360, duration: 0.5, ease: "elastic.out(1,0.5)" });
                showStatus(`Ver detalles del registro ID: ${id}`, 'success');
            }
        });
        document.querySelectorAll('#filter-bar input, #filter-bar select').forEach(input => {
            input.addEventListener('focus', () => gsap.to(input, { scale: 1.02, duration: 0.2 }));
            input.addEventListener('blur',  () => gsap.to(input, { scale: 1,    duration: 0.2 }));
        });
        window.addEventListener('pageshow', event => {
            if (event.persisted) animateHistorialElements();
        });
    }

    async function initApp() {
        showStatus('Conectando con el servidor...', 'loading');
        const ok = await findActiveBackend();
        if (ok) {
            showStatus('Cargando historial...', 'loading');
            const loaded = await loadHistorialData();
            if (loaded) clearStatus();
        } else {
            showStatus('Error: No se pudo conectar al servidor backend.', 'error');
        }
        setupEventListeners();
    }

    // --- Inicia! ---
    initApp();
});
