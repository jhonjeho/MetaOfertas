# 📋 Sistema de Registro de Usuarios - MetaOfertas

## ¿Qué se implementó?

Se agregó un sistema completo de registro obligatorio para usuarios antes de permitirles hacer pedidos. Los usuarios ahora deben proporcionar:

- ✅ **Nombre completo**
- ✅ **Número de WhatsApp** (único, no puede repetirse)
- ✅ **Barrio/Dirección**
- ✅ **Tipo de cliente** (Persona o Tienda)

## Archivos Modificados

### Backend

#### 1. `database.js`
- ✅ Agregada tabla `users` con campos:
  - `id` (INTEGER PRIMARY KEY)
  - `nombre` (TEXT NOT NULL)
  - `whatsapp` (TEXT NOT NULL UNIQUE)
  - `barrio` (TEXT NOT NULL)
  - `tipoCliente` (TEXT NOT NULL)
  - `createdAt` (DATETIME)
  
- ✅ Tabla `orders` modificada:
  - Reemplazado `customerName` y `customerEmail` por `userId` (FOREIGN KEY)

#### 2. `routes/users.js` (NUEVO)
- ✅ `POST /api/users/register` - Registrar nuevo usuario
  - Valida todos los campos requeridos
  - Previene números de WhatsApp duplicados
  - Retorna userId para guardar en cliente
  
- ✅ `GET /api/users/:id` - Obtener datos del usuario
- ✅ `GET /api/users/whatsapp/:whatsapp` - Buscar usuario por WhatsApp

#### 3. `routes/orders.js`
- ✅ Modificado `POST /api/orders`
  - Ahora requiere `userId` en lugar de `customerName` y `customerEmail`
  - Valida que el usuario exista en la BD

#### 4. `server.js`
- ✅ Importada ruta de usuarios
- ✅ Registrada en: `app.use('/api/users', userRoutes)`

### Frontend

