


document.getElementById('adminRegisterForm')?.addEventListener('submit', function (event) {
    event.preventDefault();
    

    const username = document.getElementById('adminUsername').value;
    const email = document.getElementById('adminEmail').value;
    const password = document.getElementById('adminPassword').value;
    const adminKey = document.getElementById('adminKey').value;

    fetch('http://localhost:3000/api/register-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password, adminKey })
    })
        .then(response => response.json())
        .then(data => {
            if (data.message) {
                alert(data.message); // Mostrar mensaje de éxito
                window.location.href = 'index.html'; // Redirigir a la página principal
            } else if (data.error) {
                alert('Error: ' + data.error); // Mostrar errores
            }
        })
        .catch(error => console.error('Error registrando administrador:', error));
});
