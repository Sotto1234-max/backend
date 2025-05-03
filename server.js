const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

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
      // Wait for a partner
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

app.use(express.static(path.join(__dirname, 'public'))); // for frontend

server.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
