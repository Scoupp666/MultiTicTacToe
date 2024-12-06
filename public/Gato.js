const socket = io(); // Conexión al servidor
let role = null; // Rol del jugador (O o X)
let playerCount = 0; // Número de jugadores conectados
let currPlayer = 'O'; // Jugador actual
let gameOver = false; // Estado del juego
let board = [
    [' ', ' ', ' '],
    [' ', ' ', ' '],
    [' ', ' ', ' ']
];

// Escucha el rol asignado por el servidor
socket.on('role', (assignedRole) => {
    role = assignedRole;
    document.getElementById("turn-indicator").innerText = `Tu rol es: ${role}`;
});

// Notifica si el juego está lleno
socket.on('full', (message) => {
    alert(message);
    document.getElementById("turn-indicator").innerText = "El juego está lleno. Inténtalo más tarde.";
});

// Escucha el número de jugadores conectados
socket.on('playerCount', (count) => {
    playerCount = count;
    if (playerCount < 2) {
        document.getElementById("turn-indicator").innerText = "Esperando a otro jugador...";
    }
});

// Escucha los movimientos de otros jugadores
socket.on('move', (data) => {
    let { r, c, player } = data;
    board[r][c] = player;
    document.getElementById(`${r}-${c}`).innerText = player;
    currPlayer = (currPlayer == 'O') ? 'X' : 'O';
    updateTurnIndicator();
    checkWinner();
});

// Escucha el evento de reinicio
socket.on('reset', () => {
    resetBoard();
});

function setTile() {
    if (gameOver || playerCount < 2) return;
    if (currPlayer !== role) return; // Solo permite jugar si es el turno del jugador

    let coords = this.id.split("-");
    let r = parseInt(coords[0]);
    let c = parseInt(coords[1]);

    if (board[r][c] != ' ') return;

    board[r][c] = currPlayer;
    this.innerText = currPlayer;

    // Enviar movimiento al servidor
    socket.emit('move', { r, c, player: currPlayer });

    currPlayer = (currPlayer == 'O') ? 'X' : 'O';
    updateTurnIndicator();

    checkWinner();
}

function updateTurnIndicator() {
    document.getElementById("turn-indicator").innerText = `Turno de: ${currPlayer}`;
}

function checkWinner() {
    const winningCombinations = [
        [[0, 0], [0, 1], [0, 2]],
        [[1, 0], [1, 1], [1, 2]],
        [[2, 0], [2, 1], [2, 2]],
        [[0, 0], [1, 0], [2, 0]],
        [[0, 1], [1, 1], [2, 1]],
        [[0, 2], [1, 2], [2, 2]],
        [[0, 0], [1, 1], [2, 2]],
        [[0, 2], [1, 1], [2, 0]]
    ];

    for (let combination of winningCombinations) {
        const [a, b, c] = combination;
        if (board[a[0]][a[1]] !== ' ' && board[a[0]][a[1]] === board[b[0]][b[1]] && board[a[0]][a[1]] === board[c[0]][c[1]]) {
            gameOver = true;
            document.getElementById("turn-indicator").innerText = `¡${board[a[0]][a[1]]} ha ganado!`;
            highlightWinningTiles(combination);
            return;
        }
    }

    if (board.flat().every(cell => cell !== ' ')) {
        gameOver = true;
        document.getElementById("turn-indicator").innerText = "¡Es un empate!";
    }
}

function highlightWinningTiles(combination) {
    combination.forEach(([r, c]) => {
        document.getElementById(`${r}-${c}`).classList.add("winner");
    });
}

// Inicializar el tablero
function initializeBoard() {
    const boardElement = document.getElementById("board");
    for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
            const tile = document.createElement("div");
            tile.id = `${r}-${c}`;
            tile.classList.add("tile");
            tile.addEventListener("click", setTile);
            boardElement.appendChild(tile);
        }
    }
}

function resetBoard() {
    board = [
        [' ', ' ', ' '],
        [' ', ' ', ' '],
        [' ', ' ', ' ']
    ];
    gameOver = false;
    currPlayer = 'O';
    document.getElementById("turn-indicator").innerText = `Turno de: ${currPlayer}`;
    document.querySelectorAll(".tile").forEach(tile => {
        tile.innerText = '';
        tile.classList.remove("winner");
    });
}

// Función para reiniciar el juego
function resetGame() {
    socket.emit('reset');
    resetBoard();
}

initializeBoard();