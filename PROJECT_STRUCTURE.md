<<<<<<< HEAD
# 📦 Estructura del Proyecto MetaOfertas - Fase 2

```
MetaOfertas/
│
├── 📄 Frontend (Cliente)
│   ├── index.html              → Vista pública (catálogo)
│   ├── admin.html              → Panel del administrador
│   ├── styles.css              → Estilos principales
│   ├── styles-admin.css        → Estilos del panel admin
│   ├── app.js                  → Lógica principal (Cliente)
│   └── admin.js                → Lógica del panel admin
│
├── 🖥️ Backend (Servidor)
│   ├── server.js               → Servidor principal Express
│   ├── database.js             → Configuración SQLite
│   ├── .env                    → Variables de entorno
│   ├── package.json            → Dependencias Node.js
│   │
│   └── routes/                 → Endpoints de API
│       ├── products.js         → CRUD productos
│       ├── cart.js             → Carrito de compras
│       ├── orders.js           → Gestión de pedidos
│       └── admin.js            → Panel administrativo
│
├── 🗄️ Base de Datos
│   └── database.db             → SQLite (se crea automáticamente)
│
├── 📚 Documentación
│   ├── README.md               → Documentación general
│   ├── API_DOCUMENTATION.md    → Documentación API
│   ├── BACKEND_SETUP.md        → Instalación backend
│   ├── CURL_EXAMPLES.md        → Ejemplos de cURL
│   └── PROJECT_STRUCTURE.md    → Este archivo
│
├── 🔧 Scripts
│   ├── run-server.bat          → Ejecutar en Windows
│   ├── run-server.sh           → Ejecutar en Linux/Mac
│   └── test.js                 → Suite de tests
│
└── 🔒 Configuración
    └── .gitignore             → Archivos a ignorar en Git


═══════════════════════════════════════════════════════════════════

## 📊 Arquitectura

┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND (Cliente)                    │
│  index.html + styles.css + app.js (Vanilla JavaScript)      │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP/REST
                       ▼
┌─────────────────────────────────────────────────────────────┐
│            BACKEND (Servidor Node.js + Express)             │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Rutas API                                             │ │
│  │  • GET    /products    - Listar productos             │ │
│  │  • POST   /products    - Crear producto               │ │
│  │  • PUT    /products/:id - Actualizar producto         │ │
│  │  • DELETE /products/:id - Eliminar producto           │ │
│  │                                                        │ │
│  │  • GET    /cart/:sessionId - Ver carrito             │ │
│  │  • POST   /cart/:sessionId - Agregar al carrito      │ │
│  │  • PUT    /cart/:sessionId/:id - Actualizar cantidad │ │
│  │                                                        │ │
│  │  • POST   /orders    - Crear pedido                   │ │
│  │  • GET    /orders    - Listar pedidos (admin)         │ │
│  │  • PUT    /orders/:id - Actualizar pedido (admin)     │ │
│  │                                                        │ │
│  │  • POST   /admin/login - Autenticación               │ │
│  │  • GET    /admin/dashboard - Estadísticas            │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────┬──────────────────────────────────────┘
                       │ SQL
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              BASE DE DATOS (SQLite3)                         │
│                                                              │
│  • products    - Catálogo de productos                     │
│  • cartItems   - Items en carrito                          │
│  • orders      - Pedidos realizados                        │
└─────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════

## 🔐 Flujo de Autenticación

Contraseña Admin: admin123

Para operaciones de admin, enviar header:
X-Admin-Password: admin123

O usar POST /admin/login para obtener token.


═══════════════════════════════════════════════════════════════════

## 📋 Tablas de Base de Datos

### products
┌──────────┬──────────────┬──────────────┬────────────┬──────────┐
│ id       │ title        │ originalPrice│ offerPrice │ category │
├──────────┼──────────────┼──────────────┼────────────┼──────────┤
│ 1        │ Manzana...   │ 5.99         │ 2.99       │ veg...   │
│ 2        │ Pechuga...   │ 8.99         │ 5.49       │ meats    │
│ 3        │ Leche...     │ 4.49         │ 2.99       │ dairy    │
└──────────┴──────────────┴──────────────┴────────────┴──────────┘

### cartItems
┌──────────┬───────────┬──────────┬───────────┐
│ id       │ productId │ quantity │ sessionId │
├──────────┼───────────┼──────────┼───────────┤
│ 1        │ 1         │ 2        │ user123   │
│ 2        │ 3         │ 1        │ user123   │
└──────────┴───────────┴──────────┴───────────┘

### orders
┌───────┬─────────────┬──────────────┬──────────────┬────────┐
│ id    │ orderNumber │ totalAmount  │ customerName │ status │
├───────┼─────────────┼──────────────┼──────────────┼────────┤
│ 1     │ ORD-XXX...  │ 8.97         │ Juan Pérez   │ pending│
└───────┴─────────────┴──────────────┴──────────────┴────────┘


═══════════════════════════════════════════════════════════════════

## 🚀 Flujo de Inicio

1. npm install              (Instalar dependencias)
2. npm run dev             (Ejecutar servidor)
3. Servidor en:            http://localhost:3001
4. Abrir frontend:         http://localhost:3000 (o file:///)
5. Probar API:             Ver CURL_EXAMPLES.md


═══════════════════════════════════════════════════════════════════

## 📱 Versiones de Ejecución

### Desarrollo (con auto-reload)
npm run dev

### Producción
npm start

### Tests
npm test


═══════════════════════════════════════════════════════════════════

## 🔄 Próximas Mejoras

Fase 3:
✓ Conectar frontend a API
✓ JWT en lugar de contraseña
✓ Rate limiting
✓ Validaciones avanzadas
✓ Integración de pagos (Stripe)
✓ Notificaciones en tiempo real
✓ Docker containerization
✓ Deploy a producción


═══════════════════════════════════════════════════════════════════

Versión: 2.0 (Con Backend)
Última actualización: Mayo 2026
Tecnologías: Node.js, Express, SQLite3, Vanilla JS, CSS3
Moneda: Peso Colombiano (COP) 🇨🇴
=======
# 📦 Estructura del Proyecto MetaOfertas - Fase 2

```
MetaOfertas/
│
├── 📄 Frontend (Cliente)
│   ├── index.html              → Vista pública (catálogo)
│   ├── admin.html              → Panel del administrador
│   ├── styles.css              → Estilos principales
│   ├── styles-admin.css        → Estilos del panel admin
│   ├── app.js                  → Lógica principal (Cliente)
│   └── admin.js                → Lógica del panel admin
│
├── 🖥️ Backend (Servidor)
│   ├── server.js               → Servidor principal Express
│   ├── database.js             → Configuración SQLite
│   ├── .env                    → Variables de entorno
│   ├── package.json            → Dependencias Node.js
│   │
│   └── routes/                 → Endpoints de API
│       ├── products.js         → CRUD productos
│       ├── cart.js             → Carrito de compras
│       ├── orders.js           → Gestión de pedidos
│       └── admin.js            → Panel administrativo
│
├── 🗄️ Base de Datos
│   └── database.db             → SQLite (se crea automáticamente)
│
├── 📚 Documentación
│   ├── README.md               → Documentación general
│   ├── API_DOCUMENTATION.md    → Documentación API
│   ├── BACKEND_SETUP.md        → Instalación backend
│   ├── CURL_EXAMPLES.md        → Ejemplos de cURL
│   └── PROJECT_STRUCTURE.md    → Este archivo
│
├── 🔧 Scripts
│   ├── run-server.bat          → Ejecutar en Windows
│   ├── run-server.sh           → Ejecutar en Linux/Mac
│   └── test.js                 → Suite de tests
│
└── 🔒 Configuración
    └── .gitignore             → Archivos a ignorar en Git


