const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { ExpressPeerServer } = require('peer');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Setup PeerJS signaling server
const { ExpressPeerServer } = require('peer');
const peerServer = ExpressPeerServer(server, {
  debug: true,
  path: '/peerjs'
});
app.use('/peerjs', peerServer); // must be before app.use(express.static(...))


// Serve frontend
app.use(express.static(path.join(__dirname, 'public')));

// 1v1 matchmaking
let waitingUser = null;

io.on('connection', (socket) => {
  console.log('User connected');

  socket.on('join', (peerId) => {
    socket.peerId = peerId;

    if (waitingUser) {
      // Match found
      socket.partner = waitingUser;
      waitingUser.partner = socket;

      waitingUser.emit('match', socket.peerId);
      socket.emit('match', waitingUser.peerId);

      waitingUser = null;
    } else {
      // No match yet, wait
      waitingUser = socket;
    }
  });

  socket.on('leave', () => {
    if (socket.partner) {
      socket.partner.emit('leave');
      socket.partner.partner = null;
    }
    if (waitingUser === socket) {
      waitingUser = null;
    }
    socket.partner = null;
  });

  socket.on('disconnect', () => {
    if (socket.partner) {
      socket.partner.emit('leave');
      socket.partner.partner = null;
    }
    if (waitingUser === socket) {
      waitingUser = null;
    }
  });
});

server.listen(3000, () => {
  console.log('✅ Server running on http://localhost:3000');
});
