const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const { ExpressPeerServer } = require('peer');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

const peerServer = ExpressPeerServer(server, {
  debug: true,
  path: "/peerjs"
});

app.use("/peerjs", peerServer);
app.use(express.static(path.join(__dirname, "public")));

let waitingUser = null;

io.on("connection", (socket) => {
  console.log("User connected");

  socket.on("join", (peerId) => {
    socket.peerId = peerId;

    if (waitingUser) {
      socket.partner = waitingUser;
      waitingUser.partner = socket;

      socket.emit("match", waitingUser.peerId);
      waitingUser.emit("match", socket.peerId);

      waitingUser = null;
    } else {
      waitingUser = socket;
    }
  });

  socket.on("leave", () => {
    if (socket.partner) {
      socket.partner.emit("leave");
      socket.partner.partner = null;
    }
    if (waitingUser === socket) {
      waitingUser = null;
    }
    socket.partner = null;
  });

  socket.on("disconnect", () => {
    if (socket.partner) {
      socket.partner.emit("leave");
      socket.partner.partner = null;
    }
    if (waitingUser === socket) {
      waitingUser = null;
    }
  });
});

server.listen(3000, () => {
  console.log("✅ Server running on http://localhost:3000");
});
