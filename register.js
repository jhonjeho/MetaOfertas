// ============================================================
// METAOFERTAS — REGISTRO DE USUARIOS (register.js)
// Integrado con Firebase Auth (Google) + Firestore
// ============================================================

'use strict';

// ── MOSTRAR / CERRAR MODAL ────────────────────────────────────
function showRegisterModal() {
    const modal = document.getElementById('registerModal');
    if (!modal) return;

    // Resetear estado del modal antes de mostrarlo
    resetRegisterModal();
    modal.style.display = 'flex';

    // Si no hay usuario de Google pendiente, enfocar el botón de Google
    if (!window._pendingGoogleUser) {
        const googleBtn = document.getElementById('btnGoogleLogin');
        if (googleBtn) googleBtn.focus();
    } else {
        const whatsappInput = document.getElementById('registerWhatsapp');
        if (whatsappInput) whatsappInput.focus();
    }
}

function closeRegisterModal() {
    const modal = document.getElementById('registerModal');
    if (!modal) return;
    modal.style.display = 'none';
    resetRegisterModal();
}

function resetRegisterModal() {
    // Limpiar formulario
    const form = document.getElementById('registerForm');
    if (form) form.reset();

    // Ocultar error
    hideRegisterError();

    // Restaurar campo de nombre (puede haber sido bloqueado por Google)
    const nameInput = document.getElementById('registerName');
    if (nameInput) {
        nameInput.readOnly = false;
        nameInput.style.opacity = '1';
    }

    // Ocultar foto de perfil de Google
    const photoContainer = document.getElementById('googleProfilePhoto');
    if (photoContainer) {
        photoContainer.innerHTML = '';
        photoContainer.style.display = 'none';
    }

    // Ocultar correo de Google
    const emailRow = document.getElementById('googleEmailRow');
    if (emailRow) emailRow.style.display = 'none';

    // Restaurar título y subtítulo
    const modalTitle = document.querySelector('#registerModal h2');
    if (modalTitle) modalTitle.textContent = 'Crear Cuenta';

    const modalSubtitle = document.querySelector('#registerModal .modal-subtitle');
    if (modalSubtitle) modalSubtitle.textContent = 'Regístrate con Google para hacer pedidos';

    // Mostrar botón de Google, ocultar formulario de datos extra
    const googleSection = document.getElementById('googleLoginSection');
    if (googleSection) googleSection.style.display = 'block';

    const extraDataSection = document.getElementById('extraDataSection');
    if (extraDataSection) extraDataSection.style.display = 'none';

    // Limpiar usuario de Google pendiente
    window._pendingGoogleUser = null;
}

// ── MOSTRAR / OCULTAR ERROR ───────────────────────────────────
function showRegisterError(message) {
    const errorEl = document.getElementById('registerError');
    if (!errorEl) return;
    errorEl.textContent = message;
    errorEl.style.display = 'block';
}

function hideRegisterError() {
    const errorEl = document.getElementById('registerError');
    if (errorEl) errorEl.style.display = 'none';
}

// ── MANEJAR SUBMIT DEL FORMULARIO DE DATOS EXTRA ─────────────
async function handleCompleteProfileSubmit(event) {
    event.preventDefault();

    const telefono    = document.getElementById('registerWhatsapp').value.trim();
    const direccion   = document.getElementById('registerBarrio').value.trim();
    const tipoCliente = document.getElementById('registerTipo').value;

    // Validaciones
    if (!telefono) {
        showRegisterError('❌ El número de teléfono/WhatsApp es requerido');
        return;
    }
    if (!/^[0-9+\s\-()]{7,15}$/.test(telefono)) {
        showRegisterError('❌ Ingresa un número de teléfono válido (ej: 3125551234)');
        return;
    }
    if (!direccion) {
        showRegisterError('❌ La dirección de entrega es requerida');
        return;
    }
    if (!tipoCliente) {
        showRegisterError('❌ Selecciona el tipo de cliente');
        return;
    }

    hideRegisterError();

    // Verificar que hay un usuario de Google pendiente
    const googleUser = window._pendingGoogleUser;
    if (!googleUser) {
        showRegisterError('❌ Sesión expirada. Por favor inicia sesión con Google nuevamente.');
        return;
    }

    // Deshabilitar botón mientras guarda
    const submitBtn = document.getElementById('btnCompleteProfile');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = '⏳ Guardando...';
    }

    try {
        const success = await saveNewClientToFirestore(googleUser, telefono, direccion, tipoCliente);

        if (success) {
            closeRegisterModal();
            if (typeof showToastNotification === 'function') {
                showToastNotification(`🎉 ¡Bienvenido a MetaOfertas, ${googleUser.displayName ? googleUser.displayName.split(' ')[0] : 'amigo'}!`);
            }
            // ── Recuperar carrito pendiente si el usuario tenía uno antes de registrarse ──
            if (typeof restaurarCarritoPendiente === 'function') {
                restaurarCarritoPendiente();
            }
        } else {
            showRegisterError('❌ Error al guardar tus datos. Intenta de nuevo.');
        }
    } catch (error) {
        console.error('[MetaOfertas] Error al completar perfil:', error);
        showRegisterError('❌ Error de conexión. Intenta de nuevo más tarde.');
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Completar Registro';
        }
    }
}

// ── CONFIGURAR EVENT LISTENERS ────────────────────────────────
function setupRegisterEventListeners() {
    // Cerrar modal con botón X
    const closeBtn = document.getElementById('closeRegister');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeRegisterModal);
    }

    // Cerrar modal al hacer clic fuera
    const registerModal = document.getElementById('registerModal');
    if (registerModal) {
        window.addEventListener('click', (e) => {
            if (e.target === registerModal) {
                // Solo cerrar si no hay un usuario de Google pendiente sin completar
                if (!window._pendingGoogleUser) {
                    closeRegisterModal();
                }
            }
        });
    }

    // Botón de Google en el modal
    const googleLoginBtn = document.getElementById('btnGoogleLogin');
    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', () => {
            if (typeof loginWithGoogleAsClient === 'function') {
                loginWithGoogleAsClient();
            }
        });
    }

    // Formulario de datos adicionales (para usuarios nuevos de Google)
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleCompleteProfileSubmit);
    }
}

// ── INICIALIZAR AL CARGAR EL DOM ──────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    setupRegisterEventListeners();
});
