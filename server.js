const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const os = require('os');

// Configuración del servidor
const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Sirve los archivos estáticos del cliente
app.use(express.static('public'));

// Obtiene la dirección IP local
const networkInterfaces = os.networkInterfaces();
const ip = Object.values(networkInterfaces)
    .flat()
    .find((i) => i.family === 'IPv4' && !i.internal)?.address || 'localhost';

// Almacena los jugadores y sus roles
const players = {};

// Manejo de conexiones
io.on('connection', (socket) => {
    if (Object.keys(players).length >= 2) {
        // Si ya hay dos jugadores, rechazar la conexión
        socket.emit('full', "El juego está lleno. Inténtalo más tarde.");
        socket.disconnect();
        return;
    }

    // Asignar roles O y X en el orden de conexión
    const role = Object.keys(players).length === 0 ? 'O' : 'X';
    players[socket.id] = role;
    console.log(`Jugador conectado: ${socket.id} como ${role}`);

    // Informar al cliente de su rol
    socket.emit('role', role);

    // Notificar a todos los jugadores sobre la conexión
    io.emit('playerCount', Object.keys(players).length);

    // Escucha el movimiento de un jugador y lo retransmite al oponente
    socket.on('move', (data) => {
        socket.broadcast.emit('move', data);
    });

    // Maneja el evento de reinicio y lo retransmite a otros jugadores
    socket.on('reset', () => {
        socket.broadcast.emit('reset');
    });

    // Notifica cuando un jugador se desconecta
    socket.on('disconnect', () => {
        console.log(`Jugador desconectado: ${socket.id}`);
        delete players[socket.id];
        io.emit('playerCount', Object.keys(players).length); // Actualizar contador
    });
});

// Inicia el servidor en el puerto 3000 y en la IP local
server.listen(3000, ip, () => {
    console.log(`Servidor corriendo en http://${ip}:3000`);
});