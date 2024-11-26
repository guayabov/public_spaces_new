const express = require('express');
const db = require('./db'); // Importar la conexión a la base de datos

const app = express();
const cors = require('cors');

app.use(cors());  
app.use((req, res, next) => {
    console.log(`Método: ${req.method}, Ruta: ${req.url}`);
    next();
});// Crear la aplicación de Express

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

// Ruta para manejar solicitudes no definidas
app.use((req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada.' });
});

// Iniciar el servidor
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
// Ruta para inicio de sesión
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    // Verificar que los campos no estén vacíos
    if (!username || !password) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
    }

    // Consultar el usuario en la base de datos
    const query = `SELECT * FROM users WHERE username = ?`;
    db.query(query, [username], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Error al buscar el usuario.' });
        }

        // Verificar si el usuario existe
        if (results.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado.' });
        }

        const user = results[0];

        // Comparar la contraseña (sin encriptación por ahora)
        if (user.password !== password) {
            return res.status(401).json({ error: 'Contraseña incorrecta.' });
        }

        // Inicio de sesión exitoso
        res.status(200).json({ message: 'Inicio de sesión exitoso.', user: { username: user.username, role: user.role } });
    });
});

