/* ============================================
   METAAOFERTAS - LÓGICA PANEL ADMIN (admin.js)
   Actualizado para usar IDs de Firestore (strings)
   Imágenes guardadas como Base64 en Firestore (sin Firebase Storage)
   ============================================ */

let currentEditingProductId = null; // Ahora es un string (ID de Firestore)
let currentProductView = localStorage.getItem('adminProductView') || 'grid';

// ============================================
// INICIALIZACIÓN
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    initializeAdmin();
});

function initializeAdmin() {
    setupAdminEventListeners();
    
    // Configurar clase activa del switch de visualización según localStorage
    const btnGrid = document.getElementById('btnViewGrid');
    const btnList = document.getElementById('btnViewList');
    if (btnGrid && btnList) {
        if (currentProductView === 'list') {
            btnList.classList.add('active');
            btnGrid.classList.remove('active');
        } else {
            btnGrid.classList.add('active');
            btnList.classList.remove('active');
        }
    }
    
    // Los productos se cargan automáticamente desde el listener de Firestore en app.js
    // loadAndDisplayProducts() se llama desde el onSnapshot de listenToProductsFromFirestore()
}

// ============================================
// CARGAR Y MOSTRAR PRODUCTOS
// ============================================

function loadAndDisplayProducts() {
    const products = getAllProducts();
    displayProductsList(products);
    updateProductCount();
}

function displayProductsList(products) {
    const container = document.getElementById('adminProductsList');
    const emptyMessage = document.getElementById('emptyProductsMessage');
    if (!container || !emptyMessage) return;

    if (products.length === 0) {
        container.style.display = 'none';
        emptyMessage.style.display = 'block';
        return;
    }

    container.style.display = 'flex';
    emptyMessage.style.display = 'none';

    if (currentProductView === 'list') {
        container.style.flexDirection = 'column';
        container.innerHTML = products.map(product => {
            const originalPriceStr = formatPrice(product.originalPrice);
            const offerPriceStr = formatPrice(product.offerPrice);
            const discountStr = calculateDiscount(product.originalPrice, product.offerPrice);
            const stockVal = typeof product.quantity === 'number' ? product.quantity : (product.quantity || 0);
            
            return `
            <div class="admin-product-row" data-product-id="${product.id}">
                <div class="admin-product-row-header" onclick="toggleProductRowExpansion('${product.id}')">
                    <span class="admin-product-row-emoji">${product.emoji || '📦'}</span>
                    <span class="admin-product-row-title">${product.title}</span>
                    <span class="admin-product-row-category">${getCategoryLabel(product.category)}</span>
                    <div class="admin-product-row-prices">
                        <span class="admin-product-row-original">${originalPriceStr}</span>
                        <span class="admin-product-row-offer">${offerPriceStr}</span>
                    </div>
                    <span class="admin-product-row-arrow">▼</span>
                </div>
                <div class="admin-product-row-detail">
                    <div class="admin-product-row-detail-content">
                        <div class="admin-product-row-image">
                            ${product.image ? `<img src="${product.image}" alt="${product.title}">` : `<span class="large-emoji">${product.emoji || '📦'}</span>`}
                        </div>
                        <div class="admin-product-row-detail-info">
                            <div class="admin-product-row-discount">
                                💰 Descuento: <strong>${discountStr}% OFF</strong> | Ahorras: <strong>${formatPrice(product.originalPrice - product.offerPrice)}</strong>
                            </div>
                            <div class="admin-product-row-stock-info">
                                Stock actual: <strong>${stockVal} unidades</strong>
                            </div>
                        </div>
                        <div class="admin-product-row-actions">
                            <button class="btn-icon btn-stock" onclick="changeProductStock('${product.id}', -1)" title="Restar stock">➖</button>
                            <button class="btn-icon btn-edit" onclick="openEditModal('${product.id}')" title="Editar">✏️</button>
                            <button class="btn-icon btn-stock" onclick="changeProductStock('${product.id}', 1)" title="Sumar stock">➕</button>
                            <button class="btn-icon btn-delete" onclick="deleteProductConfirm('${product.id}')" title="Eliminar">🗑️</button>
                        </div>
                    </div>
                </div>
            </div>
            `;
        }).join('');
    } else {
        container.style.flexDirection = '';
        container.innerHTML = products.map(product => `
            <div class="admin-product-item">
                <div class="admin-product-image">
                    ${product.image ? `<img src="${product.image}" alt="${product.title}">` : product.emoji}
                </div>
                <div class="admin-product-info">
                    <div class="admin-product-title">${product.title}</div>
                    <div class="admin-product-prices">
                        <span class="admin-product-original">${formatPrice(product.originalPrice)}</span>
                        <span class="admin-product-offer">${formatPrice(product.offerPrice)}</span>
                        <span class="admin-product-discount">${calculateDiscount(product.originalPrice, product.offerPrice)}% OFF</span>
                    </div>
                    <div class="admin-product-stock">Stock: <strong>${typeof product.quantity === 'number' ? product.quantity : (product.quantity || 0)}</strong></div>
                </div>
                <div class="admin-product-actions">
                    <button class="btn-icon btn-stock" onclick="changeProductStock('${product.id}', -1)" title="Restar stock">➖</button>
                    <button class="btn-icon btn-edit" onclick="openEditModal('${product.id}')" title="Editar">✏️</button>
                    <button class="btn-icon btn-stock" onclick="changeProductStock('${product.id}', 1)" title="Sumar stock">➕</button>
                    <button class="btn-icon btn-delete" onclick="deleteProductConfirm('${product.id}')" title="Eliminar">🗑️</button>
                </div>
            </div>
        `).join('');
    }
}

