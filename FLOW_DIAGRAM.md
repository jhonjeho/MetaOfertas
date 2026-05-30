# 📊 Diagrama del Flujo - Sistema de Registro

## Vista de Usuario

```
┌─────────────────────────────────────┐
│   METAAOFERTAS - Página Principal   │
│                                     │
│  [Productos]                        │
│  ┌─────────────┐  ┌─────────────┐  │
│  │ 🍎 Manzana  │  │ 🥕 Zanahoria│  │
│  │ $9,500      │  │ $5,000      │  │
│  │ [Agregar]   │  │ [Agregar]   │  │
│  └─────────────┘  └─────────────┘  │
│                                     │
│  Carrito (2) > [Abrir]              │
└─────────────────────────────────────┘
         ↓
    Usuario hace click
    en "Finalizar Pedido"
         ↓
   ┌─────────────────────────────────────┐
   │ ¿Usuario Registrado?               │
   ├─────────────────────────────────────┤
   │                                     │
   │ NO                           SÍ    │
   │ ↓                            ↓     │
   │ [Modal Registro]    [Abrir WhatsApp]│
   └─────────────────────────────────────┘
         ↓
   ┌─────────────────────────────────────┐
   │  📋 FORMULARIO DE REGISTRO          │
   ├─────────────────────────────────────┤
   │                                     │
   │  Nombre:       [Juan García      ] │
   │  WhatsApp:     [3125551234       ] │
   │  Barrio:       [Centro           ] │
   │  Tipo Cliente: [Persona ▼]        │
   │                                     │
   │            [Registrarse]           │
   │                                     │
   └─────────────────────────────────────┘
         ↓
   Validar en servidor
         ↓
   ¿WhatsApp único?
   ├─ NO: Error "Ya registrado"
   └─ SÍ: Guardar en BD
         ↓
   Guardar en localStorage
         ↓
   Cerrar modal automático
         ↓
   Abrir WhatsApp con:
   ┌─────────────────────────────────────┐
   │ NUEVO PEDIDO - METAOFERTAS          │
   │ =========================           │
   │ Cliente: Juan García                │
   │ WhatsApp: 3125551234                │
   │ Ubicacion: Centro                   │
   │ Tipo: Persona                       │
   │ =========================           │
   │                                     │
   │ 1. Manzana Roja 1kg                 │
   │    Cantidad: 2                      │
   │    Precio: $9,500                   │
   │    Subtotal: $19,000                │
   │                                     │
   │ TOTAL: $19,000                      │
   │                                     │
   │ Por favor, confírmame disponibilidad│
   └─────────────────────────────────────┘
```

---

## Flujo Técnico

```
FRONTEND                    BACKEND                    BD (SQLite)
   ↓                          ↓                            ↓
[Página cargada]          [Node.js escuchando]
   ↓                          ↓
[Usuario agrega            [Session activa]
 productos al carrito]
   ↓
[Click: Finalizar Pedido]
   ↓
[¿isUserRegistered()?]
   ├─ localStorage.getItem('metaofertasUser')
   │
   ├─ NO → showRegisterModal()
   │          ↓
   │       [Modal visible]
   │          ↓
   │       [Usuario completa datos]
   │          ↓
   │       [Submit Formulario]
   │          ↓
   │       POST /api/users/register ──────→ [Recibir datos]
   │                                              ↓
   │                                        [Validar campos]
   │                                              ↓
   │                                        [Verificar WhatsApp único]
   │                                          ├─ Duplicado → Error 400
   │                                          └─ Único → Continuar
   │                                              ↓
   │                                        [INSERT INTO users] ──→ [Guardar usuario]
   │                                              ↓                  users table
   │                                        [Retornar userId] ←────────┐
   │       ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← 
   │       [Recibir respuesta]
   │            ↓
   │       [Guardar en localStorage]
   │            ↓
   │       [closeRegisterModal()]
   │            ↓
   │       Continuar con checkout
   │
   └─ SÍ → [Abrir WhatsApp API]
              ↓
           [API WhatsApp recibe]
              ↓
           [Mensaje enviado]
```

---

## Flujo de Base de Datos

