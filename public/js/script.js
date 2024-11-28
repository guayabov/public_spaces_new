// Clase Validator para validar entradas de usuario
class Validator {
    constructor(strategy) {
        this.strategy = strategy;
    }

    validate(value) {
        return this.strategy(value);
    }
}

// Estrategias de validación
const strategies = {
    isNotEmpty: value => value.trim() !== '',
    isEmail: value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    isPasswordValid: value => value.length >= 6
};

// Validar campos
function validateUserFields(username, email, password) {
    const validators = [
        new Validator(strategies.isNotEmpty).validate(username) ? null : 'El nombre de usuario no puede estar vacío.',
        new Validator(strategies.isEmail).validate(email) ? null : 'El correo electrónico no es válido.',
        new Validator(strategies.isPasswordValid).validate(password) ? null : 'La contraseña debe tener al menos 6 caracteres.'
    ];

    const errors = validators.filter(error => error !== null);
    if (errors.length > 0) {
        alert(errors.join('\n'));
        return false;
    }
    return true;
}

// Registro de usuarios
document.getElementById('registerForm')?.addEventListener('submit', function (event) {
    event.preventDefault(); // Prevenir recarga de la página

    // Obtener los valores del formulario
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    // Validar que todos los campos estén llenos
    if (!username || !email || !password) {
        alert('Por favor, llena todos los campos.');
        return;
    }

    // Enviar datos al servidor
    fetch('http://localhost:3000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password, role: 'user' }) // Enviar datos como JSON
    })
        .then(response => response.json())
        .then(data => {
            if (data.message) {
                alert(data.message); // Mostrar mensaje de éxito
                window.location.href = 'index.html'; // Redirigir al inicio de sesión
            } else if (data.error) {
                alert('Error: ' + data.error); // Mostrar error devuelto por el servidor
            }
        })
        .catch(error => console.error('Error registrando usuario:', error)); // Manejar errores
});

document.getElementById('loginForm')?.addEventListener('submit', function (event) {
    event.preventDefault(); // Prevenir recarga de la página

    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    fetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }) // Enviar los datos de login
    })
        .then(response => response.json())
        .then(data => {
            if (data.message) {
                alert(data.message); // Mostrar mensaje de éxito
                localStorage.setItem('loggedInUser', data.user.username); // Guardar usuario en sesión
                window.location.href = 'dashboard.html'; // Redirigir al dashboard
            } else if (data.error) {
                alert('Error: ' + data.error); // Mostrar error devuelto por el servidor
            }
        })
        .catch(error => console.error('Error iniciando sesión:', error)); // Manejar errores
});




// Cargar espacios desde la base de datos
document.addEventListener('DOMContentLoaded', function () {
    const spacesList = document.getElementById('spacesList');

    fetch('http://localhost:3000/api/spaces')
        .then(response => response.json())
        .then(data => {
            data.forEach(space => {
                const spaceDiv = document.createElement('div');
                spaceDiv.className = 'space';

                spaceDiv.innerHTML = `
                    <h3>${space.name}</h3>
                    <p>${space.description}</p>
                    <p>Capacidad: ${space.capacity}</p>
                    <label for="date-${space.id}">Fecha:</label>
                    <input type="date" id="date-${space.id}" />
                    <button onclick="reserveSpace(${space.id})">Reservar</button>
                `;

                spacesList.appendChild(spaceDiv);
            });
        })
        .catch(error => console.error('Error obteniendo espacios:', error));
});

// Reservar espacio
function reserveSpace(spaceId) {
    const currentUser = localStorage.getItem('loggedInUser');
    const dateInput = document.getElementById(`date-${spaceId}`).value;

    if (!dateInput) {
        alert('Por favor, selecciona una fecha.');
        return;
    }

    fetch('http://localhost:3000/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: currentUser, spaceId, date: dateInput })
    })
        .then(response => response.json())
        .then(data => {
            if (data.message) {
                alert('Reserva realizada con éxito.');
                window.location.reload();
            } else {
                alert('Error: ' + data.error);
            }
        })
        .catch(error => console.error('Error realizando reserva:', error));
}

// Cerrar sesión
document.getElementById('logoutButton')?.addEventListener('click', function () {
    localStorage.removeItem('loggedInUser');
    window.location.href = 'index.html';
});
