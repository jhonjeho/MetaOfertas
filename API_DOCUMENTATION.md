# 📚 MetaOfertas API - Documentación

## 🚀 Introducción

API REST profesional para **MetaOfertas**, una plataforma de supermercado de ofertas diarias. Basada en **Node.js + Express** con **SQLite** como base de datos.

**💰 Moneda:** Peso Colombiano (COP) 🇨🇴

---

## 🔧 Instalación y Ejecución

### Requisitos
- Node.js 14+ 
- npm o yarn

### Pasos

```bash
# 1. Instalar dependencias
npm install

# 2. Ejecutar en modo desarrollo (con auto-reload)
npm run dev

# 3. Ejecutar en modo producción
npm start
```

El servidor estará disponible en **http://localhost:3001**

---

## 🔐 Autenticación

Para operaciones de administrador, enviar el header:
```
X-Admin-Password: admin123
```

---

## 📡 Endpoints

### Health Check

#### `GET /api/health`
Verificar estado del servidor.

**Respuesta:**
```json
{
    "status": "OK",
    "message": "MetaOfertas API está funcionando ✅"
}
```

---

## 🛍️ Productos

### `GET /api/products`
Obtener todos los productos o filtrados por categoría.

**Parámetros Query:**
- `category` (opcional): "vegetables", "meats", "dairy", "pantry", o "all"

**Ejemplo:**
```bash
GET /api/products
GET /api/products?category=vegetables
```

**Respuesta:**
```json
[
    {
        "id": 1,
        "title": "Manzana Roja (1kg)",
        "originalPrice": 18000,
        "offerPrice": 9500,
        "category": "vegetables",
        "emoji": "🍎",
        "createdAt": "2026-05-23T10:30:00.000Z"
    }
]
```

---

### `GET /api/products/:id`
Obtener un producto específico.

**Ejemplo:**
```bash
GET /api/products/1
```

---

### `POST /api/products`
Crear nuevo producto (requiere autenticación).

**Headers:**
```
X-Admin-Password: admin123
Content-Type: application/json
```

**Body:**
```json
{
    "title": "Tomate Fresco (1kg)",
    "originalPrice": 8500,
    "offerPrice": 4500,
    "category": "vegetables",
    "emoji": "🍅",
    "image": null
}
```

**Nota:** Los precios deben estar en Peso Colombiano (COP)

**Respuesta:**
```json
{
    "id": 7,
    "message": "Producto creado exitosamente"
}
```

---

### `PUT /api/products/:id`
Actualizar un producto (requiere autenticación).

**Headers:**
```
X-Admin-Password: admin123
```

**Body:**
```json
{
    "title": "Tomate Rojo Premium (1kg)",
    "originalPrice": 7.99,
    "offerPrice": 3.99,
    "category": "vegetables",
    "emoji": "🍅"
}
```

---

### `DELETE /api/products/:id`
Eliminar un producto (requiere autenticación).

**Headers:**
```
X-Admin-Password: admin123
```

---

## 🛒 Carrito de Compras

### `GET /api/cart/:sessionId`
Obtener items del carrito de una sesión.

**Ejemplo:**
```bash
GET /api/cart/user123
```

**Respuesta:**
```json
[
    {
        "id": 1,
        "productId": 1,
        "quantity": 2,
        "title": "Manzana Roja",
        "offerPrice": 2.99,
        "emoji": "🍎"
    }
]
```

---

### `POST /api/cart/:sessionId`
Agregar producto al carrito.

**Body:**
```json
{
    "productId": 1,
    "quantity": 2
}
```

---

### `PUT /api/cart/:sessionId/:cartItemId`
Actualizar cantidad de un item en el carrito.

**Body:**
```json
{
    "quantity": 3
}
```

Si quantity = 0, el item se elimina automáticamente.

---

### `DELETE /api/cart/:sessionId/:cartItemId`
Eliminar un item del carrito.

---

### `DELETE /api/cart/:sessionId`
Vaciar el carrito completamente.

---

## 📦 Pedidos

### `POST /api/orders`
Crear un nuevo pedido.

