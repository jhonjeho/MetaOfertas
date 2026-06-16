# 🚀 MetaOfertas - Plataforma de Ofertas Diarias

Una aplicación web moderna para vender productos en oferta que se actualizan diariamente. Incluye una vista pública para clientes y un panel de administrador optimizado para móvil.

**💰 Moneda:** Peso Colombiano (COP) 🇨🇴

## 📋 Estructura del Proyecto

```
MetaOfertas/
├── index.html           # Vista del usuario (catálogo de ofertas)
├── admin.html           # Panel del administrador
├── styles.css           # Estilos de la vista principal
├── styles-admin.css     # Estilos del panel admin
├── app.js               # Lógica principal (LocalStorage, gestión de productos)
├── admin.js             # Lógica del panel administrador
└── README.md            # Este archivo
```

## ✨ Características Implementadas

### Vista de Usuario (index.html)
- ✅ Catálogo moderno y atractivo con colores vibrantes (naranja, azul, rojo)
- ✅ Grid responsivo de productos con ofertas
- ✅ Precios en Peso Colombiano (COP) 🇨🇴
- ✅ Visualización de descuentos en porcentaje
- ✅ Filtros por categoría de supermercado
- ✅ Navegación sticky con fecha actual
- ✅ Botón flotante para acceder al panel admin (acceso secreto)
- ✅ Modal de autenticación con contraseña
- ✅ Diseño completamente responsivo

### Panel del Administrador (admin.html)
- ✅ Interfaz optimizada para celular y escritorio
- ✅ Formulario para crear nuevos productos con:
  - Subida de fotos
  - Emoji alternativo
  - Título del producto
  - Categoría
  - Precio original y de oferta
  - Cálculo automático de descuento
- ✅ Lista de productos con vista previa
- ✅ Editar productos
- ✅ Eliminar productos
- ✅ Búsqueda/filtrado de productos
- ✅ Modal para editar productos

### Almacenamiento (LocalStorage)
- ✅ Persistencia de datos sin base de datos
- ✅ Sincronización en tiempo real entre vistas
- ✅ Carga de 6 productos de demostración al iniciar

## 🔐 Credenciales de Acceso

**Contraseña del Panel Admin:** `admin123`

Para acceder:
1. Haz clic en el botón flotante 👤 (esquina inferior derecha)
2. Ingresa la contraseña: `admin123`
3. ¡Listo!

## 🎨 Colores y Diseño

- **Primario (Naranja):** #FF6B35 - Llamativo y atractivo
- **Secundario (Naranja Oscuro):** #F7931E - Énfasis
- **Acento (Azul):** #004E89 - Profesionalidad
- **Peligro (Rojo):** #E63946 - Energía y ofertas
- **Éxito (Verde):** #06A77D - Ahorros

## 🚀 Fase 2 - Backend Implementado ✅

### ✅ Backend con Node.js + Express
- ✅ API REST profesional con 15+ endpoints
- ✅ SQLite para persistencia de datos
- ✅ Autenticación de administrador
- ✅ CORS habilitado

### ✅ Funciones Implementadas
- ✅ CRUD completo de productos
- ✅ Sistema de carrito de compras
- ✅ Gestión de pedidos
- ✅ Dashboard administrativo
- ✅ Estadísticas de ventas

### 📚 Ver Documentación
- [API_DOCUMENTATION.md](API_DOCUMENTATION.md) - Documentación completa de endpoints
- [BACKEND_SETUP.md](BACKEND_SETUP.md) - Instrucciones de instalación y uso

### 🚀 Próximos Pasos (Fase 3)

1. **Conectar Frontend a API**
   - Actualizar app.js para usar fetch
   - Reemplazar LocalStorage por API calls

2. **Mejoras de Seguridad**
   - JWT en lugar de contraseña en headers
   - Rate limiting
   - Validaciones avanzadas

3. **Pagos Integrados**
   - Stripe o PayPal
   - Procesamiento de transacciones

