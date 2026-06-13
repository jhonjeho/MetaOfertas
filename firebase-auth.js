<<<<<<< HEAD
/* ============================================================
   METAOFERTAS — MÓDULO DE AUTENTICACIÓN FIREBASE (firebase-auth.js)
   Maneja: Login con Google (Popup), Roles, Registro de Clientes en Firestore
   ============================================================ */

'use strict';

// ── ESTADO GLOBAL DE AUTENTICACIÓN ───────────────────────────
let firebaseUser = null;   // Usuario de Firebase Auth
let firestoreUserData = null; // Datos del usuario en Firestore

// Configurar parámetro personalizado para forzar la selección de cuenta si existe el proveedor
if (typeof googleProvider !== 'undefined' && googleProvider.setCustomParameters) {
    googleProvider.setCustomParameters({ prompt: 'select_account' });
}

// ── MANEJAR PROCESAMIENTO POST-LOGIN (POPUP) ─────────────────
// Procesamiento centralizado para el usuario que se acaba de loguear
async function procesarLoginExitoso(user, redirectIntent) {
    if (!user) return;
    
    console.log('[MetaOfertas] ✅ Usuario detectado:', user.email, '| UID:', user.uid);
    const isAdminEmail = ADMIN_EMAILS.includes(user.email.toLowerCase());
    console.log('[MetaOfertas] ¿Es correo de admin?', isAdminEmail, '| ADMIN_EMAILS:', ADMIN_EMAILS);

    if (redirectIntent === 'admin' || isAdminEmail) {
        // ── Flujo de ADMINISTRADOR ────────────────────────────────
        if (isAdminEmail) {
            console.log('[MetaOfertas] ✅ Admin autorizado. Guardando en Firestore...');
            try { await saveAdminToFirestore(user); } catch(e) { console.warn('[MetaOfertas] saveAdminToFirestore falló (no crítico):', e); }

            localStorage.setItem('_adminAuthenticated', user.email);
            localStorage.setItem('_adminUID', user.uid);
            console.log('[MetaOfertas] ✅ Estado admin guardado en localStorage.');

            const enAdminHtml = window.location.pathname.includes('admin.html') || window.location.href.includes('admin.html');
            if (!enAdminHtml) {
                console.log('[MetaOfertas] Intentando redirigir a: admin.html');
                window.location.href = 'admin.html';
                return;
            }

            console.log('[MetaOfertas] Ya en admin.html → mostrando panel...');
            showAdminPanel();
            showAdminToast(`✅ Bienvenido, ${(user.displayName || user.email).split(' ')[0]}. Acceso concedido.`, 'success');
        } else {
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
            if (typeof closeRegisterModal === 'function') closeRegisterModal();
            showAuthLoadingState(false);
            if (typeof showToastNotification === 'function') showToastNotification(`✅ ¡Bienvenido de nuevo, ${currentUser.nombre.split(' ')[0]}!`);
            if (typeof restaurarCarritoPendiente === 'function') {
                restaurarCarritoPendiente();
            }
        } else {
            showAuthLoadingState(false);
            showCompleteProfileModal(user);
        }
    }
}

// ── OBSERVADOR DE ESTADO DE AUTENTICACIÓN ────────────────────
auth.onAuthStateChanged(async (user) => {
    firebaseUser = user;

    if (user) {
        const isAdminPage = window.location.pathname.includes('admin.html');
        if (isAdminPage) {
            if (ADMIN_EMAILS.includes(user.email.toLowerCase())) {
                localStorage.setItem('_adminAuthenticated', user.email);
                localStorage.setItem('_adminUID', user.uid);
                await saveAdminToFirestore(user);
                showAdminPanel();
                const userInfoEl = document.getElementById('adminUserInfo');
                if (userInfoEl) {
                    const photoHTML = user.photoURL
                        ? `<img src="${user.photoURL}" style="width:24px;height:24px;border-radius:50%;object-fit:cover;border:1.5px solid rgba(74,222,128,0.3);vertical-align:middle;margin-right:6px;">`
                        : '';
                    userInfoEl.innerHTML = `${photoHTML}<span>${user.displayName ? user.displayName.split(' ')[0] : user.email}</span>`;
                }
            } else {
                await auth.signOut();
                localStorage.removeItem('_adminAuthenticated');
                localStorage.removeItem('_adminUID');
                showAdminAccessDenied(user.email);
            }
            return;
        }
        await syncUserFromFirestore(user);
    } else {
        firebaseUser = null;
        firestoreUserData = null;
        currentUser = null;
        if (typeof CONFIG !== 'undefined') localStorage.removeItem(CONFIG.USER_STORAGE_KEY);
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
            if (typeof saveUserToStorage === 'function') saveUserToStorage();
            updateNavbarUserUI(currentUser);
            return true;
        } else {
            return false;
        }
    } catch (error) {
        console.error('[MetaOfertas] Error al sincronizar usuario:', error);
        return false;
    }
}

