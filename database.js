import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.DB_PATH || './database.db';

// Crear conexión a SQLite
export const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('❌ Error al conectar con la base de datos:', err);
        process.exit(1);
    } else {
        console.log('✅ Conectado a SQLite:', DB_PATH);
    }
});

// Inicializar tablas
export function initializeDatabase() {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            // Tabla de usuarios
            db.run(`
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    nombre TEXT NOT NULL,
                    whatsapp TEXT NOT NULL UNIQUE,
                    barrio TEXT NOT NULL,
                    tipoCliente TEXT NOT NULL,
                    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `, (err) => {
                if (err) reject(err);
            });

            // Tabla de productos
            db.run(`
                CREATE TABLE IF NOT EXISTS products (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    title TEXT NOT NULL,
                    originalPrice REAL NOT NULL,
                    offerPrice REAL NOT NULL,
                    category TEXT NOT NULL,
                    emoji TEXT,
                    image LONGBLOB,
                    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `, (err) => {
                if (err) reject(err);
            });

            // Tabla de carrito
            db.run(`
                CREATE TABLE IF NOT EXISTS cartItems (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    productId INTEGER NOT NULL,
                    quantity INTEGER NOT NULL DEFAULT 1,
                    sessionId TEXT NOT NULL,
                    addedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (productId) REFERENCES products(id)
                )
            `, (err) => {
                if (err) reject(err);
            });

            // Tabla de pedidos
            db.run(`
                CREATE TABLE IF NOT EXISTS orders (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    orderNumber TEXT UNIQUE NOT NULL,
                    userId INTEGER NOT NULL,
                    totalAmount REAL NOT NULL,
                    status TEXT DEFAULT 'pending',
                    items TEXT NOT NULL,
                    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (userId) REFERENCES users(id)
                )
            `, (err) => {
                if (err) reject(err);
                else {
                    console.log('✅ Tablas de base de datos inicializadas correctamente');
                    resolve();
                }
            });
        });
    });
}

// Ejecutar queries con Promises
export function runQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
            if (err) reject(err);
            else resolve({ id: this.lastID, changes: this.changes });
        });
    });
}

export function getQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
}

export function allQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

export default db;
