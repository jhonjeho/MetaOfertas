# 🎯 Guía Rápida - Sistema de Registro MetaOfertas

## ¿Qué Cambió?

Antes: Cualquiera podía hacer pedidos sin proporcionar información
Ahora: Los usuarios DEBEN registrarse antes de hacer checkout

## Cómo Probar

### 1️⃣ Inicia el servidor
```bash
npm run dev
# o
npm start
```
Accede a: http://localhost:3001

### 2️⃣ Prueba sin registrarse
1. Agrega productos al carrito
2. Haz clic en "Finalizar Pedido por WhatsApp"
3. ✅ Verás: "Primero debes registrarte para realizar pedidos"
4. Se abre modal de registro

### 3️⃣ Registrate
Completa el formulario:
```
Nombre: Juan García López
WhatsApp: 3125551234
Barrio: Centro / Cra 5 #12-45
Tipo: ☑ Persona  ○ Tienda
```
Clic en "Registrarse"

### 4️⃣ Continúa con tu pedido
- Se cierra el modal automáticamente
- Se abre WhatsApp con tu información incluida:
```
NUEVO PEDIDO - METAOFERTAS
=========================

Cliente: Juan García López
WhatsApp: 3125551234
Ubicacion: Centro
Tipo: Persona

=========================

1. Manzana Roja 1kg
   Cantidad: 2
   Precio: $9,500
   Subtotal: $19,000
...
```

### 5️⃣ Recarga la página
- Tu registro se mantiene en localStorage
- Próxima vez no necesitas registrarte de nuevo

## Estructura de Base de Datos

```sql
-- Tabla de usuarios
CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    nombre TEXT NOT NULL,
    whatsapp TEXT UNIQUE NOT NULL,
    barrio TEXT NOT NULL,
    tipoCliente TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de pedidos (ahora con userId)
CREATE TABLE orders (
    id INTEGER PRIMARY KEY,
    orderNumber TEXT UNIQUE NOT NULL,
    userId INTEGER NOT NULL,  -- ← NUEVO
    totalAmount REAL NOT NULL,
    status TEXT DEFAULT 'pending',
    items TEXT NOT NULL,
    createdAt DATETIME,
    FOREIGN KEY (userId) REFERENCES users(id)
);
```

## APIs Disponibles

### Registrar Usuario
```bash
curl -X POST http://localhost:3001/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Juan García",
    "whatsapp": "3125551234",
    "barrio": "Centro",
    "tipoCliente": "persona"
  }'

# Respuesta:
{
  "id": 1,
  "message": "Usuario registrado exitosamente",
  "nombre": "Juan García",
  "tipoCliente": "persona"
}
```

### Obtener Usuario
```bash
curl http://localhost:3001/api/users/1

# Respuesta:
{
  "id": 1,
  "nombre": "Juan García",
  "whatsapp": "3125551234",
  "barrio": "Centro",
  "tipoCliente": "persona",
  "createdAt": "2026-05-24T21:44:27"
}
```

### Crear Pedido
```bash
curl -X POST http://localhost:3001/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "items": [
      {"productId": 1, "quantity": 2},
      {"productId": 3, "quantity": 1}
    ]
  }'

# Respuesta:
{
  "id": 1,
  "orderNumber": "ORD-ABC123DEF",
  "totalAmount": 25000,
  "message": "Pedido creado exitosamente"
}
```

## Validaciones

✅ **Nombre**: Requerido, no vacío
✅ **WhatsApp**: Requerido, único (no puede repetirse)
✅ **Barrio**: Requerido, no vacío
✅ **Tipo**: Requerido, debe ser "persona" o "tienda"

❌ **Si falta algo**: Muestra error específico
❌ **Si WhatsApp existe**: Opción de usar cuenta existente

## Mensajes de Error

| Situación | Mensaje |
|-----------|---------|
| Nombre vacío | "El nombre es requerido" |
| WhatsApp vacío | "El número de WhatsApp es requerido" |
| Barrio vacío | "El barrio/dirección es requerido" |
| Tipo no seleccionado | "Debes seleccionar un tipo de cliente" |
| WhatsApp duplicado | "Este número de WhatsApp ya está registrado" |
| Hacer checkout sin registrar | "Primero debes registrarte para realizar pedidos" |

## Datos Guardados en localStorage

```json
{
  "metaofertasUser": {
    "id": 1,
    "nombre": "Juan García López",
    "whatsapp": "3125551234",
    "barrio": "Centro",
    "tipoCliente": "persona"
  }
}
```

## Notas Importantes

⚠️ **Por dispositivo**: Si cambias de navegador/dispositivo, no está registrado
⚠️ **Por WhatsApp**: Cada WhatsApp único es un usuario diferente
⚠️ **Historial**: El admin puede ver todos los pedidos por usuario en el panel
⚠️ **Borrar datos**: Si limpias localStorage, perderás tu sesión

## Próximas Mejoras (Ideas)

- [ ] Panel de usuario: Ver historial de pedidos
- [ ] Editar perfil: Cambiar barrio/teléfono
- [ ] Login/Logout: Contraseña para acceder
- [ ] Múltiples direcciones: Guardar varias direcciones por usuario
- [ ] Historial de pedidos: Ver estado de pedidos anteriores
- [ ] Notificaciones: WhatsApp cuando se confirme pedido

---

**¿Preguntas?** Revisa `REGISTRATION_SETUP.md` para documentación completa