// ── LOGIN CON GOOGLE (CLIENTES) — Usa Popup ──────────────────
async function loginWithGoogleAsClient() {
    try {
        showAuthLoadingState(true);
        const result = await auth.signInWithPopup(googleProvider);
        await procesarLoginExitoso(result.user, 'client');
    } catch (error) {
        showAuthLoadingState(false);
        console.error('[MetaOfertas] Error al iniciar sesión con Google:', error);
        if (typeof showRegisterError === 'function') showRegisterError('❌ Error al iniciar sesión con Google. Intenta de nuevo.');
    }
}

// ── LOGIN CON GOOGLE (ADMINISTRADORES) — Usa Popup ───────────
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
        const result = await auth.signInWithPopup(googleProvider);
        await procesarLoginExitoso(result.user, 'admin');
    } catch (error) {
        console.error('[MetaOfertas] Error al autenticar admin:', error);
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
        if (typeof saveUserToStorage === 'function') saveUserToStorage();
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
        if (typeof CONFIG !== 'undefined') localStorage.removeItem(CONFIG.USER_STORAGE_KEY);
        updateNavbarUserUI(null);
        if (typeof showToastNotification === 'function') showToastNotification('👋 Sesión cerrada correctamente');
    } catch (error) {
        console.error('[MetaOfertas] Error al cerrar sesión:', error);
    }
}

