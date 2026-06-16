import express from 'express';
import { allQuery, getQuery } from '../database.js';
import { generateAdminToken, requireAdminJwt } from '../middlewares/auth.js';

const router = express.Router();

// POST - Verificar credenciales admin
router.post('/login', (req, res) => {
    try {
        const { password } = req.body;

        if (password === process.env.ADMIN_PASSWORD) {
            const token = generateAdminToken();
            res.json({ success: true, message: 'Autenticación exitosa', token });
        } else {
            res.status(401).json({ error: 'Contraseña incorrecta' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET - Dashboard del administrador
router.get('/dashboard', requireAdminJwt, async (req, res) => {
    try {
        const totalProducts = await getQuery('SELECT COUNT(*) as count FROM products');
        const totalOrders = await getQuery('SELECT COUNT(*) as count FROM orders');
        const pendingOrders = await getQuery('SELECT COUNT(*) as count FROM orders WHERE status = "pending"');
        const totalRevenue = await getQuery('SELECT SUM(totalAmount) as total FROM orders WHERE status IN ("confirmed", "shipped", "delivered")');

        const stats = {
            totalProducts: totalProducts.count,
            totalOrders: totalOrders.count,
            pendingOrders: pendingOrders.count,
            totalRevenue: totalRevenue.total || 0
        };

        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET - Obtener resumen de ventas
router.get('/sales', requireAdminJwt, async (req, res) => {
    try {
        const sales = await allQuery(`
            SELECT 
                DATE(createdAt) as date,
                COUNT(*) as orderCount,
                SUM(totalAmount) as totalAmount
            FROM orders
            WHERE status IN ('confirmed', 'shipped', 'delivered')
            GROUP BY DATE(createdAt)
            ORDER BY date DESC
            LIMIT 30
        `);

        res.json(sales);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET - Productos más vendidos
router.get('/top-products', requireAdminJwt, async (req, res) => {
    try {
        const topProducts = await allQuery(`
            SELECT 
                p.id,
                p.title,
                p.emoji,
                COUNT(json_each.value) as totalSold,
                SUM(p.offerPrice) as revenue
            FROM products p
            JOIN orders o ON 1=1
            WHERE o.status IN ('confirmed', 'shipped', 'delivered')
            GROUP BY p.id
            ORDER BY totalSold DESC
            LIMIT 10
        `);

        res.json(topProducts || []);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
