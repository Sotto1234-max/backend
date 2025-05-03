const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const queue = [];

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (_, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

io.on('connection', (socket) => {
  console.log("Connected:", socket.id);

  socket.on('ready', (peerId) => {
    socket.peerId = peerId;

    if (queue.length > 0) {
      const partner = queue.shift();
      // Tell each user the other's peer ID
      socket.emit('peerId', partner.peerId);
      partner.emit('peerId', peerId);
    } else {
      queue.push(socket);
    }
  });

  socket.on('leave', () => {
    queue.splice(queue.indexOf(socket), 1);
  });

  socket.on('disconnect', () => {
    console.log("Disconnected:", socket.id);
    const index = queue.indexOf(socket);
    if (index !== -1) {
      queue.splice(index, 1);
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