// ── MOSTRAR MODAL DE COMPLETAR PERFIL (USUARIO NUEVO) ─────────
function showCompleteProfileModal(googleUser) {
    const nameInput = document.getElementById('registerName');
    if (nameInput && googleUser.displayName) {
        nameInput.value = googleUser.displayName;
        nameInput.readOnly = true;
        nameInput.style.opacity = '0.7';
    }

    const photoContainer = document.getElementById('googleProfilePhoto');
    if (photoContainer && googleUser.photoURL) {
        photoContainer.innerHTML = `
            <img src="${googleUser.photoURL}" alt="Foto de perfil" 
                 style="width:56px;height:56px;border-radius:50%;border:2px solid rgba(74,222,128,0.4);object-fit:cover;">
        `;
        photoContainer.style.display = 'flex';
    }

    const emailDisplay = document.getElementById('googleEmailDisplay');
    if (emailDisplay) {
        emailDisplay.textContent = googleUser.email;
        emailDisplay.parentElement.style.display = 'block';
    }

    const modalTitle = document.querySelector('#registerModal h2');
    if (modalTitle) modalTitle.textContent = 'Completa tu Perfil';

    const modalSubtitle = document.querySelector('#registerModal .modal-subtitle');
    if (modalSubtitle) modalSubtitle.textContent = 'Solo necesitamos tu teléfono y dirección para tus pedidos';

    window._pendingGoogleUser = googleUser;

    const modal = document.getElementById('registerModal');
    if (modal) modal.style.display = 'flex';
    const whatsappInput = document.getElementById('registerWhatsapp');
    if (whatsappInput) whatsappInput.focus();
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

    if (typeof initUsersDashboard === 'function') initUsersDashboard();
    if (typeof updateAdminMarketingPanel === 'function') updateAdminMarketingPanel();
    if (typeof loadAndDisplayProducts === 'function') loadAndDisplayProducts();
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
=======
/* ============================================================
   METAOFERTAS — MÓDULO DE AUTENTICACIÓN FIREBASE (firebase-auth.js)
   Maneja: Login con Google (Popup), Roles, Registro de Clientes en Firestore
   ============================================================ */

'use strict';

// ── ESTADO GLOBAL DE AUTENTICACIÓN ───────────────────────────
let firebaseUser = null;   // Usuario de Firebase Auth
let firestoreUserData = null; // Datos del usuario en Firestore

// Configurar parámetro personalizado para forzar la selección de cuenta si existe el proveedor
if (typeof googleProvider !== 'undefined' && googleProvider.setCustomParameters) {
    googleProvider.setCustomParameters({ prompt: 'select_account' });
}

// ── MANEJAR PROCESAMIENTO POST-LOGIN (POPUP) ─────────────────
// Procesamiento centralizado para el usuario que se acaba de loguear
async function procesarLoginExitoso(user, redirectIntent) {
    if (!user) return;
    
    console.log('[MetaOfertas] ✅ Usuario detectado:', user.email, '| UID:', user.uid);
    const isAdminEmail = ADMIN_EMAILS.includes(user.email.toLowerCase());
    console.log('[MetaOfertas] ¿Es correo de admin?', isAdminEmail, '| ADMIN_EMAILS:', ADMIN_EMAILS);

    if (redirectIntent === 'admin' || isAdminEmail) {
        // ── Flujo de ADMINISTRADOR ────────────────────────────────
        if (isAdminEmail) {
            console.log('[MetaOfertas] ✅ Admin autorizado. Guardando en Firestore...');
            try { await saveAdminToFirestore(user); } catch(e) { console.warn('[MetaOfertas] saveAdminToFirestore falló (no crítico):', e); }

            localStorage.setItem('_adminAuthenticated', user.email);
            localStorage.setItem('_adminUID', user.uid);
            console.log('[MetaOfertas] ✅ Estado admin guardado en localStorage.');

            const enAdminHtml = window.location.pathname.includes('admin.html') || window.location.href.includes('admin.html');
            if (!enAdminHtml) {
                console.log('[MetaOfertas] Intentando redirigir a: admin.html');
                window.location.href = 'admin.html';
                return;
            }

            console.log('[MetaOfertas] Ya en admin.html → mostrando panel...');
            showAdminPanel();
            showAdminToast(`✅ Bienvenido, ${(user.displayName || user.email).split(' ')[0]}. Acceso concedido.`, 'success');
        } else {
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
            if (typeof closeRegisterModal === 'function') closeRegisterModal();
            showAuthLoadingState(false);
            if (typeof showToastNotification === 'function') showToastNotification(`✅ ¡Bienvenido de nuevo, ${currentUser.nombre.split(' ')[0]}!`);
            if (typeof restaurarCarritoPendiente === 'function') {
                restaurarCarritoPendiente();
            }
        } else {
            showAuthLoadingState(false);
            showCompleteProfileModal(user);
        }
    }
}

// ── OBSERVADOR DE ESTADO DE AUTENTICACIÓN ────────────────────
auth.onAuthStateChanged(async (user) => {
    firebaseUser = user;

    if (user) {
        const isAdminPage = window.location.pathname.includes('admin.html');
        if (isAdminPage) {
            if (ADMIN_EMAILS.includes(user.email.toLowerCase())) {
                localStorage.setItem('_adminAuthenticated', user.email);
                localStorage.setItem('_adminUID', user.uid);
                await saveAdminToFirestore(user);
                showAdminPanel();
                const userInfoEl = document.getElementById('adminUserInfo');
                if (userInfoEl) {
                    const photoHTML = user.photoURL
                        ? `<img src="${user.photoURL}" style="width:24px;height:24px;border-radius:50%;object-fit:cover;border:1.5px solid rgba(74,222,128,0.3);vertical-align:middle;margin-right:6px;">`
                        : '';
                    userInfoEl.innerHTML = `${photoHTML}<span>${user.displayName ? user.displayName.split(' ')[0] : user.email}</span>`;
                }
            } else {
                await auth.signOut();
                localStorage.removeItem('_adminAuthenticated');
                localStorage.removeItem('_adminUID');
                showAdminAccessDenied(user.email);
            }
            return;
        }
        await syncUserFromFirestore(user);
    } else {
        firebaseUser = null;
        firestoreUserData = null;
        currentUser = null;
        if (typeof CONFIG !== 'undefined') localStorage.removeItem(CONFIG.USER_STORAGE_KEY);
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
            if (typeof saveUserToStorage === 'function') saveUserToStorage();
            updateNavbarUserUI(currentUser);
            return true;
        } else {
            return false;
        }
    } catch (error) {
        console.error('[MetaOfertas] Error al sincronizar usuario:', error);
        return false;
    }
}

// ── LOGIN CON GOOGLE (CLIENTES) — Usa Popup ──────────────────
async function loginWithGoogleAsClient() {
    try {
        showAuthLoadingState(true);
        const result = await auth.signInWithPopup(googleProvider);
        await procesarLoginExitoso(result.user, 'client');
    } catch (error) {
        showAuthLoadingState(false);
        console.error('[MetaOfertas] Error al iniciar sesión con Google:', error);
        if (typeof showRegisterError === 'function') showRegisterError('❌ Error al iniciar sesión con Google. Intenta de nuevo.');
    }
}

// ── LOGIN CON GOOGLE (ADMINISTRADORES) — Usa Popup ───────────
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
        const result = await auth.signInWithPopup(googleProvider);
        await procesarLoginExitoso(result.user, 'admin');
    } catch (error) {
        console.error('[MetaOfertas] Error al autenticar admin:', error);
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
        if (typeof saveUserToStorage === 'function') saveUserToStorage();
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
        if (typeof CONFIG !== 'undefined') localStorage.removeItem(CONFIG.USER_STORAGE_KEY);
        updateNavbarUserUI(null);
        if (typeof showToastNotification === 'function') showToastNotification('👋 Sesión cerrada correctamente');
    } catch (error) {
        console.error('[MetaOfertas] Error al cerrar sesión:', error);
    }
}

