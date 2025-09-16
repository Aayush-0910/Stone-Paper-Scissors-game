const WebSocket = require('ws');
const http = require('http');

// Global WebSocket server instance
let wss;
const rooms = {}; // Your existing rooms object

function generateRoomId() {
    return Math.random().toString(36).substring(2, 7);
}

function broadcast(roomId, data) {
    if (rooms[roomId]) {
        rooms[roomId].players.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(data));
            }
        });
    }
}

function determineWinner(choice1, choice2) {
    if (choice1 === choice2) return 'draw';
    if (
        (choice1 === 'stone' && choice2 === 'scissors') ||
        (choice1 === 'paper' && choice2 === 'stone') ||
        (choice1 === 'scissors' && choice2 === 'paper')
    ) {
        return 'player1';
    }
    return 'player2';
}

// Create a minimal HTTP server to handle WebSocket upgrades
const server = http.createServer((req, res) => {
    // This server is primarily for WebSocket upgrades.
    // Regular HTTP requests to this endpoint can be ignored or return a simple message.
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('WebSocket server is running (for upgrades)');
});

// Initialize WebSocket server if it doesn't exist
if (!wss) {
    wss = new WebSocket.Server({ noServer: true });

    wss.on('connection', ws => {
        console.log('Client connected to Vercel WebSocket');
        let roomId = null;
        let playerIndex = -1;

        ws.on('message', message => {
            const data = JSON.parse(message);
            console.log('Received:', data);

            switch (data.type) {
                case 'create':
                    roomId = generateRoomId();
                    playerIndex = 0;
                    rooms[roomId] = {
                        players: [ws],
                        choices: [null, null]
                    };
                    ws.roomId = roomId;
                    ws.send(JSON.stringify({ type: 'roomCreated', roomId }));
                    console.log(`Room ${roomId} created by Player 1`);
                    break;

                case 'join':
                    const id = data.roomId;
                    if (rooms[id] && rooms[id].players.length < 2) {
                        roomId = id;
                        playerIndex = 1;
                        rooms[roomId].players.push(ws);
                        ws.roomId = roomId;
                        broadcast(roomId, { type: 'playerJoined', playerCount: rooms[roomId].players.length });
                        console.log(`Player 2 joined Room ${roomId}`);
                    } else {
                        ws.send(JSON.stringify({ type: 'error', message: 'Room is full or does not exist.' }));
                    }
                    break;

                case 'choice':
                    if (roomId && rooms[roomId] && playerIndex !== -1) {
                        rooms[roomId].choices[playerIndex] = data.choice;
                        console.log(`Player ${playerIndex + 1} in room ${roomId} chose ${data.choice}`);
                        
                        if (rooms[roomId].choices[0] && rooms[roomId].choices[1]) {
                            const [choice1, choice2] = rooms[roomId].choices;
                            const winner = determineWinner(choice1, choice2);
                            broadcast(roomId, { type: 'result', winner, choices: rooms[roomId].choices });
                            console.log(`Game in room ${roomId} finished. Winner: ${winner}`);
                        }
                    }
                    break;
                
                case 'reset':
                    if (roomId && rooms[roomId]) {
                        rooms[roomId].choices = [null, null];
                        broadcast(roomId, { type: 'reset' });
                        console.log(`Game in room ${roomId} has been reset.`);
                    }
                    break;
            }
        });

        ws.on('close', () => {
            console.log('Client disconnected');
            if (roomId && rooms[roomId]) {
                rooms[roomId].players = rooms[roomId].players.filter(client => client !== ws);
                if (rooms[roomId].players.length === 0) {
                    delete rooms[roomId];
                    console.log(`Room ${roomId} is empty and has been deleted.`);
                } else {
                    broadcast(roomId, { type: 'playerLeft' });
                    console.log(`A player left room ${roomId}.`);
                }
            }
        });
    });
}

// Vercel serverless function handler
module.exports = (req, res) => {
    if (req.headers.upgrade && req.headers.upgrade.toLowerCase() === 'websocket') {
        // Handle WebSocket upgrade
        server.emit('upgrade', req, req.socket, Buffer.alloc(0));
    } else {
        // Handle regular HTTP requests
        server.emit('request', req, res);
    }
};

server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, ws => {
        wss.emit('connection', ws, request);
    });
});
