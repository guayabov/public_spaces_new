document.getElementById('registerForm')?.addEventListener('submit', function(event) {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const users = JSON.parse(localStorage.getItem('users')) || [];
    const userExists = users.some(user => user.username === username);

    if (userExists) {
        alert('El usuario ya existe. Por favor, elige otro nombre de usuario.');
        return;
    }

    users.push({ username, email, password });
    localStorage.setItem('users', JSON.stringify(users));

    alert('Usuario registrado con éxito.');
    window.location.href = 'index.html'; 
});

document.getElementById('loginForm')?.addEventListener('submit', function(event) {
    event.preventDefault();

    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    const users = JSON.parse(localStorage.getItem('users')) || [];
    const user = users.find(user => user.username === username && user.password === password);

    if (user) {
        alert('Inicio de sesión exitoso.');
        window.location.href = 'dashboard.html'; 
    } else {
        alert('Usuario o contraseña incorrectos.');
    }
});
const spaces = [
    { id: 1, name: "Sala de Conferencias", description: "Una sala grande para conferencias.", capacity: 50, available: true },
    { id: 2, name: "Auditorio", description: "Auditorio con escenario y capacidad para 100 personas.", capacity: 100, available: true },
    { id: 3, name: "Sala de Reuniones", description: "Pequeña sala para reuniones privadas.", capacity: 10, available: true }
];

document.addEventListener('DOMContentLoaded', function() {
    const spacesList = document.getElementById('spacesList');
    const savedSpaces = JSON.parse(localStorage.getItem('spaces')) || spaces;
    
    savedSpaces.forEach(space => {
        const spaceDiv = document.createElement('div');
        spaceDiv.className = 'space';

        spaceDiv.innerHTML = `
            <h3>${space.name}</h3>
            <p>${space.description}</p>
            <p>Capacidad: ${space.capacity}</p>
            <p>Estado: ${space.available ? 'Disponible' : 'Reservado'}</p>
            <button ${!space.available ? 'disabled' : ''} onclick="reserveSpace(${space.id})">
                ${space.available ? 'Reservar' : 'No Disponible'}
            </button>
        `;

        spacesList.appendChild(spaceDiv);
    });
});

const users = [
    { username: 'admin', role: 'admin' },
    { username: 'user1', role: 'user' }
];


let reservations = JSON.parse(localStorage.getItem('reservations')) || [];

document.addEventListener('DOMContentLoaded', function() {
    const spacesList = document.getElementById('spacesList');
    const currentUser = localStorage.getItem('loggedInUser');
    const userRole = users.find(user => user.username === currentUser)?.role;

    spaces.forEach(space => {
        const spaceDiv = document.createElement('div');
        spaceDiv.className = 'space';

        spaceDiv.innerHTML = `
            <h3>${space.name}</h3>
            <p>${space.description}</p>
            <p>Capacidad: ${space.capacity}</p>
            <label for="date-${space.id}">Fecha:</label>
            <input type="date" id="date-${space.id}" />
            <button onclick="reserveSpace(${space.id})">Reservar</button>
            ${userRole === 'admin' ? '<button onclick="modifySpace()">Modificar Espacio</button>' : ''}
        `;

        spacesList.appendChild(spaceDiv);
    });
});

function reserveSpace(spaceId) {
    const currentUser = localStorage.getItem('loggedInUser');
    const dateInput = document.getElementById(`date-${spaceId}`).value;

    if (!dateInput) {
        alert('Por favor, selecciona una fecha.');
        return;
    }

    const userReservations = reservations.filter(res => res.username === currentUser);
    if (userReservations.length >= 2) {
        alert('No puedes tener más de dos reservas activas.');
        return;
    }

    const existingReservation = reservations.find(res => res.spaceId === spaceId && res.date === dateInput);
    if (existingReservation) {
        alert('Este espacio ya ha sido reservado en esa fecha.');
        return;
    }

    reservations.push({ username: currentUser, spaceId, date: dateInput });
    localStorage.setItem('reservations', JSON.stringify(reservations));

    alert('Reserva realizada con éxito.');
    window.location.reload(); 
}

document.getElementById('logoutButton').addEventListener('click', function() {
    localStorage.removeItem('loggedInUser');
    window.location.href = 'index.html'; 
});

localStorage.setItem('loggedInUser', 'user1'); 

