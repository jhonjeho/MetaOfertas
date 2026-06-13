/* ============================================
   METAAOFERTAS - LÓGICA PRINCIPAL (app.js)
   ============================================ */

// Configuración
const CONFIG = {
    STORAGE_KEY: 'metaofertasProducts',
    CART_STORAGE_KEY: 'metaofertasCart',
    USER_STORAGE_KEY: 'metaofertasUser',
    ADMIN_PASSWORD: 'admin123',
    ADMIN_URL: 'admin.html',
    API_BASE_URL: 'http://localhost:3001/api',
    CURRENCY: 'COP',
    CURRENCY_SYMBOL: '$'
};

// Función para formatear precios en pesos colombianos
function formatPrice(price) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(price);
}

// Estado de la aplicación
let currentFilter = 'all';
let allProducts = [];
let cart = []; // Nuevo arreglo para el carrito
let currentUser = null; // Usuario actual registrado
let _productsUnsubscribe = null; // Referencia al listener de Firestore

// ============================================
// INICIALIZACIÓN
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    loadCartFromStorage(); // Cargar carrito al inicio
    loadUserFromStorage(); // Cargar usuario registrado
    displayDate();
    setupEventListeners();
    // Iniciar escucha en tiempo real de Firestore
    listenToProductsFromFirestore();
    updateCartUI(); // Actualizar la UI del carrito al inicio
}

// ============================================
// MOSTRAR FECHA ACTUAL
// ============================================

function displayDate() {
    const dateElement = document.getElementById('todayDate');
    if (!dateElement) return; // El elemento no existe en esta página (ej: admin.html)
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    const today = new Date().toLocaleDateString('es-ES', options);
    dateElement.textContent = `📅 ${today}`;
}

// ============================================
// GESTIÓN DE PRODUCTOS — FIRESTORE (Tiempo Real)
// ============================================

/**
 * Escucha en tiempo real la colección 'productos' de Firestore.
 * Actualiza allProducts y re-renderiza la tienda automáticamente.
 */
function listenToProductsFromFirestore() {
    // Evitar múltiples listeners activos
    if (_productsUnsubscribe) {
        _productsUnsubscribe();
        _productsUnsubscribe = null;
    }

    // Verificar que db esté disponible (firebase-config.js debe cargarse primero)
    if (typeof db === 'undefined') {
        // Si Firestore no está disponible, usar localStorage como fallback
        console.warn('[MetaOfertas] Firestore no disponible, usando localStorage.');
        loadProductsFromStorage();
        loadDemoProducts();
        renderProducts();
        return;
    }

    _productsUnsubscribe = db.collection('productos')
        .orderBy('createdAt', 'desc')
        .onSnapshot(
            (snapshot) => {
                allProducts = snapshot.docs.map(doc => ({
                    id: doc.id,          // ID de Firestore (string)
                    firestoreId: doc.id, // Alias explícito
                    ...doc.data()
                }));

                // Si no hay productos en Firestore, cargar demos
                if (allProducts.length === 0) {
                    loadDemoProductsToFirestore();
                } else {
                    renderProducts();
                    // Actualizar panel de marketing si está abierto
                    if (typeof updateAdminMarketingPanel === 'function') {
                        updateAdminMarketingPanel();
                    }
                    // Actualizar lista de admin si está abierta
                    if (typeof loadAndDisplayProducts === 'function') {
                        loadAndDisplayProducts();
                    }
                }
            },
            (error) => {
                console.error('[MetaOfertas] Error al escuchar productos:', error);
                // Fallback a localStorage si Firestore falla
                loadProductsFromStorage();
                loadDemoProducts();
                renderProducts();
            }
        );
}

/**
 * Carga los productos demo en Firestore si la colección está vacía.
 */
