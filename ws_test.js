const WebSocket = require('ws');

const url = process.env.WS_URL || 'ws://localhost:8080';

// track which clients have seen a result
const resultsSeen = new Set();

function makeClient(name) {
  const ws = new WebSocket(url);
  ws.name = name;
  ws.hasResult = false;

  ws.on('open', () => {
    console.log(`${name} connected`);
    ws.send(JSON.stringify({ type: 'setName', name }));
    // try matchmake
    setTimeout(() => ws.send(JSON.stringify({ type: 'matchmake' })), 200);
  });

  ws.on('message', (m) => {
    let data;
    try {
      data = JSON.parse(m.toString());
    } catch (e) {
      console.error(`${name} failed to parse message`, e);
      return;
    }
    console.log(`${name} received:`, data);
<<<<<<< Updated upstream
    if (data.type === 'roomCreated') {
      // when matched, send a chat after short delay
      setTimeout(() => {
        ws.send(JSON.stringify({ type: 'chat', text: `Hello from ${name}` }));
      }, 200);
      // send a choice
      setTimeout(() => {
        const choice = name === 'Alice' ? 'stone' : 'paper';
        ws.send(JSON.stringify({ type: 'choice', choice }));
      }, 400);
=======

    if (data.type === 'roomCreated' || data.type === 'playerJoined') {
      // send chat + choice immediately (with retries) and log sends
      const sendJson = (obj) => {
        try {
          console.log(`${name} sending:`, obj);
          ws.send(JSON.stringify(obj));
        } catch (e) {
          console.error(`${name} send failed`, e);
        }
      };

      const chatObj = { type: 'chat', text: `Hello from ${name}` };
      // send chat once and retry a couple of times
      for (let i = 0; i < 3; i++) {
        setTimeout(() => sendJson(chatObj), 50 + i * 120);
      }

      const choice = name === 'Alice' ? 'stone' : 'paper';
      const choiceObj = { type: 'choice', choice };
      // send the choice a few times to account for timing
      for (let i = 0; i < 4; i++) {
        setTimeout(() => sendJson(choiceObj), 120 + i * 150);
      }
    }

    if (data.type === 'chat') {
      console.log(`${name} sees chat from ${data.from || 'unknown'}: ${data.text}`);
    }

    if (data.type === 'result') {
      console.log(`${name} got result:`, data);
      if (!ws.hasResult) {
        ws.hasResult = true;
        resultsSeen.add(name);
      }
      // close shortly after receiving result
      setTimeout(() => { if (ws.readyState === WebSocket.OPEN) ws.close(); }, 200);
>>>>>>> Stashed changes
    }
  });

  ws.on('close', () => console.log(`${name} closed`));
  ws.on('error', (e) => console.error(`${name} error`, e));
  return ws;
}

// create two clients
const a = makeClient('Alice');
setTimeout(() => makeClient('Bob'), 100);

// exit after a few seconds
setTimeout(() => {
  console.log('Test complete, exiting');
  process.exit(0);
}, 4000);