function switchProductView(viewType) {
    if (viewType !== 'grid' && viewType !== 'list') return;
    currentProductView = viewType;
    localStorage.setItem('adminProductView', viewType);

    // Actualizar clases de botones
    const btnGrid = document.getElementById('btnViewGrid');
    const btnList = document.getElementById('btnViewList');
    if (btnGrid && btnList) {
        if (viewType === 'grid') {
            btnGrid.classList.add('active');
            btnList.classList.remove('active');
        } else {
            btnList.classList.add('active');
            btnGrid.classList.remove('active');
        }
    }

    loadAndDisplayProducts();
}

function toggleProductRowExpansion(productId) {
    const row = document.querySelector(`.admin-product-row[data-product-id="${productId}"]`);
    if (!row) return;

    const isExpanded = row.classList.contains('expanded');

    // Cerrar las demás filas primero (efecto acordeón)
    document.querySelectorAll('.admin-product-row.expanded').forEach(r => {
        if (r !== row) {
            r.classList.remove('expanded');
            const arrow = r.querySelector('.admin-product-row-arrow');
            if (arrow) arrow.textContent = '▼';
        }
    });

    if (isExpanded) {
        row.classList.remove('expanded');
        const arrow = row.querySelector('.admin-product-row-arrow');
        if (arrow) arrow.textContent = '▼';
    } else {
        row.classList.add('expanded');
        const arrow = row.querySelector('.admin-product-row-arrow');
        if (arrow) arrow.textContent = '▲';
    }
}

function getCategoryLabel(category) {
    const labels = {
        vegetables: '🥬 Frutas y Verduras',
        meats: '🍗 Carnes y Pollo',
        dairy: '🥛 Lácteos y Huevos',
        pantry: '🥫 Despensa'
    };
    return labels[category] || category || 'Sin categoría';
}

function updateProductCount() {
    const count = getAllProducts().length;
    document.querySelectorAll('h2').forEach(h2 => {
        if (h2.textContent.includes('Productos Actuales')) {
            // Preservar el ícono SVG del h2
            const svgEl = h2.querySelector('svg');
            const iconWrap = h2.querySelector('.section-icon');
            if (iconWrap) {
                // Actualizar solo el texto, no el ícono
                const textNode = Array.from(h2.childNodes).find(n => n.nodeType === Node.TEXT_NODE);
                if (textNode) {
                    textNode.textContent = ` Productos Actuales (${count})`;
                }
            }
        }
    });
}

// ============================================
// FORMULARIO DE AGREGAR PRODUCTO
// ============================================