async function loadDemoProductsToFirestore() {
    if (typeof db === 'undefined') {
        loadDemoProducts();
        renderProducts();
        return;
    }

    const demoProducts = [
        {
            title: 'Manzana Roja Seleccionada (1kg)',
            originalPrice: 18000,
            offerPrice: 9500,
            category: 'vegetables',
            emoji: '🍎',
            image: null,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        },
        {
            title: 'Pechuga de Pollo Fresca (500g)',
            originalPrice: 42000,
            offerPrice: 25500,
            category: 'meats',
            emoji: '🍗',
            image: null,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        },
        {
            title: 'Leche Entera Premium (1L)',
            originalPrice: 5500,
            offerPrice: 3500,
            category: 'dairy',
            emoji: '🥛',
            image: null,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        },
        {
            title: 'Pan Integral Fresco (500g)',
            originalPrice: 9500,
            offerPrice: 5500,
            category: 'pantry',
            emoji: '🍞',
            image: null,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        },
        {
            title: 'Zanahoria Fresca (1kg)',
            originalPrice: 12000,
            offerPrice: 6500,
            category: 'vegetables',
            emoji: '🥕',
            image: null,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        },
        {
            title: 'Queso Gauda Seleccionado (250g)',
            originalPrice: 28000,
            offerPrice: 16800,
            category: 'dairy',
            emoji: '🧀',
            image: null,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }
    ];

    try {
        const batch = db.batch();
        demoProducts.forEach(product => {
            const docRef = db.collection('productos').doc();
            batch.set(docRef, product);
        });
        await batch.commit();
        console.log('[MetaOfertas] Productos demo cargados en Firestore.');
    } catch (error) {
        console.error('[MetaOfertas] Error al cargar demos en Firestore:', error);
        // Fallback local
        loadDemoProducts();
        renderProducts();
    }
}

// ============================================
// GESTIÓN DE PRODUCTOS (LocalStorage — Fallback)
// ============================================

function loadProductsFromStorage() {
    const stored = localStorage.getItem(CONFIG.STORAGE_KEY);
    if (stored) {
        allProducts = JSON.parse(stored);
    }
}

function saveProductsToStorage() {
    localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(allProducts));
}

function loadCartFromStorage() {
    const storedCart = localStorage.getItem(CONFIG.CART_STORAGE_KEY);
    if (storedCart) {
        cart = JSON.parse(storedCart);
    }
}

function saveCartToStorage() {
    localStorage.setItem(CONFIG.CART_STORAGE_KEY, JSON.stringify(cart));
}

// ============================================
// GESTIÓN DE USUARIOS
// ============================================

function loadUserFromStorage() {
    const stored = localStorage.getItem(CONFIG.USER_STORAGE_KEY);
    if (stored) {
        currentUser = JSON.parse(stored);
    }
}

function saveUserToStorage() {
    localStorage.setItem(CONFIG.USER_STORAGE_KEY, JSON.stringify(currentUser));
}

function isUserRegistered() {
    return currentUser !== null && currentUser.id;
}

function loadDemoProducts() {
    // Solo cargar demo si no hay productos (fallback local)
    if (allProducts.length === 0) {
        const demoProducts = [
            {
                id: 'demo-1',
                title: 'Manzana Roja Seleccionada (1kg)',
                originalPrice: 18000,
                offerPrice: 9500,
                category: 'vegetables',
                emoji: '🍎',
                image: null
            },
            {
                id: 'demo-2',
                title: 'Pechuga de Pollo Fresca (500g)',
                originalPrice: 42000,
                offerPrice: 25500,
                category: 'meats',
                emoji: '🍗',
                image: null
            },
            {
                id: 'demo-3',
                title: 'Leche Entera Premium (1L)',
                originalPrice: 5500,
                offerPrice: 3500,
                category: 'dairy',
                emoji: '🥛',
                image: null
            },
            {
                id: 'demo-4',
                title: 'Pan Integral Fresco (500g)',
                originalPrice: 9500,
                offerPrice: 5500,
                category: 'pantry',
                emoji: '🍞',
                image: null
            },
            {
                id: 'demo-5',
                title: 'Zanahoria Fresca (1kg)',
                originalPrice: 12000,
                offerPrice: 6500,
                category: 'vegetables',
                emoji: '🥕',
                image: null
            },
            {
                id: 'demo-6',
                title: 'Queso Gauda Seleccionado (250g)',
                originalPrice: 28000,
                offerPrice: 16800,
                category: 'dairy',
                emoji: '🧀',
                image: null
            }
        ];

        allProducts = demoProducts;
        saveProductsToStorage();
    }
}

// ============================================
// RENDERIZAR PRODUCTOS
// ============================================

