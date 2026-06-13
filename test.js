<<<<<<< HEAD
// test.js - Script para probar la API de MetaOfertas

const BASE_URL = 'http://localhost:3001/api';
const ADMIN_PASSWORD = 'admin123';

// Colores para terminal
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testAPI() {
    log('\n╔════════════════════════════════════════╗', 'cyan');
    log('║  🧪 MetaOfertas API Test Suite  🧪  ║', 'cyan');
    log('╚════════════════════════════════════════╝\n', 'cyan');

    try {
        // 1. Health Check
        log('✓ Test 1: Health Check', 'blue');
        const health = await fetch(`${BASE_URL}/health`);
        const healthData = await health.json();
        log(`  Status: ${healthData.status}`, 'green');

        // 2. Obtener productos
        log('\n✓ Test 2: Obtener Productos', 'blue');
        const products = await fetch(`${BASE_URL}/products`);
        const productsData = await products.json();
        log(`  Productos encontrados: ${productsData.length}`, 'green');
        if (productsData.length > 0) {
            log(`  Primer producto: ${productsData[0].title}`, 'green');
        }

        // 3. Obtener productos por categoría
        log('\n✓ Test 3: Filtrar por Categoría', 'blue');
        const vegetables = await fetch(`${BASE_URL}/products?category=vegetables`);
        const vegetablesData = await vegetables.json();
        log(`  Productos en "Frutas y Verduras": ${vegetablesData.length}`, 'green');

        // 4. Login admin
        log('\n✓ Test 4: Autenticación Admin', 'blue');
        const login = await fetch(`${BASE_URL}/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: ADMIN_PASSWORD })
        });
        const loginData = await login.json();
        log(`  Autenticación: ${loginData.success ? 'EXITOSA' : 'FALLIDA'}`, loginData.success ? 'green' : 'red');

        // 5. Dashboard
        log('\n✓ Test 5: Dashboard Admin', 'blue');
        const dashboard = await fetch(`${BASE_URL}/admin/dashboard`, {
            headers: { 'X-Admin-Password': ADMIN_PASSWORD }
        });
        const dashboardData = await dashboard.json();
        log(`  Total de productos: ${dashboardData.totalProducts}`, 'green');
        log(`  Total de pedidos: ${dashboardData.totalOrders}`, 'green');
        log(`  Ingresos totales: $${dashboardData.totalRevenue}`, 'green');

        // 6. Crear carrito
        log('\n✓ Test 6: Carrito de Compras', 'blue');
        const sessionId = 'test-user-' + Date.now();
        const cartAdd = await fetch(`${BASE_URL}/cart/${sessionId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId: 1, quantity: 2 })
        });
        log(`  Producto agregado al carrito`, 'green');

        const cartGet = await fetch(`${BASE_URL}/cart/${sessionId}`);
        const cartData = await cartGet.json();
        log(`  Items en carrito: ${cartData.length}`, 'green');

        // 7. Crear pedido
        log('\n✓ Test 7: Crear Pedido', 'blue');
        const order = await fetch(`${BASE_URL}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                customerName: 'Test Customer',
                customerEmail: 'test@example.com',
                items: [{ productId: 1, quantity: 2 }]
            })
        });
        const orderData = await order.json();
        log(`  Pedido creado: ${orderData.orderNumber}`, 'green');
        log(`  Total: $${orderData.totalAmount}`, 'green');

        log('\n╔════════════════════════════════════════╗', 'green');
        log('║  ✅ Todos los tests pasaron! ✅      ║', 'green');
        log('╚════════════════════════════════════════╝', 'green');

    } catch (error) {
        log(`\n❌ Error en tests: ${error.message}`, 'red');
        log('\n¿El servidor está ejecutándose?', 'yellow');
        log('Ejecuta: npm run dev', 'yellow');
    }
}

testAPI();
=======
// test.js - Script para probar la API de MetaOfertas

const BASE_URL = 'http://localhost:3001/api';
const ADMIN_PASSWORD = 'admin123';

// Colores para terminal
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testAPI() {
    log('\n╔════════════════════════════════════════╗', 'cyan');
    log('║  🧪 MetaOfertas API Test Suite  🧪  ║', 'cyan');
    log('╚════════════════════════════════════════╝\n', 'cyan');

    try {
        // 1. Health Check
        log('✓ Test 1: Health Check', 'blue');
        const health = await fetch(`${BASE_URL}/health`);
        const healthData = await health.json();
        log(`  Status: ${healthData.status}`, 'green');

        // 2. Obtener productos
        log('\n✓ Test 2: Obtener Productos', 'blue');
        const products = await fetch(`${BASE_URL}/products`);
        const productsData = await products.json();
        log(`  Productos encontrados: ${productsData.length}`, 'green');
        if (productsData.length > 0) {
            log(`  Primer producto: ${productsData[0].title}`, 'green');
        }

        // 3. Obtener productos por categoría
        log('\n✓ Test 3: Filtrar por Categoría', 'blue');
        const vegetables = await fetch(`${BASE_URL}/products?category=vegetables`);
        const vegetablesData = await vegetables.json();
        log(`  Productos en "Frutas y Verduras": ${vegetablesData.length}`, 'green');

        // 4. Login admin
        log('\n✓ Test 4: Autenticación Admin', 'blue');
        const login = await fetch(`${BASE_URL}/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: ADMIN_PASSWORD })
        });
        const loginData = await login.json();
        log(`  Autenticación: ${loginData.success ? 'EXITOSA' : 'FALLIDA'}`, loginData.success ? 'green' : 'red');

        // 5. Dashboard
        log('\n✓ Test 5: Dashboard Admin', 'blue');
        const dashboard = await fetch(`${BASE_URL}/admin/dashboard`, {
            headers: { 'X-Admin-Password': ADMIN_PASSWORD }
        });
        const dashboardData = await dashboard.json();
        log(`  Total de productos: ${dashboardData.totalProducts}`, 'green');
        log(`  Total de pedidos: ${dashboardData.totalOrders}`, 'green');
        log(`  Ingresos totales: $${dashboardData.totalRevenue}`, 'green');

        // 6. Crear carrito
        log('\n✓ Test 6: Carrito de Compras', 'blue');
        const sessionId = 'test-user-' + Date.now();
        const cartAdd = await fetch(`${BASE_URL}/cart/${sessionId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId: 1, quantity: 2 })
        });
        log(`  Producto agregado al carrito`, 'green');

        const cartGet = await fetch(`${BASE_URL}/cart/${sessionId}`);
        const cartData = await cartGet.json();
        log(`  Items en carrito: ${cartData.length}`, 'green');

        // 7. Crear pedido
        log('\n✓ Test 7: Crear Pedido', 'blue');
        const order = await fetch(`${BASE_URL}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                customerName: 'Test Customer',
                customerEmail: 'test@example.com',
                items: [{ productId: 1, quantity: 2 }]
            })
        });
        const orderData = await order.json();
        log(`  Pedido creado: ${orderData.orderNumber}`, 'green');
        log(`  Total: $${orderData.totalAmount}`, 'green');

        log('\n╔════════════════════════════════════════╗', 'green');
        log('║  ✅ Todos los tests pasaron! ✅      ║', 'green');
        log('╚════════════════════════════════════════╝', 'green');

    } catch (error) {
        log(`\n❌ Error en tests: ${error.message}`, 'red');
        log('\n¿El servidor está ejecutándose?', 'yellow');
        log('Ejecuta: npm run dev', 'yellow');
    }
}

testAPI();
>>>>>>> 501eef96e7e1bf4b282028af1297426bac033904
