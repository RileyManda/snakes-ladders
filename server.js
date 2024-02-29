const express = require("express");
const socket = require("socket.io");
const http = require("http");
const CryptoJS = require("crypto-js");
const { MongoClient } = require('mongodb');

const app = express();
const PORT = 3001 || process.env.PORT;
const server = http.createServer(app);

// Set static folder
app.use(express.static("src"));

// Socket setup
const io = socket(server);

// MongoDB connection URI
const uri = "mongodb+srv://rileymanda0:Nbti6n2TM8HftQhZ@cluster0.mnkokgz.mongodb.net/cluster0?retryWrites=true&w=majority";

// MongoClient
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

let users = []; // Store session data in memory

async function connectToMongoDB() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("Error connecting to MongoDB:", err);
  }
}

connectToMongoDB();

// Function to fetch session data from MongoDB
async function getSessionData() {
  try {
    const database = client.db("cluster0");
    const collection = database.collection("sessions");
    const sessionData = await collection.findOne({ session_id: "1" });
    return sessionData ? sessionData.users : [];
  } catch (err) {
    console.error("Error fetching session data:", err);
    return [];
  }
}

// Function to update session data in MongoDB
async function updateSessionData(usersData) {
  try {
    const database = client.db("cluster0");
    const collection = database.collection("sessions");
    await collection.updateOne(
      { session_id: "1" },
      { $set: { users: usersData } },
      { upsert: true }
    );
    console.log("Session data updated successfully");
  } catch (err) {
    console.error("Error updating session data:", err);
  }
}

// Load session data from MongoDB when the server starts
getSessionData().then((data) => {
  users = data;
}).catch((err) => {
  console.error("Error loading session data:", err);
});

io.on("connection", (socket) => {
  console.log("Made socket connection", socket.id);

  socket.on("join", (encryptedData) => {
    const decryptedData = decryptMessage(encryptedData);
    console.log("Decrypted Message:", decryptedData);
    const data = JSON.parse(decryptedData);
    users.push(data);
    io.sockets.emit("join", data);
    // Update session data in MongoDB
    updateSessionData(users);
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
    // Update session data in MongoDB
    updateSessionData(users);
  });

  socket.on("restart", () => {
    users = [];
    io.sockets.emit("restart");
    // Update session data in MongoDB
    updateSessionData(users);
  });
});

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

const mysecretencryptionkey = 'wedrjjshhfbu473hfvdhj';
// Function to decrypt message
function decryptMessage(encryptedMessage) {
  const bytes = CryptoJS.AES.decrypt(encryptedMessage, mysecretencryptionkey);
  return bytes.toString(CryptoJS.enc.Utf8);
}
