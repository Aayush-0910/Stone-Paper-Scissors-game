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

    if (data.type === 'roomCreated') {
      // when matched, send a chat after short delay
      setTimeout(() => {
        ws.send(JSON.stringify({ type: 'chat', text: `Hello from ${name}` }));
      }, 200);
      // send a choice
      setTimeout(() => {
        const choice = name === 'Alice' ? 'stone' : 'paper';
        ws.send(JSON.stringify({ type: 'choice', choice }));


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