function setupAdminEventListeners() {
    // Formulario Agregar Producto
    const productForm = document.getElementById('productForm');
    if (productForm) productForm.addEventListener('submit', handleAddProduct);

    // Cambios en precios para mostrar descuento
    const productOriginal = document.getElementById('productOriginal');
    const productOffer = document.getElementById('productOffer');
    if (productOriginal) productOriginal.addEventListener('input', updateDiscountInfo);
    if (productOffer) productOffer.addEventListener('input', updateDiscountInfo);

    // Previsualización de imagen
    const productImage = document.getElementById('productImage');
    if (productImage) productImage.addEventListener('change', previewImage);

    // Formulario Editar Producto
    const editProductForm = document.getElementById('editProductForm');
    if (editProductForm) editProductForm.addEventListener('submit', handleEditProduct);

    const editProductImage = document.getElementById('editProductImage');
    if (editProductImage) editProductImage.addEventListener('change', previewEditImage);

    const editProductOriginal = document.getElementById('editProductOriginal');
    const editProductOffer = document.getElementById('editProductOffer');
    if (editProductOriginal) editProductOriginal.addEventListener('input', updateEditDiscountInfo);
    if (editProductOffer) editProductOffer.addEventListener('input', updateEditDiscountInfo);

    // Modal cerrar
    const closeBtn = document.querySelector('#editModal .close');
    if (closeBtn) closeBtn.addEventListener('click', closeEditModal);

    window.addEventListener('click', (e) => {
        const modal = document.getElementById('editModal');
        if (modal && e.target === modal) {
            closeEditModal();
        }
    });

    // Búsqueda
    const searchProducts = document.getElementById('searchProducts');
    if (searchProducts) searchProducts.addEventListener('input', handleSearch);

    // Formulario de gestión de administradores (agregar / eliminar correos)
    const adminEmailsForm = document.getElementById('adminEmailsForm');
    if (adminEmailsForm) adminEmailsForm.addEventListener('submit', async (ev) => {
        ev.preventDefault();
        const input = document.getElementById('newAdminEmail');
        if (!input) return;
        const email = input.value.trim().toLowerCase();
        if (!email) return;
        try {
            await addAdminEmail(email);
            input.value = '';
            showAdminToast('✅ Administrador agregado', 'success');
        } catch (err) {
            console.error('[Admin] Error agregando admin:', err);
            const msg = (err && err.message) ? err.message : String(err);
            showAdminToast('❌ Error al agregar admin: ' + msg, 'error');
        }
    });

    // Importación CSV de inventario
    const inventoryCsvFile = document.getElementById('inventoryCsvFile');
    const btnUploadInventoryCsv = document.getElementById('btnUploadInventoryCsv');
    if (btnUploadInventoryCsv) btnUploadInventoryCsv.addEventListener('click', handleInventoryCsvUpload);

}

async function handleInventoryCsvUpload(e) {
    e.preventDefault();
    const fileInput = document.getElementById('inventoryCsvFile');
    const statusEl = document.getElementById('inventoryCsvStatus');
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
        showAdminToast('Selecciona un archivo CSV primero', 'error');
        return;
    }

    const file = fileInput.files[0];
    const text = await file.text();
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    const items = [];

    for (const line of lines) {
        // soportar id,quantity o title,quantity
        const parts = line.split(',').map(p => p.trim());
        if (parts.length < 2) continue;
        const a = parts[0];
        const b = parts[1];
        if (/^\d+$/.test(a)) {
            items.push({ id: Number(a), quantity: Number(b) });
        } else {
            // buscar por title localmente
            const prods = getAllProducts().filter(p => String(p.title).toLowerCase() === String(a).toLowerCase());
            if (prods.length > 0) {
                items.push({ id: prods[0].id, quantity: Number(b) });
            } else {
                // intentar match parcial
                const partial = getAllProducts().find(p => String(p.title).toLowerCase().includes(String(a).toLowerCase()));
                if (partial) items.push({ id: partial.id, quantity: Number(b) });
            }
        }
    }

    if (items.length === 0) {
        showAdminToast('No se encontraron filas válidas en el CSV', 'error');
        return;
    }

    // Solicitar token JWT al backend usando la contraseña
    const adminPassword = prompt('Ingresa la contraseña de admin para solicitar token:');
    if (!adminPassword) {
        showAdminToast('Operación cancelada', 'info');
        return;
    }

    statusEl.textContent = 'Obteniendo token...';
    try {
        const loginRes = await fetch('/api/admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: adminPassword })
        });
        const loginData = await loginRes.json();
        if (!loginRes.ok) throw new Error(loginData && loginData.error ? loginData.error : 'Autenticación fallida');
        const token = loginData.token;

        statusEl.textContent = 'Enviando cambios...';
        const res = await fetch('/api/products/inventory/bulk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
            body: JSON.stringify({ items })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data && data.error ? data.error : 'Error desconocido');
        statusEl.textContent = `Importados: ${data.updated}`;
        showAdminToast('✅ Inventario importado correctamente', 'success');
        if (typeof loadAndDisplayProducts === 'function') loadAndDisplayProducts();
    } catch (err) {
        console.error('Error importando CSV:', err);
        statusEl.textContent = 'Error: ' + err.message;
        showAdminToast('❌ Error al importar inventario: ' + err.message, 'error');
    }
}

