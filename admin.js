/* ============================================
   METAAOFERTAS - LÓGICA PANEL ADMIN (admin.js)
   Actualizado para usar IDs de Firestore (strings)
   ============================================ */

let currentEditingProductId = null; // Ahora es un string (ID de Firestore)

// ============================================
// INICIALIZACIÓN
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    initializeAdmin();
});

function initializeAdmin() {
    setupAdminEventListeners();
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
            </div>
            <div class="admin-product-actions">
                <button class="btn-icon btn-edit" onclick="openEditModal('${product.id}')" title="Editar">✏️</button>
                <button class="btn-icon btn-delete" onclick="deleteProductConfirm('${product.id}')" title="Eliminar">🗑️</button>
            </div>
        </div>
    `).join('');
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

    // Validaciones
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
        // ── PROCESAR IMAGEN CON COMPRESIÓN ──────────────────────
        let imageURL = null;
        if (imageInput && imageInput.files.length > 0) {
            const imageFile = imageInput.files[0];
            
            // Validar que sea imagen
            if (!isValidImageFile(imageFile)) {
                alert('❌ Imagen no válida. Usa JPEG, PNG, WebP o GIF (máx 20MB)');
                return;
            }

            // Mostrar progreso
            showAdminToast('⏳ Comprimiendo y subiendo imagen...', 'info');
            console.log('[Admin] Iniciando carga de imagen:', imageFile.name, imageFile.size, imageFile.type);
            
            // Generar ID único para la imagen
            const imageId = generateImageId();
            
            // Comprimir y subir con callback de progreso
            imageURL = await compressAndUploadImage(
                imageFile,
                imageId,
                (progress) => {
                    console.log('[Admin] Progress callback:', progress);
                    if (submitBtn) {
                        submitBtn.textContent = `⏳ Subiendo ${Math.round(progress)}%...`;
                    }
                }
            );
            
            console.log('[Admin] Imagen subida exitosamente:', imageURL);
            showAdminToast('✅ Imagen comprimida y subida exitosamente', 'success');
        }

        // ── CREAR PRODUCTO ──────────────────────────────────────
        const product = {
            title,
            originalPrice,
            offerPrice,
            category,
            emoji,
            image: imageURL // URL de Firebase Storage (o null)
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
        let imageURL = currentProduct ? currentProduct.image : null;

        // ── PROCESAR IMAGEN CON COMPRESIÓN SI HAY NUEVA ──────────
        if (imageInput && imageInput.files.length > 0) {
            const imageFile = imageInput.files[0];
            
            if (!isValidImageFile(imageFile)) {
                alert('❌ Imagen no válida. Usa JPEG, PNG, WebP o GIF (máx 20MB)');
                return;
            }

            showAdminToast('⏳ Comprimiendo y subiendo imagen...', 'info');
            const imageId = generateImageId();
            
            imageURL = await compressAndUploadImage(
                imageFile,
                imageId,
                (progress) => {
                    if (submitBtn) {
                        submitBtn.textContent = `⏳ Subiendo ${Math.round(progress)}%...`;
                    }
                }
            );
            
            showAdminToast('✅ Imagen actualizada', 'success');
        }

        // ── ACTUALIZAR PRODUCTO ────────────────────────────────
        const updatedData = {
            title,
            originalPrice,
            offerPrice,
            category,
            emoji,
            image: imageURL
        };

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

// ── Toast de confirmación para el admin ──────────────────────
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
