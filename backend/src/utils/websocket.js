const { WebSocketServer, WebSocket } = require('ws');

let wss = null;

/**
 * Initializes the WebSocket server using the existing HTTP server instance.
 * Shares the same port (5000) with Express.
 *
 * @param {import('http').Server} server
 */
function initWebSocketServer(server) {
  wss = new WebSocketServer({ server });

  wss.on('connection', (ws) => {
    console.log('[WebSocket] New client connected');

    // Send initial handshake message to the client
    ws.send(JSON.stringify({
      type: 'CONNECTED',
      message: 'Connected to Mini API Tester live WebSocket stream',
    }));

    ws.on('close', () => {
      console.log('[WebSocket] Client disconnected');
    });

    ws.on('error', (err) => {
      console.error('[WebSocket] Error:', err.message);
    });
  });

  return wss;
}

/**
 * Broadcasts an event to all currently connected WebSocket clients.
 *
 * @param {string} type - Event type (e.g. 'RUN_START', 'TEST_RESULT', 'RUN_COMPLETE')
 * @param {object} payload - Event data to deliver to the frontend
 */
function broadcast(type, payload = {}) {
  if (!wss) return;

  const data = JSON.stringify({ type, ...payload });

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

module.exports = {
  initWebSocketServer,
  broadcast,
};
