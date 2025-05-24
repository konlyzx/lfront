document.addEventListener('DOMContentLoaded', () => {
    const apiBaseUrl = 'http://159.223.204.253:3001'; // Definir la URL base del backend

    // Elementos DOM
    const phoneStep = document.getElementById('phone-step');
    const otpStep = document.getElementById('otp-step'); // Nuevo paso OTP
    const documentsStep = document.getElementById('documents-step');
    const phoneInput = document.getElementById('phone-input');
    const sendCodeBtn = document.getElementById('send-code-btn'); // Renombrado
    const otpInputsContainer = document.getElementById('otp-inputs'); // Contenedor de inputs OTP
    const verifyOtpBtn = document.getElementById('verify-otp-btn'); // Botón para verificar OTP
    const resendCodeBtn = document.getElementById('resend-code-btn');
    const userPhoneDisplay = document.getElementById('user-phone-display');
    const statusDiv = document.getElementById('status');
    const documentsContainer = document.getElementById('documents-container');

    let currentPhoneNumber = ''; // Almacenar el número para el que se envió el OTP
    let currentVerificationId = ''; // Almacenar el ID de la operación de verificación

    // Mostrar mensaje de estado
    function showStatus(message, isError = false) {
        statusDiv.textContent = message;
        statusDiv.className = isError ? 'status-notification error' : 'status-notification success';
        statusDiv.style.display = 'block';
        setTimeout(() => { statusDiv.style.display = 'none'; }, 5000);
    }

    // Ocultar todos los pasos principales
    function hideAllSteps() {
        phoneStep.style.display = 'none';
        otpStep.style.display = 'none';
        documentsStep.style.display = 'none';
    }

    function showStep(stepElement) {
        hideAllSteps();
        stepElement.style.display = 'block';
    }

    // Lógica para inputs OTP (auto-avance y colectar código)
    const otpInputFields = otpInputsContainer.querySelectorAll('.otp-input');
    otpInputFields.forEach((input, index) => {
        input.addEventListener('input', (e) => {
            if (e.target.value && index < otpInputFields.length - 1) {
                otpInputFields[index + 1].focus();
            }
            collectAndValidateOtp();
        });
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !e.target.value && index > 0) {
                otpInputFields[index - 1].focus();
            }
            // Para permitir borrar y re-focus en el mismo input si ya tiene valor
            else if (e.key === 'Backspace' && e.target.value && index >= 0) {
                 // No hacer nada especial, permitir que el input se vacíe y luego el input event maneje el resto
            }
            // Colectar en keydown también para respuesta más rápida del botón de verificar
            setTimeout(collectAndValidateOtp, 0); 
        });
        input.addEventListener('focus', () => input.select()); // Seleccionar contenido al enfocar
    });

    function collectAndValidateOtp() {
        let otp = '';
        otpInputFields.forEach(input => otp += input.value);
        verifyOtpBtn.disabled = otp.length !== 6;
        return otp;
    }

    // Cargar documentos firmados
    async function loadDocuments(userPhone) {
        showStep(documentsStep);
        documentsContainer.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Cargando documentos...</div>';

        try {
            const response = await fetch(`${apiBaseUrl}/api/user-documents?phone=${encodeURIComponent(userPhone)}`);
            const data = await response.json();
            
            if (response.ok && data.success) {
                documentsContainer.innerHTML = ''; // Limpiar spinner
                if (data.documents && data.documents.length > 0) {
                    data.documents.forEach(doc => {
                        const docItem = document.createElement('div');
                        docItem.className = 'document-item';
                        const fecha = new Date(doc.fecha);
                        const fechaFormateada = fecha.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
                        
                        docItem.innerHTML = `
                            <div class="document-icon"><i class="fas fa-file-pdf"></i></div>
                            <div class="document-details">
                                <div class="document-name">Documento firmado</div>
                                <div class="document-info">Remitente: ${doc.firma.sender_name || 'No especificado'}</div>
                                <div class="document-date">Fecha: ${fechaFormateada}</div>
                                <div class="document-status">Estado: ${doc.firma.status}</div>
                            </div>
                            <div class="document-download" data-url="${doc.firma.modified_pdf_url || doc.firma.document_url}">
                                <i class="fas fa-download"></i>
                            </div>
                        `;
                        
                        const downloadBtn = docItem.querySelector('.document-download');
                        downloadBtn.addEventListener('click', () => {
                            const url = downloadBtn.dataset.url;
                            if (url) window.open(url, '_blank');
                        });
                        documentsContainer.appendChild(docItem);
                    });
                } else {
                    documentsContainer.innerHTML = '<div class="no-documents"><i class="fas fa-folder-open"></i><p>No tienes documentos firmados.</p></div>';
                }
            } else {
                showStatus(data.error || 'Error al cargar documentos', true);
                documentsContainer.innerHTML = '<div class="error-message"><i class="fas fa-exclamation-triangle"></i><p>Error al cargar documentos.</p></div>';
            }
        } catch (error) {
            console.error('Error cargando documentos:', error);
            showStatus('Error de conexión al cargar documentos.', true);
            documentsContainer.innerHTML = '<div class="error-message"><i class="fas fa-exclamation-triangle"></i><p>Error de conexión.</p></div>';
        }
    }

    async function requestOtp(phoneNumberToRequest) {
        sendCodeBtn.disabled = true;
        sendCodeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
        resendCodeBtn.disabled = true; // Deshabilitar reenviar mientras se envía

        try {
            const response = await fetch(`${apiBaseUrl}/api/send-verification-code`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: phoneNumberToRequest })
            });
            const data = await response.json();
            if (response.ok && data.success) {
                currentPhoneNumber = phoneNumberToRequest; // Guardar el número actual
                currentVerificationId = data.verificationId; // Guardar el ID de verificación
                userPhoneDisplay.textContent = currentPhoneNumber; // Mostrar a qué número se envió
                showStatus('Código de verificación enviado a tu WhatsApp.');
                showStep(otpStep);
                otpInputFields.forEach(input => input.value = ''); // Limpiar campos OTP
                otpInputFields[0].focus(); // Enfocar primer campo OTP
                verifyOtpBtn.disabled = true;
            } else {
                showStatus(data.error || 'Error al enviar el código de verificación.', true);
            }
        } catch (error) {
            showStatus('Error de conexión. Inténtalo de nuevo.', true);
        } finally {
            sendCodeBtn.disabled = false;
            sendCodeBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Enviar código';
            resendCodeBtn.disabled = false; // Habilitar reenviar
        }
    }

    sendCodeBtn.addEventListener('click', () => {
        const phoneNumber = phoneInput.value.trim();
        if (!phoneNumber) {
            showStatus('Por favor, ingresa un número de teléfono válido.', true);
            return;
        }
        requestOtp(phoneNumber);
    });

    resendCodeBtn.addEventListener('click', () => {
        if (currentPhoneNumber) {
            otpInputFields.forEach(input => input.value = ''); // Limpiar campos OTP
            verifyOtpBtn.disabled = true;
            requestOtp(currentPhoneNumber); // Reenviar al último número usado
        } else {
            showStatus('No hay un número previo para reenviar el código. Ingresa tu número primero.', true);
            showStep(phoneStep);
        }
    });

    verifyOtpBtn.addEventListener('click', async () => {
        const otp = collectAndValidateOtp();
        if (otp.length !== 6) {
            showStatus('El código OTP debe tener 6 dígitos.', true);
            return;
        }

        verifyOtpBtn.disabled = true;
        verifyOtpBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verificando...';

        try {
            const response = await fetch(`${apiBaseUrl}/api/verify-code`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    phone: currentPhoneNumber, 
                    code: otp, 
                    verificationId: currentVerificationId 
                })
            });
            const data = await response.json();
            if (response.ok && data.success) {
                showStatus('Verificación exitosa.');
                loadDocuments(data.phone);
            } else {
                showStatus(data.error || 'Código de verificación incorrecto o expirado.', true);
                otpInputFields.forEach(input => input.value = '');
                otpInputFields[0].focus();
                verifyOtpBtn.disabled = true;
            }
        } catch (error) {
            showStatus('Error de conexión al verificar el código.', true);
        } finally {
            verifyOtpBtn.disabled = false; // Se re-habilita (o no) por collectAndValidateOtp
            verifyOtpBtn.innerHTML = '<i class="fas fa-check"></i> Verificar código';
            collectAndValidateOtp(); // Para asegurar estado correcto del botón
        }
    });

    // Estado inicial: mostrar paso para ingresar teléfono
    showStep(phoneStep);
}); 