**Body:**
```json
{
    "customerName": "Juan Pérez",
    "customerEmail": "juan@example.com",
    "items": [
        {
            "productId": 1,
            "quantity": 2
        },
        {
            "productId": 3,
            "quantity": 1
        }
    ]
}
```

**Nota:** Los totales se calculan automáticamente en COP

**Respuesta:**
```json
{
    "id": 1,
    "orderNumber": "ORD-KHQM2V-ABC123",
    "totalAmount": 35000,
    "message": "Pedido creado exitosamente"
}
```

---

### `GET /api/orders` (Admin)
Obtener todos los pedidos.

**Headers:**
```
X-Admin-Password: admin123
```

---

### `GET /api/orders/:id`
Obtener detalles de un pedido.

---

### `PUT /api/orders/:id` (Admin)
Actualizar estado de un pedido.

**Headers:**
```
X-Admin-Password: admin123
```

**Body:**
```json
{
    "status": "confirmed"
}
```

**Estados válidos:** "pending", "confirmed", "shipped", "delivered", "cancelled"

---

## 👨‍💼 Administración

### `POST /api/admin/login`
Verificar credenciales de administrador.

**Body:**
```json
{
    "password": "admin123"
}
```

**Respuesta exitosa:**
```json
{
    "success": true,
    "message": "Autenticación exitosa",
    "token": "YWRtaW46YWRtaW4xMjM="
}
```

---

### `GET /api/admin/dashboard` (Admin)
Obtener estadísticas del dashboard.

**Headers:**
```
X-Admin-Password: admin123
```

**Respuesta:**
```json
{
    "totalProducts": 6,
    "totalOrders": 25,
    "pendingOrders": 3,
    "totalRevenue": 1250.50
}
```

---

### `GET /api/admin/sales` (Admin)
Obtener resumen de ventas por fecha.

**Headers:**
```
X-Admin-Password: admin123
```

---

### `GET /api/admin/top-products` (Admin)
Obtener productos más vendidos.

**Headers:**
```
X-Admin-Password: admin123
```

---

## 🗄️ Base de Datos

### Tablas

#### `products`
```sql
- id: INTEGER (PK)
- title: TEXT
- originalPrice: REAL
- offerPrice: REAL
- category: TEXT
- emoji: TEXT
- image: BLOB
- createdAt: DATETIME
- updatedAt: DATETIME
```

#### `cartItems`
```sql
- id: INTEGER (PK)
- productId: INTEGER (FK)
- quantity: INTEGER
- sessionId: TEXT
- addedAt: DATETIME
```

#### `orders`
```sql
- id: INTEGER (PK)
- orderNumber: TEXT (UNIQUE)
- customerName: TEXT
- customerEmail: TEXT
- totalAmount: REAL
- status: TEXT
- items: TEXT (JSON)
- createdAt: DATETIME
- updatedAt: DATETIME
```

---

## ⚠️ Códigos de Error

| Código | Significado |
|--------|------------|
| 200 | OK - Solicitud exitosa |
| 201 | CREATED - Recurso creado |
| 400 | BAD REQUEST - Parámetros inválidos |
| 401 | UNAUTHORIZED - Autenticación requerida |
| 404 | NOT FOUND - Recurso no encontrado |
| 500 | SERVER ERROR - Error interno |

---

## 🔄 Ejemplo de Flujo Completo

```bash
# 1. Obtener productos
curl http://localhost:3001/api/products

# 2. Agregar al carrito
curl -X POST http://localhost:3001/api/cart/user123 \
  -H "Content-Type: application/json" \
  -d '{"productId": 1, "quantity": 2}'

# 3. Ver carrito
curl http://localhost:3001/api/cart/user123

# 4. Crear pedido
curl -X POST http://localhost:3001/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "Juan",
    "customerEmail": "juan@email.com",
    "items": [{"productId": 1, "quantity": 2}]
  }'

# 5. Ver pedidos (Admin)
curl http://localhost:3001/api/orders \
  -H "X-Admin-Password: admin123"
```

---

## 📞 Soporte

Para errores o preguntas, contacta al equipo de MetaOfertas.

**Versión:** 1.0.0  
**Última actualización:** Mayo 2026
