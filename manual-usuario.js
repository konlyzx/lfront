document.addEventListener('DOMContentLoaded', () => {
    console.log('Manual de usuario: Inicialización');
    
    // --- Elementos del DOM ---
    const bookCover = document.getElementById('book-cover');
    const startButton = document.getElementById('start-reading');
    const book = document.getElementById('manual-book');
    const bookContent = document.querySelector('.book-content');
    const pages = document.querySelectorAll('.page');
    const prevButton = document.getElementById('prev-page');
    const nextButton = document.getElementById('next-page');
    const faqItems = document.querySelectorAll('.faq-item');
    const zoomableImages = document.querySelectorAll('.step-image, .dashboard-preview');
    const imageZoomOverlay = document.getElementById('imageZoomOverlay');
    const zoomedImage = document.getElementById('zoomedImage');
    const zoomInButton = document.getElementById('zoomIn');
    const zoomOutButton = document.getElementById('zoomOut');
    
    // --- Estado ---
    let currentPage = 0;
    let isBookOpen = false;
    
    // --- FUNCIONES PRINCIPALES ---
    
    // Función para abrir el libro y mostrar la primera página
    function openBook() {
        console.log('Abriendo el libro');
        
        if (bookCover) {
            bookCover.classList.add('open');
            isBookOpen = true;
            
            // Ocultar la portada después de la animación
            setTimeout(() => {
                bookCover.style.display = 'none';
                showPage(1); // Mostrar la primera página
            }, 700);
        } else {
            console.error('No se encontró la portada del libro');
        }
    }
    
    // Mostrar una página específica (simplificado)
    function showPage(pageNumber) {
        console.log('Mostrando página:', pageNumber);
        
        // Verificar si es necesario abrir el libro primero
        if (!isBookOpen) {
            openBook();
            return;
        }
        
        // Ocultar todas las páginas primero
        pages.forEach(page => {
            page.style.display = 'none';
        });
        
        // Mostrar la página solicitada
        const targetPage = document.getElementById(`page-${pageNumber}`);
        if (targetPage) {
            targetPage.style.display = 'block';
            currentPage = pageNumber;
            console.log('Página mostrada:', currentPage);
        } else {
            console.error(`No se encontró la página ${pageNumber}`);
        }
        
        // Actualizar estado de los botones
        updateNavButtons();
    }
    
    // Actualizar el estado de los botones de navegación
    function updateNavButtons() {
        if (prevButton && nextButton) {
            prevButton.disabled = currentPage <= 1;
            nextButton.disabled = currentPage >= pages.length;
            console.log('Botones actualizados:', {prev: prevButton.disabled, next: nextButton.disabled});
        }
    }
    
    // Ir a la página siguiente
    function nextPage() {
        if (currentPage < pages.length) {
            showPage(currentPage + 1);
        }
    }
    
    // Ir a la página anterior
    function prevPage() {
        if (currentPage > 1) {
            showPage(currentPage - 1);
        }
    }
    
    // --- ZOOM DE IMÁGENES ---
    function setupImageZoom() {
        zoomableImages.forEach(img => {
            img.addEventListener('click', () => {
                zoomedImage.src = img.src;
                imageZoomOverlay.classList.add('visible');
                console.log('Imagen ampliada:', img.src);
            });
        });
        
        imageZoomOverlay.addEventListener('click', (e) => {
            if (e.target === imageZoomOverlay) {
                imageZoomOverlay.classList.remove('visible');
                zoomedImage.style.transform = 'scale(1)'; // Restablecer zoom
            }
        });
        
        if (zoomInButton) {
            zoomInButton.addEventListener('click', (e) => {
                e.stopPropagation();
                const currentTransform = zoomedImage.style.transform || 'scale(1)';
                const currentScale = parseFloat(currentTransform.replace('scale(', '').replace(')', '')) || 1;
                const newScale = Math.min(currentScale + 0.25, 3);
                zoomedImage.style.transform = `scale(${newScale})`;
            });
        }
        
        if (zoomOutButton) {
            zoomOutButton.addEventListener('click', (e) => {
                e.stopPropagation();
                const currentTransform = zoomedImage.style.transform || 'scale(1)';
                const currentScale = parseFloat(currentTransform.replace('scale(', '').replace(')', '')) || 1;
                const newScale = Math.max(currentScale - 0.25, 0.5);
                zoomedImage.style.transform = `scale(${newScale})`;
            });
        }
    }
    
    // --- ACORDEÓN PARA PREGUNTAS FRECUENTES ---
    function setupFaqAccordion() {
        faqItems.forEach(item => {
            const question = item.querySelector('.faq-question');
            
            if (question) {
                question.addEventListener('click', () => {
                    // Alternar la clase active en el elemento actual
                    item.classList.toggle('active');
                });
            }
        });
    }
    
    // --- INICIALIZACIÓN ---
    function init() {
        console.log('Inicializando manual de usuario...');
        
        // Ocultar todas las páginas al inicio
        if (pages && pages.length > 0) {
            pages.forEach(page => {
                page.style.display = 'none';
            });
            console.log(`${pages.length} páginas preparadas`);
        } else {
            console.error('No se encontraron páginas en el libro');
        }
        
        // Configurar evento del botón de inicio
        if (startButton) {
            startButton.addEventListener('click', openBook);
            console.log('Evento de botón de inicio configurado');
        } else {
            console.error('No se encontró el botón de inicio');
        }
        
        // Configurar navegación con botones
        if (prevButton) {
            prevButton.addEventListener('click', prevPage);
            console.log('Botón anterior configurado');
        }
        
        if (nextButton) {
            nextButton.addEventListener('click', nextPage);
            console.log('Botón siguiente configurado');
        }
        
        // Navegación con teclado
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') prevPage();
            if (e.key === 'ArrowRight') nextPage();
        });
        
        // Configurar zoom y acordeón
        setupImageZoom();
        setupFaqAccordion();
        
        console.log('Manual de usuario: Inicialización completada');
    }
    
    // Iniciar la aplicación
    init();
}); 