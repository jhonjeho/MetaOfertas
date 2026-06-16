import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'metaofertas_dev_secret';
const EXPIRES = process.env.JWT_EXPIRES || '8h';

export function generateAdminToken() {
    const payload = { role: 'admin' };
    return jwt.sign(payload, SECRET, { expiresIn: EXPIRES });
}

export function requireAdminJwt(req, res, next) {
    try {
        const auth = req.headers['authorization'] || '';
        if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: 'No autorizado' });
        const token = auth.split(' ')[1];
        const decoded = jwt.verify(token, SECRET);
        if (!decoded || decoded.role !== 'admin') return res.status(401).json({ error: 'No autorizado' });
        req.admin = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Token inválido o expirado' });
    }
}
