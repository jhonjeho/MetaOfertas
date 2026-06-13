/**
 * ============================================
 * IMAGE OPTIMIZER & UPLOADER MODULE
 * Comprime imágenes y las sube a Firebase Storage
 * Optimizado para móviles y conexiones lentas
 * ============================================
 */

/**
 * Comprime una imagen mediante Canvas y la sube a Firebase Storage.
 * 
 * @param {File} imageFile - Archivo de imagen del input type="file"
 * @param {string} uploadPath - Ruta en Storage (ej: 'products/product-1234')
 * @param {Function} onProgress - Callback para progreso (recibe % 0-100)
 * @returns {Promise<string>} URL pública de la imagen comprimida
 */
async function compressAndUploadImage(imageFile, uploadPath, onProgress = null) {
    try {
        // ── 1. VALIDAR ARCHIVO ──────────────────────────────────
        if (!imageFile || !imageFile.type.startsWith('image/')) {
            throw new Error('El archivo debe ser una imagen válida');
        }

        // ── 2. CREAR OBJECT URL PARA ACCESO DIRECTO ──────────────
        const objectURL = URL.createObjectURL(imageFile);
        console.log(`[ImageOptimizer] Imagen original: ${(imageFile.size / 1024 / 1024).toFixed(2)} MB`);

        // ── 3. COMPRIMIR USANDO CANVAS ──────────────────────────
        const compressedBlob = await compressImageViaCanvas(objectURL);
        console.log(`[ImageOptimizer] Imagen comprimida: ${(compressedBlob.size / 1024).toFixed(2)} KB`);

        // Liberar object URL después de usar
        URL.revokeObjectURL(objectURL);

        // ── 4. VALIDAR TAMAÑO ───────────────────────────────────
        const MAX_SIZE_MB = 5; // Límite máximo en MB
        if (compressedBlob.size > MAX_SIZE_MB * 1024 * 1024) {
            throw new Error(`La imagen comprimida aún pesa más de ${MAX_SIZE_MB}MB`);
        }

        // ── 5. SUBIR A FIREBASE STORAGE ──────────────────────────
        const downloadURL = await uploadBlobToFirebaseStorage(
            compressedBlob,
            uploadPath,
            onProgress
        );

        return downloadURL;

    } catch (error) {
        console.error('[ImageOptimizer] Error:', error.message);
        throw error;
    }
}

/**
 * Lee un archivo como Data URL (DEPRECATED - usar URL.createObjectURL en su lugar).
 * @private
 */
function readImageAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = () => reject(new Error('Error al leer el archivo'));
        reader.readAsDataURL(file);
    });
}

/**
 * Comprime una imagen usando Canvas.
 * - Redimensiona a máximo 1080px de ancho
 * - Comprime a JPEG con 80% de calidad
 * @private
 */
function compressImageViaCanvas(dataURL) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        
        img.onload = () => {
            try {
                // ── CALCULAR NUEVAS DIMENSIONES ──────────────────
                const MAX_WIDTH = 1080;
                const MAX_HEIGHT = 1080;
                let width = img.width;
                let height = img.height;

                // Mantener proporción
                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height = Math.round((height * MAX_WIDTH) / width);
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width = Math.round((width * MAX_HEIGHT) / height);
                        height = MAX_HEIGHT;
                    }
                }

                // ── CREAR CANVAS INVISIBLE ──────────────────────
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d', { alpha: true });
                if (!ctx) {
                    throw new Error('No se pudo obtener el contexto del canvas');
                }

                // ── DIBUJAR IMAGEN REDIMENSIONADA ──────────────
                ctx.fillStyle = '#ffffff'; // Fondo blanco
                ctx.fillRect(0, 0, width, height);
                ctx.drawImage(img, 0, 0, width, height);

                // ── CONVERTIR A BLOB JPEG CON 80% CALIDAD ───────
                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            reject(new Error('Error al comprimir imagen'));
                            return;
                        }
                        resolve(blob);
                    },
                    'image/jpeg',
                    0.8 // 80% de calidad
                );

            } catch (error) {
                reject(error);
            }
        };

        img.onerror = () => {
            reject(new Error('Error al cargar la imagen'));
        };

        img.src = dataURL;
    });
}

/**
 * Sube un Blob a Firebase Storage.
 * @private
 */
function uploadBlobToFirebaseStorage(blob, uploadPath, onProgress) {
    return new Promise((resolve, reject) => {
        try {
            // ── VERIFICAR FIREBASE STORAGE ──────────────────────
            if (typeof firebase === 'undefined' || !firebase.storage) {
                throw new Error('Firebase Storage no está disponible');
            }

            const storage = firebase.storage();
            const ref = storage.ref(`images/${uploadPath}`);

            // ── CREAR TAREA DE CARGA CON PROGRESO ───────────────
            const uploadTask = ref.put(blob, {
                contentType: 'image/jpeg'
            });

            // ── ESCUCHAR PROGRESO ───────────────────────────────
            uploadTask.on(
                'state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    console.log(`[ImageOptimizer] Progreso: ${progress.toFixed(2)}%`);
                    if (onProgress && typeof onProgress === 'function') {
                        onProgress(progress);
                    }
                },
                (error) => {
                    console.error('[ImageOptimizer] Error de carga:', error);
                    reject(new Error(`Error al subir: ${error.message}`));
                },
                async () => {
                    try {
                        // ── OBTENER URL PÚBLICA ─────────────────
                        const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();
                        console.log(`[ImageOptimizer] URL pública: ${downloadURL}`);
                        resolve(downloadURL);
                    } catch (error) {
                        reject(new Error(`Error al obtener URL: ${error.message}`));
                    }
                }
            );

        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Valida si un archivo es una imagen soportada.
 * @param {File} file - Archivo a validar
 * @returns {boolean}
 */
function isValidImageFile(file) {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const maxSize = 20 * 1024 * 1024; // 20 MB
    
    return file && validTypes.includes(file.type) && file.size <= maxSize;
}

/**
 * Obtiene un ID único para la imagen (basado en timestamp).
 * @returns {string}
 */
function generateImageId() {
    return `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
