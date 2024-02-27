const express = require("express");
const socket = require("socket.io");
const http = require("http");
const CryptoJS = require("crypto-js");

const app = express();
const PORT = 3001 || process.env.PORT;
const server = http.createServer(app);

// Set static folder
app.use(express.static("src"));

// Socket setup
const io = socket(server);

// Players array
let users = [];

// Generate a random secret key for encryption/decryption
const secretKey = generateSecretKey();

// Function to generate a random secret key
function generateSecretKey() {
  return CryptoJS.lib.WordArray.random(128 / 8).toString();
}

// Function to encrypt data
function encryptData(data, secretKey) {
  const ciphertext = CryptoJS.AES.encrypt(JSON.stringify(data), secretKey).toString();
  console.log("Data encrypted:", ciphertext);
  return ciphertext;
}

// Function to decrypt data
function decryptData(ciphertext, secretKey) {
  const bytes = CryptoJS.AES.decrypt(ciphertext, secretKey);
  const decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
  console.log("Data decrypted:", decryptedData);
  return decryptedData;
}

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
    if (Array.isArray(data)) {
      data.forEach((item) => {
        users[item.id].pos = item.pos;
        users[item.id].score = item.score;
      });
      const turn = data.some((item) => item.num !== 6)
        ? (data[0].id + 1) % users.length
        : data[0].id;
      io.sockets.emit("rollDice", data, turn);
    }
  });

  socket.on("restart", () => {
    users = [];
    io.sockets.emit("restart");
  });
});


server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
