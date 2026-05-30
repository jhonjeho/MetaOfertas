# ⚙️ Instrucciones de Instalación - Sistema de Registro

## Requisitos Previos

- Node.js ≥ 14.x (Descargar: https://nodejs.org/)
- npm ≥ 6.x (Incluido con Node.js)
- Git (Opcional, para clonar repositorio)

## Instalación Paso a Paso

### 1. Preparar directorio del proyecto

```bash
# Navega a la carpeta del proyecto
cd c:\Users\USUARIO\OneDrive\Documents\MetaOfertas

# O si descargaste un archivo comprimido
unzip metaofertasAPI.zip
cd metaofertasAPI
```

### 2. Instalar dependencias

```bash
npm install
```

Este comando instala todos los paquetes necesarios:
- `express` - Framework web
- `sqlite3` - Base de datos
- `cors` - Seguridad
- `body-parser` - Parseo de JSON
- `dotenv` - Variables de entorno

### 3. Verificar instalación

```bash
npm --version
node --version

# Debería mostrar las versiones instaladas
```

### 4. Iniciar el servidor

#### Opción A: Desarrollo (con auto-reload)
```bash
npm run dev
```

#### Opción B: Producción (simple)
```bash
npm start
```

#### Opción C: Windows (archivo .bat)
```bash
# Doble-clic en: run-server.bat
```

#### Opción D: Linux/Mac
```bash
./run-server.sh
```

### 5. Verificar que funciona

```bash
# En otra terminal, prueba:
curl http://localhost:3001/api/health

# Debería retornar:
# {"status":"OK","message":"MetaOfertas API está funcionando ✅"}
```

### 6. Abrir en navegador

Visita: http://localhost:3001

Debería cargar la página con:
- ✅ Productos en la tienda
- ✅ Carrito funcional
- ✅ Modal de registro (al hacer checkout)

---

## Estructura de Carpetas

```
MetaOfertas/
├── routes/
│   ├── admin.js           (Rutas admin)
│   ├── cart.js            (Carrito)
│   ├── orders.js          (Pedidos) ← MODIFICADO
│   ├── products.js        (Productos)
│   └── users.js           (Usuarios) ← NUEVO
│
├── app.js                 (Frontend lógica) ← MODIFICADO
├── database.js            (BD) ← MODIFICADO
├── server.js              (Servidor) ← MODIFICADO
├── register.js            (Registro) ← NUEVO
│
├── index.html             (Frontend) ← MODIFICADO
├── admin.html             (Panel admin)
├── styles.css             (Estilos) ← MODIFICADO
├── styles-admin.css       (Admin estilos)
│
├── package.json           (Dependencias)
├── database.db            (BD SQLite - se crea automáticamente)
│
├── REGISTRATION_SETUP.md  ← NUEVA DOCUMENTACIÓN
├── QUICK_START.md         ← NUEVA DOCUMENTACIÓN
├── FLOW_DIAGRAM.md        ← NUEVA DOCUMENTACIÓN
└── IMPLEMENTATION_SUMMARY.md ← NUEVA DOCUMENTACIÓN
```

---

## Archivos de Configuración

### `.env` (Opcional)
```bash
# Puerto del servidor
PORT=3001

# Ruta de base de datos
DB_PATH=./database.db

# Contraseña de admin
ADMIN_PASSWORD=admin123
```

### `package.json`
```json
{
  "name": "metaofertasapi",
  "version": "1.0.0",
  "scripts": {
    "start": "node server.js",
    "dev": "node --watch server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "sqlite3": "^5.1.6",
    "cors": "^2.8.5",
    "body-parser": "^1.20.2",
    "dotenv": "^16.3.1"
  }
}
```

---

## Solución de Problemas

### Error: "npm: comando no encontrado"
```bash
# Solución: Instalar Node.js desde https://nodejs.org/
# Reinicia el terminal después de instalar
```

### Error: "Port 3001 in use"
```bash
# Opción 1: Cambiar puerto en .env
PORT=3002

# Opción 2: Matar proceso en puerto 3001
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :3001
kill -9 <PID>
```

### Error: "Cannot find module 'express'"
```bash
# Solución: Instalar dependencias
npm install
```

### Error: "database.db locked"
```bash
# Causa: Otro proceso accede a la BD
# Solución:
# 1. Cierra otras instancias del servidor
# 2. Borra database.db y reinicia (perderá datos)
# rm database.db  # Linux/Mac
```

### Error: "CORS error" en navegador
```bash
# Ya está configurado en server.js
# Si persiste, verifica que CORS esté habilitado:
app.use(cors());
```

### Modal de registro no aparece
```bash
# Verifica que register.js está cargado
# En index.html debe estar:
<script src="register.js"></script>

# Y debe estar después de app.js:
<script src="app.js"></script>
<script src="register.js"></script>
```

---

## Pruebas Post-Instalación

### Test 1: Backend funciona
```bash
curl http://localhost:3001/api/health
# Esperado: {"status":"OK"...}
```

### Test 2: Obtener productos
```bash
curl http://localhost:3001/api/products
# Esperado: Array de productos JSON
```

### Test 3: Registrar usuario
```bash
curl -X POST http://localhost:3001/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Juan",
    "whatsapp": "3125551234",
    "barrio": "Centro",
    "tipoCliente": "persona"
  }'

# Esperado: {"id": 1, "message": "Usuario registrado exitosamente"}
```

### Test 4: Frontend carga
```
Abrir en navegador: http://localhost:3001
Esperado:
- Navbar con logo
- Hero section
- Productos visibles
- Carrito funcional
- Modal de registro al hacer checkout sin registrarse
```

---

## Características Principales

✅ **Registro de usuarios**
- Nombre, WhatsApp, Barrio, Tipo de cliente
- WhatsApp único (no duplicados)

✅ **Carrito de compras**
- Agregar/quitar productos
- Actualizar cantidades
- Total calculado

✅ **Pedidos por WhatsApp**
- Integración con API de WhatsApp
- Datos del cliente incluidos
- Mensaje formateado

✅ **Panel de admin**
- Contraseña: admin123
- Gestionar productos
- Ver pedidos

✅ **Base de datos**
- SQLite local
- Tablas: products, users, orders, cartItems
- Relaciones: orders.userId → users.id

---

## Pasos para Actualizar

Si ya tenías el proyecto, para actualizar con el sistema de registro:

1. Actualizar archivos modificados:
   ```bash
   # Reemplazar: database.js, server.js, app.js, index.html, styles.css
   # Reemplazar: routes/orders.js
   ```

2. Agregar archivos nuevos:
   ```bash
   # Copiar: routes/users.js, register.js
   # Copiar: REGISTRATION_SETUP.md, etc.
   ```

3. Reiniciar servidor:
   ```bash
   npm run dev
   ```

4. Limpiar BD (si hay problemas):
   ```bash
   # Eliminar database.db (se recreará automáticamente)
   # Los productos demo se volverán a cargar
   ```

---

## Variables de Entorno

Crea archivo `.env` en la raíz del proyecto:

```bash
# Puerto (default: 3001)
PORT=3001

# Base de datos (default: ./database.db)
DB_PATH=./database.db

# Contraseña admin (default: admin123)
ADMIN_PASSWORD=admin123

# Modo (development o production)
NODE_ENV=development
```

---

## Docker (Opcional)

Si quieres usar Docker:

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

EXPOSE 3001
CMD ["npm", "start"]
```

Ejecutar:
```bash
docker build -t metaofertasapi .
docker run -p 3001:3001 metaofertasapi
```

---

## Seguridad

⚠️ **Para Producción:**

1. Cambiar contraseña admin
   ```bash
   # En .env:
   ADMIN_PASSWORD=tuContraseñaSuperSegura123!
   ```

2. Usar HTTPS
   ```bash
   # Usar reverse proxy (nginx, Apache)
   # O certificado SSL
   ```

3. Validar inputs
   ```javascript
   // Ya está implementado en routes/users.js
   // Pero puedes agregar más validaciones
   ```

4. Rate limiting
   ```bash
   npm install express-rate-limit
   ```

5. Autenticación tokens
   ```bash
   npm install jsonwebtoken bcrypt
   ```

---

## Monitoreo

```bash
# Ver logs en tiempo real
npm run dev

# Ver procesos Node activos
ps aux | grep node

# Ver memoria usada
node --expose-gc script.js
```

---

## Contacto y Soporte

Para problemas o preguntas:

1. Revisa `REGISTRATION_SETUP.md` - Documentación técnica
2. Revisa `QUICK_START.md` - Guía rápida
3. Revisa `FLOW_DIAGRAM.md` - Diagramas del flujo
4. Revisa logs del servidor - Errores específicos

---

**¡Listo para usar!** 🚀

Accede a http://localhost:3001 y comienza a usar MetaOfertas con el nuevo sistema de registro.