4. **Optimizaciones**
   - Compresión de imágenes
   - Caché de productos
   - Notificaciones en tiempo real

## 💻 Cómo Usar

### Para Clientes (Vista Pública)
1. Abre `index.html` en tu navegador
2. Explora los productos en oferta
3. Usa los filtros para categorizar productos
4. Haz clic en "Añadir al Carrito"

### Para Administrador
1. Haz clic en el botón 👤 (esquina inferior derecha)
2. Ingresa: `admin123`
3. Sube fotos, configura precios y crea ofertas
4. Los cambios se guardan automáticamente en LocalStorage

## 📱 Compatibilidad

- ✅ Responsive en móvil, tablet y desktop
- ✅ Compatible con navegadores modernos (Chrome, Firefox, Safari, Edge)
- ✅ No requiere instalación ni servidor

## 📝 Notas Técnicas

- Usa **Vanilla JavaScript** (sin frameworks)
- **LocalStorage** para persistencia de datos
- **CSS Grid + Flexbox** para layouts responsivos
- Animaciones suaves con CSS transitions
- Compresión de imágenes con FileReader API

---

**Versión:** 1.0 - Fase inicial (Frontend + LocalStorage)
**Fecha:** Mayo 2026
**Empresa:** MetaOfertas

## 📦 Sistema de Inventario (Panel Admin)

Se ha añadido soporte básico de inventario para los productos. Cambios relevantes:

- Se agrega el campo `Stock (unidades)` en el formulario de creación y edición de productos en el panel administrador (`admin.html`).
- Campo HTML: `productStock` y `editProductStock`.
- El campo se guarda como `quantity` en los documentos de la colección `productos` en Firestore (o en LocalStorage como fallback).
- En la tienda pública, los productos con `quantity` igual a `0` se muestran como "Agotado" y no pueden añadirse al carrito.

Uso desde el Panel Admin:

1. Abre `admin.html` y autentícate como administrador.
2. Al crear o editar un producto, completa el campo "Stock (unidades)".
3. Puedes ajustar el stock rápidamente desde la lista de productos usando los botones ➕/➖.

Reglas y seguridad recomendadas (Firestore):

- Incluye el archivo `firestore.rules` en tu despliegue de Firebase para validar `quantity >= 0` y restringir escrituras a administradores con el claim `admin=true`.
- Para asignar el claim `admin` a un usuario, usa la consola de Firebase Admin SDK en tu servidor backend.

Ejemplo de despliegue de reglas:

1. Guarda `firestore.rules` en el directorio del proyecto.
2. Ejecuta:

```bash
firebase deploy --only firestore:rules
```

Pruebas básicas incluidas:

- `tests/inventory.test.js` comprueba que los campos `productStock` y `editProductStock` existen y que `admin.js` contiene la función `changeProductStock`.
- Ejecuta las pruebas con:

Si quieres, puedo añadir endpoints REST para gestionar inventario desde el backend, o proteger `quantity` con validaciones adicionales en el servidor. Dime qué prefieres.

### Importar inventario por CSV

El panel admin ahora soporta importar stock masivo desde un CSV. Formato esperado:

- `id,quantity` (ej: `12,30`) — usa `id` de la tabla `products` en SQLite
- o `title,quantity` (ej: `Manzana Roja Seleccionada (1kg),25`) — intentará buscar por título

Pasos rápidos:

1. Abre `admin.html` → pestaña `Productos` → sección "Importar stock (CSV)".
2. Selecciona el archivo CSV y pulsa "Subir CSV".
3. Ingresa la contraseña admin cuando se solicite para aplicar los cambios.

El proceso actualizará `quantity` de los productos y mostrará un resumen al finalizar.
```bash
npm run test:inventory
```

Si quieres, puedo añadir endpoints REST para gestionar inventario desde el backend, o proteger `quantity` con validaciones adicionales en el servidor. Dime qué prefieres.
