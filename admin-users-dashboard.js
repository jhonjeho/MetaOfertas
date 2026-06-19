/* ============================================================
   METAOFERTAS — DASHBOARD DE USUARIOS (admin-users-dashboard.js)
   Escucha en tiempo real la colección 'usuarios' de Firestore
   y renderiza una tabla premium con buscador integrado.
   ============================================================ */

'use strict';

let usersUnsubscribe = null;   // Referencia para cancelar el listener
let allUsersCache    = [];      // Cache local de usuarios para el buscador

// ── INICIALIZAR DASHBOARD DE USUARIOS ────────────────────────
function initUsersDashboard() {
    // Evitar múltiples listeners activos
    if (usersUnsubscribe) {
        usersUnsubscribe();
        usersUnsubscribe = null;
    }

    // Configurar buscador
    const searchInput = document.getElementById('usersSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            filterUsersTable(e.target.value.trim().toLowerCase());
        });
    }

    // Escuchar colección 'usuarios' en tiempo real con onSnapshot
    usersUnsubscribe = db.collection('usuarios')
        .orderBy('fechaRegistro', 'desc')
        .onSnapshot(
            (snapshot) => {
                allUsersCache = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                renderUsersTable(allUsersCache);
                updateUserStats(allUsersCache);
            },
            (error) => {
                console.error('[MetaOfertas] Error al escuchar usuarios:', error);
                renderUsersTableError();
            }
        );
}

// ── RENDERIZAR TABLA DE USUARIOS ──────────────────────────────
function renderUsersTable(users) {
    const tbody = document.getElementById('usersTableBody');
    const emptyState = document.getElementById('usersTableEmpty');
    const tableWrapper = document.getElementById('usersTableWrapper');

    if (!tbody) return;

    if (users.length === 0) {
        if (tableWrapper) tableWrapper.style.display = 'none';
        if (emptyState) emptyState.style.display = 'flex';
        return;
    }

    if (tableWrapper) tableWrapper.style.display = 'block';
    if (emptyState) emptyState.style.display = 'none';

    tbody.innerHTML = users.map(user => {
        const fechaStr = formatFirestoreDate(user.fechaRegistro);
        const rolBadge = getRolBadge(user.rol);
        const photoHTML = user.photoURL
            ? `<img src="${user.photoURL}" alt="${user.nombre || ''}" 
                    style="width:34px;height:34px;border-radius:50%;object-fit:cover;border:1.5px solid rgba(74,222,128,0.35);flex-shrink:0;"
                    onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
               <span class="user-avatar-fallback" style="display:none;">${getInitials(user.nombre)}</span>`
            : `<span class="user-avatar-fallback">${getInitials(user.nombre)}</span>`;

        return `
        <tr class="users-table-row">
            <td class="users-td">
                <div style="display:flex;align-items:center;gap:10px;">
                    <div style="position:relative;flex-shrink:0;display:flex;align-items:center;justify-content:center;">
                        ${photoHTML}
                    </div>
                    <div style="min-width:0;">
                        <div style="font-weight:700;font-size:0.875rem;color:#f0fdf4;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:160px;">${escapeHtml(user.nombre || 'Sin nombre')}</div>
                        ${rolBadge}
                    </div>
                </div>
            </td>
            <td class="users-td">
                <span style="font-size:0.82rem;color:rgba(240,253,244,0.7);">${escapeHtml(user.correo || '—')}</span>
            </td>
            <td class="users-td">
                <span style="font-size:0.85rem;color:rgba(240,253,244,0.85);font-weight:500;">${escapeHtml(user.telefono || '—')}</span>
            </td>
            <td class="users-td">
                <span style="font-size:0.82rem;color:rgba(240,253,244,0.7);max-width:180px;display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${escapeHtml(user.direccion || '')}">${escapeHtml(user.direccion || '—')}</span>
            </td>
            <td class="users-td">
                <span style="font-size:0.78rem;color:rgba(240,253,244,0.5);white-space:nowrap;">${fechaStr}</span>
            </td>
            <td class="users-td">
                ${(user.correo && user.correo.toLowerCase() === 'jhon.jeho@gmail.com')
                    ? '<span style="display:inline-flex;align-items:center;padding:2px 8px;background:rgba(132,204,22,0.12);border:1px solid rgba(132,204,22,0.25);border-radius:9999px;font-size:0.68rem;font-weight:700;color:#84cc16;letter-spacing:0.04em;">⭐ Principal</span>'
                    : `<button class="btn-delete-user" data-user-id="${user.id}" data-user-email="${user.correo || ''}" data-user-role="${user.rol || ''}" type="button">Eliminar</button>`}
            </td>
        </tr>`;
    }).join('');

    const deleteButtons = tbody.querySelectorAll('.btn-delete-user');
    deleteButtons.forEach(btn => {
        btn.addEventListener('click', async () => {
            const userId = btn.dataset.userId;
            const userEmail = btn.dataset.userEmail;
            const userRole = btn.dataset.userRole;
            if (!userId) return;

            if (userEmail && userEmail.toLowerCase() === 'jhon.jeho@gmail.com') {
                alert('No se puede eliminar al administrador principal.');
                return;
            }

            if (!confirm('¿Eliminar este usuario? Esta acción no se puede deshacer.')) return;
            try {
                // Si es un administrador, también quitarlo de config/admins
                if (userRole === 'admin' && userEmail) {
                    try {
                        const ref = db.collection('config').doc('admins');
                        const doc = await ref.get();
                        if (doc.exists && Array.isArray(doc.data().emails)) {
                            const emails = doc.data().emails.map(e => String(e).toLowerCase());
                            const filtered = emails.filter(e => e !== userEmail.toLowerCase());
                            await ref.set({ emails: filtered }, { merge: true });
                            if (typeof ADMIN_EMAILS !== 'undefined') {
                                ADMIN_EMAILS = filtered;
                            }
                        }
                    } catch (adminErr) {
                        console.warn('[MetaOfertas] No se pudo quitar de config/admins:', adminErr);
                    }
                }

                await db.collection('usuarios').doc(userId).delete();
                if (typeof showAdminToast === 'function') {
                    showAdminToast('✅ Usuario eliminado correctamente', 'success');
                }
            } catch (error) {
                console.error('[MetaOfertas] Error eliminando usuario:', error);
                if (typeof showAdminToast === 'function') {
                    showAdminToast('❌ Error al eliminar usuario', 'error');
                }
            }
        });
    });
}

