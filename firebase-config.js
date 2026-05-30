/* ============================================================
   METAOFERTAS — CONFIGURACIÓN FIREBASE v10 (Compat CDN)
   ============================================================ */

// ── LISTA BLANCA DE ADMINISTRADORES ──────────────────────────
// Agrega aquí los correos autorizados como administradores.
// Solo estos correos podrán acceder al Panel de Administración.
const ADMIN_EMAILS = [
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
