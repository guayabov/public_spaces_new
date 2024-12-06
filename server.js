const express = require('express');
const db = require('./db'); // Importar la conexión a la base de datos

const app = express();
const cors = require('cors');
const path = require('path');
const fs = require('fs');


// Función para registrar logs
function logMessage(message) {
    const logPath = path.join(__dirname, 'server.log'); // Archivo `server.log`
    const timestamp = new Date().toLocaleString(); // Fecha y hora actual
    const logEntry = `${timestamp} - ${message}\n`; // Entrada de log

    fs.appendFile(logPath, logEntry, (err) => {
        if (err) {
            console.error('Error escribiendo en el log:', err);
        }
    });
}


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
        logMessage('Error: Campos obligatorios faltantes en el registro de usuario.');
        return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
    }

    const query = 'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)';
    db.query(query, [username, email, password, role || 'user'], (err, result) => {
        if (err) {
            logMessage(`Error registrando usuario: ${username}`);
            return res.status(500).json({ error: 'Error registrando el usuario.' });
        }

        logMessage(`Usuario "${username}" registrado con éxito.`);
        res.status(201).json({ message: 'Usuario registrado con éxito.' });
    });
});


// Ruta para inicio de sesión
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
    }

    // Verificar en la tabla `users`
    const userQuery = `SELECT * FROM users WHERE username = ?`;
    db.query(userQuery, [username], (err, userResults) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Error buscando el usuario.' });
        }

        if (userResults.length > 0) {
            const user = userResults[0];

            if (user.password === password) {
                return res.status(200).json({
                    message: 'Inicio de sesión exitoso.',
                    user: { id: user.id, username: user.username, role: 'user' }
                });
            } else {
                return res.status(401).json({ error: 'Contraseña incorrecta.' });
            }
        }

        // Verificar en la tabla `admins`
        const adminQuery = `SELECT * FROM admins WHERE username = ?`;
        db.query(adminQuery, [username], (err, adminResults) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Error buscando al administrador.' });
            }

            if (adminResults.length > 0) {
                const admin = adminResults[0];

                if (admin.password === password) {
                    return res.status(200).json({
                        message: 'Inicio de sesión exitoso.',
                        user: { id: admin.id, username: admin.username, role: 'admin' }
                    });
                } else {
                    return res.status(401).json({ error: 'Contraseña incorrecta.' });
                }
            }

            return res.status(404).json({ error: 'Usuario o administrador no encontrado.' });
        });
    });
});




