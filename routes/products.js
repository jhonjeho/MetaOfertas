import express from 'express';
import { allQuery, getQuery, runQuery } from '../database.js';

const router = express.Router();

// GET - Obtener todos los productos
router.get('/', async (req, res) => {
    try {
        const category = req.query.category;
        let sql = 'SELECT * FROM products ORDER BY createdAt DESC';
        let params = [];

        if (category && category !== 'all') {
            sql = 'SELECT * FROM products WHERE category = ? ORDER BY createdAt DESC';
            params = [category];
        }

        const products = await allQuery(sql, params);
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET - Obtener un producto por ID
router.get('/:id', async (req, res) => {
    try {
        const product = await getQuery('SELECT * FROM products WHERE id = ?', [req.params.id]);
        if (!product) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        res.json(product);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST - Crear nuevo producto (requiere autenticación)
router.post('/', async (req, res) => {
    try {
        const { title, originalPrice, offerPrice, category, emoji, image } = req.body;
        const adminPassword = req.headers['x-admin-password'];

        // Verificar contraseña admin
        if (adminPassword !== process.env.ADMIN_PASSWORD) {
            return res.status(401).json({ error: 'No autorizado' });
        }

        // Validaciones
        if (!title || !originalPrice || !offerPrice || !category) {
            return res.status(400).json({ error: 'Faltan campos requeridos' });
        }

        if (offerPrice >= originalPrice) {
            return res.status(400).json({ error: 'El precio de oferta debe ser menor que el original' });
        }

        const result = await runQuery(
            'INSERT INTO products (title, originalPrice, offerPrice, category, emoji, image) VALUES (?, ?, ?, ?, ?, ?)',
            [title, originalPrice, offerPrice, category, emoji || '📦', image || null]
        );

        res.status(201).json({
            id: result.id,
            message: 'Producto creado exitosamente'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT - Actualizar producto (requiere autenticación)
router.put('/:id', async (req, res) => {
    try {
        const { title, originalPrice, offerPrice, category, emoji, image } = req.body;
        const adminPassword = req.headers['x-admin-password'];

        if (adminPassword !== process.env.ADMIN_PASSWORD) {
            return res.status(401).json({ error: 'No autorizado' });
        }

        if (offerPrice >= originalPrice) {
            return res.status(400).json({ error: 'El precio de oferta debe ser menor que el original' });
        }

        await runQuery(
            `UPDATE products 
             SET title = ?, originalPrice = ?, offerPrice = ?, category = ?, emoji = ?, image = ?, updatedAt = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [title, originalPrice, offerPrice, category, emoji, image || null, req.params.id]
        );

        res.json({ message: 'Producto actualizado exitosamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE - Eliminar producto (requiere autenticación)
router.delete('/:id', async (req, res) => {
    try {
        const adminPassword = req.headers['x-admin-password'];

        if (adminPassword !== process.env.ADMIN_PASSWORD) {
            return res.status(401).json({ error: 'No autorizado' });
        }

        await runQuery('DELETE FROM products WHERE id = ?', [req.params.id]);
        res.json({ message: 'Producto eliminado exitosamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
