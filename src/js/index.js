// Making Connection
const socket = io.connect("http://localhost:3001");
socket.emit("joined");

let players = []; // All players in the game
let currentPlayer; // Player object for individual players

let canvas = document.getElementById("canvas");
canvas.width = document.documentElement.clientHeight * 0.9;
canvas.height = document.documentElement.clientHeight * 0.9;
let ctx = canvas.getContext("2d");

const redPieceImg = "../images/red_piece.png";
const bluePieceImg = "../images/blue_piece.png";
const yellowPieceImg = "../images/yellow_piece.png";
const greenPieceImg = "../images/green_piece.png";

const side = canvas.width / 10;
const offsetX = side / 2;
const offsetY = side / 2 + 20;

const images = [redPieceImg, bluePieceImg, yellowPieceImg, greenPieceImg];

const ladders = [
  [2, 23],
  [4, 68],
  [6, 45],
  [20, 59],
  [30, 96],
  [52, 72],
  [57, 96],
  [71, 92],
];

const snakes = [
  [98, 40],
  [84, 58],
  [87, 49],
  [73, 15],
  [56, 8],
  [50, 5],
  [43, 17],
];

class Player {
  constructor(id, name, pos, img) {
    this.id = id;
    this.name = name;
    this.pos = pos;
    this.img = img;
    this.score = 0;
  }

  draw() {
    let xPos =
      Math.floor(this.pos / 10) % 2 == 0
        ? (this.pos % 10) * side - 15 + offsetX
        : canvas.width - ((this.pos % 10) * side + offsetX + 15);
    let yPos = canvas.height - (Math.floor(this.pos / 10) * side + offsetY);

    let image = new Image();
    image.src = this.img;
    ctx.drawImage(image, xPos, yPos, 30, 40);
  }

  updatePos(num) {
    if (this.pos + num <= 99) {
      this.pos += num;
      this.score += num;
      this.pos = this.isLadderOrSnake(this.pos + 1) - 1;
    }
  }

  isLadderOrSnake(pos) {
    let newPos = pos;

    for (let i = 0; i < ladders.length; i++) {
      if (ladders[i][0] == pos) {
        newPos = ladders[i][1];
        break;
      }
    }

    for (let i = 0; i < snakes.length; i++) {
      if (snakes[i][0] == pos) {
        newPos = snakes[i][1];
        break;
      }
    }

    return newPos;
  }
}

document.getElementById("start-btn").addEventListener("click", () => {
  const name = document.getElementById("name").value;
  document.getElementById("name").disabled = true;
  document.getElementById("start-btn").hidden = true;
  document.getElementById("roll-button").hidden = false;
  currentPlayer = new Player(players.length, name, 0, images[players.length]);
  document.getElementById(
    "current-player"
  ).innerHTML = `<p>Anyone can roll</p>`;
  const encryptedData = encryptMessage(JSON.stringify(currentPlayer));
  socket.emit("join", encryptedData);
});

document.getElementById("roll-button").addEventListener("click", () => {
  const num = rollDice();
  currentPlayer.updatePos(num);
  console.log(`Dice rolled: ${num}`);
  const encryptedData = encryptMessage(JSON.stringify({
    num: num,
    id: currentPlayer.id,
    pos: currentPlayer.pos,
    score: currentPlayer.score,
    img: currentPlayer.img,
  }));
  socket.emit("rollDice", encryptedData);
});

function rollDice() {
  const number = Math.ceil(Math.random() * 6);
  return number;
}

function drawPins() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  players.forEach((player) => {
    player.draw();
  });
}

function updatePlayersTable() {
  let table = document.getElementById("players-table");
  table.innerHTML = "";
  players.forEach((player) => {
    table.innerHTML += `<tr><td>${player.name}</td><td><img src=${player.img} height=50 width=40></td><td>${player.score}</td></tr>`;
  });
}

// Listen for events
socket.on("join", (data) => {
  players.push(new Player(players.length, data.name, data.pos, data.img, data.score));
  drawPins();
  updatePlayersTable();
});

socket.on("joined", (data) => {
  data.forEach((player, index) => {
    players.push(new Player(index, player.name, player.pos, player.img, player.score));
    console.log(player);
    updatePlayersTable();
  });
  drawPins();
});

socket.on("rollDice", (data, turn) => {
  players[data.id].updatePos(data.num);
  players[data.id].score = data.score;
  document.getElementById("dice").src = `./images/dice/dice${data.num}.png`;
  drawPins();

  // Update the players table
  updatePlayersTable();

  if (turn != currentPlayer.id) {
    document.getElementById("roll-button").hidden = true;
    document.getElementById(
      "current-player"
    ).innerHTML = `<p>It's ${players[turn].name}'s turn</p>`;
  } else {
    document.getElementById("roll-button").hidden = false;
    document.getElementById(
      "current-player"
    ).innerHTML = `<p>It's your turn</p>`;
  }

  let winner;
  for (let i = 0; i < players.length; i++) {
    if (players[i].pos == 99) {
      winner = players[i];
      break;
    }
  }

  if (winner) {
    document.getElementById(
      "current-player"
    ).innerHTML = `<p>${winner.name} has won!</p>`;
    document.getElementById("roll-button").hidden = true;
    document.getElementById("dice").hidden = true;
    document.getElementById("restart-btn").hidden = false;
  }
});

// Logic to restart the game
document.getElementById("restart-btn").addEventListener("click", () => {
  socket.emit("restart");
});

socket.on("restart", () => {
  window.location.reload();
});

// Function to encrypt message
function encryptMessage(message) {
  const mysecretencryptionkey = 'wedrjjshhfbu473hfvdhj';
  return CryptoJS.AES.encrypt(message, mysecretencryptionkey).toString();
}

document.getElementById("show-scoreboard-btn").addEventListener("click", () => {
  fetch("/scoreboard")
    .then((response) => response.json())
    .then((data) => {
      updateScoreboardModal(data);
      document.getElementById("scoreboard-modal").style.display = "block";
    })
    .catch((error) => {
      console.error("Error fetching scoreboard data:", error);
    });
});

document.getElementById("show-scoreboard-btn").addEventListener("click", () => {
  fetch("/scoreboard")
    .then((response) => response.json())
    .then((data) => {
      updateScoreboardModal(data);
      document.getElementById("scoreboard-modal").style.display = "block";
    })
    .catch((error) => {
      console.error("Error fetching scoreboard data:", error);
    });
});

function updateScoreboardModal(data) {
  // Filter out null values or undefined properties
  data = data.filter(player => player && player.score !== null && player.score !== undefined);

  // Sort players by score in descending order
  data.sort((a, b) => b.score - a.score);

  let scoreboardTable = document.getElementById("scoreboard-table");
  scoreboardTable.innerHTML = "";

  // Display player name and score in the modal
  data.forEach((player) => {
    scoreboardTable.innerHTML += `<tr><td>${player.name}</td><td>${player.score}</td></tr>`;
  });
}




