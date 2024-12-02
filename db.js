const mysql = require('mysql2');

// Configuración de conexión a la base de datos
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root', // Cambia esto según tu configuración
    password: '3015084203Gg', // Cambia esto según tu configuración
    database: 'public_space_management'
});

// Verificar conexión
db.connect(err => {
    if (err) {
        console.error('Error conectando a la base de datos:', err.message);
        process.exit(1); // Detener la ejecución si no hay conexión
    }
    console.log('Conexión exitosa con la base de datos.');
});

module.exports = db;
