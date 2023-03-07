const express = require("express");
var cors = require('cors')
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
// const io = new Server(server);
const io = require('socket.io')(server, {cors: {origin: "*"}});

// app.use(cors());
app.use(cors({
  origin: '*'
}));

// This list of players should come from some sort of DataBase.
let players = [];
let turn = 0;
let pointsOnTable = 0;

const deck = [
  '2 of Hearts',
  '3 of Hearts',
  '4 of Hearts',
  '5 of Hearts',
  '6 of Hearts',
  '7 of Hearts',
  '8 of Hearts',
  '9 of Hearts',
  '10 of Hearts',
  'Jack of Hearts',
  'Queen of Hearts',
  'King of Hearts',
  'Ace of Hearts',
  '2 of Spades',
  '3 of Spades',
  '4 of Spades',
  '5 of Spades',
  '6 of Spades',
  '7 of Spades',
  '8 of Spades',
  '9 of Spades',
  '10 of Spades',
  'Jack of Spades',
  'Queen of Spades',
  'King of Spades',
  'Ace of Spades',
  '2 of Clubs',
  '3 of Clubs',
  '4 of Clubs',
  '5 of Clubs',
  '6 of Clubs',
  '7 of Clubs',
  '8 of Clubs',
  '9 of Clubs',
  '10 of Clubs',
  'Jack of Clubs',
  'Queen of Clubs',
  'King of Clubs',
  'Ace of Clubs',
  '2 of Diamonds',
  '3 of Diamonds',
  '4 of Diamonds',
  '5 of Diamonds',
  '6 of Diamonds',
  '7 of Diamonds',
  '8 of Diamonds',
  '9 of Diamonds',
  '10 of Diamonds',
  'Jack of Diamonds',
  'Queen of Diamonds',
  'King of Diamonds',
  'Ace of Diamonds',
];

function cardShuffle() {
  let remainingDeck = [...deck];

  players.forEach(player => {
    if (!player.cards.length) {
      for (let i = 0; i < 3; i++) {
        const randomIndex = Math.floor(Math.random() * remainingDeck.length);
        player.cards.push(remainingDeck[randomIndex]);
        remainingDeck = remainingDeck.filter((_, index) => index !== randomIndex);
      }
    }
  });

  // console.log(players, "Players");
}

function determineResult() {
  players.forEach(player => {
    player.cards.forEach(card => {
      const cardValue = card.split(' ')[0];

      if (
        cardValue === 'Jack' ||
        cardValue === 'Queen' ||
        cardValue === 'King'
      ) {
        player.score += 10;
      } else if (cardValue === 'Ace') {
        player.score += 11;
      } else {
        player.score += parseInt(cardValue);
      }
    });
  });

  // console.log(players, "Result");
  return players.find(player => player.score === Math.max(...players.map(p => p.score)));
}

function moveTurns() {
  if (players.length) {
    if (turn === 0) {
      turn = players.length - 1;
    } else {
      turn -= 1;
    }
  }

  return turn;
}

io.on("connection", (socket) => {
  // console.log("A user connected");

  socket.on("ping", (color) => {
    console.log("pong");
    io.emit("ping", color);
  });

  socket.on("new-player", (name) => {
    io.emit("broadcast-msg", `${name} Joined!`);
    // console.log("New Player: " + name);
    players.push({
      name,
      cards: [],
      score: 0,
      points: 9950,
      playingStatus: "blind",
      id: socket.id,
      avatarUrl: `url(https://robohash.org/${players.length+1}?set=set2)`,
    });

    io.emit("set-new-player", players);
  });

  socket.on("start-game", () => {
    if (players.length < 2) {
      io.emit("broadcast-msg", "At least 2 players must join to start game.");

      return;
    }

    io.emit("broadcast-msg", `Game Started!`);

    cardShuffle();
    pointsOnTable = 50 * players.length;

    io.emit("set-new-player", players);
    io.emit("set-points-on-table", pointsOnTable);
    io.emit("movePlayerTurn", moveTurns());
    io.emit("set-game-status", true);
  });

  socket.on("fold", () => {
    io.emit("broadcast-msg", `${players[turn]?.name} Folded!`);
    
    players = players.filter(player => players[turn].name !== player.name);

    io.emit("set-new-player", players);
    io.emit("movePlayerTurn", moveTurns());
  });

  socket.on("call", (data) => {
    io.emit("broadcast-msg", `${data.name} Called!`);
    // console.log(players[turn], data.name, "check");
    players[turn].points -= data.stake;
    // console.log(players[turn], "turn++");
    io.emit("set-new-player", players);
    io.emit("movePlayerTurn", moveTurns());
  });

  socket.on("raise", (data) => {
    io.emit("broadcast-msg", `${data.name} Raised!`);

    players[turn].points -= data.stake;

    io.emit("set-new-player", players);
    io.emit("update-ante", data.stake);
    io.emit("movePlayerTurn", moveTurns());
  });

  socket.on("see-hand", () => {
    io.emit("broadcast-msg", `${players[turn].name} saw hand!`);

    players[turn].playingStatus = "seen";

    io.emit("set-new-player", players);
    // io.emit("movePlayerTurn", moveTurns());
  });

  socket.on("side-show", () => {
    io.emit("movePlayerTurn", moveTurns());
  });

  socket.on("show", () => {
    io.emit("broadcast-msg", `${players[turn].name} requested for show!`);

    const winner = determineResult();
    io.emit("show", winner);
    // turn -= 1;
  });

  socket.on("update-points-on-table", (point) => {
    pointsOnTable += point;
    io.emit("set-points-on-table", pointsOnTable);
  });

  socket.on('disconnect', () => {
    // io.emit("broadcast-msg", `${players.find(player => socket.id == player.id)?.name} disconnected and folded!`);

    players = players.filter(player => socket.id !== player.id);

    io.emit("set-new-player", players);
    io.emit("movePlayerTurn", moveTurns());
  });
});

server.listen(4000, () => {
  console.log("Listening on *: 4000");
});
