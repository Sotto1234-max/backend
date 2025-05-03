const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 5000;

let waitingUsers = [];

app.use(express.static(path.join(__dirname, 'public'))); // Serve frontend

io.on('connection', socket => {
  console.log('User connected:', socket.id);

  socket.on('offer', ({ id }) => {
    socket.peerId = id;

    // If there's a user waiting, match them
    if (waitingUsers.length > 0) {
      const partner = waitingUsers.shift();
      if (partner.connected) {
        // Tell both users to call each other
        socket.emit('offer', { id: partner.peerId });
        partner.emit('offer', { id });
      }
    } else {
      // No partner yet, wait in queue
      waitingUsers.push(socket);
    }
  });

  socket.on('stop', () => {
    // Remove from waiting queue if still there
    waitingUsers = waitingUsers.filter(s => s !== socket);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    waitingUsers = waitingUsers.filter(s => s !== socket);
  });
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