function renderProducts() {
    const grid = document.getElementById('productsGrid');
    const emptyState = document.getElementById('emptyState');
    if (!grid || !emptyState) return; // No estamos en index.html
    
    let productsToDisplay = allProducts;
    
    if (currentFilter !== 'all') {
        productsToDisplay = allProducts.filter(p => p.category === currentFilter);
    }

    if (productsToDisplay.length === 0) {
        grid.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }

    grid.style.display = 'grid';
    emptyState.style.display = 'none';

    grid.innerHTML = productsToDisplay.map(product => {
        const discount = calculateDiscount(product.originalPrice, product.offerPrice);
        const savings = formatPrice(product.originalPrice - product.offerPrice);
        const imageContent = product.image
            ? `<img src="${product.image}" alt="${product.title}" onclick="openImageModal('${product.image}', '${product.title}')" style="cursor:pointer;">`
            : `<span style="font-size:4rem;line-height:1;filter:drop-shadow(0 4px 12px rgba(0,0,0,0.5))">${product.emoji}</span>`;
        // Usar JSON.stringify para pasar el ID de forma segura (puede ser string de Firestore)
        const safeId = JSON.stringify(product.id);
        return `
        <div class="product-card">
            <div class="product-image">
                ${imageContent}
                <span class="discount-badge">${discount}% OFF</span>
            </div>
            <div class="product-info">
                <p class="product-category">${getCategoryLabel(product.category)}</p>
                <h3 class="product-title">${product.title}</h3>
                <div class="product-prices">
                    <span class="original-price">${formatPrice(product.originalPrice)}</span>
                    <span class="offer-price">${formatPrice(product.offerPrice)}</span>
                </div>
                <p class="savings">✦ Ahorras ${savings}</p>
                <button class="btn-add-cart" onclick="addToCart(${safeId})">¡Lo Quiero!</button>
            </div>
        </div>`;
    }).join('');
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================

function calculateDiscount(original, offer) {
    return Math.round(((original - offer) / original) * 100);
}

function getCategoryLabel(category) {
    const labels = {
        vegetables: '🥬 Frutas y Verduras',
        meats: '🍗 Carnes y Pollo',
        dairy: '🥛 Lácteos y Huevos',
        pantry: '🥫 Despensa',
        all: 'Todos'
    };
    return labels[category] || category;
}

function addToCart(productId) {
    // ── Los visitantes pueden agregar al carrito libremente sin login ──
    const product = allProducts.find(p => p.id === productId);
    if (product) {
        const existingCartItem = cart.find(item => item.id === productId);
        if (existingCartItem) {
            existingCartItem.quantity++;
        } else {
            cart.push({ ...product, quantity: 1 });
        }
        saveCartToStorage();
        updateCartUI();
        // Mostrar notificación toast en lugar de alert bloqueante
        showToastNotification(`✅ ${product.title} añadido al carrito`);
    }
}

// ── Notificación toast no bloqueante ──────────────────────────
function showToastNotification(message) {
    // Remover toast anterior si existe
    const existingToast = document.getElementById('metaToast');
    if (existingToast) existingToast.remove();

    const toast = document.createElement('div');
    toast.id = 'metaToast';
    toast.style.cssText = `
        position: fixed;
        bottom: 5rem;
        left: 50%;
        transform: translateX(-50%) translateY(20px);
        background: linear-gradient(135deg, rgba(10, 107, 60, 0.95), rgba(4, 47, 26, 0.95));
        border: 1px solid rgba(74, 222, 128, 0.3);
        color: #f0fdf4;
        padding: 0.75rem 1.5rem;
        border-radius: 9999px;
        font-family: 'Inter', sans-serif;
        font-size: 0.875rem;
        font-weight: 600;
        z-index: 9999;
        backdrop-filter: blur(12px);
        box-shadow: 0 8px 32px rgba(0,0,0,0.4), 0 0 20px rgba(26, 157, 93, 0.2);
        opacity: 0;
        transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        white-space: nowrap;
        pointer-events: none;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);

    // Animar entrada
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(-50%) translateY(0)';
        });
    });

    // Animar salida y remover
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%) translateY(10px)';
        setTimeout(() => toast.remove(), 400);
    }, 2800);
}

function updateCartUI() {
    const cartCounter = document.getElementById('cartCounter');
    const cartItemsContainer = document.getElementById('cartItems');
    const cartTotalElement = document.getElementById('cartTotal');
    if (!cartCounter || !cartItemsContainer || !cartTotalElement) return;

    const emptyCartMessage = cartItemsContainer.querySelector('.empty-cart-message');

    // Actualizar contador del carrito
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCounter.textContent = totalItems;

    // Renderizar elementos del carrito
    cartItemsContainer.innerHTML = ''; // Limpiar antes de renderizar

    if (cart.length === 0) {
        if (emptyCartMessage) {
            emptyCartMessage.style.display = 'block';
        } else {
            cartItemsContainer.innerHTML = `<p class="empty-cart-message">Tu carrito está vacío.</p>`;
        }
        cartTotalElement.textContent = formatPrice(0);
    } else {
        if (emptyCartMessage) {
            emptyCartMessage.style.display = 'none';
        }
        cart.forEach(item => {
            const itemTotal = item.offerPrice * item.quantity;
            const safeId = JSON.stringify(item.id);
            cartItemsContainer.innerHTML += `
                <div class="cart-item">
                    <div class="cart-item-image">
                        ${item.image ? `<img src="${item.image}" alt="${item.title}">` : item.emoji}
                    </div>
                    <div class="cart-item-details">
                        <h4>${item.title}</h4>
                        <p>Precio: ${formatPrice(item.offerPrice)}</p>
                        <div class="cart-item-quantity-controls">
                            <button class="quantity-btn" onclick="changeQuantity(${safeId}, -1)">-</button>
                            <span class="item-quantity">${item.quantity}</span>
                            <button class="quantity-btn" onclick="changeQuantity(${safeId}, 1)">+</button>
                        </div>
                    </div>
                    <span class="cart-item-total">${formatPrice(itemTotal)}</span>
                    <button class="remove-item-btn" onclick="removeFromCart(${safeId})">&times;</button>
                </div>
            `;
        });

        // Calcular y mostrar total
        const total = cart.reduce((sum, item) => sum + (item.offerPrice * item.quantity), 0);
        cartTotalElement.textContent = formatPrice(total);
    }
}

function changeQuantity(productId, delta) {
    const itemIndex = cart.findIndex(item => item.id === productId);
    if (itemIndex > -1) {
        cart[itemIndex].quantity += delta;
        if (cart[itemIndex].quantity <= 0) {
            cart.splice(itemIndex, 1); // Eliminar si la cantidad es 0 o menos
        }
        saveCartToStorage();
        updateCartUI();
    }
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCartToStorage();
    updateCartUI();
}

function toggleCartSidebar() {
    const sidebar = document.getElementById('cartSidebar');
    if (sidebar) sidebar.classList.toggle('open');
}

// ============================================
// EVENT LISTENERS
// ============================================

function setupEventListeners() {
    // Filtros
    document.querySelectorAll(".filter-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
            e.target.classList.add("active");
            currentFilter = e.target.dataset.filter;
            renderProducts();
        });
    });

    // Botón Admin
    const adminBtn = document.getElementById("adminAccessBtn");
    if (adminBtn) adminBtn.addEventListener("click", showPasswordModal);

    // Eventos del Carrito
    const cartButton = document.getElementById('cartButton');
    const closeCart = document.getElementById('closeCart');
    if (cartButton) cartButton.addEventListener('click', toggleCartSidebar);
    if (closeCart) closeCart.addEventListener('click', toggleCartSidebar);

    // Cerrar carrito al hacer clic fuera
    document.addEventListener("click", (e) => {
        const cartSidebar = document.getElementById("cartSidebar");
        const cartButtonEl = document.getElementById("cartButton");
        if (!cartSidebar || !cartButtonEl) return;
        if (!cartSidebar.contains(e.target) && !cartButtonEl.contains(e.target) && !e.target.closest(".quantity-btn") && !e.target.closest(".remove-item-btn") && cartSidebar.classList.contains("open")) {
            cartSidebar.classList.remove("open");
        }
    });

    // Modal contraseña admin
    const modal = document.getElementById("passwordModal");
    const closeBtn = document.querySelector(".close");
    
    if (closeBtn) closeBtn.addEventListener("click", closePasswordModal);
    if (modal) {
        window.addEventListener("click", (e) => {
            if (e.target === modal) {
                closePasswordModal();
            }
        });
    }

    // Enviar contraseña
    const submitPassword = document.getElementById("submitPassword");
    if (submitPassword) submitPassword.addEventListener("click", checkAdminPassword);
    
    // Enter en input de contraseña
    const adminPassword = document.getElementById("adminPassword");
    if (adminPassword) {
        adminPassword.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                checkAdminPassword();
            }
        });
    }

   // Botón de WhatsApp - Generar pedido real
    const checkoutBtn = document.getElementById('checkoutWhatsapp');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', enviarPedidoWhatsApp);
    }
}

// ============================================
// ENVÍO DE PEDIDO POR WHATSAPP (con verificación de auth)
// ============================================

/**
 * Función principal para enviar el pedido por WhatsApp.
 * - Si el usuario YA está logueado: genera el mensaje y abre WhatsApp.
 * - Si NO está logueado: guarda el carrito en localStorage y lanza el login con Google.
 */
function enviarPedidoWhatsApp() {
    // 1. Validar si el carrito está vacío
    if (cart.length === 0) {
        alert('Tu carrito está vacío. Agrega productos antes de finalizar tu pedido.');
        return;
    }

    // 2. Verificar si el usuario está autenticado en Firebase
    if (!isUserRegistered()) {
        // ── Usuario NO logueado: guardar carrito y redirigir a login ──
        console.log('[MetaOfertas] Usuario no logueado. Guardando carrito pendiente y lanzando login...');

        // Guardar el carrito actual en localStorage para recuperarlo después del redirect
        localStorage.setItem('carrito_pendiente', JSON.stringify(cart));

        // Mostrar modal de registro/login con Google
        if (typeof showRegisterModal === 'function') {
            showRegisterModal();
        } else {
            const registerModal = document.getElementById('registerModal');
            if (registerModal) registerModal.style.display = 'flex';
        }

        // Mostrar un mensaje informativo al usuario dentro del modal
        showToastNotification('🔐 Inicia sesión para completar tu pedido. ¡Tu carrito está guardado!');
        return;
    }

    // 3. Usuario logueado: construir y enviar el mensaje de WhatsApp
    _generarMensajeWhatsApp();
}

/**
 * Genera el texto del pedido y abre WhatsApp.
 * Solo se llama cuando el usuario ya está autenticado.
 */
function _generarMensajeWhatsApp() {
    // Número de teléfono con código de país (57 para Colombia)
    const phoneNumber = '573117336376';

    // Construir el encabezado del mensaje
    let message = `🛒 *NUEVO PEDIDO - METAOFERTAS*\n`;
    message += `=========================\n\n`;
    message += `Cliente: ${currentUser.nombre}\n`;
    message += `WhatsApp: ${currentUser.whatsapp}\n`;
    message += `Ubicacion: ${currentUser.barrio}\n`;
    message += `Tipo: ${currentUser.tipoCliente === 'persona' ? 'Persona' : 'Tienda'}\n`;
    message += `=========================\n\n`;

    // Recorrer el carrito con validación de seguridad de precios
    let total = 0;

    cart.forEach((item, index) => {
        // Buscar el producto real en la lista maestra para usar su precio oficial
        const realProduct = allProducts.find(p => p.id === item.id);
        const securePrice = realProduct ? realProduct.offerPrice : item.offerPrice;
        const itemTotal = securePrice * item.quantity;

        total += itemTotal;

        message += `${index + 1}. *${item.title}*\n`;
        message += `   Cantidad: ${item.quantity}\n`;
        message += `   Precio Unitario: ${formatPrice(securePrice)}\n`;
        message += `   Subtotal: ${formatPrice(itemTotal)}\n`;
        message += `-------------------------\n`;
    });

    // Total final
    message += `\n💰 *TOTAL A PAGAR:* ${formatPrice(total)}\n\n`;
    message += `Por favor, confírmame la disponibilidad para coordinar el pago y el envío. ¡Muchas gracias!`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappURL = `https://api.whatsapp.com/send?phone=${phoneNumber}&text=${encodedMessage}`;
    window.open(whatsappURL, '_blank');
}

/**
 * Restaura el carrito pendiente desde localStorage (si existe).
 * Se llama automáticamente después de que el usuario completa el login/registro.
 * Si hay carrito pendiente, lo restaura y notifica al usuario.
 */
function restaurarCarritoPendiente() {
    const carritoGuardado = localStorage.getItem('carrito_pendiente');
    if (!carritoGuardado) return; // No hay carrito pendiente, nada que hacer

    try {
        const carritoAnterior = JSON.parse(carritoGuardado);
        if (!Array.isArray(carritoAnterior) || carritoAnterior.length === 0) {
            localStorage.removeItem('carrito_pendiente');
            return;
        }

        // Fusionar el carrito pendiente con el carrito actual (si hubiera algo)
        carritoAnterior.forEach(itemPendiente => {
            const existente = cart.find(item => item.id === itemPendiente.id);
            if (existente) {
                // Si el producto ya está en el carrito, sumar cantidades
                existente.quantity += itemPendiente.quantity;
            } else {
                // Si no existe, agregarlo
                cart.push(itemPendiente);
            }
        });

        // Guardar el carrito fusionado y actualizar la UI
        saveCartToStorage();
        updateCartUI();

        // Limpiar el carrito pendiente del localStorage
        localStorage.removeItem('carrito_pendiente');

        console.log('[MetaOfertas] ✅ Carrito pendiente restaurado correctamente.');

        // Notificar al usuario y abrir el carrito automáticamente
        showToastNotification('🛒 ¡Tu carrito fue restaurado! Presiona "Finalizar por WhatsApp" para completar tu pedido.');

        // Abrir el sidebar del carrito para que el usuario lo vea
        setTimeout(() => {
            const sidebar = document.getElementById('cartSidebar');
            if (sidebar && !sidebar.classList.contains('open')) {
                sidebar.classList.add('open');
            }
        }, 1200);

    } catch (e) {
        console.error('[MetaOfertas] Error al restaurar carrito pendiente:', e);
        localStorage.removeItem('carrito_pendiente');
    }
}

// ============================================
// ACCESO AL ADMIN
// ============================================

function showPasswordModal() {
    // Redirigir directamente a admin.html (el login ahora es con Google)
    window.location.href = CONFIG.ADMIN_URL;
}

function closePasswordModal() {
    const modal = document.getElementById('passwordModal');
    if (modal) modal.style.display = 'none';
    const passInput = document.getElementById('adminPassword');
    if (passInput) passInput.value = '';
}

function checkAdminPassword() {
    // Redirigir a admin.html donde está el login con Google
    window.location.href = CONFIG.ADMIN_URL;
}

// ============================================
// FUNCIONES PÚBLICAS PARA ADMIN — FIRESTORE
// ============================================

/**
 * Agrega un nuevo producto a Firestore.
 * Retorna una Promise con el documento creado.
 */
async function addProduct(product) {
    if (typeof db === 'undefined') {
        // Fallback local
        const newId = 'local-' + Date.now();
        const newProduct = { id: newId, ...product };
        allProducts.push(newProduct);
        saveProductsToStorage();
        if (typeof updateAdminMarketingPanel === 'function') updateAdminMarketingPanel();
        return newProduct;
    }

    try {
        const docRef = await db.collection('productos').add({
            ...product,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        // El listener onSnapshot actualizará allProducts automáticamente
        return { id: docRef.id, ...product };
    } catch (error) {
        console.error('[MetaOfertas] Error al agregar producto:', error);
        throw error;
    }
}

/**
 * Actualiza un producto existente en Firestore por su ID de documento.
 */
async function updateProduct(firestoreId, updatedData) {
    if (typeof db === 'undefined') {
        // Fallback local
        const index = allProducts.findIndex(p => p.id === firestoreId);
        if (index !== -1) {
            allProducts[index] = { ...allProducts[index], ...updatedData };
            saveProductsToStorage();
            return allProducts[index];
        }
        return null;
    }

    try {
        // Eliminar campos que no deben guardarse en Firestore
        const { id, firestoreId: _fid, ...dataToSave } = updatedData;
        await db.collection('productos').doc(firestoreId).update({
            ...dataToSave,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        // El listener onSnapshot actualizará allProducts automáticamente
        return true;
    } catch (error) {
        console.error('[MetaOfertas] Error al actualizar producto:', error);
        throw error;
    }
}

/**
 * Elimina un producto de Firestore por su ID de documento.
 */
async function deleteProduct(firestoreId) {
    if (typeof db === 'undefined') {
        // Fallback local
        const index = allProducts.findIndex(p => p.id === firestoreId);
        if (index !== -1) {
            allProducts.splice(index, 1);
            saveProductsToStorage();
            if (typeof updateAdminMarketingPanel === 'function') updateAdminMarketingPanel();
            return true;
        }
        return false;
    }

    try {
        await db.collection('productos').doc(firestoreId).delete();
        // El listener onSnapshot actualizará allProducts automáticamente
        return true;
    } catch (error) {
        console.error('[MetaOfertas] Error al eliminar producto:', error);
        throw error;
    }
}

/**
 * Retorna el array actual de productos (sincrónico, desde la caché local).
 */
function getAllProducts() {
    return allProducts;
}

// ============================================
// LOGICA PARA VER IMAGEN GRANDE (LIGHTBOX)
// ============================================

function openImageModal(imageSrc, title) {
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalTargetImage');
    const captionText = document.getElementById('modalCaption');
    
    if (modal && modalImg && captionText) {
        modal.style.display = "flex";
        modalImg.src = imageSrc;
        captionText.textContent = title;
    }
}

function closeImageModal() {
    const modal = document.getElementById('imageModal');
    if (modal) {
        modal.style.display = "none";
    }
}

// Configurar los clics para cerrar
document.addEventListener('DOMContentLoaded', () => {
    const closeBtn = document.getElementById('closeImageModal');
    const modal = document.getElementById('imageModal');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', closeImageModal);
    }
    
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeImageModal();
            }
        });
    }
});

