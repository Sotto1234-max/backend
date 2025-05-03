const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*', // Allow all domains
    methods: ['GET', 'POST'],
  }
});

app.get('/', (req, res) => {
  res.send('1v1 Video Chat Backend Running');
});

let users = [];

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // When an offer is sent from a user, find a user to connect to
  socket.on('offer', (offer) => {
    // Try to find a user to connect with
    const user = users.find((u) => u.id !== socket.id);
    if (user) {
      io.to(user.id).emit('offer', { id: socket.id });
    } else {
      users.push({ id: socket.id });
    }
  });

  // When the user sends an answer, forward it to the other user
  socket.on('answer', (answer) => {
    const user = users.find((u) => u.id !== socket.id);
    if (user) {
      io.to(user.id).emit('answer', answer);
    }
  });

  // ICE candidate exchange
  socket.on('ice-candidate', (candidate) => {
    const user = users.find((u) => u.id !== socket.id);
    if (user) {
      io.to(user.id).emit('ice-candidate', candidate);
    }
  });

  // When the user wants to stop the call
  socket.on('stop', () => {
    // Remove the user from the list and disconnect
    users = users.filter((user) => user.id !== socket.id);
    socket.disconnect();
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    users = users.filter((user) => user.id !== socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
