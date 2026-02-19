import { io } from "socket.io-client";
const socket = io("http://localhost:3001");
import React, { useState, useEffect } from "react";
import Board from "./components/Board";
import { history as calculateWinner } from "./utils/history";
import clickSoundFile from "./assets/click.mp3";
import winSoundFile from "./assets/win.mp3";
import drawSoundFile from "./assets/draw.mp3";
import "./App.css";
import confetti from "canvas-confetti";

type ScoreType = { X: number; O: number; Draws: number };
// Look for this line and update it:
type Screen = "welcome" | "game" | "options" | "credits" | "end" | "online";

export default function App() {
  const [room, setRoom] = useState("");
  const [screen, setScreen] = useState<Screen>("welcome");
  const [history, setHistory] = useState<(string | null)[]>(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState(true);
  const [score, setScore] = useState<ScoreType>({ X: 0, O: 0, Draws: 0 });
  const [winningSquares, setWinningSquares] = useState<number[]>([]);
  const [lastWinner, setLastWinner] = useState<string | null>(null);
  const [isDraw, setIsDraw] = useState(false);
  const [challenge, setChallenge] = useState<"none" | "speed" | "invisible">("none");
  const [timeLeft, setTimeLeft] = useState(10);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const handleNavigate = (newScreen: Screen) => {
    playGlobalClick();
    setScreen(newScreen);
  };
  const joinRoom = () => {
    if (room !== "") {
      socket.emit("join_room", room);
      handleNavigate("game"); // Using your existing wrapper
    }
  };

  // Audio
  const clickSound = new Audio(clickSoundFile);
  const winSound = new Audio(winSoundFile);
  const drawSound = new Audio(drawSoundFile);
  const playGlobalClick = () => {
    const audio = new Audio(clickSoundFile);
    audio.volume = 0.5; // Adjust volume as needed
    audio.play().catch(() => {}); // Catch prevents errors if user hasn't interacted yet
  };
 

// Use this wrapper for navigation
  

  function handlePlay(i: number) {
    if (history[i] || lastWinner || isDraw) return; // prevent clicks after game ends

    const next = history.slice();
    next[i] = xIsNext ? "X" : "O";
    setHistory(next);
    setXIsNext(!xIsNext);
    clickSound.play();
    socket.emit("send_move", { index: i, room: room, symbol: next[i] });

    // Check winner
    const newWinner = calculateWinner(next, setWinningSquares);
    const gameDraw = !newWinner && next.every((s) => s !== null);

    if (newWinner === "X" || newWinner === "O") {
      setScore(prev => ({ ...prev, [newWinner]: prev[newWinner] + 1 }));
      setLastWinner(newWinner);
      winSound.play();
      setScreen("end");
      launchConfetti();
    } else if (gameDraw) {
      setScore(prev => ({ ...prev, Draws: prev.Draws + 1 }));
      setIsDraw(true);
      drawSound.play();
      setScreen("end");
    }

  }

  function handleReset() {
    setHistory(Array(9).fill(null));
    setXIsNext(true);
    setWinningSquares([]);
    setLastWinner(null);
    setIsDraw(false);
    setTimeLeft(10); // Reset the clock!
    setScreen("game");
  }
  useEffect(() => {
    socket.on("receive_move", (data) => {
      // This updates your board when the opponent moves
      setHistory((prevHistory) => {
        const next = prevHistory.slice();
        next[data.index] = data.symbol;
        return next;
      });
      setXIsNext(data.symbol === "X" ? false : true);
    });

    return () => { socket.off("receive_move"); };
  }, []); // Empty dependency array so it only sets up once

// Apply to your welcome-screen div:
  
  // Screens
  let currentScreenView;
  if (screen === "welcome") {
    currentScreenView = (
      <div className="welcome-content">
        <h1 className="title-glow">React TicTacToe</h1>
        <div className="buttons-stack">
          <button onClick={() => handleNavigate("game")}>Local Play</button>
          <button className="online-btn" onClick={() => handleNavigate("online")}>🌐 Online Match</button>
          <button onClick={() => handleNavigate("options")}>Challenges</button>
          <button onClick={() => handleNavigate("credits")}>Credits</button>
        </div>
      </div>
    );
  }

 else if (screen === "online") {
    currentScreenView = (
      <div className="welcome-content">
        <h2>🌐 Online Match</h2>
        <p>Enter a Room Code to join a friend:</p>
        <input 
          type="text" 
          placeholder="e.g. SPACE-123" 
          className="room-input" 
          maxLength={10}
          onChange={(e) => setRoom(e.target.value)} // Track room code
        />
        <div className="buttons-stack">
          <button onClick={joinRoom}>Join Game</button>
          <button onClick={() => handleNavigate("welcome")}>Back</button>
        </div>
      </div>
    );
  } else if (screen === "options") {
    currentScreenView = (
      <div className="options-screen">
        <h2>Extra Challenges</h2>
        <button onClick={() => { setChallenge("speed"); setTimeLeft(10); handleNavigate("game"); }}>⏱️ Speed Mode (10s)</button>
        <button onClick={() => { setChallenge("invisible"); handleNavigate("game"); }}>👻 Invisible Mode</button>
        <button onClick={() => handleNavigate("welcome")}>Back</button>
      </div>
    );
  } else if (screen === "credits") {
    currentScreenView = (
      <div className="credits-screen">
        <h2>Credits</h2>
        <p>Created by Dhurgham Alsaadi</p>
        <button onClick={() => handleNavigate("welcome")}>Back</button>
      </div>
    );
  } else {
    // THIS IS THE ACTUAL GAME BOARD
    currentScreenView = (
      <div className="app">
        <button className="home-icon" onClick={() => handleNavigate("welcome")}>🏠 Menu</button>
        {challenge === "speed" && <div className="timer">Time Left: {timeLeft}s</div>}
        <div className={challenge === "invisible" ? "board-hidden" : ""}>
          <Board squares={history} onPlay={handlePlay} winningSquares={winningSquares} />
        </div>
        <h1>React TicTacToe</h1>
        <div className="info">
          {!lastWinner && !isDraw && <div>Next: {xIsNext ? "X" : "O"}</div>}
          <button onClick={handleReset}>Restart Game</button>
        </div>
        <div className="scoreboard">
          <p>X: {score.X} | O: {score.O} | Draws: {score.Draws}</p>
        </div>
      </div>
    );
  }

  // 2. Wrap everything in the container for the Star Travel effect
  return (
    <div className="main-container">
      {/* Background Layer with Mouse Movement */}
      <div 
        className="star-background" 
        style={{ 
          transform: `translate(${mousePos.x}px, ${mousePos.y}px) scale(1.1)`,
          backgroundImage: "url('./Background.png')" 
        }} 
      />

      {/* UI Layer for Screens and End Screen Overlay */}
      <div className="ui-layer">
        {currentScreenView}

        {screen === "end" && (
          <div className="end-screen">
            <div className="end-message">
              {isDraw ? <h2>It's a Draw!</h2> : <h2>{lastWinner} Wins!</h2>}
              <div className="end-buttons">
                <button onClick={handleReset}>Play Again</button>
                <button onClick={() => handleNavigate("welcome")}>Main Menu</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
// Confetti animation function
function launchConfetti() {
  const duration = 2 * 1000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 };

  const interval = setInterval(function () {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) return clearInterval(interval);

    const particleCount = 50 * (timeLeft / duration);
    confetti(
      Object.assign({}, defaults, {
        particleCount,
        origin: { x: Math.random(), y: Math.random() - 0.2 },
      })
    );
  }, 250);
}
