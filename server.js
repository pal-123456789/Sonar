import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

const server = createServer(app);
const wss = new WebSocketServer({ server });

console.log("🚀 RAW DATA SERVER STARTED");

// 1. WebSocket: Broadcast raw data to anyone who connects
wss.on('connection', (ws, req) => {
  const clientIp = req.socket.remoteAddress;
  console.log(`🔌 New Listener Connected from: ${clientIp}`);
});

// 2. HTTP POST: Receive data from ESP32
app.post('/api/telemetry', (req, res) => {
  const { angle, distance } = req.body;

  // Log to Server Terminal
  console.log(`📥 RAW IN: Angle=${angle}, Dist=${distance}`);

  // Broadcast to all WebSocket listeners (e.g., your customized URL)
  const jsonPayload = JSON.stringify({ angle, distance });
  
  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(jsonPayload);
    }
  });

  res.sendStatus(200); // Tell ESP32 "Data Received"
});

// Start Server on Port 3001
server.listen(3001, '0.0.0.0', () => {
  console.log(`✅ Server Listening on Port 3001`);
  console.log(`👉 Raw WS Stream available at: ws://YOUR_PC_IP:3001`);
});