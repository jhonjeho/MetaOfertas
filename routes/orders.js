import express from 'express';
import { allQuery, runQuery, getQuery } from '../database.js';

const router = express.Router();

// Función para generar número de pedido único
function generateOrderNumber() {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `ORD-${timestamp}-${random}`;
}

// GET - Obtener todos los pedidos
router.get('/', async (req, res) => {
    try {
        const adminPassword = req.headers['x-admin-password'];

        if (adminPassword !== process.env.ADMIN_PASSWORD) {
            return res.status(401).json({ error: 'No autorizado' });
        }

        const orders = await allQuery('SELECT * FROM orders ORDER BY createdAt DESC');
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET - Obtener un pedido
router.get('/:id', async (req, res) => {
    try {
        const order = await getQuery('SELECT * FROM orders WHERE id = ?', [req.params.id]);
        if (!order) {
            return res.status(404).json({ error: 'Pedido no encontrado' });
        }
        res.json(order);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST - Crear nuevo pedido
router.post('/', async (req, res) => {
    try {
        const { userId, items } = req.body;

        if (!userId) {
            return res.status(400).json({ error: 'userId es requerido' });
        }

        // Verificar que el usuario existe
        const user = await getQuery('SELECT * FROM users WHERE id = ?', [userId]);
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        if (!items || items.length === 0) {
            return res.status(400).json({ error: 'El carrito no puede estar vacío' });
        }

        // Calcular total
        let totalAmount = 0;
        for (const item of items) {
            const product = await getQuery('SELECT * FROM products WHERE id = ?', [item.productId]);
            if (product) {
                totalAmount += product.offerPrice * item.quantity;
            }
        }

        // Crear pedido
        const orderNumber = generateOrderNumber();
        const result = await runQuery(
            `INSERT INTO orders (orderNumber, userId, totalAmount, items, status)
             VALUES (?, ?, ?, ?, ?)`,
            [orderNumber, userId, totalAmount, JSON.stringify(items), 'pending']
        );

        res.status(201).json({
            id: result.id,
            orderNumber,
            totalAmount,
            message: 'Pedido creado exitosamente'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT - Actualizar estado de pedido
router.put('/:id', async (req, res) => {
    try {
        const { status } = req.body;
        const adminPassword = req.headers['x-admin-password'];

        if (adminPassword !== process.env.ADMIN_PASSWORD) {
            return res.status(401).json({ error: 'No autorizado' });
        }

        const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Estado inválido' });
        }

        await runQuery(
            'UPDATE orders SET status = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
            [status, req.params.id]
        );

        res.json({ message: 'Pedido actualizado' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