// ========================================================
// FUNCIÓN AUXILIAR: Envuelve texto en múltiples líneas
// ========================================================
const wrapText = (ctx, text, maxWidth) => {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    words.forEach(word => {
        const testLine = currentLine + word + ' ';
        const metrics = ctx.measureText(testLine);
        
        if (metrics.width > maxWidth && currentLine !== '') {
            lines.push(currentLine.trim());
            currentLine = word + ' ';
        } else {
            currentLine = testLine;
        }
    });
    
    if (currentLine !== '') {
        lines.push(currentLine.trim());
    }
    
    return lines;
};

// ========================================================
// GENERADOR DE ESTADOS DE WHATSAPP (PANEL ADMIN CORREGIDO)
// ========================================================

const renderStateCanvas = (product, outputType = 'base64') => {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        canvas.width = 1080;
        canvas.height = 1920;

        // Fondo Degradado
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#111827'); 
        gradient.addColorStop(0.5, '#1f2937'); 
        gradient.addColorStop(1, '#065f46');   
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Marco elegante
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 5;
        ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);

        // Título de la app
        ctx.fillStyle = '#2ecc71'; 
        ctx.font = 'bold 50px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🛒 METAOFERTAS', canvas.width / 2, 130);

        // Nombre del Producto - Con soporte para saltos de línea
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 48px sans-serif';
        const maxTitleWidth = canvas.width - 100;
        const titleLines = wrapText(ctx, product.title.toUpperCase(), maxTitleWidth);
        let titleY = 230;
        const lineHeight = 60;
        titleLines.forEach(line => {
            ctx.fillText(line, canvas.width / 2, titleY);
            titleY += lineHeight;
        });

        // Renderizado del contenido central (Imagen o Emoji)
        const drawFooterAndResolve = () => {
            // Rectángulo del precio
            const rectW = 680;
            const rectH = 150;
            const rectX = (canvas.width - rectW) / 2;
            const rectY = 1450;

            ctx.fillStyle = '#e74c3c'; 
            ctx.beginPath();
            ctx.roundRect(rectX, rectY, rectW, rectH, 30);
            ctx.fill();

            // Texto del Precio Oferta
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 75px sans-serif';
            ctx.fillText(`OFERTA: ${formatPrice(product.offerPrice)}`, canvas.width / 2, rectY + 100);

            // Mensaje de acción
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.font = 'italic 42px sans-serif';
            ctx.fillText('Pedilo ya por nuestra Web 📲 Link en Bio', canvas.width / 2, 1750);

            // Retornar formato solicitado
            if (outputType === 'blob') {
                canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.95);
            } else {
                const dataURL = canvas.toDataURL('image/jpeg', 0.95);
                const base64Data = dataURL.replace(/^data:image\/(png|jpeg|jpg);base64,/, "");
                resolve(base64Data);
            }
        };

        // Si el producto tiene imagen cargada en Base64 o URL
        if (product.image && product.image.startsWith('data:image')) {
            const img = new Image();
            img.onload = () => {
                const maxW = 900;
                const maxH = 900;
                const ratio = Math.min(maxW / img.width, maxH / img.height);
                const nw = img.width * ratio;
                const nh = img.height * ratio;
                const cx = (canvas.width - nw) / 2;
                const cy = 420 + (maxH - nh) / 2;

                ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
                ctx.shadowBlur = 30;
                ctx.shadowOffsetY = 15;
                ctx.drawImage(img, cx, cy, nw, nh);
                ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
                drawFooterAndResolve();
            };
            img.onerror = () => {
                ctx.fillStyle = '#2d3544';
                ctx.beginPath();
                ctx.roundRect(90, 420, 900, 900, 30);
                ctx.fill();
                ctx.fillStyle = '#ffffff';
                ctx.font = '200px sans-serif';
                ctx.fillText(product.emoji || '📦', canvas.width / 2, 950);
                drawFooterAndResolve();
            };
            img.src = product.image;
        } else {
            // Si el producto usa Emoji (Productos Demo)
            ctx.fillStyle = '#2d3544';
            ctx.beginPath();
            ctx.roundRect(90, 420, 900, 900, 30);
            ctx.fill();
            
            ctx.fillStyle = '#ffffff';
            ctx.font = '280px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(product.emoji || '📦', canvas.width / 2, 870);
            drawFooterAndResolve();
        }
    });
};