#### 1. `index.html`
- ✅ Agregado modal de registro (#registerModal)
- ✅ Formulario con campos:
  - Input: Nombre completo
  - Input: Número de WhatsApp
  - Input: Barrio/Dirección
  - Select: Tipo de cliente (Persona/Tienda)
  - Botón: Registrarse
- ✅ Importado script `register.js`

#### 2. `register.js` (NUEVO)
- ✅ `showRegisterModal()` - Muestra el modal de registro
- ✅ `closeRegisterModal()` - Cierra el modal
- ✅ `registerUser(event)` - Procesa el registro
  - Valida campos antes de enviar
  - Hace POST a `/api/users/register`
  - Guarda usuario en localStorage
  - Maneja errores (ej: WhatsApp ya registrado)
  
#### 3. `app.js`
- ✅ Nueva variable: `currentUser` (almacena usuario registrado)
- ✅ Nueva constante `USER_STORAGE_KEY` para localStorage
- ✅ Nueva función: `loadUserFromStorage()` - Carga usuario al iniciar
- ✅ Nueva función: `saveUserToStorage()` - Guarda usuario en localStorage
- ✅ Nueva función: `isUserRegistered()` - Verifica si hay usuario registrado
- ✅ Modificado evento de checkout (#checkoutWhatsapp):
  - Valida que el usuario esté registrado
  - Si no está registrado, muestra modal de registro
  - Incluye datos del usuario en mensaje de WhatsApp:
    - Nombre
    - WhatsApp
    - Ubicación (barrio)
    - Tipo de cliente

#### 4. `styles.css`
- ✅ Estilos para formulario de registro:
  - `.register-form` - Contenedor del formulario
  - `.error-message` - Mensajes de error/éxito
  - Estilos responsive para inputs y selects

## Flujo de Usuario

1. **Usuario abre la app** → Carga datos del usuario desde localStorage (si existe)
2. **Usuario agrega productos al carrito**
3. **Usuario hace clic en "Finalizar Pedido por WhatsApp"**
4. **Verificación de registro:**
   - ✅ Si está registrado → Abre WhatsApp con datos completos
   - ❌ Si NO está registrado → Abre modal de registro
5. **Usuario completa el formulario:**
   - Nombre
   - WhatsApp
   - Barrio/Dirección
   - Tipo de cliente
6. **Sistema valida:**
   - Todos los campos obligatorios
   - WhatsApp no sea duplicado
7. **Si es exitoso:**
   - Guarda usuario en BD
   - Guarda userId en localStorage
   - Cierra modal
   - Abre WhatsApp con pedido
8. **Si es error:**
   - Muestra mensaje de error
   - Permite reintentar

## Pruebas Recomendadas

### Test 1: Registro exitoso
```
1. Abre http://localhost:3001
2. Agrega productos al carrito
3. Haz clic en "Finalizar Pedido por WhatsApp"
4. Completa el formulario de registro:
   - Nombre: Juan García
   - WhatsApp: 3125551234
   - Barrio: Centro
   - Tipo: Persona
5. ✅ Debe abrir WhatsApp con los datos registrados
```

### Test 2: WhatsApp duplicado
```
1. Intenta registrar con el mismo WhatsApp (3125551234)
2. ✅ Debe mostrar: "Este número de WhatsApp ya está registrado"
3. Y permitir continuar (ya está en el sistema)
```

### Test 3: Validar campos requeridos
```
1. Intenta enviar formulario sin llenar campos
2. ✅ Debe mostrar error para cada campo obligatorio
```

### Test 4: Persistencia
```
1. Registra un usuario
2. Recarga la página (F5)
3. Agrega productos y haz checkout
4. ✅ Los datos del usuario deben estar pre-llenados
```

## Datos Almacenados

### En la BD (SQLite)
```sql
-- Usuario registrado
SELECT * FROM users WHERE id = 1;
-- Resultado:
-- 1 | Juan García | 3125551234 | Centro | persona | 2026-05-24

-- Pedido asociado a usuario
SELECT * FROM orders WHERE userId = 1;
-- Resultado:
-- 1 | ORD-XXXXX | 1 | 25000 | pending | [...items...] | 2026-05-24
```

### En localStorage
```json
{
  "metaofertasUser": {
    "id": 1,
    "nombre": "Juan García",
    "whatsapp": "3125551234",
    "barrio": "Centro",
    "tipoCliente": "persona"
  }
}
```

## API Endpoints

### Registro
```
POST /api/users/register
Content-Type: application/json

{
  "nombre": "Juan García",
  "whatsapp": "3125551234",
  "barrio": "Centro",
  "tipoCliente": "persona"
}

Respuesta exitosa (201):
{
  "id": 1,
  "message": "Usuario registrado exitosamente",
  "nombre": "Juan García",
  "tipoCliente": "persona"
}
```

### Obtener usuario
```
GET /api/users/:id

Respuesta (200):
{
  "id": 1,
  "nombre": "Juan García",
  "whatsapp": "3125551234",
  "barrio": "Centro",
  "tipoCliente": "persona",
  "createdAt": "2026-05-24T..."
}
```

### Crear pedido
```
POST /api/orders
Content-Type: application/json

{
  "userId": 1,
  "items": [
    {"productId": 1, "quantity": 2},
    {"productId": 3, "quantity": 1}
  ]
}

Respuesta exitosa (201):
{
  "id": 1,
  "orderNumber": "ORD-ABC123DEF",
  "totalAmount": 25000,
  "message": "Pedido creado exitosamente"
}
```

## Notas Importantes

⚠️ **WhatsApp ÚNICO**: No se puede repetir el mismo número de WhatsApp. Es el identificador principal del usuario.

⚠️ **localStorage**: El userId se guarda en el navegador para sesiones locales. Si cambias de navegador/dispositivo, deberás registrarte nuevamente.

⚠️ **Base de datos**: Los datos se guardan en `database.db` (SQLite). Esta es una BD local que persiste entre reinicios.

✅ **Pedidos**: Ya están vinculados a usuarios por `userId`, permitiendo histórico por usuario en el futuro.

## Próximos Pasos (Opcional)

Puedes mejorar el sistema con:

1. **Panel de usuario** - Ver historial de pedidos
2. **Editar perfil** - Modificar barrio/teléfono
3. **Autenticación** - Contraseña para acceder a cuenta
4. **Panel de admin mejorado** - Ver clientes registrados
5. **Notificaciones** - Email/SMS cuando se confirme pedido