```
PRIMER REGISTRO

1. Usuario A se registra:
   POST /api/users/register
   {
     "nombre": "Juan García",
     "whatsapp": "3125551234",
     "barrio": "Centro",
     "tipoCliente": "persona"
   }

2. Servidor valida y crea:
   INSERT INTO users (nombre, whatsapp, barrio, tipoCliente)
   VALUES ('Juan García', '3125551234', 'Centro', 'persona')
   
   ✅ Resultado: users.id = 1

3. Respuesta al cliente:
   {
     "id": 1,
     "message": "Usuario registrado exitosamente"
   }

4. Cliente guarda en localStorage:
   metaofertasUser = {
     "id": 1,
     "nombre": "Juan García",
     "whatsapp": "3125551234",
     "barrio": "Centro",
     "tipoCliente": "persona"
   }


CREAR PEDIDO

5. Usuario hace checkout:
   POST /api/orders
   {
     "userId": 1,  ← ← ← De localStorage
     "items": [...]
   }

6. Servidor valida usuario:
   SELECT * FROM users WHERE id = 1
   ✅ Encontrado → Continuar

7. Crear pedido vinculado:
   INSERT INTO orders (orderNumber, userId, totalAmount, items, status)
   VALUES ('ORD-ABC123', 1, 25000, '[...]', 'pending')
   
   ✅ Resultado: orders.id = 1

8. BD ahora contiene:
   users
   ├─ id: 1
   ├─ nombre: Juan García
   ├─ whatsapp: 3125551234
   └─ ...
   
   orders
   ├─ id: 1
   ├─ userId: 1 ← Vinculado
   ├─ items: [...]
   └─ ...


PRÓXIMO REGISTRO DEL MISMO USUARIO

9. Usuario B intenta registrarse con mismo WhatsApp:
   POST /api/users/register
   {
     "whatsapp": "3125551234"  ← Mismo que Usuario A
   }

10. Servidor verifica:
    SELECT * FROM users WHERE whatsapp = '3125551234'
    ✅ Encontrado (Usuario A)

11. Respuesta al cliente:
    {
      "error": "Este número de WhatsApp ya está registrado",
      "userId": 1  ← Opción de usar cuenta existente
    }

12. Cliente puede optar por usar cuenta existente
```

---

## Secuencia Temporal

```
TIEMPO    FRONTEND                SERVIDOR                BD

T0        [App iniciada]
          └─ loadUserFromStorage()

T1        [Productos visibles]    [Esperando requests]

T2        [Usuario agrega items]

T3        [Click: Finalizar]
          └─ isUserRegistered()?
             NO

T4        └─ showRegisterModal()
             [Modal abierto]

T5        [Usuario completa
           formulario]

T6        [Submit forma]          
          └─ POST /register ─────→ [Recibido]

T7                                └─ Validar
                                   └─ Verificar WhatsApp ─→ [Query BD]
                                                           ✅ Único

T8                                └─ INSERT users ─────→ [Guardar]
                                                         ✅ Guardado
                                                         (id = 1)

T9                                └─ Respuesta JSON ←
          ← ← Recibida
          └─ localStorage.setItem()
             ✅ Guardado en navegador

T10       [Modal cerrado]
          └─ Abrir WhatsApp

T11       [WhatsApp abierto
           con mensaje]

T12       [Usuario envía en WA]

T13                                [Pedido vía WA]
                                   [Admin recibe en WA]
```

---

## Estados del Usuario

```
┌──────────────────────────────────┐
│  ESTADO 1: No Registrado         │
├──────────────────────────────────┤
│ localStorage: null               │
│ Comportamiento:                  │
│ - NO puede hacer checkout        │
│ - Ve modal de registro al intentar
│ - Debe completar formulario      │
└──────────────────────────────────┘
         ↓
    [Registrarse]
         ↓
┌──────────────────────────────────┐
│  ESTADO 2: Registrado (Sesión)   │
├──────────────────────────────────┤
│ localStorage: userId + datos     │
│ Comportamiento:                  │
│ - PUEDE hacer checkout           │
│ - No ve modal de registro        │
│ - Datos se incluyen en pedido    │
└──────────────────────────────────┘
         ↓
    [F5: Recarga página]
    [Cerrar navegador]
    [Limpiar localStorage]
         ↓
┌──────────────────────────────────┐
│  ESTADO 3: Registrado (BD)       │
├──────────────────────────────────┤
│ BD: users table                  │
│ localStorage: null (perdió sesión)
│ Comportamiento:                  │
│ - Debe registrarse nuevamente    │
│ - Pero WhatsApp ya existe en BD  │
│ - Opción: usar cuenta existente  │
└──────────────────────────────────┘
```

---

## Manejo de Errores

```
ERRORES VALIDACIÓN

Nombre vacío
  ├─ Cliente: Validación local
  └─ Servidor: Error 400 "El nombre es requerido"

WhatsApp vacío
  ├─ Cliente: Validación local
  └─ Servidor: Error 400 "El número de WhatsApp es requerido"

Barrio vacío
  ├─ Cliente: Validación local
  └─ Servidor: Error 400 "El barrio es requerido"

Tipo no seleccionado
  ├─ Cliente: HTML5 required
  └─ Servidor: Error 400 "El tipo debe ser persona o tienda"

WhatsApp duplicado
  ├─ Cliente: No puede validar (depende del servidor)
  └─ Servidor: Error 400 + userId (opción de usar existente)

Conexión perdida
  ├─ Cliente: Error "Error de conexión"
  └─ Servidor: No disponible
```

---

Este diagrama ayuda a visualizar cómo los diferentes componentes interactúan
en el sistema de registro de usuarios de MetaOfertas.
