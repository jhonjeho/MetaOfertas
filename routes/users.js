import express from 'express';
import { allQuery, runQuery, getQuery } from '../database.js';

const router = express.Router();

// POST - Registrar nuevo usuario
router.post('/register', async (req, res) => {
    try {
        const { nombre, whatsapp, barrio, tipoCliente } = req.body;

        // Validaciones
        if (!nombre || !nombre.trim()) {
            return res.status(400).json({ error: 'El nombre es requerido' });
        }

        if (!whatsapp || !whatsapp.trim()) {
            return res.status(400).json({ error: 'El número de WhatsApp es requerido' });
        }

        if (!barrio || !barrio.trim()) {
            return res.status(400).json({ error: 'El barrio/dirección es requerido' });
        }

        if (!tipoCliente || (tipoCliente !== 'persona' && tipoCliente !== 'tienda')) {
            return res.status(400).json({ error: 'El tipo de cliente debe ser "persona" o "tienda"' });
        }

        // Verificar si el número de WhatsApp ya está registrado
        const existingUser = await getQuery('SELECT * FROM users WHERE whatsapp = ?', [whatsapp]);
        if (existingUser) {
            return res.status(400).json({ 
                error: 'Este número de WhatsApp ya está registrado',
                userId: existingUser.id
            });
        }

        // Crear usuario
        const result = await runQuery(
            `INSERT INTO users (nombre, whatsapp, barrio, tipoCliente) 
             VALUES (?, ?, ?, ?)`,
            [nombre.trim(), whatsapp.trim(), barrio.trim(), tipoCliente]
        );

        res.status(201).json({
            id: result.id,
            message: 'Usuario registrado exitosamente',
            nombre: nombre.trim(),
            tipoCliente
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET - Obtener datos del usuario
router.get('/:id', async (req, res) => {
    try {
        const user = await getQuery('SELECT id, nombre, whatsapp, barrio, tipoCliente, createdAt FROM users WHERE id = ?', [req.params.id]);
        
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET - Buscar usuario por WhatsApp
router.get('/whatsapp/:whatsapp', async (req, res) => {
    try {
        const user = await getQuery('SELECT id, nombre, whatsapp, barrio, tipoCliente FROM users WHERE whatsapp = ?', [req.params.whatsapp]);
        
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