// ============================================
// FUNCIONES DE FORMULARIO
// ============================================

async function handleAddProduct(e) {
    e.preventDefault();

    const title = document.getElementById('productTitle').value.trim();
    const originalPrice = parseFloat(document.getElementById('productOriginal').value);
    const offerPrice = parseFloat(document.getElementById('productOffer').value);
    const category = document.getElementById('productCategory').value;
    const emoji = document.getElementById('productEmoji').value || '📦';
    const imageInput = document.getElementById('productImage');
    const submitBtn = document.querySelector('#productForm button[type="submit"]');

    if (!title || !category || !originalPrice || !offerPrice) {
        alert('❌ Por favor completa todos los campos requeridos');
        return;
    }

    if (offerPrice >= originalPrice) {
        alert('❌ El precio de oferta debe ser menor que el precio original');
        return;
    }

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = '⏳ Preparando imagen...';
    }

    try {
        let imageDataURL = null;

        if (imageInput && imageInput.files.length > 0) {
            const imageFile = imageInput.files[0];

            if (!isValidImageFile(imageFile)) {
                throw new Error('Imagen no válida. Usa JPEG, PNG, WebP o GIF (máx 20MB).');
            }

            showAdminToast('⏳ Comprimiendo imagen...', 'info');

            if (submitBtn) submitBtn.textContent = '⏳ Comprimiendo...';

            imageDataURL = await compressImageToBase64(imageFile, 800, 0.70);

            // Verificar tamaño (Firestore tiene límite de 1MB por documento)
            const sizeKB = Math.round((imageDataURL.length * 3) / 4 / 1024);
            console.log(`[Admin] Imagen comprimida: ~${sizeKB}KB`);

            if (sizeKB > 900) {
                // Comprimir más si es muy grande
                imageDataURL = await compressImageToBase64(imageFile, 600, 0.55);
                const newSizeKB = Math.round((imageDataURL.length * 3) / 4 / 1024);
                console.log(`[Admin] Re-comprimida: ~${newSizeKB}KB`);
            }

            if (submitBtn) submitBtn.textContent = '⏳ Guardando...';
            showAdminToast('✅ Imagen comprimida correctamente', 'success');
        }

        const product = {
            title,
            originalPrice,
            offerPrice,
            category,
            emoji,
            image: imageDataURL,
            quantity: parseInt(document.getElementById('productStock')?.value || 0, 10)
        };

        await addProduct(product);
        resetForm();
        showAdminToast('✅ Producto agregado exitosamente', 'success');

    } catch (error) {
        console.error('[Admin] Error al agregar producto:', error);
        alert(`❌ Error: ${error.message}`);
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Crear Producto`;
        }
    }
}

/**
 * Comprime una imagen y la devuelve como Data URL (Base64).
 * Se guarda directamente en Firestore sin necesidad de Firebase Storage.
 */
async function compressImageToBase64(file, maxWidth = 800, quality = 0.70) {
    return new Promise((resolve, reject) => {
        const objectUrl = URL.createObjectURL(file);
        const img = new Image();

        const cleanup = () => {
            try { URL.revokeObjectURL(objectUrl); } catch (err) {}
            img.onload = null;
            img.onerror = null;
        };

        img.onerror = () => {
            cleanup();
            reject(new Error('Error al cargar la imagen para compresión.'));
        };

        img.onload = () => {
            try {
                let width = img.naturalWidth || img.width;
                let height = img.naturalHeight || img.height;

                // Redimensionar si es más ancha que maxWidth
                if (width > maxWidth) {
                    const ratio = maxWidth / width;
                    width = Math.round(maxWidth);
                    height = Math.round(height * ratio);
                }

                // También limitar la altura máxima
                const maxHeight = 800;
                if (height > maxHeight) {
                    const ratio = maxHeight / height;
                    height = Math.round(maxHeight);
                    width = Math.round(width * ratio);
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d', { alpha: false });

                if (!ctx) {
                    cleanup();
                    reject(new Error('No se pudo obtener el contexto del canvas.'));
                    return;
                }

                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, width, height);
                ctx.drawImage(img, 0, 0, width, height);

                cleanup();
                const dataURL = canvas.toDataURL('image/jpeg', quality);
                resolve(dataURL);
            } catch (err) {
                cleanup();
                reject(err);
            }
        };

        img.src = objectUrl;
    });
}

function resetForm() {
    const form = document.getElementById('productForm');
    if (form) form.reset();
    const emojiInput = document.getElementById('productEmoji');
    if (emojiInput) emojiInput.value = '📦';
    const imagePreview = document.getElementById('imagePreview');
    if (imagePreview) {
        imagePreview.innerHTML = `
            <div class="image-preview-placeholder">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                <p>Previsualización de imagen</p>
            </div>`;
    }
    const discountInfo = document.getElementById('discountInfo');
    if (discountInfo) discountInfo.innerHTML = '';
}

function previewImage(e) {
    const file = e.target.files[0];
    const preview = document.getElementById('imagePreview');
    if (!preview) return;

    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            preview.innerHTML = `<img src="${event.target.result}" alt="Preview">`;
        };
        reader.readAsDataURL(file);
    } else {
        preview.innerHTML = `
            <div class="image-preview-placeholder">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                <p>Previsualización de imagen</p>
            </div>`;
    }
}

// ============================================
// GESTIÓN DE CORREOS DE ADMIN (Firestore)
// Guarda la lista en: collection 'config' doc 'admins' { emails: [...] }
// ============================================

const PROTECTED_ADMIN_EMAIL = 'jhon.jeho@gmail.com';

async function loadAdminEmails() {
    try {
        if (typeof db === 'undefined') return [];
        const ref = db.collection('config').doc('admins');
        const doc = await ref.get();
        let emails = [];
        if (doc.exists && doc.data() && Array.isArray(doc.data().emails)) {
            emails = doc.data().emails.map(e => String(e).toLowerCase());
        }

        if (!emails.includes(PROTECTED_ADMIN_EMAIL)) {
            emails.unshift(PROTECTED_ADMIN_EMAIL);
            await ref.set({ emails }, { merge: true });
            console.log('[Admin] Agregado admin protegido automáticamente a Firestore:', PROTECTED_ADMIN_EMAIL);
        }

        // actualizar variable global si existe
        try { ADMIN_EMAILS = emails; } catch (e) { /* ignore if const */ }
        renderAdminEmailsList(emails);
        return emails;
    } catch (err) {
        console.error('[Admin] Error cargando admin emails:', err);
        renderAdminEmailsList(ADMIN_EMAILS || [PROTECTED_ADMIN_EMAIL]);
        return ADMIN_EMAILS || [PROTECTED_ADMIN_EMAIL];
    }
}

function renderAdminEmailsList(emails) {
    const container = document.getElementById('adminEmailsList');
    if (!container) return;
    if (!emails || emails.length === 0) {
        container.innerHTML = '<div style="color:rgba(240,253,244,0.5);">No hay administradores configurados.</div>';
        return;
    }
    container.innerHTML = emails.map(function(e){
        const isProtectedAdmin = e.toLowerCase() === 'jhon.jeho@gmail.com';
        return '<div class="admin-email-item" style="display:flex;align-items:center;justify-content:space-between;padding:6px 8px;border-radius:8px;margin-bottom:6px;background:rgba(255,255,255,0.02);">'
            + '<div style="font-size:0.95rem;color:rgba(240,253,244,0.9);">' + e + '</div>'
            + '<div>'
                + (isProtectedAdmin
                    ? '<span style="font-size:0.85rem;color:rgba(132,204,22,0.95);padding:6px 10px;border-radius:8px;background:rgba(132,204,22,0.1);">Administrador principal</span>'
                    : '<button class="btn-icon btn-delete-admin" data-email="' + e + '" style="background:transparent;border:0;color:#f87171;cursor:pointer;padding:6px;border-radius:8px;">Eliminar</button>')
            + '</div>'
        + '</div>';
    }).join('');

    // attach delete handlers
    container.querySelectorAll('.btn-delete-admin').forEach(btn => {
        btn.addEventListener('click', async (ev) => {
            const email = btn.getAttribute('data-email');
            if (!email) return;
            if (!confirm('Eliminar administrador ' + email + '?')) return;
            try {
                await removeAdminEmail(email);
                showAdminToast('✅ Administrador eliminado', 'success');
            } catch (err) {
                console.error('[Admin] Error eliminando admin:', err);
                const msg = (err && err.message) ? err.message : String(err);
                showAdminToast('❌ Error al eliminar admin: ' + msg, 'error');
            }
        });
    });
}

async function addAdminEmail(email) {
    if (!email) throw new Error('Email vacío');
    try {
        const ref = db.collection('config').doc('admins');
        const doc = await ref.get();
        let emails = [];
        if (doc.exists && Array.isArray(doc.data().emails)) {
            emails = doc.data().emails.map(e => String(e).toLowerCase());
        }
        if (emails.includes(email.toLowerCase())) {
            throw new Error('El correo ya es administrador');
        }
        emails.push(email.toLowerCase());
        await ref.set({ emails }, { merge: true });
        // actualizar memoria local
        try { ADMIN_EMAILS = emails; } catch (e) {}
        renderAdminEmailsList(emails);
        return emails;
    } catch (err) {
        throw err;
    }
}

async function removeAdminEmail(email) {
    if (!email) throw new Error('Email vacío');
    if (email.toLowerCase() === 'jhon.jeho@gmail.com') {
        throw new Error('Este administrador no puede ser eliminado.');
    }
    try {
        const ref = db.collection('config').doc('admins');
        const doc = await ref.get();
        let emails = [];
        if (doc.exists && Array.isArray(doc.data().emails)) {
            emails = doc.data().emails.map(e => String(e).toLowerCase());
        }
        const filtered = emails.filter(e => e !== email.toLowerCase());
        if (!filtered.includes(PROTECTED_ADMIN_EMAIL) || email.toLowerCase() === PROTECTED_ADMIN_EMAIL) {
            throw new Error('Este administrador no puede ser eliminado.');
        }
        await ref.set({ emails: filtered }, { merge: true });
        try { ADMIN_EMAILS = filtered; } catch (e) {}

        // También eliminar de la colección 'usuarios' en Firestore
        try {
            const userSnapshot = await db.collection('usuarios').where('correo', '==', email.toLowerCase()).get();
            const batch = db.batch();
            userSnapshot.forEach(userDoc => {
                batch.delete(userDoc.ref);
            });
            await batch.commit();
        } catch (userErr) {
            console.warn('[Admin] Error al intentar eliminar el usuario de la colección usuarios:', userErr);
        }

        renderAdminEmailsList(filtered);
        return filtered;
    } catch (err) {
        throw err;
    }
}

// Exponer funciones clave en `window` para asegurar accesibilidad desde handlers del DOM
try {
    if (typeof window !== 'undefined') {
        window.addAdminEmail = addAdminEmail;
        window.removeAdminEmail = removeAdminEmail;
        window.loadAdminEmails = loadAdminEmails;
        window.switchProductView = switchProductView;
        window.toggleProductRowExpansion = toggleProductRowExpansion;
    }
} catch (e) {
    /* noop */
}

function updateDiscountInfo() {
    const original = parseFloat(document.getElementById('productOriginal').value) || 0;
    const offer = parseFloat(document.getElementById('productOffer').value) || 0;
    const infoDiv = document.getElementById('discountInfo');
    if (!infoDiv) return;

    if (original > 0 && offer > 0) {
        if (offer >= original) {
            infoDiv.innerHTML = '<span style="color: red;">❌ Precio de oferta no válido</span>';
            infoDiv.classList.remove('active');
        } else {
            const discount = Math.round(((original - offer) / original) * 100);
            const savings = original - offer;
            infoDiv.innerHTML = `
                <span>💰 Descuento: <strong>${discount}%</strong> | Ahorras: <strong>${formatPrice(savings)}</strong></span>
            `;
            infoDiv.classList.add('active');
        }
    }
}

// ============================================
// EDITAR PRODUCTO
// ============================================

function openEditModal(productId) {
    // productId es ahora un string (ID de Firestore)
    const product = getAllProducts().find(p => p.id === productId);
    if (!product) return;

    currentEditingProductId = productId;

    document.getElementById('editProductId').value = productId;
    document.getElementById('editProductTitle').value = product.title;
    document.getElementById('editProductCategory').value = product.category;
    document.getElementById('editProductOriginal').value = product.originalPrice;
    document.getElementById('editProductOffer').value = product.offerPrice;
    document.getElementById('editProductEmoji').value = product.emoji || '📦';
    const editStock = document.getElementById('editProductStock');
    if (editStock) editStock.value = typeof product.quantity === 'number' ? product.quantity : (product.quantity || 0);

    const editImagePreview = document.getElementById('editImagePreview');
    if (editImagePreview) {
        if (product.image) {
            editImagePreview.innerHTML = `<img src="${product.image}" alt="Preview">`;
        } else {
            editImagePreview.innerHTML = `
                <div class="image-preview-placeholder">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                    <p>Previsualización</p>
                </div>`;
        }
    }

    updateEditDiscountInfo();
    document.getElementById('editModal').style.display = 'flex';
}

function closeEditModal() {
    const modal = document.getElementById('editModal');
    if (modal) modal.style.display = 'none';
    currentEditingProductId = null;
}

async function handleEditProduct(e) {
    e.preventDefault();

    const productId = document.getElementById('editProductId').value; // string de Firestore
    const title = document.getElementById('editProductTitle').value.trim();
    const originalPrice = parseFloat(document.getElementById('editProductOriginal').value);
    const offerPrice = parseFloat(document.getElementById('editProductOffer').value);
    const category = document.getElementById('editProductCategory').value;
    const emoji = document.getElementById('editProductEmoji').value || '📦';
    const imageInput = document.getElementById('editProductImage');
    const submitBtn = document.querySelector('#editProductForm button[type="submit"]');

    if (!title || !category || !originalPrice || !offerPrice) {
        alert('❌ Por favor completa todos los campos requeridos');
        return;
    }

    if (offerPrice >= originalPrice) {
        alert('❌ El precio de oferta debe ser menor que el precio original');
        return;
    }

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = '⏳ Guardando...';
    }

    try {
        const currentProduct = getAllProducts().find(p => p.id === productId);
        let imageDataURL = currentProduct ? currentProduct.image : null;

        // ── PROCESAR IMAGEN SI HAY NUEVA ──────────────────────────
        if (imageInput && imageInput.files.length > 0) {
            const imageFile = imageInput.files[0];

            if (!isValidImageFile(imageFile)) {
                alert('❌ Imagen no válida. Usa JPEG, PNG, WebP o GIF (máx 20MB)');
                return;
            }

            showAdminToast('⏳ Comprimiendo imagen...', 'info');
            if (submitBtn) submitBtn.textContent = '⏳ Comprimiendo...';

            imageDataURL = await compressImageToBase64(imageFile, 800, 0.70);

            // Verificar tamaño
            const sizeKB = Math.round((imageDataURL.length * 3) / 4 / 1024);
            if (sizeKB > 900) {
                imageDataURL = await compressImageToBase64(imageFile, 600, 0.55);
            }

            if (submitBtn) submitBtn.textContent = '⏳ Guardando...';
            showAdminToast('✅ Imagen actualizada', 'success');
        }

        // ── ACTUALIZAR PRODUCTO ────────────────────────────────
        const updatedData = {
            title,
            originalPrice,
            offerPrice,
            category,
            emoji,
            image: imageDataURL
        };

        const editStockVal = parseInt(document.getElementById('editProductStock')?.value || 0, 10);
        updatedData.quantity = editStockVal;

        await updateProduct(productId, updatedData);
        closeEditModal();
        showAdminToast('✅ Producto actualizado correctamente', 'success');

    } catch (error) {
        console.error('[Admin] Error al editar producto:', error);
        alert(`❌ Error: ${error.message}`);
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Guardar Cambios`;
        }
    }
}