const ADMIN_KEY = '1234567'; // Cambia esto por una clave más segura
app.post('/api/register-admin', (req, res) => {
    const { username, email, password, adminKey } = req.body;

    if (!username || !email || !password || !adminKey) {
        logMessage('Error: Intento de registro de administrador fallido. Campos obligatorios faltantes.');
        return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
    }

    // Verificar la clave de acceso
    if (adminKey !== ADMIN_KEY) {
        logMessage(`Error: Intento de registro fallido para administrador "${username}". Clave de acceso incorrecta: ${adminKey}`);
        return res.status(403).json({ error: 'Clave de acceso incorrecta.' });
    }

    // Insertar el administrador en la tabla correspondiente
    const query = `INSERT INTO admins (username, email, password) VALUES (?, ?, ?)`;
    db.query(query, [username, email, password], (err, result) => {
        if (err) {
            logMessage(`Error: Fallo al registrar al administrador "${username}".`);
            console.error(err);
            return res.status(500).json({ error: 'Error registrando al administrador.' });
        }

        logMessage(`Administrador "${username}" registrado con éxito.`);
        res.status(201).json({ message: 'Administrador registrado con éxito.' });
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

app.put('/api/reservations/:id', (req, res) => {
    const reservationId = req.params.id; // ID de la reserva desde la URL
    const { date } = req.body; // Nueva fecha desde el cuerpo de la solicitud

    if (!date) {
        logMessage(`Error: Intento de actualización de reserva fallido. La nueva fecha es obligatoria. Reserva ID: ${reservationId}`);
        return res.status(400).json({ error: 'La nueva fecha es obligatoria.' });
    }

    const query = `UPDATE reservations SET date = ? WHERE id = ?`;
    db.query(query, [date, reservationId], (err, result) => {
        if (err) {
            logMessage(`Error: Fallo al actualizar la reserva ID: ${reservationId}. Error de base de datos.`);
            console.error(err);
            return res.status(500).json({ error: 'Error actualizando la reserva.' });
        }

        if (result.affectedRows === 0) {
            logMessage(`Error: Reserva ID: ${reservationId} no encontrada para actualización.`);
            return res.status(404).json({ error: 'Reserva no encontrada.' });
        }

        logMessage(`Reserva ID: ${reservationId} actualizada con éxito a la fecha ${date}.`);
        res.status(200).json({ message: 'Reserva actualizada con éxito.' });
    });
});


//reservas
app.post('/api/reservations', (req, res) => {
    const { user_id, space_id, date } = req.body;

    if (!user_id || !space_id || !date) {
        logMessage(`Error: Intento de creación de reserva fallido. Faltan campos obligatorios.`);
        return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
    }

    // Verificar que el usuario no tenga más de una reserva activa
    const checkQuery = 'SELECT COUNT(*) AS activeReservations FROM reservations WHERE user_id = ?';
    db.query(checkQuery, [user_id], (err, results) => {
        if (err) {
            logMessage(`Error: Fallo verificando reservas activas para el usuario ID: ${user_id}.`);
            console.error('Error verificando reservas activas:', err);
            return res.status(500).json({ error: 'Error verificando reservas activas.' });
        }

        const activeReservations = results[0].activeReservations;
        if (activeReservations >= 1) {
            logMessage(`Usuario ID: ${user_id} intentó crear una reserva pero ya tiene una activa.`);
            return res.status(400).json({ error: 'Solo puedes tener una reserva activa a la vez.' });
        }

        // Verificar si el espacio ya está reservado en la misma fecha
        const spaceCheckQuery = 'SELECT COUNT(*) AS spaceReservations FROM reservations WHERE space_id = ? AND date = ?';
        db.query(spaceCheckQuery, [space_id, date], (err, results) => {
            if (err) {
                logMessage(`Error: Fallo verificando disponibilidad del espacio ID: ${space_id} para la fecha ${date}.`);
                console.error('Error verificando disponibilidad del espacio:', err);
                return res.status(500).json({ error: 'Error verificando disponibilidad del espacio.' });
            }

            const spaceReservations = results[0].spaceReservations;
            if (spaceReservations > 0) {
                logMessage(`Error: Espacio ID: ${space_id} ya está reservado para la fecha ${date}.`);
                return res.status(400).json({ error: 'El espacio ya está reservado para esta fecha.' });
            }

            // Crear la nueva reserva
            const insertQuery = 'INSERT INTO reservations (user_id, space_id, date) VALUES (?, ?, ?)';
            db.query(insertQuery, [user_id, space_id, date], (err, result) => {
                if (err) {
                    logMessage(`Error: Fallo al crear reserva para usuario ID: ${user_id}, espacio ID: ${space_id}, fecha: ${date}.`);
                    console.error('Error creando la reserva:', err);
                    return res.status(500).json({ error: 'Error creando la reserva.' });
                }

                logMessage(`Reserva creada exitosamente. Usuario ID: ${user_id}, Espacio ID: ${space_id}, Fecha: ${date}, Reserva ID: ${result.insertId}.`);
                res.status(201).json({ message: 'Reserva creada con éxito.', reservationId: result.insertId });
            });
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





//eliminar reserva
app.delete('/api/reservations/:id', (req, res) => {
    const { id } = req.params;

    const query = 'DELETE FROM reservations WHERE id = ?';
    db.query(query, [id], (err, result) => {
        if (err) {
            logMessage(`Error eliminando la reserva con ID: ${id}.`);
            console.error('Error eliminando la reserva:', err);
            return res.status(500).json({ error: 'Error eliminando la reserva.' });
        }

        if (result.affectedRows === 0) {
            logMessage(`Error: Reserva con ID ${id} no encontrada.`);
            return res.status(404).json({ error: 'Reserva no encontrada.' });
        }

        logMessage(`Reserva con ID ${id} eliminada exitosamente.`);
        res.status(200).json({ message: 'Reserva eliminada con éxito.' });
    });
});

app.put('/api/spaces/:id', (req, res) => {
    const spaceId = req.params.id;
    const { name, description, capacity } = req.body;

    if (!name || !capacity) {
        logMessage(`Error: Actualización fallida para el espacio con ID ${spaceId}. Faltan campos obligatorios.`);
        return res.status(400).json({ error: 'El nombre y la capacidad son obligatorios.' });
    }

    const query = `UPDATE spaces SET name = ?, description = ?, capacity = ? WHERE id = ?`;
    db.query(query, [name, description || '', capacity, spaceId], (err, result) => {
        if (err) {
            logMessage(`Error actualizando el espacio con ID ${spaceId}.`);
            console.error(err);
            return res.status(500).json({ error: 'Error actualizando el espacio.' });
        }

        if (result.affectedRows === 0) {
            logMessage(`Error: Espacio con ID ${spaceId} no encontrado para actualizar.`);
            return res.status(404).json({ error: 'Espacio no encontrado.' });
        }

        logMessage(`Espacio con ID ${spaceId} actualizado exitosamente. Nuevo nombre: "${name}", Capacidad: ${capacity}.`);
        res.status(200).json({ message: 'Espacio actualizado con éxito.' });
    });
});

app.delete('/api/spaces/:id', (req, res) => {
    const { id } = req.params;

    const query = 'DELETE FROM spaces WHERE id = ?';
    db.query(query, [id], (err, result) => {
        if (err) {
            logMessage(`Error al intentar eliminar el espacio con ID ${id}.`);
            console.error('Error al eliminar el espacio:', err);
            return res.status(500).json({ error: 'Error al eliminar el espacio.' });
        }

        if (result.affectedRows === 0) {
            logMessage(`Error: Espacio con ID ${id} no encontrado para eliminar.`);
            return res.status(404).json({ error: 'Espacio no encontrado.' });
        }

        logMessage(`Espacio con ID ${id} eliminado exitosamente.`);
        res.status(200).json({ message: 'Espacio eliminado con éxito.' });
    });
});

app.post('/api/spaces', (req, res) => {
    const { name, description, capacity } = req.body;

    if (!name || !description || !capacity) {
        logMessage('Error: Campos obligatorios faltantes al intentar crear un espacio.');
        return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
    }

    const query = `INSERT INTO spaces (name, description, capacity) VALUES (?, ?, ?)`;
    db.query(query, [name, description, capacity], (err, result) => {
        if (err) {
            logMessage(`Error creando el espacio "${name}".`);
            console.error(err);
            return res.status(500).json({ error: 'Error creando el espacio.' });
        }

        logMessage(`Espacio "${name}" creado exitosamente con ID ${result.insertId}.`);
        res.status(201).json({ message: 'Espacio creado con éxito.', spaceId: result.insertId });
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
