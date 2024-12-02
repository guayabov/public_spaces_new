document.addEventListener('DOMContentLoaded', function () {
    // Verificar si el usuario logueado es un admin
    const currentUser = JSON.parse(localStorage.getItem('loggedInUser'));

    if (!currentUser || currentUser.role !== 'admin') {
        alert('No tienes permisos para acceder a esta página.');
        window.location.href = 'index.html'; // Redirigir al login
        return;
    }

    // Mostrar las acciones de administración
    document.getElementById('adminActions').style.display = 'block';

    // Cargar espacios existentes
    loadSpaces();

    // Manejar creación de nuevos espacios
    document.getElementById('spaceForm').addEventListener('submit', function (event) {
        event.preventDefault();

        const name = document.getElementById('spaceName').value;
        const description = document.getElementById('spaceDescription').value;
        const capacity = document.getElementById('spaceCapacity').value;

        if (!name || !capacity) {
            alert('El nombre y la capacidad son obligatorios.');
            return;
        }

        // Realizar la solicitud POST para crear un nuevo espacio
        fetch('http://localhost:3000/api/spaces', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, description, capacity })
        })
            .then(response => response.json())
            .then(data => {
                if (data.message) {
                    alert(data.message);
                    loadSpaces(); // Recargar espacios
                    document.getElementById('spaceForm').reset(); // Limpiar el formulario
                } else {
                    alert('Error: ' + data.error);
                }
            })
            .catch(error => console.error('Error creando espacio:', error));
    });
});

// Función para cargar espacios existentes
function loadSpaces() {
    fetch('http://localhost:3000/api/spaces')
        .then(response => response.json())
        .then(spaces => renderSpaces(spaces))
        .catch(error => console.error('Error cargando los espacios:', error));
}

// Función para renderizar los espacios en el DOM
function renderSpaces(spaces) {
    const spacesList = document.getElementById('spacesList');
    spacesList.innerHTML = ''; // Limpiar la lista

    spaces.forEach(space => {
        const spaceCard = document.createElement('div');
        spaceCard.className = 'space-card';

        spaceCard.innerHTML = `
            <h3>${space.name}</h3>
            <p>Descripción: ${space.description || 'Sin descripción'}</p>
            <p>Capacidad: ${space.capacity}</p>
            <button onclick="updateSpace(${space.id})">Editar</button>
            <button onclick="deleteSpace(${space.id})">Eliminar</button>
        `;

        spacesList.appendChild(spaceCard);
    });
}

// Función para actualizar un espacio
function updateSpace(spaceId) {
    const name = prompt('Nuevo nombre del espacio:');
    const description = prompt('Nueva descripción del espacio:');
    const capacity = prompt('Nueva capacidad del espacio:');

    if (!name || !capacity) {
        alert('El nombre y la capacidad son obligatorios.');
        return;
    }

    fetch(`http://localhost:3000/api/spaces/${spaceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, capacity })
    })
        .then(response => response.json())
        .then(data => {
            if (data.message) {
                alert(data.message);
                loadSpaces(); // Recargar espacios
            } else {
                alert('Error: ' + data.error);
            }
        })
        .catch(error => console.error('Error actualizando el espacio:', error));
}

// Función para eliminar un espacio
function deleteSpace(spaceId) {
    if (!confirm('¿Estás seguro de que deseas eliminar este espacio?')) return;

    fetch(`http://localhost:3000/api/spaces/${spaceId}`, {
        method: 'DELETE'
    })
        .then(response => response.json())
        .then(data => {
            if (data.message) {
                alert(data.message);
                loadSpaces(); // Recargar espacios
            } else {
                alert('Error: ' + data.error);
            }
        })
        .catch(error => console.error('Error eliminando el espacio:', error));
}

// Cerrar sesión
document.getElementById('logoutButton').addEventListener('click', function () {
    localStorage.removeItem('loggedInUser');
    window.location.href = 'index.html';
});
