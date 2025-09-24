const http = require('http');
const WebSocket = require('ws');

const PORT = process.env.PORT || 8080;

// Create an HTTP server — some hosting platforms require an HTTP server
// and provide an automatic TLS/proxy in front. We attach the WebSocket
// server to this HTTP server so it works on those platforms.
const server = http.createServer();
const wss = new WebSocket.Server({ server });

const rooms = {};
const matchQueue = [];

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

wss.on('connection', ws => {
    console.log('Client connected');
    let roomId = null;
    let playerIndex = -1;

    ws.on('message', message => {
        const data = JSON.parse(message);
        console.log('Received:', data);

        switch (data.type) {
            case 'setName':
                ws.playerName = data.name || 'Player';
                break;

            case 'matchmake':
                // add to matchmaking queue if not already queued
                if (!matchQueue.includes(ws)) {
                    matchQueue.push(ws);
                }
                // try to match
                if (matchQueue.length >= 2) {
                    const a = matchQueue.shift();
                    const b = matchQueue.shift();
                    const newRoomId = generateRoomId();
                    rooms[newRoomId] = {
                        players: [a, b],
                        choices: [null, null]
                    };
                    a.roomId = newRoomId; a.playerIndex = 0;
                    b.roomId = newRoomId; b.playerIndex = 1;
                    // notify both players of match
                    a.send(JSON.stringify({ type: 'roomCreated', roomId: newRoomId, opponent: b.playerName || 'Opponent' }));
                    b.send(JSON.stringify({ type: 'roomCreated', roomId: newRoomId, opponent: a.playerName || 'Opponent' }));
                    console.log(`Matched players into room ${newRoomId}`);
                }
                break;

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

            case 'chat':
                // forward chat to other players in room
                if (roomId && rooms[roomId]) {
                    const from = ws.playerName || 'Player';
                    broadcast(roomId, { type: 'chat', from, text: data.text });
                }
                break;

            case 'choice':
                if (roomId && rooms[roomId] && playerIndex !== -1) {
                    rooms[roomId].choices[playerIndex] = data.choice;
                    console.log(`Player ${playerIndex + 1} in room ${roomId} chose ${data.choice}`);
                    
                    // Check if both players have made a choice
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
                // Notify remaining player
                broadcast(roomId, { type: 'playerLeft' });
                console.log(`A player left room ${roomId}.`);
            }
        }
    });
});

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

server.listen(PORT, () => {
    console.log(`WebSocket server started on port ${PORT}`);
});