// DIBUJAR LISTA INDIVIDUAL DE PRODUCTOS
const updateAdminMarketingPanel = () => {
    const container = document.getElementById('admin-marketing-list');
    if (!container) return;
    
    container.innerHTML = ''; 

    if (!allProducts || allProducts.length === 0) {
        container.innerHTML = '<p style="color: #9ca3af; font-size: 14px; padding: 10px; text-align: center;">No hay productos creados. Agrega un producto primero.</p>';
        return;
    }

    allProducts.forEach(product => {
        const row = document.createElement('div');
        row.style = "display: flex; justify-content: space-between; align-items: center; background-color: #2d3748; padding: 12px 16px; border-radius: 8px; margin-bottom: 4px; border: 1px solid #4a5568;";
        
        row.innerHTML = `
            <span style="font-size: 14px; font-weight: bold; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 60%;">
                ${product.emoji || '📦'} ${product.title} (${formatPrice(product.offerPrice)})
            </span>
            <button class="btn-download-single" data-id="${product.id}" style="background-color: #3182ce; color: white; border: none; padding: 8px 14px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: bold; transition: background 0.2s;">
                📥 Guardar JPG
            </button>
        `;
        container.appendChild(row);
    });

    // Eventos para descargas individuales
    document.querySelectorAll('.btn-download-single').forEach(button => {
        button.addEventListener('click', async (e) => {
            e.preventDefault();
            const productId = e.target.getAttribute('data-id');
            const product = allProducts.find(p => p.id === productId);
            if (!product) return;

            const originalText = e.target.innerText;
            e.target.innerText = "⏳... ";
            e.target.disabled = true;

            try {
                const blobData = await renderStateCanvas(product, 'blob');
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blobData);
                const safeName = product.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
                link.download = `estado_${safeName}.jpg`;
                
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } catch (err) {
                console.error(err);
                alert("Error al descargar la imagen.");
            } finally {
                e.target.innerText = originalText;
                e.target.disabled = false;
            }
        });
    });

    // Iniciar botón de descarga masiva (.ZIP)
    initMasterDownloadButton();
};