// ── MOSTRAR MODAL DE COMPLETAR PERFIL (USUARIO NUEVO) ─────────
function showCompleteProfileModal(googleUser) {
    const nameInput = document.getElementById('registerName');
    if (nameInput && googleUser.displayName) {
        nameInput.value = googleUser.displayName;
        nameInput.readOnly = true;
        nameInput.style.opacity = '0.7';
    }

    const photoContainer = document.getElementById('googleProfilePhoto');
    if (photoContainer && googleUser.photoURL) {
        photoContainer.innerHTML = `
            <img src="${googleUser.photoURL}" alt="Foto de perfil" 
                 style="width:56px;height:56px;border-radius:50%;border:2px solid rgba(74,222,128,0.4);object-fit:cover;">
        `;
        photoContainer.style.display = 'flex';
    }

    const emailDisplay = document.getElementById('googleEmailDisplay');
    if (emailDisplay) {
        emailDisplay.textContent = googleUser.email;
        emailDisplay.parentElement.style.display = 'block';
    }

    const modalTitle = document.querySelector('#registerModal h2');
    if (modalTitle) modalTitle.textContent = 'Completa tu Perfil';

    const modalSubtitle = document.querySelector('#registerModal .modal-subtitle');
    if (modalSubtitle) modalSubtitle.textContent = 'Solo necesitamos tu teléfono y dirección para tus pedidos';

    window._pendingGoogleUser = googleUser;

    const modal = document.getElementById('registerModal');
    if (modal) modal.style.display = 'flex';
    const whatsappInput = document.getElementById('registerWhatsapp');
    if (whatsappInput) whatsappInput.focus();
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

    if (typeof initUsersDashboard === 'function') initUsersDashboard();
    if (typeof updateAdminMarketingPanel === 'function') updateAdminMarketingPanel();
    if (typeof loadAndDisplayProducts === 'function') loadAndDisplayProducts();
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
>>>>>>> 501eef96e7e1bf4b282028af1297426bac033904
}