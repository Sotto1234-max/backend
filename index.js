const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.get('/', (req, res) => {
  res.send('Video Chat Backend Running');
});

let users = [];

io.on('connection', (socket) => {
  console.log('a user connected');

  socket.on('offer', (offer) => {
    const user = users.find((u) => u.id !== socket.id);
    if (user) {
      io.to(user.id).emit('offer', offer);
    } else {
      users.push({ id: socket.id });
    }
  });

  socket.on('answer', (answer) => {
    const user = users.find((u) => u.id !== socket.id);
    if (user) {
      io.to(user.id).emit('answer', answer);
    }
  });

  socket.on('ice-candidate', (candidate) => {
    const user = users.find((u) => u.id !== socket.id);
    if (user) {
      io.to(user.id).emit('ice-candidate', candidate);
    }
  });

  socket.on('stop', () => {
    users = users.filter((user) => user.id !== socket.id);
    socket.disconnect();
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
    users = users.filter((user) => user.id !== socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
