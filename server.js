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

io.on("connection", (socket) => {
  console.log("Made socket connection", socket.id);

  socket.on("join", (encryptedData) => {
    const decryptedData = decryptMessage(encryptedData);
    console.log("Decrypted Message:", decryptedData);
    const data = JSON.parse(decryptedData);
    users.push(data);
    io.sockets.emit("join", data);
  });

  socket.on("joined", () => {
    socket.emit("joined", users);
  });

  socket.on("rollDice", (encryptedData) => {
    const decryptedData = decryptMessage(encryptedData);
    console.log("Decrypted Message:", decryptedData);
    const data = JSON.parse(decryptedData);
    users[data.id].pos = data.pos;
    users[data.id].score = data.score;
    const turn = data.num != 6 ? (data.id + 1) % users.length : data.id;
    io.sockets.emit("rollDice", data, turn);
  });

  socket.on("restart", () => {
    users = [];
    io.sockets.emit("restart");
  });
});

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

const mysecretencryptionkey = 'wedrjjshhfbu473hfvdhj';
// Function to decrypt message
function decryptMessage(encryptedMessage) {
  const bytes = CryptoJS.AES.decrypt(encryptedMessage, mysecretencryptionkey);
  return bytes.toString(CryptoJS.enc.Utf8);
}