// ── FILTRAR TABLA POR BÚSQUEDA ────────────────────────────────
function filterUsersTable(query) {
    if (!query) {
        renderUsersTable(allUsersCache);
        return;
    }

    const filtered = allUsersCache.filter(user => {
        const nombre  = (user.nombre  || '').toLowerCase();
        const correo  = (user.correo  || '').toLowerCase();
        const telefono = (user.telefono || '').toLowerCase();
        return nombre.includes(query) || correo.includes(query) || telefono.includes(query);
    });

    renderUsersTable(filtered);

    // Mostrar contador de resultados
    const counter = document.getElementById('usersSearchCounter');
    if (counter) {
        counter.textContent = filtered.length === allUsersCache.length
            ? ''
            : `${filtered.length} resultado${filtered.length !== 1 ? 's' : ''}`;
    }
}

// ── ACTUALIZAR ESTADÍSTICAS ───────────────────────────────────
function updateUserStats(users) {
    const totalEl   = document.getElementById('statTotalUsers');
    const clientsEl = document.getElementById('statTotalClients');
    const adminsEl  = document.getElementById('statTotalAdmins');

    const clients = users.filter(u => u.rol === 'cliente').length;
    const admins  = users.filter(u => u.rol === 'admin').length;

    if (totalEl)   totalEl.textContent   = users.length;
    if (clientsEl) clientsEl.textContent = clients;
    if (adminsEl)  adminsEl.textContent  = admins;
}

// ── ESTADO DE ERROR ───────────────────────────────────────────
function renderUsersTableError() {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;
    tbody.innerHTML = `
        <tr>
            <td colspan="5" style="text-align:center;padding:3rem 1rem;color:rgba(252,165,165,0.8);font-size:0.875rem;">
                ⚠️ Error al cargar los usuarios. Verifica tu conexión y los permisos de Firestore.
            </td>
        </tr>`;
}

// ── UTILIDADES ────────────────────────────────────────────────
function formatFirestoreDate(timestamp) {
    if (!timestamp) return '—';
    try {
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('es-CO', {
            day: '2-digit', month: 'short', year: 'numeric'
        });
    } catch {
        return '—';
    }
}

function getInitials(nombre) {
    if (!nombre) return '?';
    const parts = nombre.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return nombre.charAt(0).toUpperCase();
}

function getRolBadge(rol) {
    if (rol === 'admin') {
        return `<span style="display:inline-flex;align-items:center;gap:4px;padding:2px 8px;background:rgba(212,160,23,0.15);border:1px solid rgba(212,160,23,0.3);border-radius:9999px;font-size:0.68rem;font-weight:700;color:#f0c040;letter-spacing:0.04em;">⚡ Admin</span>`;
    }
    return `<span style="display:inline-flex;align-items:center;gap:4px;padding:2px 8px;background:rgba(26,157,93,0.12);border:1px solid rgba(74,222,128,0.2);border-radius:9999px;font-size:0.68rem;font-weight:700;color:#34d399;letter-spacing:0.04em;">👤 Cliente</span>`;
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