═══════════════════════════════════════════════════════════════════

## 📊 Arquitectura

┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND (Cliente)                    │
│  index.html + styles.css + app.js (Vanilla JavaScript)      │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP/REST
                       ▼
┌─────────────────────────────────────────────────────────────┐
│            BACKEND (Servidor Node.js + Express)             │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Rutas API                                             │ │
│  │  • GET    /products    - Listar productos             │ │
│  │  • POST   /products    - Crear producto               │ │
│  │  • PUT    /products/:id - Actualizar producto         │ │
│  │  • DELETE /products/:id - Eliminar producto           │ │
│  │                                                        │ │
│  │  • GET    /cart/:sessionId - Ver carrito             │ │
│  │  • POST   /cart/:sessionId - Agregar al carrito      │ │
│  │  • PUT    /cart/:sessionId/:id - Actualizar cantidad │ │
│  │                                                        │ │
│  │  • POST   /orders    - Crear pedido                   │ │
│  │  • GET    /orders    - Listar pedidos (admin)         │ │
│  │  • PUT    /orders/:id - Actualizar pedido (admin)     │ │
│  │                                                        │ │
│  │  • POST   /admin/login - Autenticación               │ │
│  │  • GET    /admin/dashboard - Estadísticas            │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────┬──────────────────────────────────────┘
                       │ SQL
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              BASE DE DATOS (SQLite3)                         │
│                                                              │
│  • products    - Catálogo de productos                     │
│  • cartItems   - Items en carrito                          │
│  • orders      - Pedidos realizados                        │
└─────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════

