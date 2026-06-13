# 📸 Image Optimizer Module - Documentación

## Descripción General

El módulo **Image Optimizer** (`image-optimizer.js`) proporciona funcionalidad optimizada para comprimir imágenes en navegadores web (especialmente móviles) y subirlas a Firebase Storage de manera eficiente.

### Problema Resuelto

- ❌ **Antes**: Imágenes de cámara (5-15MB) saturaban la memoria del navegador y causaban fallos de carga
- ✅ **Después**: Imágenes comprimidas a ~300KB sin perder calidad visual notable

---

## Características Principales

### 1. **Compresión Automática con Canvas**
- Redimensiona automáticamente a máximo **1080px de ancho**
- Mantiene la proporción de aspecto original
- Comprime a formato JPEG con **80% de calidad**
- Resultado final: ~300KB por imagen

### 2. **Carga Progresiva a Firebase Storage**
- Usa `uploadBytesResumable()` para carga con progreso
- Reporta porcentaje de carga (0-100%)
- Retorna URL pública descargable

### 3. **Optimización para Móviles**
- Canvas invisible (no consume espacio en DOM)
- Procesamiento eficiente de memoria
- Compatible con iOS, Android, Firefox, Chrome

### 4. **Manejo Robusto de Errores**
- Validación de tipos MIME
- Límites de tamaño configurable
- Mensajes de error descriptivos

---

## API

### `compressAndUploadImage(imageFile, uploadPath, onProgress)`

Función principal que comprime una imagen y la sube a Firebase Storage.

**Parámetros:**
```javascript
imageFile      {File}      - Archivo del input type="file"
uploadPath     {string}    - Ruta en Storage (ej: 'product-123')
onProgress     {Function}  - Callback para reportar progreso (opcional)
                             Recibe: progress (0-100)
```

**Retorna:**
```javascript
Promise<string>  - URL pública de la imagen comprimida
                   Ej: https://firebasestorage.googleapis.com/...
```

**Ejemplo de Uso:**
```javascript
try {
    const imageFile = document.getElementById('productImage').files[0];
    
    const imageURL = await compressAndUploadImage(
        imageFile,
        'products/product-1234',
        (progress) => {
            console.log(`Cargando: ${Math.round(progress)}%`);
            // Actualizar barra de progreso en UI
        }
    );
    
    console.log('Imagen lista:', imageURL);
    // Guardar imageURL en Firestore junto con datos del producto
    
} catch (error) {
    console.error('Error:', error.message);
    alert(error.message);
}
```

---

### `isValidImageFile(file)`

Valida si un archivo es una imagen soportada y está dentro del límite de tamaño.

**Parámetros:**
```javascript
file  {File}  - Archivo a validar
```

**Retorna:**
```javascript
boolean  - true si es válido, false si no
```

**Tipos Soportados:**
- `image/jpeg` (JPG)
- `image/png` (PNG)
- `image/webp` (WebP)
- `image/gif` (GIF)

**Límite de Tamaño:** 20MB (configurable en la función)

**Ejemplo:**
```javascript
const file = document.getElementById('fileInput').files[0];

if (!isValidImageFile(file)) {
    alert('❌ Imagen no válida. Usa JPEG, PNG, WebP o GIF (máx 20MB)');
    return;
}

// Proceder con compresión
```

---

### `generateImageId()`

Genera un ID único para la imagen basado en timestamp.

**Retorna:**
```javascript
string  - ID único (ej: 'img-1686234567890-a1b2c3d4e')
```

**Ejemplo:**
```javascript
const imageId = generateImageId();
const imageURL = await compressAndUploadImage(file, imageId);
```

---

## Integración en el Proyecto

### 1. **En HTML (admin.html)**

Ya está incluido en la sección de scripts:

```html
<!-- image-optimizer.js debe cargarse ANTES de admin.js -->
<script src="firebase-config.js"></script>
<script src="app.js"></script>
<script src="image-optimizer.js"></script>
<script src="firebase-auth.js"></script>
<script src="admin.js"></script>
```

### 2. **En admin.js (handleAddProduct)**

La función `handleAddProduct()` ya está optimizada para usar el módulo:

```javascript
// En handleAddProduct():
if (imageInput && imageInput.files.length > 0) {
    const imageFile = imageInput.files[0];
    
    if (!isValidImageFile(imageFile)) {
        alert('❌ Imagen no válida...');
        return;
    }
    
    // Subir con progreso
    imageURL = await compressAndUploadImage(
        imageFile,
        imageId,
        (progress) => {
            submitBtn.textContent = `⏳ Subiendo ${Math.round(progress)}%...`;
        }
    );
}

// Guardar URL pública en Firestore
const product = { 
    title, 
    originalPrice, 
    offerPrice, 
    category, 
    emoji, 
    image: imageURL  // URL de Firebase Storage
};

await addProduct(product);
```

---

