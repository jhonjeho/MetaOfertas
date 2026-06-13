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
