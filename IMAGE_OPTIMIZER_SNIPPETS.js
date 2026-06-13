/**
 * ============================================
 * SNIPPETS DE IMPLEMENTACIÓN RÁPIDA
 * Image Optimizer - MetaOfertas
 * ============================================
 */

// ────────────────────────────────────────────────
// SNIPPET 1: Uso Básico en Formulario
// ────────────────────────────────────────────────

/*
HTML:
<input type="file" id="productImage" accept="image/*">
<button onclick="handleImageUpload()">Subir Imagen</button>
*/

async function handleImageUpload() {
    const fileInput = document.getElementById('productImage');
    const file = fileInput.files[0];
    
    if (!file) {
        alert('Selecciona una imagen');
        return;
    }
    
    try {
        // Comprimir y subir
        const imageURL = await compressAndUploadImage(
            file,
            'my-product'  // ID único o ruta
        );
        
        console.log('Imagen subida:', imageURL);
        alert('✅ Imagen subida exitosamente');
        
    } catch (error) {
        alert(`❌ Error: ${error.message}`);
    }
}


// ────────────────────────────────────────────────
// SNIPPET 2: Con Barra de Progreso
// ────────────────────────────────────────────────

/*
HTML:
<div id="progressContainer" style="display:none;">
    <div id="progressBar" style="width:0%; height:4px; background:#4ade80;"></div>
    <p id="progressText">0%</p>
</div>
<button onclick="uploadWithProgress()">Subir</button>
*/

async function uploadWithProgress() {
    const file = document.getElementById('productImage').files[0];
    const progressContainer = document.getElementById('progressContainer');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    
    progressContainer.style.display = 'block';
    
    try {
        const imageURL = await compressAndUploadImage(
            file,
            'products/' + Date.now(),
            (progress) => {
                // Actualizar barra
                progressBar.style.width = `${progress}%`;
                progressText.textContent = `${Math.round(progress)}%`;
            }
        );
        
        progressText.textContent = '✅ Completado';
        console.log('URL:', imageURL);
        
    } catch (error) {
        progressText.textContent = `❌ Error: ${error.message}`;
    }
}


// ────────────────────────────────────────────────
// SNIPPET 3: Múltiples Imágenes
// ────────────────────────────────────────────────

async function uploadMultipleImages() {
    const files = document.getElementById('galleryInput').files;
    const imageURLs = [];
    
    for (let i = 0; i < files.length; i++) {
        try {
            console.log(`Subiendo imagen ${i + 1}/${files.length}...`);
            
            const url = await compressAndUploadImage(
                files[i],
                `gallery/image-${i}`
            );
            
            imageURLs.push(url);
            console.log(`✅ Imagen ${i + 1} lista`);
            
        } catch (error) {
            console.error(`❌ Error en imagen ${i + 1}:`, error);
        }
    }
    
    return imageURLs;
}


// ────────────────────────────────────────────────
// SNIPPET 4: Validación Previa + Upload
// ────────────────────────────────────────────────

async function safeImageUpload(file) {
    // Validar tipo
    if (!isValidImageFile(file)) {
        throw new Error(
            '❌ Archivo inválido. Acepta: JPEG, PNG, WebP, GIF (máx 20MB)'
        );
    }
    
    // Validar nombre
    if (file.name.length > 100) {
        throw new Error('Nombre de archivo muy largo (máx 100 caracteres)');
    }
    
    // Mostrar información
    const sizeMB = (file.size / 1024 / 1024).toFixed(2);
    console.log(`📸 Imagen: ${file.name} (${sizeMB}MB)`);
    
    // Generar ruta única
    const uniqueId = generateImageId();
    
    // Subir
    return compressAndUploadImage(file, uniqueId);
}


// ────────────────────────────────────────────────
// SNIPPET 5: Preview + Upload
// ────────────────────────────────────────────────

function setupImagePreviewWithUpload() {
    const fileInput = document.getElementById('imageInput');
    const preview = document.getElementById('imagePreview');
    const uploadBtn = document.getElementById('uploadBtn');
    
    // Mostrar preview cuando seleccione archivo
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        
        if (!file) return;
        
        // Crear URL de preview (sin comprimir)
        const reader = new FileReader();
        reader.onload = (event) => {
            preview.src = event.target.result;
            preview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    });
    
    // Upload al hacer clic
    uploadBtn.addEventListener('click', async () => {
        const file = fileInput.files[0];
        
        if (!file) {
            alert('Selecciona una imagen');
            return;
        }
        
        uploadBtn.disabled = true;
        uploadBtn.textContent = '⏳ Subiendo...';
        
        try {
            const imageURL = await compressAndUploadImage(file, 'my-image');
            console.log('URL:', imageURL);
            uploadBtn.textContent = '✅ Listo';
        } catch (error) {
            alert(`Error: ${error.message}`);
            uploadBtn.textContent = '❌ Error';
        } finally {
            uploadBtn.disabled = false;
        }
    });
}


