import React, { useState, useEffect } from "react";
import io from 'socket.io-client';
import { message, Progress } from 'antd';
import ReactCardFlip from "react-card-flip";

import pokerLogo from "./assets/pokerlogo.png";
import pokerCoins from "./assets/pokercoins.png";
import pokerCoinTopView from "./assets/pokercoingtopview.png";
import cardBack from "./assets/Card-Back.jpg";
import gameLogo from "./assets/3pattilogo.png";

import "./App.css";

const socket = io('http://localhost:4000');

const playerPositionss = [
  {top: "22%", left: "-25px"},
  {top: "68%", left: "-25px"},
  {top: "calc(100% - 25px)", left: "calc(50% - 25px)"},
  {top: "68%", left: "calc(100% - 25px)"},
  {top: "22%", left: "calc(100% - 25px)"},
  {top: "-25px", left: "calc(50% - 25px)"},
];
const profileInfoPositions = [
  {top: "85%", right: "calc(-50%)"},
  {top: "85%", right: "calc(-50%)"},
  {top: "85%", left: "calc(50% - 50px)"},
  {top: "85%", left: "calc(50% - 50px)"},
  {top: "85%", left: "calc(50% - 50px)"},
  {top: "85%", left: "calc(50% - 50px)"},
];
const statusPosition = [
  {right: "110%"},
  {right: "110%"},
  {left: "110%"},
  {left: "110%"},
  {left: "110%"},
  {left: "110%"},
];
const cardPositions = [
  {top: "100px", left: "10px"},
  {bottom: "30px", left: "50px"},
  {bottom: "80px", right: "25px"},
  {bottom: "50px", right: "100px"},
  {top: "100px", right: "70px"},
  {top: "110px", right: "25px"},
];
const individualCardStyle = [
  {transform: "rotate(-20deg)"},
  {marginLeft: "-25px", transform: "rotate(0deg)"},
  {marginLeft: "-25px", transform: "rotate(20deg)"},
];

const cardSuitsUniCode = {
  Hearts: {symbol: "&#x2665;", color: "red"},
  Spades: {symbol: "&#x2660;", color: "black"},
  Clubs: {symbol: "&#x2663;", color: "black"},
  Diamonds: {symbol: "&#x2666;", color: "red"},
};

