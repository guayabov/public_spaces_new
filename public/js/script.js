

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
                localStorage.setItem('loggedInUser', JSON.stringify(data.user));
                 // Guardar usuario en sesión
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
            data.forEach(spaces => {
                const spaceDiv = document.createElement('div');
                spaceDiv.className = 'space';

                spaceDiv.innerHTML = `
                    <h3>${spaces.name}</h3>
                    <p>${spaces.description}</p>
                    <p>Capacidad: ${spaces.capacity}</p>
                    <label for="date-${spaces.id}">Fecha:</label>
                    <input type="date" id="date-${spaces.id}" />
                    <button onclick="reserveSpace(${spaces.id})">Reservar</button>
                `;

                spacesList.appendChild(spaceDiv);
            });
        })
        .catch(error => console.error('Error obteniendo espacios:', error));
});

// Reservar espacio
function reserveSpace(spaceId) {
    const currentUser = JSON.parse(localStorage.getItem('loggedInUser'));

if (!currentUser) {
    alert('Por favor, inicia sesión.');
    window.location.href = 'index.html'; // Cambia 'index.html' por la ruta de tu login
}

    const dateInput = document.getElementById(`date-${spaceId}`).value;

    if (!dateInput) {
        alert('Por favor, selecciona una fecha.');
        return;
    }

    console.log('Usuario actual:', currentUser); // Para verificar si el usuario está disponible

    fetch('http://localhost:3000/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            user_id: currentUser.id,
            space_id: spaceId,
            date: dateInput
        })
    })
        .then(response => response.json())
        .then(data => {
            if (data.message) {
                alert(data.message);
                loadUserReservations(); // Recarga las reservas del usuario
            } else {
                alert('Error: ' + data.error);
            }
        })
        .catch(error => console.error('Error al reservar:', error));
}


document.addEventListener('DOMContentLoaded', function () {
    loadUserReservations(); // Cargar las reservas del usuario al cargar la página
    fetch('http://localhost:3000/api/spaces') // También carga los espacios
        .then(response => response.json())
        .then(spaces => renderSpaces(spaces))
        .catch(error => console.error('Error cargando los espacios:', error));
});


//ver reservas
function loadUserReservations() {
    const currentUser = JSON.parse(localStorage.getItem('loggedInUser')); // Obtener usuario logueado

    if (!currentUser || !currentUser.id) {
        alert('Usuario no autenticado. Por favor, inicia sesión.');
        window.location.href = 'index.html'; // Redirigir al login
        return;
    }

    fetch(`http://localhost:3000/api/reservations/${currentUser.id}`)
        .then(response => response.json())
        .then(reservations => {
            const reservationsList = document.getElementById('userReservations');
            reservationsList.innerHTML = '<h4>Mis Reservas</h4>'; // Título de la sección

            if (reservations.length === 0) {
                reservationsList.innerHTML += '<p>No tienes reservas activas.</p>';
                return;
            }

            reservations.forEach(reservation => {
                const reservationItem = document.createElement('div');
                reservationItem.className = 'reservation-item';

                reservationItem.innerHTML = `
                    <p><strong>Espacio:</strong> ${reservation.space_name}</p>
                    <p><strong>Descripción:</strong> ${reservation.description}</p>
                    <p><strong>Capacidad:</strong> ${reservation.capacity}</p>
                    <p><strong>Fecha:</strong> ${reservation.reservation_date}</p>
                    <button onclick="updateReservation(${reservation.reservation_id})">Actualizar</button>
                    <button onclick="deleteReservation(${reservation.reservation_id})">Eliminar</button>
                `;

                reservationsList.appendChild(reservationItem);
            });
        })
        .catch(error => console.error('Error cargando reservas del usuario:', error));
}

//actualizar reservas
function updateReservation(reservationId) {
    const newDate = prompt('Ingresa la nueva fecha para la reserva (YYYY-MM-DD):');
    if (!newDate) return;

    fetch(`http://localhost:3000/api/reservations/${reservationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reservation_date: newDate })
    })
        .then(response => response.json())
        .then(data => {
            if (data.message) {
                alert(data.message);
                loadUserReservations(); // Recarga las reservas del usuario
            } else {
                alert('Error: ' + data.error);
            }
        })
        .catch(error => console.error('Error actualizando la reserva:', error));
}

//eliminar reservas
function deleteReservation(reservationId) {
    if (!confirm('¿Estás seguro de que deseas eliminar esta reserva?')) return;

    fetch(`http://localhost:3000/api/reservations/${reservationId}`, {
        method: 'DELETE'
    })
        .then(response => response.json())
        .then(data => {
            if (data.message) {
                alert(data.message);
                loadUserReservations(); // Recarga las reservas del usuario
            } else {
                alert('Error: ' + data.error);
            }
        })
        .catch(error => console.error('Error eliminando la reserva:', error));
}

function loadUserReservations() {
    fetch(`http://localhost:3000/api/reservations/${currentUser.id}`)
        .then(response => response.json())
        .then(reservations => {
            const userReservations = document.getElementById('userReservations');
            userReservations.innerHTML = '<h4>Mis Reservas</h4>';

            reservations.forEach(reservation => {
                const reservationItem = document.createElement('div');
                reservationItem.className = 'reservation-item';

                reservationItem.innerHTML = `
                    <p><strong>Espacio:</strong> ${reservation.space_name}</p>
                    <p><strong>Fecha:</strong> ${reservation.reservation_date}</p>
                    <button onclick="updateReservation(${reservation.reservation_id})">Actualizar</button>
                    <button onclick="deleteReservation(${reservation.reservation_id})">Eliminar</button>
                `;

                userReservations.appendChild(reservationItem);
            });
        })
        .catch(error => console.error('Error cargando reservas del usuario:', error));
}
function renderSpaces(spaces) {
    const spacesList = document.getElementById('spacesList');
    spacesList.innerHTML = ''; // Limpia la lista antes de renderizar

    spaces.forEach(space => {
        const spaceCard = document.createElement('div');
        spaceCard.className = 'space-card';

        spaceCard.innerHTML = `
            <h3>${space.name}</h3>
            <p>Descripción: ${space.description || 'Sin descripción'}</p>
            <p>Capacidad: ${space.capacity}</p>
            <label for="date-${space.id}">Selecciona una fecha:</label>
            <input type="date" id="date-${space.id}" />
            <button onclick="reserveSpace(${space.id})">Reservar</button>
        `;

        spacesList.appendChild(spaceCard);
    });
}
document.addEventListener('DOMContentLoaded', function () {
    loadUserReservations(); // Cargar las reservas del usuario
    fetch('http://localhost:3000/api/spaces') // Cargar los espacios disponibles
        .then(response => response.json())
        .then(spaces => renderSpaces(spaces))
        .catch(error => console.error('Error cargando los espacios:', error));
});




// Cerrar sesión
document.getElementById('logoutButton')?.addEventListener('click', function () {
    localStorage.removeItem('loggedInUser');
    window.location.href = 'index.html';
});