function previewEditImage(e) {
    const file = e.target.files[0];
    const preview = document.getElementById('editImagePreview');
    if (!preview) return;

    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            preview.innerHTML = `<img src="${event.target.result}" alt="Preview">`;
        };
        reader.readAsDataURL(file);
    }
}

function updateEditDiscountInfo() {
    const original = parseFloat(document.getElementById('editProductOriginal').value) || 0;
    const offer = parseFloat(document.getElementById('editProductOffer').value) || 0;
    const infoDiv = document.getElementById('editDiscountInfo');
    if (!infoDiv) return;

    if (original > 0 && offer > 0) {
        if (offer >= original) {
            infoDiv.innerHTML = '<span style="color: red;">❌ Precio de oferta no válido</span>';
            infoDiv.classList.remove('active');
        } else {
            const discount = Math.round(((original - offer) / original) * 100);
            const savings = original - offer;
            infoDiv.innerHTML = `
                <span>💰 Descuento: <strong>${discount}%</strong> | Ahorras: <strong>${formatPrice(savings)}</strong></span>
            `;
            infoDiv.classList.add('active');
        }
    }
}

// ============================================
// ELIMINAR PRODUCTO
// ============================================

async function deleteProductConfirm(productId) {
    // productId es ahora un string (ID de Firestore)
    const product = getAllProducts().find(p => p.id === productId);
    if (!product) return;

    if (confirm(`¿Estás seguro de que deseas eliminar "${product.title}"?`)) {
        try {
            await deleteProduct(productId);
            showAdminToast('✅ Producto eliminado correctamente', 'success');
        } catch (err) {
            alert('❌ Error al eliminar el producto. Intenta de nuevo.');
        }
    }
}