## Flujo de Compresión Paso a Paso

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. USUARIO SELECCIONA IMAGEN (Ej: 10MB desde cámara)           │
└─────────────┬───────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. VALIDACIÓN                                                    │
│    - ¿Es imagen? (MIME type)                                    │
│    - ¿Peso ≤ 20MB?                                              │
└─────────────┬───────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. CREAR CANVAS INVISIBLE                                       │
│    - Calcular nuevas dimensiones (máx 1080px)                  │
│    - Mantener proporción                                        │
└─────────────┬───────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. DIBUJAR EN CANVAS                                            │
│    - Imagen redimensionada                                      │
│    - Fondo blanco                                               │
└─────────────┬───────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. CONVERTIR A BLOB JPEG (80% calidad)                          │
│    Resultado: ~300KB                                            │
└─────────────┬───────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. SUBIR A FIREBASE STORAGE                                     │
│    - uploadBytesResumable() con progreso                        │
│    - Reportar % de carga                                        │
└─────────────┬───────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 7. RETORNAR URL PÚBLICA                                         │
│    - Guardar en Firestore                                       │
│    - Mostrar en producto                                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## Configuración Avanzada

### Cambiar Dimensiones Máximas

En `image-optimizer.js`, función `compressImageViaCanvas()`:

```javascript
const MAX_WIDTH = 1080;   // Cambiar aquí
const MAX_HEIGHT = 1080;  // Cambiar aquí
```

### Cambiar Calidad de Compresión

En `image-optimizer.js`, función `compressImageViaCanvas()`:

```javascript
canvas.toBlob(
    (blob) => { ... },
    'image/jpeg',
    0.8  // Cambiar: 0.5 = 50%, 0.9 = 90%
);
```

### Cambiar Límite de Tamaño Original

En `image-optimizer.js`, función `isValidImageFile()`:

```javascript
const maxSize = 20 * 1024 * 1024;  // Cambiar aquí (en bytes)
```

---

## Ejemplos de Uso Avanzado

### Ejemplo 1: Con Validación Personalizada

```javascript
async function uploadProductImage(file) {
    // Validar
    if (!isValidImageFile(file)) {
        throw new Error('Archivo inválido');
    }
    
    // Validar nombre
    if (file.name.length > 50) {
        throw new Error('Nombre de archivo muy largo');
    }
    
    // Generar ruta
    const timestamp = Date.now();
    const path = `products/${timestamp}/main`;
    
    // Comprimir y subir
    return compressAndUploadImage(file, path);
}
```

### Ejemplo 2: Con Múltiples Imágenes

```javascript
async function uploadMultipleImages(files) {
    const urls = [];
    
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        try {
            const path = `products/multi/${i}`;
            const url = await compressAndUploadImage(
                file,
                path,
                (progress) => {
                    console.log(`Imagen ${i+1}: ${progress}%`);
                }
            );
            urls.push(url);
        } catch (error) {
            console.error(`Error en imagen ${i+1}:`, error);
        }
    }
    
    return urls;
}
```

### Ejemplo 3: Con Barra de Progreso Visual

```javascript
async function uploadWithProgressBar(file) {
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    
    const imageURL = await compressAndUploadImage(
        file,
        'my-product',
        (progress) => {
            // Actualizar barra visual
            progressBar.style.width = `${progress}%`;
            progressText.textContent = `${Math.round(progress)}%`;
            
            if (progress === 100) {
                progressText.textContent = 'Completado ✅';
            }
        }
    );
    
    return imageURL;
}
```

---

## Notas Técnicas

### Canvas y Navegadores

- ✅ Soportado en todos los navegadores modernos
- ✅ Funciona en mobile (iOS Safari, Chrome Android)
- Canvas es invisible (no afecta el DOM)
- Memoria se libera automáticamente después de uso

### Firebase Storage

- Ubicación de archivos: `images/{uploadPath}`
- Acceso público: URLs descargables sin autenticación
- Timeout de carga: Configurable en Firebase Console
- Cuota gratuita: 1GB/mes

### Validación MIME

El módulo valida tipos MIME, pero considera también:
- Algunos navegadores pueden reportar MIME incorrectamente
- Verificar extensión de archivo como respaldo en servidor

---

## Troubleshooting

### Problema: "Firebase Storage no está disponible"

**Solución:** Asegúrate de que `firebase-config.js` carga ANTES de `image-optimizer.js`:

```html
<script src="firebase-config.js"></script>
<script src="image-optimizer.js"></script>  <!-- Después -->
```

### Problema: Imágenes se cargan lentamente

**Soluciones:**
1. Reducir calidad a 70%: `0.7` en `toBlob()`
2. Reducir dimensiones: `MAX_WIDTH = 800`
3. Verificar conexión de red

### Problema: "Error al obtener URL"

**Causas comunes:**
- Permisos de Firebase Storage incorrectos
- Cuota de almacenamiento excedida
- Usuario no autenticado

**Solución:** Verificar reglas en Firebase Console

---

## Performance

### Métricas Típicas (en Mobile)

| Métrica | Tiempo |
|---------|--------|
| Leer archivo | 100-300ms |
| Comprimir | 200-800ms |
| Subir (1-5MB) | 2-10s |
| Total | 2-15s |

### Optimizaciones Aplicadas

✅ Canvas invisible (sin rendering)
✅ Blob en lugar de Data URL (menos memoria)
✅ uploadBytesResumable (reintentos automáticos)
✅ JPEG en lugar de PNG (80% menor tamaño)

---

## Licencia & Créditos

Módulo desarrollado para **MetaOfertas**
Basado en estándares HTML5 Canvas API y Firebase Storage