## 🔐 Flujo de Autenticación

Contraseña Admin: admin123

Para operaciones de admin, enviar header:
X-Admin-Password: admin123

O usar POST /admin/login para obtener token.


═══════════════════════════════════════════════════════════════════

## 📋 Tablas de Base de Datos

### products
┌──────────┬──────────────┬──────────────┬────────────┬──────────┐
│ id       │ title        │ originalPrice│ offerPrice │ category │
├──────────┼──────────────┼──────────────┼────────────┼──────────┤
│ 1        │ Manzana...   │ 5.99         │ 2.99       │ veg...   │
│ 2        │ Pechuga...   │ 8.99         │ 5.49       │ meats    │
│ 3        │ Leche...     │ 4.49         │ 2.99       │ dairy    │
└──────────┴──────────────┴──────────────┴────────────┴──────────┘

### cartItems
┌──────────┬───────────┬──────────┬───────────┐
│ id       │ productId │ quantity │ sessionId │
├──────────┼───────────┼──────────┼───────────┤
│ 1        │ 1         │ 2        │ user123   │
│ 2        │ 3         │ 1        │ user123   │
└──────────┴───────────┴──────────┴───────────┘

### orders
┌───────┬─────────────┬──────────────┬──────────────┬────────┐
│ id    │ orderNumber │ totalAmount  │ customerName │ status │
├───────┼─────────────┼──────────────┼──────────────┼────────┤
│ 1     │ ORD-XXX...  │ 8.97         │ Juan Pérez   │ pending│
└───────┴─────────────┴──────────────┴──────────────┴────────┘


═══════════════════════════════════════════════════════════════════

## 🚀 Flujo de Inicio

1. npm install              (Instalar dependencias)
2. npm run dev             (Ejecutar servidor)
3. Servidor en:            http://localhost:3001
4. Abrir frontend:         http://localhost:3000 (o file:///)
5. Probar API:             Ver CURL_EXAMPLES.md


═══════════════════════════════════════════════════════════════════

## 📱 Versiones de Ejecución

### Desarrollo (con auto-reload)
npm run dev

### Producción
npm start

### Tests
npm test


═══════════════════════════════════════════════════════════════════

## 🔄 Próximas Mejoras

Fase 3:
✓ Conectar frontend a API
✓ JWT en lugar de contraseña
✓ Rate limiting
✓ Validaciones avanzadas
✓ Integración de pagos (Stripe)
✓ Notificaciones en tiempo real
✓ Docker containerization
✓ Deploy a producción


═══════════════════════════════════════════════════════════════════

Versión: 2.0 (Con Backend)
Última actualización: Mayo 2026
Tecnologías: Node.js, Express, SQLite3, Vanilla JS, CSS3
Moneda: Peso Colombiano (COP) 🇨🇴
>>>>>>> 501eef96e7e1bf4b282028af1297426bac033904
