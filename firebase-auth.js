/* ============================================================
   METAOFERTAS — MÓDULO DE AUTENTICACIÓN FIREBASE (firebase-auth.js)
   Maneja: Login con Google (Redirect), Roles, Registro de Clientes en Firestore
   ============================================================ */

'use strict';

// ── ESTADO GLOBAL DE AUTENTICACIÓN ───────────────────────────
let firebaseUser = null;   // Usuario de Firebase Auth
let firestoreUserData = null; // Datos del usuario en Firestore

// ── CAPTURAR RESULTADO DE REDIRECCIÓN AL CARGAR LA PÁGINA ────
// Se ejecuta al inicio para procesar el resultado del redirect de Google
(async function handleRedirectOnLoad() {
    try {
        console.log('[MetaOfertas] 🔄 Procesando resultado de redirección de Google...');
        const result = await auth.getRedirectResult();
        console.log('[MetaOfertas] getRedirectResult completado. result:', result ? 'tiene datos' : 'null/vacío');

        if (result && result.user) {
            const user = result.user;
            console.log('[MetaOfertas] ✅ Usuario detectado:', user.email, '| UID:', user.uid);

            // ── Determinar si venimos de un redirect de ADMIN o de CLIENTE ──
            const redirectIntent = sessionStorage.getItem('_authRedirectIntent');
            console.log('[MetaOfertas] Intención de redirect guardada en sessionStorage:', redirectIntent);
            sessionStorage.removeItem('_authRedirectIntent'); // Limpiar inmediatamente

            // Si el correo es admin, tratarlo como admin independientemente del intent
            const isAdminEmail = ADMIN_EMAILS.includes(user.email.toLowerCase());
            console.log('[MetaOfertas] ¿Es correo de admin?', isAdminEmail, '| ADMIN_EMAILS:', ADMIN_EMAILS);

            if (redirectIntent === 'admin' || isAdminEmail) {
                // ── Flujo de ADMINISTRADOR ────────────────────────────────
                if (isAdminEmail) {
                    // ✅ Administrador autorizado
                    console.log('[MetaOfertas] ✅ Admin autorizado. Guardando en Firestore...');
                    try { await saveAdminToFirestore(user); } catch(e) { console.warn('[MetaOfertas] saveAdminToFirestore falló (no crítico):', e); }

                    // Guardar estado de admin en localStorage para evitar rebote al login
                    localStorage.setItem('_adminAuthenticated', user.email);
                    localStorage.setItem('_adminUID', user.uid);
                    console.log('[MetaOfertas] ✅ Estado admin guardado en localStorage.');

                    // Verificar si ya estamos en admin.html
                    const enAdminHtml = window.location.pathname.includes('admin.html') || window.location.href.includes('admin.html');
                    console.log('[MetaOfertas] ¿Estamos en admin.html?', enAdminHtml, '| URL actual:', window.location.href);

                    if (!enAdminHtml) {
                        console.log('[MetaOfertas] Intentando redirigir a: admin.html');
                        window.location.href = 'admin.html';
                        return;
                    }

                    // Ya estamos en admin.html → mostrar panel
                    console.log('[MetaOfertas] Ya en admin.html → mostrando panel...');
                    showAdminPanel();
                    showAdminToast(`✅ Bienvenido, ${(user.displayName || user.email).split(' ')[0]}. Acceso concedido.`, 'success');
                } else {
                    // ❌ No autorizado → cerrar sesión inmediatamente
                    console.warn('[MetaOfertas] ❌ Correo no autorizado:', user.email);
                    await auth.signOut();
                    localStorage.removeItem('_adminAuthenticated');
                    localStorage.removeItem('_adminUID');
                    showAdminAccessDenied(user.email);
                }
            } else {
                // ── Flujo de CLIENTE (por defecto) ────────────────────────
                console.log('[MetaOfertas] Flujo de cliente. Buscando en Firestore...');
                const docRef = db.collection('usuarios').doc(user.uid);
                const docSnap = await docRef.get();

                if (docSnap.exists) {
                    // Usuario ya registrado → iniciar sesión directamente
                    firestoreUserData = docSnap.data();
                    currentUser = {
                        id: user.uid,
                        uid: user.uid,
                        nombre: firestoreUserData.nombre || user.displayName,
                        correo: firestoreUserData.correo || user.email,
                        whatsapp: firestoreUserData.telefono || '',
                        barrio: firestoreUserData.direccion || '',
                        tipoCliente: firestoreUserData.tipoCliente || 'persona',
                        rol: firestoreUserData.rol || 'cliente',
                        photoURL: user.photoURL || null
                    };
                    saveUserToStorage();
                    updateNavbarUserUI(currentUser);
                    closeRegisterModal();
                    showAuthLoadingState(false);
                    showToastNotification(`✅ ¡Bienvenido de nuevo, ${currentUser.nombre.split(' ')[0]}!`);
                    // ── Recuperar carrito pendiente si existía antes del login ──
                    if (typeof restaurarCarritoPendiente === 'function') {
                        restaurarCarritoPendiente();
                    }
                } else {
                    // Usuario NUEVO → mostrar formulario de datos adicionales
                    showAuthLoadingState(false);
                    showCompleteProfileModal(user);
                }
            }
        } else {
            console.log('[MetaOfertas] No hay resultado de redirect (carga normal de página).');
        }
    } catch (error) {
        console.error('[MetaOfertas] ❌ Error al procesar resultado de redirección:', error);
        console.error('[MetaOfertas] Código de error:', error.code, '| Mensaje:', error.message);
        // Restaurar botones en caso de error
        showAuthLoadingState(false);
        const btnAdmin = document.getElementById('btnAdminGoogleLogin');
        if (btnAdmin) {
            btnAdmin.disabled = false;
            btnAdmin.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
                    <path fill="#FF3D00" d="m6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"/>
                    <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
                    <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
                </svg>
                Ingresar como Administrador con Google
            `;
        }
        if (error.code && error.code !== 'auth/no-current-user') {
            const errorEl = document.getElementById('adminLoginError');
            if (errorEl) {
                errorEl.innerHTML = `<div style="display:flex;align-items:flex-start;gap:12px;"><span style="font-size:1.4rem;flex-shrink:0;">⚠️</span><div><strong style="display:block;margin-bottom:4px;">Error de autenticación</strong><span style="font-size:0.82rem;opacity:0.85;">${error.message}</span></div></div>`;
                errorEl.style.display = 'block';
                setTimeout(() => { errorEl.style.display = 'none'; }, 8000);
            }
        }
    }
})();

// ── OBSERVADOR DE ESTADO DE AUTENTICACIÓN ────────────────────
// Se ejecuta automáticamente cuando el estado de auth cambia
auth.onAuthStateChanged(async (user) => {
    firebaseUser = user;

    if (user) {
        // ── Verificar si es administrador en admin.html ──────────
        const isAdminPage = window.location.pathname.includes('admin.html');
        if (isAdminPage) {
            if (ADMIN_EMAILS.includes(user.email.toLowerCase())) {
                // Admin válido: guardar en localStorage y mostrar panel
                localStorage.setItem('_adminAuthenticated', user.email);
                localStorage.setItem('_adminUID', user.uid);
                await saveAdminToFirestore(user);
                showAdminPanel();
                // Mostrar info del admin en el header
                const userInfoEl = document.getElementById('adminUserInfo');
                if (userInfoEl) {
                    const photoHTML = user.photoURL
                        ? `<img src="${user.photoURL}" style="width:24px;height:24px;border-radius:50%;object-fit:cover;border:1.5px solid rgba(74,222,128,0.3);vertical-align:middle;margin-right:6px;">`
                        : '';
                    userInfoEl.innerHTML = `${photoHTML}<span>${user.displayName ? user.displayName.split(' ')[0] : user.email}</span>`;
                }
            } else {
                // No es admin: cerrar sesión y mostrar error
                await auth.signOut();
                localStorage.removeItem('_adminAuthenticated');
                localStorage.removeItem('_adminUID');
                showAdminAccessDenied(user.email);
            }
            return; // No continuar con el flujo de cliente
        }

        // ── Flujo de CLIENTE en index.html ───────────────────────
        await syncUserFromFirestore(user);
    } else {
        // Usuario cerró sesión
        firebaseUser = null;
        firestoreUserData = null;
        currentUser = null;
        localStorage.removeItem(CONFIG.USER_STORAGE_KEY);
        localStorage.removeItem('_adminAuthenticated');
        localStorage.removeItem('_adminUID');
        updateNavbarUserUI(null);
    }
});

// ── SINCRONIZAR USUARIO DESDE FIRESTORE ──────────────────────
async function syncUserFromFirestore(user) {
    try {
        const docRef = db.collection('usuarios').doc(user.uid);
        const docSnap = await docRef.get();

        if (docSnap.exists) {
            firestoreUserData = docSnap.data();
            // Actualizar currentUser global (compatible con app.js)
            currentUser = {
                id: user.uid,
                uid: user.uid,
                nombre: firestoreUserData.nombre || user.displayName,
                correo: firestoreUserData.correo || user.email,
                whatsapp: firestoreUserData.telefono || '',
                barrio: firestoreUserData.direccion || '',
                tipoCliente: firestoreUserData.tipoCliente || 'persona',
                rol: firestoreUserData.rol || 'cliente',
                photoURL: user.photoURL || null
            };
            saveUserToStorage();
            updateNavbarUserUI(currentUser);
            return true; // Usuario ya registrado
        } else {
            // Usuario nuevo: necesita completar registro
            return false;
        }
    } catch (error) {
        console.error('[MetaOfertas] Error al sincronizar usuario:', error);
        return false;
    }
}

// ── LOGIN CON GOOGLE (CLIENTES) — usa signInWithRedirect ─────
async function loginWithGoogleAsClient() {
    try {
        showAuthLoadingState(true);
        // Guardar intención de redirect para procesarla al volver
        sessionStorage.setItem('_authRedirectIntent', 'client');
        await auth.signInWithPopup(googleProvider);
        // La página se redirige a Google; el resultado se procesa en handleRedirectOnLoad()
    } catch (error) {
        showAuthLoadingState(false);
        console.error('[MetaOfertas] Error al iniciar redirect con Google:', error);
        showRegisterError('❌ Error al iniciar sesión con Google. Intenta de nuevo.');
    }
}

// ── LOGIN CON GOOGLE (ADMINISTRADORES) — usa signInWithRedirect ──
async function loginWithGoogleAsAdmin() {
    const btnAdmin = document.getElementById('btnAdminGoogleLogin');
    if (btnAdmin) {
        btnAdmin.disabled = true;
        btnAdmin.innerHTML = `
            <svg class="spin-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
            Verificando...
        `;
    }

    try {
        // Guardar intención de redirect para procesarla al volver
        sessionStorage.setItem('_authRedirectIntent', 'admin');
        await auth.signInWithPopup(googleProvider);
        // La página se redirige a Google; el resultado se procesa en handleRedirectOnLoad()
    } catch (error) {
        console.error('[MetaOfertas] Error al iniciar redirect admin:', error);
        if (btnAdmin) {
            btnAdmin.disabled = false;
            btnAdmin.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
                    <path fill="#FF3D00" d="m6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"/>
                    <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
                    <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
                </svg>
                Ingresar como Administrador con Google
            `;
        }
        showAdminToast('❌ Error al autenticar. Intenta de nuevo.', 'error');
    }
}

// ── GUARDAR ADMIN EN FIRESTORE ────────────────────────────────
async function saveAdminToFirestore(user) {
    try {
        const docRef = db.collection('usuarios').doc(user.uid);
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            await docRef.set({
                uid: user.uid,
                nombre: user.displayName || 'Administrador',
                correo: user.email,
                telefono: '',
                direccion: '',
                rol: 'admin',
                photoURL: user.photoURL || null,
                fechaRegistro: firebase.firestore.FieldValue.serverTimestamp()
            });
        } else if (docSnap.data().rol !== 'admin') {
            await docRef.update({ rol: 'admin' });
        }
    } catch (error) {
        console.error('[MetaOfertas] Error al guardar admin:', error);
    }
}