function App() {
  const [messageApi, contextHolder] = message.useMessage();

  // New Players:
  const [players, setPlayers] = useState([]);
  const [currentPlayerJoined, setCurrentPlayerJoined] = useState(false);
  const [turn, setTurn] = useState(NaN);
  const [seeHand, setSeeHand] = useState(false);
  const [ante, setAnte] = useState(50);
  const [pointsOnTable, setPointsOnTable] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [timer, setTimer] = useState(21);
  const [showCallBtn, setShowCallBtn] = useState(true);
  const [showRaiseBtn, setShowRaiseBtn] = useState(true);

  useEffect(() => {
    socket.on("set-game-status", status => {
      setGameStarted(status);
    });

    socket.on("set-new-player", (name) => {
      console.log("Time to set new player!", name);
      // setPlayers((prevState) => [...prevState, name]);
      setPlayers(name);

      if (name.length === 1 && pointsOnTable) {
        alert(name[0].name + " Won!");
        sessionStorage.removeItem("CurrentPlayer");
        window.location.reload();
      }
    });

    socket.on("set-points-on-table", tablePoint => {
      setPointsOnTable(tablePoint);
    });

    socket.on("update-ante", raisedAnte => {
      setAnte(raisedAnte);
    });

    socket.on("show", winner => {
      alert(winner.name + " Won!");
      sessionStorage.removeItem("CurrentPlayer");
      window.location.reload();
    });

    socket.on("movePlayerTurn", turn => {
      setTurn(turn);
      // SetTimer back to 21
      setTimer(21);
    });

    socket.on("broadcast-msg", msg => {
      messageApi.open({
        type: 'info',
        content: msg,
        className: 'broadcast-msg',
        style: {
          marginTop: '35vh',
          padding: '2px',
          fontWeight: 'bold',
        },
        duration: "2",
      });
    });

    return () => {
      socket.off("set-new-player");
      socket.off("set-points-on-table");
      socket.off("update-ante");
      socket.off("show");
      socket.off("movePlayerTurn");
      socket.off("set-game-status");
      socket.off("broadcast-msg");
    }
  }, [pointsOnTable]);

  useEffect(() => {
    const timeoutId = gameStarted && setInterval(() => {
      // socket.emit("fold");
      console.log(timer, "timer++");
      if (timer <= 0) {
        clearInterval(timeoutId);
        socket.emit("fold");

        return;
      }

      setTimer(prevState => prevState - 1);
    }, 1000);

    return () => {
      clearInterval(timeoutId);
    }

    // eslint-disable-next-line
  }, [turn, timer]);

  useEffect(() => {
    console.log(players, turn, players[turn], "players++++");
    const currentPlayer = players[turn];
    const nextCall = currentPlayer?.playingStatus === "blind"
                    ? ante
                    : currentPlayer?.playingStatus === "seen"
                      ? 2 * ante
                      : null;

    const nextRaise = currentPlayer?.playingStatus === "blind"
                    ? 2 * ante
                    : currentPlayer?.playingStatus === "seen"
                      ? 2 * 2 * ante
                      : null;

    if (nextCall > currentPlayer?.points) {
      setShowCallBtn(false);
    }

    if (nextRaise > currentPlayer?.points) {
      setShowRaiseBtn(false);
    }
  }, [turn]);

  return (
    <div className="app">
      {
        currentPlayerJoined ? (
          <>
            {
              players[0]?.name === sessionStorage.getItem("CurrentPlayer") &&
              !gameStarted &&
              <button
                onClick={() => {
                  socket.emit("start-game");
                }}
              >
                Start Game
              </button>
            }
            
            <div style={{textAlign: "center"}}>
              {/* 3 Patti Table */}
              <span className="table-container">
                {/* Outer Oval */}
                <div className="oval outerOval">
                  {/* Middle Oval */}
                  <div className="oval middleOval">
                    {/* Inner Oval */}
                    <div className="oval innerOval">
                      <div>
                        <img
                          className="pokerLogo"
                          width="150px"
                          src={pokerLogo}
                          alt="pokerLogo"
                        />
                        <p className="tablePoints">
                          $ {pointsOnTable}
                          <br />
                          <small style={{fontSize: "16px"}}>{`Stake: $ ${ante}`}</small>
                        </p>
                        <img src={pokerCoins} alt="pokerCoins" />
                      </div>
                    </div>
                  </div>
                </div>

                {
                  players.map((player, idx) => (
                    <>
                      <div className="player-profile" style={{
                        ...playerPositionss[idx],
                        border: "1px solid black",
                        background: player.avatarUrl,
                        backgroundSize: "cover",
                        backgroundRepeat: "no-repeat",
                      }}>
                        {
                          idx === turn && gameStarted &&
                          <Progress
                            type="circle"
                            percent={timer*(100/21)}
                            showInfo={false}
                            strokeColor="green"
                            strokeWidth={12}
                            width={60}
                            style={{
                              position: "absolute",
                              top: "-5px",
                              left: "-5px",
                            }}
                          />
                        }
                        <p className="player-status" style={statusPosition[idx]}>
                          {player.playingStatus}
                        </p>
                        <div className="player-info" style={profileInfoPositions[idx]}>
                          <p className="player-info--points">
                            <img
                              src={pokerCoinTopView}
                              alt="pokercointopview"
                            />
                            <span>${player.points}</span>
                          </p>
                          <p className="player-info--name">{player.name}</p>
                        </div>

                        <div className="cards" style={cardPositions[idx]}>
                          {
                            player.cards.map((card, cardIdx) => (
                              // (sessionStorage.getItem("CurrentPlayer") === player.name) &&
                              <ReactCardFlip
                                isFlipped={
                                  sessionStorage.getItem("CurrentPlayer") === player.name &&
                                  seeHand
                                }
                              >
                                <img
                                  width="50px"
                                  style={individualCardStyle[cardIdx]}
                                  src={cardBack}
                                  alt="card"
                                />

                                <div
                                  className="seen-card"
                                  style={{
                                    ...individualCardStyle[cardIdx],
                                    color: cardSuitsUniCode[card.split(" ")[2]]["color"]
                                  }}
                                >
                                   <p style={{textAlign: "start", margin: 0}}>
                                     {card.split(" ")[0][0]}
                                     <br />
                                     {new DOMParser().parseFromString(
                                      cardSuitsUniCode[card.split(" ")[2]]["symbol"],
                                      "text/html"
                                    ).body.innerText}
                                  </p>

                                  <p
                                    style={{
                                      textAlign: "start",
                                      margin: "-10px 0",
                                      transform: "rotate(180deg)"
                                    }}
                                  >
                                    {card.split(" ")[0][0]}
                                    <br />
                                    {new DOMParser().parseFromString(
                                      cardSuitsUniCode[card.split(" ")[2]]["symbol"],
                                      "text/html"
                                    ).body.innerText}
                                  </p>
                                </div>
                              </ReactCardFlip>
                            ))
                          }
                        </div>
                      </div>

                      {
                        // Action Buttons
                        (sessionStorage.getItem("CurrentPlayer") === player.name) &&
                        (idx === turn) &&
                        gameStarted &&
                        (
                          <div className="btn-container">
                            <button
                              className="action-btn"
                              onClick={() => socket.emit("fold")}
                            >
                              Fold
                            </button>
                            {showCallBtn && <button
                              className="action-btn"
                              onClick={() => {
                                if (player.playingStatus === "blind") {
                                  // Playing blind
                                  socket.emit("call", {stake: ante, name: player.name});
                                  socket.emit("update-points-on-table", ante);
                                } else if (player.playingStatus === "seen") {
                                  // Playing seen hand (chaal)
                                  socket.emit("call", {stake: 2*ante, name: player.name});
                                  socket.emit("update-points-on-table", 2*ante);
                                }
                              }}
                            >
                              Call {
                              player.playingStatus === "blind"
                              ? ante
                              : player.playingStatus === "seen"
                                ? 2*ante
                                : ""
                              }
                            </button>}
                            {showRaiseBtn && <button
                              className="action-btn"
                              onClick={() => {
                                if (player.playingStatus === "blind") {
                                  // Playing blind
                                  socket.emit("raise", {stake: 2*ante, name: player.name});
                                  socket.emit("update-points-on-table", 2*ante);
                                } else if (player.playingStatus === "seen") {
                                  // Playing seen hand (chaal)
                                  socket.emit("raise", {stake: 2*2*ante, name: player.name});
                                  socket.emit("update-points-on-table", 2*2*ante);
                                }
                              }}
                            >
                              Raise {
                              player.playingStatus === "blind"
                              ? 2*ante
                              : player.playingStatus === "seen"
                                ? 2*2*ante
                                : ""
                              }
                            </button>}
                            {
                              player.playingStatus === "blind" &&
                              <button
                                className="action-btn"
                                onClick={() => {
                                  setSeeHand(true);
                                  socket.emit("see-hand");
                                }}
                              >
                                See Hand
                              </button>
                            }
                            {
                              players.length === 2 &&
                              <button
                                className="action-btn"
                                onClick={() => {
                                  socket.emit("show");
                                }}
                              >
                                Show
                              </button>
                            }
                            {/* <button
                              className="action-btn"
                              onClick={() => socket.emit("side-show")}
                            >
                              Side Show
                            </button> */}
                          </div>
                        )
                      }
                    </>
                  ))
                }
              </span>
            </div>

            {contextHolder}
          </>
        ) : (
          <>
          <div style={{
              background: "#fff",
              width: "400px",
              height: "200px",
              margin: "0 auto",
              position: "relative",
              top: "calc(50% - 100px)",
              borderRadius: "20px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-around",
              alignItems: "center",
              padding: "10px",
              boxSizing: "border-box",
              boxShadow: "0px 0px 10px 1px rgba(0,0,0,0.75)",
            }}>
              <img width="80px" src={gameLogo} alt="3pattiLogo" />
              <h3 style={{margin: 0}}>Enter Game: Teen Patti</h3>
              <form onSubmit={(e) => {
                e.preventDefault();

                socket.emit("new-player", e.target[0].value);
                setCurrentPlayerJoined(true);
                sessionStorage.setItem("CurrentPlayer", e.target[0].value);
              }}>
                <input
                  type="text"
                  placeholder="Your Name"
                  style={{
                    padding: "4px",
                    borderRadius: "6px",
                    border: "1px solid black",
                    margin: "2px",
                  }}
                />
                <input
                  type="submit"
                  value="Play"
                  style={{
                    padding: "4px 6px",
                    borderRadius: "6px",
                    border: "1px solid black",
                    margin: "2px",
                    cursor: "pointer",
                  }}
                />
              </form>
            </div>
          </>
        )
      }
    </div>
  );
}

export default App;