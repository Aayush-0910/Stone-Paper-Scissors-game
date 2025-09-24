const WebSocket = require('ws');

const url = process.env.WS_URL || 'ws://localhost:8080';

function makeClient(name) {
  const ws = new WebSocket(url);
  ws.name = name;
  ws.hasResult = false;

  ws.on('open', () => {
    console.log(`${name} connected`);
    ws.send(JSON.stringify({ type: 'setName', name }));
    ws.send(JSON.stringify({ type: 'matchmake' }));
  });

  ws.on('message', (m) => {
    const data = JSON.parse(m.toString());
    console.log(`${name} received:`, data);

    if (data.type === 'roomCreated' || data.type === 'playerJoined') {
      // send chat + choice immediately
      ws.send(JSON.stringify({ type: 'chat', text: `Hello from ${name}` }));
      const choice = name === 'Alice' ? 'stone' : 'paper';
      setTimeout(() => ws.send(JSON.stringify({ type: 'choice', choice })), 50);
    }

    if (data.type === 'chat') {
      console.log(`${name} sees chat from ${data.from || 'unknown'}: ${data.text}`);
    }

    if (data.type === 'result') {
      console.log(`${name} got result:`, data);
      ws.hasResult = true;
      setTimeout(() => { if (ws.readyState === WebSocket.OPEN) ws.close(); }, 200);
    }
  });

  ws.on('close', () => console.log(`${name} closed`));
  ws.on('error', (e) => console.error(`${name} error`, e));
  return ws;
}

const clients = [];
clients.push(makeClient('Alice'));
setTimeout(() => clients.push(makeClient('Bob')), 100);

const start = Date.now();
const maxMs = 15000;
const interval = setInterval(() => {
  const allDone = clients.length >= 2 && clients.every(c => c.hasResult);
  if (allDone) {
    console.log('Both clients received results — finishing test');
    clearInterval(interval);
    process.exit(0);
  }
  if (Date.now() - start > maxMs) {
    console.log('Timeout reached; exiting test');
    clearInterval(interval);
    process.exit(0);
  }
}, 500);
