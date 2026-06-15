/* ============================================================
   METAOFERTAS — CONFIGURACIÓN FIREBASE v10 (Compat CDN)
   ============================================================ */

// ── LISTA BLANCA DE ADMINISTRADORES (fallback en archivo)
// Esta lista puede sincronizarse con Firestore en tiempo de ejecución.
let ADMIN_EMAILS = [
    'jhon.jeho@gmail.com',       // ← Reemplaza con tu correo real de administrador
    'rigobertoalvarez8899@gmail.com',
    // 'admin2@gmail.com',        // ← Descomenta y agrega más correos si necesitas
];

// ── CONFIGURACIÓN DE FIREBASE ─────────────────────────────────
const firebaseConfig = {
    apiKey: "AIzaSyA05wJlR2QPaFzj7My9-oQD0Bl742y29v0",
    authDomain: "metaofertas.firebaseapp.com",
    projectId: "metaofertas",
    storageBucket: "metaofertas.firebasestorage.app",
    messagingSenderId: "883554899291",
    appId: "1:883554899291:web:6547e2fcff4109da5f367e"
};

// ── INICIALIZACIÓN ────────────────────────────────────────────
firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db   = firebase.firestore();
const googleProvider = new firebase.auth.GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Intentar cargar la lista maestra de admins desde Firestore (documento: config/admins)
// Si existe, reemplaza la lista local `ADMIN_EMAILS` por la versión almacenada.
(async function syncAdminEmailsFromFirestore(){
    try {
        const doc = await db.collection('config').doc('admins').get();
        if (doc.exists && doc.data() && Array.isArray(doc.data().emails)) {
            ADMIN_EMAILS = doc.data().emails.map(e => String(e).toLowerCase());
            console.log('[FirebaseConfig] ADMIN_EMAILS sincronizada desde Firestore:', ADMIN_EMAILS);
        } else {
            console.log('[FirebaseConfig] No se encontró documento config/admins — usando lista local.');
        }
    } catch (err) {
        console.warn('[FirebaseConfig] Error sincronizando ADMIN_EMAILS desde Firestore:', err);
    }
})();
