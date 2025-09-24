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
    // try matchmake shortly after open
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

    if (data.type === 'roomCreated' || data.type === 'playerJoined') {
      // helper to safely send JSON and log
      const sendJson = (obj) => {
        try {
          console.log(`${name} sending:`, obj);
          ws.send(JSON.stringify(obj));
        } catch (e) {
          console.error(`${name} send failed`, e);
        }
      };

      const chatObj = { type: 'chat', text: `Hello from ${name}` };
      // send chat a few times to account for timing issues
      for (let i = 0; i < 3; i++) setTimeout(() => sendJson(chatObj), 50 + i * 120);

      const choice = name === 'Alice' ? 'stone' : 'paper';
      const choiceObj = { type: 'choice', choice };
      // send the choice multiple times staggered
      for (let i = 0; i < 5; i++) setTimeout(() => sendJson(choiceObj), 120 + i * 200);
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

      // if both clients have received result, exit successfully
      if (resultsSeen.size >= 2) {
        console.log('Both clients received result — exiting with success');
        process.exit(0);
      }
    }
  });

  ws.on('close', () => console.log(`${name} closed`));
  ws.on('error', (e) => console.error(`${name} error`, e));
  return ws;
}

// create two clients staggered slightly
const a = makeClient('Alice');
setTimeout(() => makeClient('Bob'), 200);

// overall timeout: give the test up to 20s for production latency
setTimeout(() => {
  console.log('Test timeout reached. Results seen:', Array.from(resultsSeen));
  process.exit(resultsSeen.size >= 2 ? 0 : 2);
}, 20000);
