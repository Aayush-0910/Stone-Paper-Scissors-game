const http = require('http');
const WebSocket = require('ws');

const PORT = process.env.PORT || 8080;

// Create an HTTP server — some hosting platforms require an HTTP server
// and provide an automatic TLS/proxy in front. We attach the WebSocket
// server to this HTTP server so it works on those platforms.
// Simple HTTP handler so the host can respond to health checks
const server = http.createServer((req, res) => {
    if (req.method === 'GET' && req.url === '/api/socket') {
        // Respond to HTTP GET requests to the WebSocket endpoint
        res.writeHead(426, { 'Content-Type': 'text/plain', 'Upgrade': 'WebSocket' });
        res.end('This endpoint is for WebSocket connections only.');
        return;
    }
    if (req.method === 'GET' && (req.url === '/' || req.url === '/health')) {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('ok');
        return;
    }
    res.writeHead(404);
    res.end('Not found');
});
const wss = new WebSocket.Server({ server, path: '/api/socket' });

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
    // prefer storing room/player on the socket object so matchmaking (which
    // manipulates other sockets) is always visible to this connection's handlers
    ws.roomId = null;
    ws.playerIndex = -1;

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
                    // set metadata on the socket objects themselves
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

            case 'join': {
                const id = data.roomId;
                if (rooms[id] && rooms[id].players.length < 2) {
                    ws.roomId = id;
                    ws.playerIndex = 1;
                    rooms[id].players.push(ws);
                    broadcast(id, { type: 'playerJoined', playerCount: rooms[id].players.length });
                    console.log(`Player 2 joined Room ${id}`);
                } else {
                    ws.send(JSON.stringify({ type: 'error', message: 'Room is full or does not exist.' }));
                }
            }
                break;
                break;

            case 'chat':
                // forward chat to other players in room
                if (roomId && rooms[roomId]) {
                    const from = ws.playerName || 'Player';
                    broadcast(roomId, { type: 'chat', from, text: data.text });
                }
                break;

            case 'choice': {
                const rid = ws.roomId;
                const pidx = typeof ws.playerIndex === 'number' ? ws.playerIndex : -1;
                if (rid && rooms[rid] && pidx !== -1) {
                    rooms[rid].choices[pidx] = data.choice;
                    console.log(`Player ${pidx + 1} in room ${rid} chose ${data.choice}`);

                    // Check if both players have made a choice
                    if (rooms[rid].choices[0] && rooms[rid].choices[1]) {
                        const [choice1, choice2] = rooms[rid].choices;
                        const winner = determineWinner(choice1, choice2);
                        broadcast(rid, { type: 'result', winner, choices: rooms[rid].choices });
                        console.log(`Game in room ${rid} finished. Winner: ${winner}`);
                        // reset choices for next round
                        rooms[rid].choices = [null, null];
                    }
                }
            }
                break;
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
        const rid = ws.roomId;
        if (rid && rooms[rid]) {
            rooms[rid].players = rooms[rid].players.filter(client => client !== ws);
            if (rooms[rid].players.length === 0) {
                delete rooms[rid];
                console.log(`Room ${rid} is empty and has been deleted.`);
            } else {
                // Notify remaining player
                broadcast(rid, { type: 'playerLeft' });
                console.log(`A player left room ${rid}.`);
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