// ── GUARDAR NUEVO CLIENTE EN FIRESTORE ────────────────────────
async function saveNewClientToFirestore(user, telefono, direccion, tipoCliente) {
    try {
        await db.collection('usuarios').doc(user.uid).set({
            uid: user.uid,
            nombre: user.displayName || 'Usuario',
            correo: user.email,
            telefono: telefono,
            direccion: direccion,
            tipoCliente: tipoCliente || 'persona',
            rol: 'cliente',
            photoURL: user.photoURL || null,
            fechaRegistro: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Actualizar estado local
        currentUser = {
            id: user.uid,
            uid: user.uid,
            nombre: user.displayName || 'Usuario',
            correo: user.email,
            whatsapp: telefono,
            barrio: direccion,
            tipoCliente: tipoCliente || 'persona',
            rol: 'cliente',
            photoURL: user.photoURL || null
        };
        saveUserToStorage();
        updateNavbarUserUI(currentUser);
        return true;
    } catch (error) {
        console.error('[MetaOfertas] Error al guardar cliente:', error);
        return false;
    }
}

// ── CERRAR SESIÓN ─────────────────────────────────────────────
async function signOutUser() {
    try {
        await auth.signOut();
        currentUser = null;
        firestoreUserData = null;
        localStorage.removeItem(CONFIG.USER_STORAGE_KEY);
        updateNavbarUserUI(null);
        showToastNotification('👋 Sesión cerrada correctamente');
    } catch (error) {
        console.error('[MetaOfertas] Error al cerrar sesión:', error);
    }
}

// ── MOSTRAR MODAL DE COMPLETAR PERFIL (USUARIO NUEVO) ─────────
function showCompleteProfileModal(googleUser) {
    // Rellenar datos de Google en el formulario
    const nameInput = document.getElementById('registerName');
    if (nameInput && googleUser.displayName) {
        nameInput.value = googleUser.displayName;
        nameInput.readOnly = true;
        nameInput.style.opacity = '0.7';
    }

    // Mostrar foto de perfil de Google si existe
    const photoContainer = document.getElementById('googleProfilePhoto');
    if (photoContainer && googleUser.photoURL) {
        photoContainer.innerHTML = `
            <img src="${googleUser.photoURL}" alt="Foto de perfil" 
                 style="width:56px;height:56px;border-radius:50%;border:2px solid rgba(74,222,128,0.4);object-fit:cover;">
        `;
        photoContainer.style.display = 'flex';
    }

    // Mostrar el correo de Google
    const emailDisplay = document.getElementById('googleEmailDisplay');
    if (emailDisplay) {
        emailDisplay.textContent = googleUser.email;
        emailDisplay.parentElement.style.display = 'block';
    }

    // Cambiar título del modal
    const modalTitle = document.querySelector('#registerModal h2');
    if (modalTitle) modalTitle.textContent = 'Completa tu Perfil';

    const modalSubtitle = document.querySelector('#registerModal .modal-subtitle');
    if (modalSubtitle) modalSubtitle.textContent = 'Solo necesitamos tu teléfono y dirección para tus pedidos';

    // Ocultar campo de nombre (ya viene de Google)
    const nameGroup = nameInput ? nameInput.closest('.register-field-group') || nameInput.parentElement : null;

    // Guardar referencia al usuario de Google para el submit
    window._pendingGoogleUser = googleUser;

    // Mostrar modal
    document.getElementById('registerModal').style.display = 'flex';
    document.getElementById('registerWhatsapp').focus();
}

// ── ACTUALIZAR UI DE NAVBAR CON USUARIO ──────────────────────
function updateNavbarUserUI(user) {
    const userInfoEl = document.getElementById('navbarUserInfo');
    if (!userInfoEl) return;

    if (user) {
        const photoHTML = user.photoURL
            ? `<img src="${user.photoURL}" alt="${user.nombre}" style="width:28px;height:28px;border-radius:50%;object-fit:cover;border:1.5px solid rgba(74,222,128,0.4);">`
            : `<span style="width:28px;height:28px;border-radius:50%;background:rgba(26,157,93,0.2);border:1.5px solid rgba(74,222,128,0.3);display:flex;align-items:center;justify-content:center;font-size:0.75rem;font-weight:700;color:#34d399;">${(user.nombre || 'U').charAt(0).toUpperCase()}</span>`;

        userInfoEl.innerHTML = `
            <div style="display:flex;align-items:center;gap:8px;padding:5px 12px 5px 6px;background:rgba(74,222,128,0.08);border:1px solid rgba(74,222,128,0.2);border-radius:9999px;cursor:pointer;" onclick="signOutUser()" title="Cerrar sesión">
                ${photoHTML}
                <span style="font-size:0.82rem;font-weight:600;color:#6ee7b7;max-width:100px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${user.nombre ? user.nombre.split(' ')[0] : 'Usuario'}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(110,231,183,0.6)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </div>
        `;
    } else {
        userInfoEl.innerHTML = '';
    }
}

// ── ESTADO DE CARGA EN BOTÓN ──────────────────────────────────
function showAuthLoadingState(loading) {
    const btn = document.getElementById('btnGoogleLogin');
    if (!btn) return;

    if (loading) {
        btn.disabled = true;
        btn.innerHTML = `
            <svg class="spin-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
            Conectando con Google...
        `;
    } else {
        btn.disabled = false;
        btn.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
                <path fill="#FF3D00" d="m6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"/>
                <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
                <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
            </svg>
            Registrarse con Google
        `;
    }
}

// ── MOSTRAR PANEL ADMIN (en admin.html) ───────────────────────
function showAdminPanel() {
    const loginScreen = document.getElementById('adminLoginScreen');
    const adminContent = document.getElementById('adminContent');

    if (loginScreen) loginScreen.style.display = 'none';
    if (adminContent) adminContent.style.display = 'block';

    // Inicializar el dashboard de usuarios
    if (typeof initUsersDashboard === 'function') {
        initUsersDashboard();
    }
    // Inicializar panel de marketing
    if (typeof updateAdminMarketingPanel === 'function') {
        updateAdminMarketingPanel();
    }
    // Inicializar admin.js
    if (typeof loadAndDisplayProducts === 'function') {
        loadAndDisplayProducts();
    }
}

// ── MOSTRAR ACCESO DENEGADO (en admin.html) ───────────────────
function showAdminAccessDenied(email) {
    const btnAdmin = document.getElementById('btnAdminGoogleLogin');
    if (btnAdmin) {
        btnAdmin.disabled = false;
        btnAdmin.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
                <path fill="#FF3D00" d="m6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"/>
                <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
                <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
            </svg>
            Ingresar como Administrador con Google
        `;
    }

    // Mostrar alerta elegante de acceso denegado
    const errorEl = document.getElementById('adminLoginError');
    if (errorEl) {
        errorEl.innerHTML = `
            <div style="display:flex;align-items:flex-start;gap:12px;">
                <span style="font-size:1.4rem;flex-shrink:0;">🚫</span>
                <div>
                    <strong style="display:block;margin-bottom:4px;">Acceso Denegado</strong>
                    <span style="font-size:0.82rem;opacity:0.85;">El correo <strong>${email}</strong> no tiene permisos de administrador. Contacta al propietario de la tienda.</span>
                </div>
            </div>
        `;
        errorEl.style.display = 'block';
        // Ocultar después de 8 segundos
        setTimeout(() => { errorEl.style.display = 'none'; }, 8000);
    }
}

// ── TOAST PARA ADMIN ──────────────────────────────────────────
function showAdminToast(message, type = 'success') {
    const existing = document.getElementById('adminToast');
    if (existing) existing.remove();

    const colors = {
        success: { bg: 'rgba(10, 107, 60, 0.95)', border: 'rgba(74, 222, 128, 0.3)' },
        error:   { bg: 'rgba(127, 29, 29, 0.95)',  border: 'rgba(239, 68, 68, 0.3)' }
    };
    const c = colors[type] || colors.success;

    const toast = document.createElement('div');
    toast.id = 'adminToast';
    toast.style.cssText = `
        position: fixed;
        top: 5rem;
        right: 2rem;
        background: ${c.bg};
        border: 1px solid ${c.border};
        color: #f0fdf4;
        padding: 0.85rem 1.5rem;
        border-radius: 12px;
        font-family: 'Inter', sans-serif;
        font-size: 0.875rem;
        font-weight: 600;
        z-index: 9999;
        backdrop-filter: blur(12px);
        box-shadow: 0 8px 32px rgba(0,0,0,0.4);
        opacity: 0;
        transform: translateX(20px);
        transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        max-width: 320px;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(0)';
        });
    });

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(20px)';
        setTimeout(() => toast.remove(), 400);
    }, 4000);
}