// ────────────────────────────────────────────────
// SNIPPET 6: Drag & Drop Upload
// ────────────────────────────────────────────────

function setupDragDropUpload(dropZoneId) {
    const dropZone = document.getElementById(dropZoneId);
    
    // Prevenir comportamiento por defecto
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
        });
    });
    
    // Visual feedback
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.style.background = 'rgba(74, 222, 128, 0.1)';
        });
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.style.background = '';
        });
    });
    
    // Handle drop
    dropZone.addEventListener('drop', async (e) => {
        const files = e.dataTransfer.files;
        
        for (let file of files) {
            if (file.type.startsWith('image/')) {
                try {
                    const url = await compressAndUploadImage(file, 'dragged-' + Date.now());
                    console.log('Imagen subida:', url);
                } catch (error) {
                    console.error('Error:', error.message);
                }
            }
        }
    });
}

// Usar: setupDragDropUpload('myDropZone')


// ────────────────────────────────────────────────
// SNIPPET 7: Integration con Firestore
// ────────────────────────────────────────────────

async function createProductWithImage(title, price, file) {
    // 1. Subir imagen
    const imageURL = await compressAndUploadImage(
        file,
        `products/${title.replace(/\s+/g, '-')}`
    );
    
    // 2. Crear documento en Firestore
    const product = {
        title,
        price,
        image: imageURL,  // URL pública de Firebase Storage
        createdAt: new Date()
    };
    
    // 3. Guardar en Firestore (ejemplo)
    await firebase.firestore()
        .collection('products')
        .add(product);
    
    console.log('✅ Producto creado con imagen');
    return product;
}


// ────────────────────────────────────────────────
// SNIPPET 8: Retry Logic (si falla la carga)
// ────────────────────────────────────────────────

async function uploadWithRetry(file, maxRetries = 3) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`Intento ${attempt}/${maxRetries}...`);
            return await compressAndUploadImage(
                file,
                `retryable/${Date.now()}`
            );
        } catch (error) {
            lastError = error;
            console.warn(`Intento ${attempt} falló:`, error.message);
            
            // Esperar antes de reintentar
            if (attempt < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
    }
    
    throw new Error(
        `Falló después de ${maxRetries} intentos: ${lastError.message}`
    );
}


// ────────────────────────────────────────────────
// SNIPPET 9: Monitorear Tamaño Final
// ────────────────────────────────────────────────

async function uploadAndLogStats(file) {
    const originalSizeMB = (file.size / 1024 / 1024).toFixed(2);
    
    const imageURL = await compressAndUploadImage(
        file,
        'stats-' + Date.now(),
        (progress) => {
            if (progress === 100) {
                console.log('📊 ESTADÍSTICAS:');
                console.log(`  Original: ${originalSizeMB}MB`);
                console.log(`  Tipo: ${file.type}`);
                console.log(`  URL: ${imageURL}`);
            }
        }
    );
    
    return imageURL;
}


// ────────────────────────────────────────────────
// SNIPPET 10: Error Handler Mejorado
// ────────────────────────────────────────────────

async function uploadWithErrorHandling(file) {
    try {
        // Validar
        if (!isValidImageFile(file)) {
            throw new Error('Tipo o tamaño de archivo no válido');
        }
        
        // Subir
        const imageURL = await compressAndUploadImage(file, 'safe-' + Date.now());
        return imageURL;
        
    } catch (error) {
        // Parsear error
        const errorMsg = error.message || 'Error desconocido';
        
        // Log para debugging
        console.error('❌ Error de carga:', {
            message: errorMsg,
            file: file.name,
            size: file.size,
            type: file.type,
            timestamp: new Date().toISOString()
        });
        
        // UI amigable
        if (errorMsg.includes('Firebase')) {
            alert('❌ Error en el servidor. Intenta en unos momentos');
        } else if (errorMsg.includes('no válido')) {
            alert('❌ Imagen no válida. Verifica formato y tamaño');
        } else {
            alert(`❌ Error: ${errorMsg}`);
        }
        
        throw error;
    }
}

// ────────────────────────────────────────────────
// FIN DE SNIPPETS
// ────────────────────────────────────────────────