// DESCARGA MASIVA EN FORMATO COMPRIMIDO (.ZIP)
const initMasterDownloadButton = () => {
    const btnMaster = document.getElementById('btnDownloadAllStates');
    if (!btnMaster) return;

    // Clonar para evitar acumulamiento de eventos click repetidos
    const newBtnMaster = btnMaster.cloneNode(true);
    btnMaster.parentNode.replaceChild(newBtnMaster, btnMaster);

    newBtnMaster.addEventListener('click', async (e) => {
        e.preventDefault();
        
        if (!allProducts || allProducts.length === 0) {
            alert('No hay productos registrados en tu tienda para empaquetar.');
            return;
        }

        const originalText = newBtnMaster.innerText;
        newBtnMaster.innerText = "⏳ Generando campaña... Por favor espera";
        newBtnMaster.disabled = true;

        try {
            if (typeof JSZip === 'undefined') {
                throw new Error("La librería JSZip no se ha cargado correctamente en esta sección.");
            }

            const zip = new JSZip();

            for (const product of allProducts) {
                const base64Image = await renderStateCanvas(product, 'base64');
                const safeName = product.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
                zip.file(`estado_${safeName}.jpg`, base64Image, {base64: true});
            }

            const content = await zip.generateAsync({type: 'blob'});
            const link = document.createElement('a');
            link.href = URL.createObjectURL(content);
            link.download = `Campana_Estados_MetaOfertas.zip`;
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error(error);
            alert("Error al empaquetar el archivo comprimido. Verifica las librerías.");
        } finally {
            newBtnMaster.innerText = originalText;
            newBtnMaster.disabled = false;
        }
    });
};