// ============================================
// BÚSQUEDA
// ============================================

function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    const allProds = getAllProducts();

    const filtered = allProds.filter(product =>
        product.title.toLowerCase().includes(searchTerm) ||
        product.category.toLowerCase().includes(searchTerm)
    );

    displayProductsList(filtered);
}

// ============================================
// UTILIDADES
// ============================================

function calculateDiscount(original, offer) {
    return Math.round(((original - offer) / original) * 100);
}

/**
 * Valida si un archivo es una imagen soportada.
 * (Definida aquí como fallback si image-optimizer.js no está cargado)
 */
function isValidImageFile(file) {
    if (typeof window.isValidImageFile === 'function' && window.isValidImageFile !== isValidImageFile) {
        return window.isValidImageFile(file);
    }
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const maxSize = 20 * 1024 * 1024; // 20 MB
    return file && validTypes.includes(file.type) && file.size <= maxSize;
}

// ── Toast de confirmación para el admin ──────────────────────
// Ajustar stock rápido desde el panel (incrementar / decrementar)
async function changeProductStock(productId, delta) {
    const product = getAllProducts().find(p => p.id === productId);
    if (!product) return;
    const current = typeof product.quantity === 'number' ? product.quantity : (product.quantity || 0);
    const newQty = Math.max(0, current + delta);
    try {
        await updateProduct(productId, { quantity: newQty });
        showAdminToast('✅ Stock actualizado', 'success');
        if (typeof loadAndDisplayProducts === 'function') loadAndDisplayProducts();
    } catch (err) {
        console.error('[Admin] Error actualizando stock:', err);
        showAdminToast('❌ Error al actualizar stock', 'error');
    }
}

function showAdminToast(message, type = 'success') {
    // Usar la función de firebase-auth.js si está disponible
    if (typeof window.showAdminToast === 'function' && window.showAdminToast !== showAdminToast) {
        window.showAdminToast(message, type);
        return;
    }

    const existing = document.getElementById('adminToast');
    if (existing) existing.remove();

    const colors = {
        success: { bg: 'rgba(10, 107, 60, 0.95)', border: 'rgba(74, 222, 128, 0.3)' },
        error:   { bg: 'rgba(127, 29, 29, 0.95)',  border: 'rgba(239, 68, 68, 0.3)' },
        info:    { bg: 'rgba(30, 64, 175, 0.95)',   border: 'rgba(96, 165, 250, 0.3)' }
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
