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

    // Verificar primero en la tabla `users`
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
                    user: { id: user.id, username: user.username, role: 'user', source: 'users' }
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
                        user: { id: admin.id, username: admin.username, role: 'admin', source: 'admins' }
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
app.post('/api/spaces', (req, res) => {
    const { name, description, capacity} = req.body;

    if (!name || !description || !capacity ) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
    }

    const query = `INSERT INTO spaces (name, description, capacity) VALUES (?, ?, ?)`;
    db.query(query, [name, description, capacity], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Error creando el espacio.' });
        }

        res.status(201).json({ message: 'Espacio creado con éxito.' });
    });
});
app.get('/api/spaces', (req, res) => {
    const query = 'SELECT * FROM spaces';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error obteniendo los espacios:', err);
            return res.status(500).json({ error: 'Error obteniendo los espacios.' });
        }

        res.status(200).json(results);
    });
});
app.delete('/api/spaces/:id', (req, res) => {
    const { id } = req.params;

    const query = 'DELETE FROM spaces WHERE id = ?';
    db.query(query, [id], (err, result) => {
        if (err) {
            console.error('Error al eliminar el espacio:', err);
            return res.status(500).json({ error: 'Error al eliminar el espacio.' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Espacio no encontrado.' });
        }

        res.status(200).json({ message: 'Espacio eliminado con éxito.' });
    });
});
app.put('/api/spaces/:id', (req, res) => {
    const { id } = req.params;
    const { name, description, capacity } = req.body;

    if (!name || !capacity) {
        return res.status(400).json({ error: 'Los campos name y capacity son obligatorios.' });
    }

    const query = 'UPDATE spaces SET name = ?, description = ?, capacity = ? WHERE id = ?';
    db.query(query, [name, description || null, capacity, id], (err, result) => {
        if (err) {
            console.error('Error al actualizar el espacio:', err);
            return res.status(500).json({ error: 'Error al actualizar el espacio.' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Espacio no encontrado.' });
        }

        res.status(200).json({ message: 'Espacio actualizado con éxito.' });
    });
});
//reservas
app.post('/api/reservations', (req, res) => {
    const { user_id, space_id, date } = req.body;

    if (!user_id || !space_id || !date) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
    }

    // Verificar que el usuario no tenga más de una reserva activa
    const checkQuery = 'SELECT COUNT(*) AS activeReservations FROM reservations WHERE user_id = ?';
    db.query(checkQuery, [user_id], (err, results) => {
        if (err) {
            console.error('Error verificando reservas activas:', err);
            return res.status(500).json({ error: 'Error verificando reservas activas.' });
        }

        const activeReservations = results[0].activeReservations;
        if (activeReservations >= 1) {
            return res.status(400).json({ error: 'Solo puedes tener una reserva activa a la vez.' });
        }

        // Crear la nueva reserva
        const insertQuery = 'INSERT INTO reservations (user_id, space_id, date) VALUES (?, ?, ?)';
        db.query(insertQuery, [user_id, space_id, date], (err, result) => {
            if (err) {
                console.error('Error creando la reserva:', err);
                return res.status(500).json({ error: 'Error creando la reserva.' });
            }

            res.status(201).json({ message: 'Reserva creada con éxito.', reservationId: result.insertId });
        });
    });
});
//ver reservas
app.get('/api/reservations/:userId', (req, res) => {
    const userId = req.params.userId;

    const query = `
        SELECT r.id as reservation_id, r.date as reservation_date, s.name as space_name, s.description, s.capacity
        FROM reservations r
        JOIN spaces s ON r.space_id = s.id
        WHERE r.user_id = ?
    `;

    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Error obteniendo las reservas:', err);
            return res.status(500).json({ error: 'Error obteniendo las reservas.' });
        }

        res.status(200).json(results); // Devolver las reservas
    });
});


//actualizar reservas
app.put('/api/reservations/:id', (req, res) => {
    const { id } = req.params;
    const { reservation_date } = req.body;

    if (!reservation_date) {
        return res.status(400).json({ error: 'La nueva fecha es obligatoria.' });
    }

    const query = 'UPDATE reservations SET reservation_date = ? WHERE id = ?';
    db.query(query, [date, id], (err, result) => {
        if (err) {
            console.error('Error actualizando la reserva:', err);
            return res.status(500).json({ error: 'Error actualizando la reserva.' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Reserva no encontrada.' });
        }

        res.status(200).json({ message: 'Reserva actualizada con éxito.' });
    });
});

//eliminar reserva
app.delete('/api/reservations/:id', (req, res) => {
    const { id } = req.params;

    const query = 'DELETE FROM reservations WHERE id = ?';
    db.query(query, [id], (err, result) => {
        if (err) {
            console.error('Error eliminando la reserva:', err);
            return res.status(500).json({ error: 'Error eliminando la reserva.' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Reserva no encontrada.' });
        }

        res.status(200).json({ message: 'Reserva eliminada con éxito.' });
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
