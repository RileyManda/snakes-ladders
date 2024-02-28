const express = require("express");
const socket = require("socket.io");
const http = require("http");
const CryptoJS = require("crypto-js");
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || 'localhost';
const server = http.createServer(app);

// Set static folder
app.use(express.static("src"));

// Socket setup
const io = socket(server);

// Players array
let users = [];

// secret key from env
const secretKey = process.env.SECRET_KEY;

io.on("connection", (socket) => {
  console.log("Made socket connection", socket.id);

  socket.on("join", (data) => {
    users.push(data);
    io.sockets.emit("join", data);
  });

  socket.on("joined", () => {
    socket.emit("joined", users);
  });

  socket.on("rollDice", (data) => {
    // Encrypt the data before sending
    const encryptedData = CryptoJS.AES.encrypt(JSON.stringify(data), secretKey).toString();
    console.log("Encrypted message:", encryptedData);
    socket.emit('encryptedMessage', encryptedData); // Emit encrypted message for testing purpposes
    users[data.id].pos = data.pos;
    users[data.id].score = data.score;
    const turn = data.num != 6 ? (data.id + 1) % users.length : data.id;
    io.sockets.emit("rollDice", encryptedData, turn);
  });

  socket.on("restart", () => {
    users = [];
    io.sockets.emit("restart");
  });
});

server.listen(PORT, HOST, () => console.log(`Server running on ${HOST}:${PORT}`));