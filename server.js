import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { initializeDatabase } from './database.js';
import productRoutes from './routes/products.js';
import cartRoutes from './routes/cart.js';
import orderRoutes from './routes/orders.js';
import userRoutes from './routes/users.js';
import adminRoutes from './routes/admin.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Rutas
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'MetaOfertas API está funcionando ✅' });
});

// Manejo de errores
app.use((err, req, res, next) => {
    console.error('❌ Error:', err);
    res.status(500).json({
        error: 'Error interno del servidor',
        message: err.message
    });
});

// 404
app.use((req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada' });
});

// Iniciar servidor
async function startServer() {
    try {
        // Inicializar base de datos
        await initializeDatabase();

        // Iniciar servidor
        app.listen(PORT, () => {
            console.log(`
╔════════════════════════════════════════╗
║    🛒 MetaOfertas API v1.0 🛒         ║
╠════════════════════════════════════════╣
║  ✅ Servidor ejecutándose en:         ║
║     http://localhost:${PORT}            ║
║                                        ║
║  📚 Documentación de API:              ║
║     GET  /api/health                  ║
║     GET  /api/products                ║
║     POST /api/products (admin)        ║
║     GET  /api/cart                    ║
║     POST /api/cart                    ║
║     GET  /api/orders                  ║
║     POST /api/orders                  ║
║                                        ║
║  📍 Base de datos: SQLite              ║
║  🔑 Contraseña admin: admin123        ║
╚════════════════════════════════════════╝
            `);
        });
    } catch (error) {
        console.error('❌ Error al iniciar el servidor:', error);
        process.exit(1);
    }
}

startServer();

export default app;
