const express = require('express');
const db = require('./db'); // Importar la conexión a la base de datos

const app = express();
const cors = require('cors');
const path = require('path');

// Servir archivos estáticos desde la carpeta 'public'
app.use(express.static(path.join(__dirname, 'public')));

app.use(cors());
app.use((req, res, next) => {
    console.log(`Método: ${req.method}, Ruta: ${req.url}`);
    next();
}); // Crear la aplicación de Express

// Middleware para procesar JSON
app.use(express.json());

// Ruta para obtener todos los espacios públicos
app.get('/api/spaces', (req, res) => {
    const query = 'SELECT * FROM spaces';
    db.query(query, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Error obteniendo los espacios.' });
        }

        res.status(200).json(results);
    });
});

// Ruta para registrar un usuario
app.post('/api/register', (req, res) => {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
    }

    const query = `INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)`;
    db.query(query, [username, email, password, role || 'user'], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Error registrando el usuario.' });
        }

        res.status(201).json({ message: 'Usuario registrado con éxito.' });
    });
});

// Ruta para inicio de sesión
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
    }

    // Verificar primero en la tabla de usuarios
    const userQuery = `SELECT * FROM users WHERE username = ?`;
    db.query(userQuery, [username], (err, userResults) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Error buscando el usuario.' });
        }

        if (userResults.length > 0) {
            const user = userResults[0];

            // Validar la contraseña
            if (user.password === password) {
                return res.status(200).json({ 
                    message: 'Inicio de sesión exitoso.',
                    user: { id: user.id, username: user.username, role: 'user' }
                });
            } else {
                return res.status(401).json({ error: 'Contraseña incorrecta.' });
            }
        }

        // Si no se encuentra en `users`, verificar en `admins`
        const adminQuery = `SELECT * FROM admins WHERE username = ?`;
        db.query(adminQuery, [username], (err, adminResults) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Error buscando el administrador.' });
            }

            if (adminResults.length > 0) {
                const admin = adminResults[0];

                // Validar la contraseña
                if (admin.password === password) {
                    return res.status(200).json({ 
                        message: 'Inicio de sesión exitoso.',
                        user: { id: admin.id, username: admin.username, role: 'admin' }
                    });
                } else {
                    return res.status(401).json({ error: 'Contraseña incorrecta.' });
                }
            }

            // Si no se encuentra en ninguna tabla
            return res.status(404).json({ error: 'Usuario o administrador no encontrado.' });
        });
    });
});

const ADMIN_KEY = '1234567'; // Cambia esto por una clave más segura

app.post('/api/register-admin', (req, res) => {
    const { username, email, password, adminKey } = req.body;

    if (!username || !email || !password || !adminKey) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
    }

    // Verificar la clave de acceso
    if (adminKey !== ADMIN_KEY) {
        return res.status(403).json({ error: 'Clave de acceso incorrecta.' });
    }

    // Insertar el administrador en la tabla correspondiente
    const query = `INSERT INTO admins (username, email, password) VALUES (?, ?, ?)`;
    db.query(query, [username, email, password], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Error registrando al administrador.' });
        }

        res.status(201).json({ message: 'Administrador registrado con éxito.' });
    });
});


// Ruta para manejar solicitudes no definidas (debe ir al final)
app.use((req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada.' });
});

// Iniciar el servidor
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
