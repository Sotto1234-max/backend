const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Serve frontend
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

let users = [];

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('offer', (offer) => {
    const user = users.find((u) => u.id !== socket.id);
    if (user) {
      io.to(user.id).emit('offer', { id: socket.id });
    } else {
      users.push({ id: socket.id });
    }
  });

  socket.on('stop', () => {
    users = users.filter((user) => user.id !== socket.id);
    socket.disconnect();
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    users = users.filter((user) => user.id !== socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
