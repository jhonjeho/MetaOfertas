import express from 'express';
import { allQuery, runQuery, getQuery } from '../database.js';

const router = express.Router();

// GET - Obtener carrito de una sesión
router.get('/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const cartItems = await allQuery(
            `SELECT c.id, c.productId, c.quantity, p.title, p.originalPrice, p.offerPrice, p.emoji
             FROM cartItems c
             JOIN products p ON c.productId = p.id
             WHERE c.sessionId = ?
             ORDER BY c.addedAt DESC`,
            [sessionId]
        );

        res.json(cartItems);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST - Agregar producto al carrito
router.post('/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { productId, quantity = 1 } = req.body;

        if (!productId) {
            return res.status(400).json({ error: 'productId requerido' });
        }

        // Verificar que el producto existe
        const product = await getQuery('SELECT * FROM products WHERE id = ?', [productId]);
        if (!product) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        // Verificar si ya existe en el carrito
        const existing = await getQuery(
            'SELECT * FROM cartItems WHERE sessionId = ? AND productId = ?',
            [sessionId, productId]
        );

        if (existing) {
            // Actualizar cantidad
            await runQuery(
                'UPDATE cartItems SET quantity = quantity + ? WHERE sessionId = ? AND productId = ?',
                [quantity, sessionId, productId]
            );
        } else {
            // Crear nuevo item
            await runQuery(
                'INSERT INTO cartItems (productId, quantity, sessionId) VALUES (?, ?, ?)',
                [productId, quantity, sessionId]
            );
        }

        res.status(201).json({ message: 'Producto agregado al carrito' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT - Actualizar cantidad en carrito
router.put('/:sessionId/:cartItemId', async (req, res) => {
    try {
        const { sessionId, cartItemId } = req.params;
        const { quantity } = req.body;

        if (quantity <= 0) {
            // Eliminar item
            await runQuery('DELETE FROM cartItems WHERE id = ? AND sessionId = ?', [cartItemId, sessionId]);
        } else {
            // Actualizar cantidad
            await runQuery(
                'UPDATE cartItems SET quantity = ? WHERE id = ? AND sessionId = ?',
                [quantity, cartItemId, sessionId]
            );
        }

        res.json({ message: 'Carrito actualizado' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE - Eliminar producto del carrito
router.delete('/:sessionId/:cartItemId', async (req, res) => {
    try {
        const { sessionId, cartItemId } = req.params;

        await runQuery(
            'DELETE FROM cartItems WHERE id = ? AND sessionId = ?',
            [cartItemId, sessionId]
        );

        res.json({ message: 'Producto eliminado del carrito' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE - Vaciar carrito
router.delete('/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;

        await runQuery('DELETE FROM cartItems WHERE sessionId = ?', [sessionId]);
        res.json({ message: 'Carrito vaciado' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
