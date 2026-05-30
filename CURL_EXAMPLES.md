# Ejemplos de cURL para probar MetaOfertas API

## 📌 IMPORTANTE: Moneda = Peso Colombiano (COP) 🇨🇴

Base URL: http://localhost:3001/api

# ═══════════════════════════════════════════════════════════════
# 1. HEALTH CHECK
# ═══════════════════════════════════════════════════════════════

curl http://localhost:3001/api/health


# ═══════════════════════════════════════════════════════════════
# 2. PRODUCTOS - GET
# ═══════════════════════════════════════════════════════════════

# Obtener todos los productos
curl http://localhost:3001/api/products

# Obtener por categoría
curl http://localhost:3001/api/products?category=vegetables
curl http://localhost:3001/api/products?category=meats
curl http://localhost:3001/api/products?category=dairy
curl http://localhost:3001/api/products?category=pantry

# Obtener producto específico
curl http://localhost:3001/api/products/1


# ═══════════════════════════════════════════════════════════════
# 3. PRODUCTOS - CREATE (Admin)
# ═══════════════════════════════════════════════════════════════

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


# ═══════════════════════════════════════════════════════════════
# 4. PRODUCTOS - UPDATE (Admin)
# ═══════════════════════════════════════════════════════════════

curl -X PUT http://localhost:3001/api/products/1 \
  -H "Content-Type: application/json" \
  -H "X-Admin-Password: admin123" \
  -d '{
    "title": "Manzana Roja Premium (1kg)",
    "originalPrice": 7.99,
    "offerPrice": 3.99,
    "category": "vegetables",
    "emoji": "🍎"
  }'


# ═══════════════════════════════════════════════════════════════
# 5. PRODUCTOS - DELETE (Admin)
# ═══════════════════════════════════════════════════════════════

curl -X DELETE http://localhost:3001/api/products/1 \
  -H "X-Admin-Password: admin123"


# ═══════════════════════════════════════════════════════════════
# 6. CARRITO - VER
# ═══════════════════════════════════════════════════════════════

curl http://localhost:3001/api/cart/user123


# ═══════════════════════════════════════════════════════════════
# 7. CARRITO - AGREGAR PRODUCTO
# ═══════════════════════════════════════════════════════════════

curl -X POST http://localhost:3001/api/cart/user123 \
  -H "Content-Type: application/json" \
  -d '{
    "productId": 1,
    "quantity": 2
  }'


# ═══════════════════════════════════════════════════════════════
# 8. CARRITO - ACTUALIZAR CANTIDAD
# ═══════════════════════════════════════════════════════════════

curl -X PUT http://localhost:3001/api/cart/user123/1 \
  -H "Content-Type: application/json" \
  -d '{
    "quantity": 3
  }'


# ═══════════════════════════════════════════════════════════════
# 9. CARRITO - ELIMINAR PRODUCTO
# ═══════════════════════════════════════════════════════════════

curl -X DELETE http://localhost:3001/api/cart/user123/1


# ═══════════════════════════════════════════════════════════════
# 10. CARRITO - VACIAR
# ═══════════════════════════════════════════════════════════════

curl -X DELETE http://localhost:3001/api/cart/user123


# ═══════════════════════════════════════════════════════════════
# 11. PEDIDOS - CREAR
# ═══════════════════════════════════════════════════════════════

curl -X POST http://localhost:3001/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "Juan Pérez",
    "customerEmail": "juan@example.com",
    "items": [
      {"productId": 1, "quantity": 2},
      {"productId": 3, "quantity": 1}
    ]
  }'


# ═══════════════════════════════════════════════════════════════
# 12. PEDIDOS - VER (ID)
# ═══════════════════════════════════════════════════════════════

curl http://localhost:3001/api/orders/1


# ═══════════════════════════════════════════════════════════════
# 13. PEDIDOS - LISTAR TODOS (Admin)
# ═══════════════════════════════════════════════════════════════

curl http://localhost:3001/api/orders \
  -H "X-Admin-Password: admin123"


# ═══════════════════════════════════════════════════════════════
# 14. PEDIDOS - ACTUALIZAR ESTADO (Admin)
# ═══════════════════════════════════════════════════════════════

curl -X PUT http://localhost:3001/api/orders/1 \
  -H "Content-Type: application/json" \
  -H "X-Admin-Password: admin123" \
  -d '{
    "status": "confirmed"
  }'

# Estados válidos: pending, confirmed, shipped, delivered, cancelled


# ═══════════════════════════════════════════════════════════════
# 15. ADMIN - LOGIN
# ═══════════════════════════════════════════════════════════════

curl -X POST http://localhost:3001/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "password": "admin123"
  }'


# ═══════════════════════════════════════════════════════════════
# 16. ADMIN - DASHBOARD
# ═══════════════════════════════════════════════════════════════

curl http://localhost:3001/api/admin/dashboard \
  -H "X-Admin-Password: admin123"


# ═══════════════════════════════════════════════════════════════
# 17. ADMIN - VENTAS
# ═══════════════════════════════════════════════════════════════

curl http://localhost:3001/api/admin/sales \
  -H "X-Admin-Password: admin123"


# ═══════════════════════════════════════════════════════════════
# 18. ADMIN - PRODUCTOS TOP
# ═══════════════════════════════════════════════════════════════

curl http://localhost:3001/api/admin/top-products \
  -H "X-Admin-Password: admin123"


# ═══════════════════════════════════════════════════════════════
# NOTAS
# ═══════════════════════════════════════════════════════════════

# 1. Reemplaza "user123" por el ID de sesión real del usuario
# 2. Reemplaza los IDs (1, 2, etc) con IDs reales de productos/pedidos
# 3. Contraseña Admin por defecto: admin123
# 4. El servidor debe estar ejecutándose en http://localhost:3001
