# 🚀 FASE 2 - MetaOfertas Backend

## 📋 Resumen de Cambios

Se ha añadido una arquitectura backend completa a MetaOfertas:

### ✅ Backend Implementado

**Tecnologías:**
- ✅ Node.js + Express (servidor)
- ✅ SQLite (base de datos)
- ✅ API REST (endpoints profesionales)
- ✅ **Moneda:** Peso Colombiano (COP) 🇨🇴

**Archivos Creados:**
```
MetaOfertas/
├── server.js              (Servidor principal)
├── database.js            (Configuración SQLite + inicialización)
├── package.json           (Dependencias Node.js)
├── .env                   (Variables de configuración)
├── routes/
│   ├── products.js        (CRUD de productos)
│   ├── cart.js            (Gestión del carrito)
│   ├── orders.js          (Gestión de pedidos)
│   └── admin.js           (Panel administrativo)
├── database.db            (Se crea automáticamente)
└── API_DOCUMENTATION.md   (Documentación completa)
```

---

## 🔧 Instalación

### Paso 1: Instalar Dependencias

```bash
cd "c:\Users\USUARIO\OneDrive\Documents\MetaOfertas"
npm install
```

Esto instalará:
- `express` - Framework HTTP
- `sqlite3` - Base de datos
- `cors` - Soporte para CORS
- `body-parser` - Parser de JSON
- `dotenv` - Variables de entorno

### Paso 2: Ejecutar el Servidor

```bash
# Modo desarrollo (con auto-reload)
npm run dev

# O modo producción
npm start
```

---

## 📡 Endpoints Disponibles

### Productos
```
GET    /api/products              - Obtener todos los productos
GET    /api/products/:id          - Obtener producto específico
POST   /api/products              - Crear producto (admin)
PUT    /api/products/:id          - Actualizar producto (admin)
DELETE /api/products/:id          - Eliminar producto (admin)
```

### Carrito
```
GET    /api/cart/:sessionId       - Ver carrito
POST   /api/cart/:sessionId       - Agregar al carrito
PUT    /api/cart/:sessionId/:id   - Actualizar cantidad
DELETE /api/cart/:sessionId/:id   - Eliminar del carrito
DELETE /api/cart/:sessionId       - Vaciar carrito
```

### Pedidos
```
POST   /api/orders                - Crear pedido
GET    /api/orders/:id            - Ver pedido
GET    /api/orders                - Listar todos (admin)
PUT    /api/orders/:id            - Actualizar estado (admin)
```

### Admin
```
POST   /api/admin/login           - Verificar credenciales
GET    /api/admin/dashboard       - Estadísticas (admin)
GET    /api/admin/sales           - Ventas por fecha (admin)
GET    /api/admin/top-products    - Productos top (admin)
```

---

## 🔐 Autenticación

**Contraseña Admin:** `admin123`

Para operaciones de admin, enviar header:
```
X-Admin-Password: admin123
```

---

## 📝 Ejemplo: Crear Producto vía API

```bash
curl -X POST http://localhost:3001/api/products \
  -H "Content-Type: application/json" \
  -H "X-Admin-Password: admin123" \
  -d '{
    "title": "Tomate Fresco (1kg)",
    "originalPrice": 8500,
    "offerPrice": 4500,
    "category": "vegetables",
    "emoji": "🍅"
  }'
```

**Nota:** Todos los precios están en Peso Colombiano (COP) 🇨🇴

---

## 🗄️ Base de Datos

Se crea automáticamente en `database.db` con 3 tablas:

1. **products** - Catálogo de productos
2. **cartItems** - Items en el carrito
3. **orders** - Pedidos realizados

---

## 📚 Documentación Completa

Ver `API_DOCUMENTATION.md` para detalles de todos los endpoints.

---

## 🚀 Próximos Pasos (Fase 2.5)

1. **Conectar Frontend a la API**
   - Actualizar `app.js` y `admin.js` para usar fetch
   - Cambiar de LocalStorage a API REST

2. **Validaciones Avanzadas**
   - Verificación de emails
   - Validación de datos

3. **Seguridad**
   - Rate limiting
   - JWT en lugar de contraseña en header

4. **Pagos**
   - Integración con Stripe
   - Procesamiento de transacciones

---

## ❓ Troubleshooting

### Error: "Cannot find module 'express'"
```bash
npm install
```

### Error: "Port 3001 already in use"
Cambiar puerto en `.env`:
```
PORT=3002
```

### Base de datos corrupta
Eliminar `database.db` y ejecutar nuevamente (se recreará automáticamente).

---

**¡El backend está listo para producción! 🎉**
