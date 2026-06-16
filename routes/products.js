import express from 'express';
import { allQuery, getQuery, runQuery } from '../database.js';
import { requireAdminJwt } from '../middlewares/auth.js';

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

// GET - Inventario (id, title, quantity)
router.get('/inventory/list', async (req, res) => {
    try {
        const rows = await allQuery('SELECT id, title, quantity FROM products ORDER BY title ASC');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT - Actualizar cantidad de inventario para un producto
router.put('/inventory/:id', async (req, res) => {
    try {
        const adminPassword = req.headers['x-admin-password'];
        if (adminPassword !== process.env.ADMIN_PASSWORD) {
            return res.status(401).json({ error: 'No autorizado' });
        }

        const qty = parseInt(req.body.quantity, 10);
        if (isNaN(qty) || qty < 0) {
            return res.status(400).json({ error: 'quantity debe ser entero >= 0' });
        }

        await runQuery('UPDATE products SET quantity = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?', [qty, req.params.id]);
        res.json({ message: 'Cantidad de inventario actualizada', id: req.params.id, quantity: qty });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST - Importar inventario masivo (JSON list of {id, quantity})
router.post('/inventory/bulk', async (req, res) => {
    try {
        const adminPassword = req.headers['x-admin-password'];
        if (adminPassword !== process.env.ADMIN_PASSWORD) {
            return res.status(401).json({ error: 'No autorizado' });
        }

        const items = req.body.items;
        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'Se requiere un arreglo de items {id, quantity}' });
        }

        // Validar y ejecutar updates
        const updates = items.map(it => {
            const id = parseInt(it.id, 10);
            const qty = parseInt(it.quantity, 10);
            if (isNaN(id) || isNaN(qty) || qty < 0) {
                throw new Error('Formato inválido en items; id y quantity deben ser enteros y quantity >= 0');
            }
            return runQuery('UPDATE products SET quantity = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?', [qty, id]);
        });

        await Promise.all(updates);
        res.json({ message: 'Inventario importado correctamente', updated: items.length });
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
router.post('/', requireAdminJwt, async (req, res) => {
    try {
        const { title, originalPrice, offerPrice, category, emoji, image, quantity } = req.body;
        // Autenticación vía JWT (middleware)

        // Validaciones
        if (!title || !originalPrice || !offerPrice || !category) {
            return res.status(400).json({ error: 'Faltan campos requeridos' });
        }

        if (offerPrice >= originalPrice) {
            return res.status(400).json({ error: 'El precio de oferta debe ser menor que el original' });
        }

        const result = await runQuery(
            'INSERT INTO products (title, originalPrice, offerPrice, category, emoji, image, quantity) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [title, originalPrice, offerPrice, category, emoji || '📦', image || null, Number.isInteger(quantity) ? quantity : 0]
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
router.put('/:id', requireAdminJwt, async (req, res) => {
    try {
        const { title, originalPrice, offerPrice, category, emoji, image, quantity } = req.body;
        // Autenticación vía JWT (middleware)

        if (offerPrice >= originalPrice) {
            return res.status(400).json({ error: 'El precio de oferta debe ser menor que el original' });
        }

        await runQuery(
            `UPDATE products 
             SET title = ?, originalPrice = ?, offerPrice = ?, category = ?, emoji = ?, image = ?, quantity = ?, updatedAt = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [title, originalPrice, offerPrice, category, emoji, image || null, Number.isInteger(quantity) ? quantity : 0, req.params.id]
        );

        res.json({ message: 'Producto actualizado exitosamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE - Eliminar producto (requiere autenticación)
router.delete('/:id', requireAdminJwt, async (req, res) => {
    try {
        await runQuery('DELETE FROM products WHERE id = ?', [req.params.id]);
        res.json({ message: 'Producto eliminado exitosamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
