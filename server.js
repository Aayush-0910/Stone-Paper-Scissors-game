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
        rooms[roomId].players.forEach((client, idx) => {
            try {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(data));
                } else {
                    console.log(`broadcast: client at index ${idx} in room ${roomId} not open (state=${client.readyState})`);
                }
            } catch (err) {
                console.error(`broadcast: error sending to client ${idx} in room ${roomId}:`, err);
            }
        });
    }
}

wss.on('connection', ws => {
    console.log('Client connected');
    // roomId & playerIndex are stored on the socket object (ws.roomId, ws.playerIndex)

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
                    // store room info on the socket objects so their message handlers can access them
                    a.roomId = newRoomId; a.playerIndex = 0;
                    b.roomId = newRoomId; b.playerIndex = 1;
                    // notify both players of match
                    a.send(JSON.stringify({ type: 'roomCreated', roomId: newRoomId, opponent: b.playerName || 'Opponent' }));
                    b.send(JSON.stringify({ type: 'roomCreated', roomId: newRoomId, opponent: a.playerName || 'Opponent' }));
                    console.log(`Matched players into room ${newRoomId}`);
                }
                break;

            case 'create':
                // create a room and attach it to this socket
                const newId = generateRoomId();
                rooms[newId] = {
                    players: [ws],
                    choices: [null, null]
                };
                ws.roomId = newId;
                ws.playerIndex = 0;
                ws.send(JSON.stringify({ type: 'roomCreated', roomId }));
                console.log(`Room ${roomId} created by Player 1`);
                break;

            case 'join':
                const id = data.roomId;
                if (rooms[id] && rooms[id].players.length < 2) {
                    // attach this socket to the room
                    rooms[id].players.push(ws);
                    ws.roomId = id;
                    ws.playerIndex = 1;
                    broadcast(id, { type: 'playerJoined', playerCount: rooms[id].players.length });
                    console.log(`Player 2 joined Room ${id}`);
                } else {
                    ws.send(JSON.stringify({ type: 'error', message: 'Room is full or does not exist.' }));
                }
                break;

            case 'chat':
                // forward chat to other players in room
                if (ws.roomId && rooms[ws.roomId]) {
                    const from = ws.playerName || 'Player';
                    broadcast(ws.roomId, { type: 'chat', from, text: data.text });
                }
                break;

            case 'choice':
                if (ws.roomId && rooms[ws.roomId] && typeof ws.playerIndex === 'number') {
                    rooms[ws.roomId].choices[ws.playerIndex] = data.choice;
                    console.log(`choice: playerIndex=${ws.playerIndex} room=${ws.roomId} choice=${data.choice}`);

                    // Check if both players have made a choice
                    const choices = rooms[ws.roomId].choices;
                    console.log(`current choices for room ${ws.roomId}:`, choices);
                    if (choices[0] && choices[1]) {
                        const [choice1, choice2] = choices;
                        const winner = determineWinner(choice1, choice2);
                        console.log(`will broadcast result for room ${ws.roomId} — winner=${winner} choices=${JSON.stringify(choices)}`);
                        broadcast(ws.roomId, { type: 'result', winner, choices });
                        console.log(`Game in room ${ws.roomId} finished. Winner: ${winner}`);
                        // reset choices for next round
                        rooms[ws.roomId].choices = [null, null];
                        console.log(`choices for room ${ws.roomId} reset to [null,null]`);
                    }
                }
                break;
            
            case 'reset':
                if (ws.roomId && rooms[ws.roomId]) {
                    rooms[ws.roomId].choices = [null, null];
                    broadcast(ws.roomId, { type: 'reset' });
                    console.log(`Game in room ${ws.roomId} has been reset.`);
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
