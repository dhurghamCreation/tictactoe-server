
import { io } from "socket.io-client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import Board from "./components/Board";
import { history as calculateWinner } from "./utils/history";
import clickSoundFile from "./assets/click.mp3";
import bgMusicFile from "./assets/background-music.mp3"; 
import "./App.css";
import confetti from "canvas-confetti";
import bgImage from "./assets/Background.png"; 
import winSound from "./assets/win.mp3";
import drawSound from "./assets/draw.mp3";
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import loseSound from "./assets/lose.mp3"; 

import Dashboard from "./components/ui/Dashboard";
import Store from "./components/ui/Store";
import Settings from "./components/ui/Settings";
import LuckyWheel from "./components/ui/LuckyWheel";
import DailyRewards from "./components/ui/DailyRewards";
import MegaBox from "./components/ui/MegaBox";


const socket = io("https://tictactoe-server-1-2tzt.onrender.com"
, { 
  transports: ["websocket"],
  reconnection: true,
  reconnectionDelay: 500,    
  reconnectionDelayMax: 2000, 
  timeout: 10000             
});
const stripePromise = loadStripe('pk_test_51T3kFEAZ3Hc8WY2NzufXWSfRQ8WG1zGZM5PoHrzjigvRJ2EyqwpB1NomYSGxWFCSOA5H0wlaIkMzQd1sYwyKrZgA00dTC9zhsx');
 
type Screen = "welcome" | "game" | "challenges" | "credits" | "end";

type Overlay = "none" | "store" | "settings" | "wheel" | "daily" | "megaBox" | "megabox" | "win_screen" | "lose_screen" | "draw_screen" | "searching" | "difficulty_picker";

type GameMode = "normal" | "ghost" | "online" | "speed" | "paradox" | "blitz" | "gravity" | "multiplayer" | "mirror" | "glitch";

export default function App() {
  const [screen, setScreen] = useState<Screen>("welcome");
  const [overlay, setOverlay] = useState<string>("none");
  const [gameMode, setGameMode] = useState<GameMode>("normal");
  const [coins, setCoins] = useState(() => {
    const saved = localStorage.getItem("userCoins");
    return saved ? parseInt(saved) : 4700; 
  });
  const [gems, setGems] = useState(7);
  const [volume, setVolume] = useState(50);
  const [music, setMusic] = useState(50);
 
  const [equippedBoard, setEquippedBoard] = useState<any>(null);
  const [history, setHistory] = useState<(string | null)[]>(Array(9).fill(null));
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [xIsNext, setXIsNext] = useState(true);
  const [turnTimeLeft, setTurnTimeLeft] = useState(10);
  const [boardRotation, setBoardRotation] = useState(0);
  const [blitzTime, setBlitzTime] = useState(4);
  const [locationPing, setLocationPing] = useState("Scanning Sector 7G...");
  const [chatMessage, setChatMessage] = useState("");
  const [chatLog, setChatLog] = useState<{s: string, t: string}[]>([]);
  const [roomInput, setRoomInput] = useState("");
  const [gameStarted, setGameStarted] = useState(false);
  const [myCreatedRoom, setMyCreatedRoom] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [pendingMode, setPendingMode] = useState<GameMode>("normal");
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [playerSymbol, setPlayerSymbol] = useState<"X" | "O" | null>(null);
  const [rematchRequested, setRematchRequested] = useState(false);
  const [rematchPending, setRematchPending] = useState(false); 
  const [paradoxOverlay, setParadoxOverlay] = useState(false);
  const [equippedSkin, setEquippedSkin] = useState({x: 'X', o: 'O', color: '#fff'});
  const [view, setView] = useState("menu");
 

  const [playerSkins, setPlayerSkins] = useState({
    p1: { x: "X", o: "O", color: "#ff0055" }, 
    p2: { x: "X", o: "O", color: "#00f3ff" }  
  });
  const [ownedSkins, setOwnedSkins] = useState([
    { id: "classic", name: "CLASSIC", x: "X", o: "O", color: "#ff0055" } 
  ]);
  const handleGoBack = () => {
  
  setEquippedBoard(null); 
  
  
  setHistory(Array(9).fill(null)); 
  
  setScreen("welcome");
};
  

  const [isMoveLocked, setIsMoveLocked] = useState(false);

  const onOpenMegaBox = () => {
  const savedStreak = parseInt(localStorage.getItem("daily_streak_count") || "0");
  
  if (savedStreak < 7) {
    
    const boxBtn = document.querySelector('.box-btn');
    boxBtn?.classList.add('shake-locked');
    setTimeout(() => boxBtn?.classList.remove('shake-locked'), 500);
    return;
  }
  
  setOverlay("megaBox");
};
  const requestRematch = () => {
    setRematchPending(true);
    socket.emit("request_rematch", { room: roomInput || myCreatedRoom });
  };

  const acceptRematch = () => {
      socket.emit("accept_rematch", { room: roomInput || myCreatedRoom });
  }
  

  const [moveCounter, setMoveCounter] = useState(0);
  const [lastTurnHistory, setLastTurnHistory] = useState<(string | null)[]>(Array(9).fill(null));

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const winner = calculateWinner(history);
  
      const [roomCount, setRoomCount] = useState(0);
        useEffect(() => {
        socket.on("assign_symbol", (symbol) => {
          console.log("SERVER ASSIGNED:", symbol);
        setPlayerSymbol(symbol); 
        socket.on("room_count_update", (data) => {
        setRoomCount(data.count); 
    });
      });

      
      socket.on("human_connected", ({ room }) => {
        socket.emit("send_skin", { 
          room, 
          skin: equippedSkin, 
          symbol: playerSymbol 
        });
      });

      
      socket.on("receive_opponent_skin", ({ skin, symbol }) => {
          setPlayerSkins(prev => ({
              ...prev,
              
              [symbol === "X" ? "p1" : "p2"]: skin
          }));
      });

        return () => {
          socket.off("assign_symbol");
          socket.off("human_connected");
          socket.off("receive_opponent_skin");
          socket.off("room_count_update");
        };
      }, []);
      useEffect(() => {
        const today = new Date().toDateString();
        const lastLoginDate = localStorage.getItem("last_login_date");
        let currentStreak = parseInt(localStorage.getItem("daily_streak_count") || "0");

        
        if (currentStreak > 1 && !lastLoginDate) {
          currentStreak = 1; 
          localStorage.setItem("daily_streak_count", "1");
          localStorage.setItem("last_login_date", today);
        }
        

        
        if (lastLoginDate !== today) {
          
          const newStreak = Math.min(currentStreak + 1, 7);
          localStorage.setItem("daily_streak_count", newStreak.toString());
          localStorage.setItem("last_login_date", today);
        }
      }, []);
      useEffect(() => {
        let interval: any;
        if (gameMode === "glitch") {
          
          interval = setInterval(() => {
            setBoardRotation(prev => prev + 90);
          }, 2000);
        } else {
          
          setBoardRotation(0);
        }
        return () => clearInterval(interval);
      }, [gameMode]);
      
      
    useEffect(() => {
        socket.on("room_count_update", (data) => {
            setRoomCount(data.count);
        });
        return () => { socket.off("room_count_update"); };
    }, []); 
    
    useEffect(() => {
      
      if (socket.connected) setIsConnected(true);
      socket.on("connect", () => {
        console.log("DEBUG: Connected to Server via Socket ID:");
        setIsConnected(true);
      });

      socket.on("disconnect", () => {
        console.log("DEBUG: Disconnected from Server");
        setIsConnected(false);
      });
    
    
     
   socket.on("receive_move", (data) => {
    console.log("📥 Received move from opponent:", { index: data.index, symbol: data.symbol, nextTurn: data.xIsNext });
    
    
    setHistory((prev: any) => {
      const nextBoard = [...prev];
      
      if (!nextBoard[data.index]) {
        nextBoard[data.index] = data.symbol;
      }
      return nextBoard;
    });
    
    
    setXIsNext(data.xIsNext);
    
    
    setIsMoveLocked(false);
    console.log("✅ Board unlocked - opponent's move confirmed"); });
          

  

    
    socket.on("human_connected", (data) => {
      setRoomInput(data.room);
      setOverlay("none");
      setScreen("game");
      
      
      if (myCreatedRoom && data.room === myCreatedRoom) {
        setPlayerSymbol("X");
      } else {
        setPlayerSymbol("O");
      }
    });
    return () => {
      socket.off("start_game");
      
      socket.off("receive_move");
    };
  }, []); 
     

const forceStart = () => {
    console.warn("DEBUG: Force Starting Game Locally...");
    setGameMode("multiplayer");
    setOverlay("none");
    setScreen("game");
};
      
  const sendChat = () => {
    if (!chatMessage) return;
    const userText = chatMessage.toLowerCase();
    const newLog = [...chatLog, { s: "You", t: chatMessage }];
    setChatLog(newLog);
    setChatMessage("");

    if (gameMode !== "multiplayer") {
      setTimeout(() => {
        let aiResponse = "Analyzing strategy...";
        
        
        if (userText.includes("hello") || userText.includes("hi")) {
            aiResponse = "Greetings, organic. I've predicted your first 10 moves already.";
        } else if (userText.includes("how are you")) {
            aiResponse = "Operating at 100% capacity. Ready to conquer the board.";
        } else if (userText.includes("win") || userText.includes("ez")) {
            aiResponse = "Overconfidence detected. Recalculating odds of your defeat...";
        } else if (userText.includes("hack") || userText.includes("cheat")) {
            aiResponse = "System integrity is absolute. I am the code.";
        } else if (userText.includes("paradox")) {
            aiResponse = "Time is an illusion. Your moves will be erased.";
        }    else if (userText.includes("donkey")) {
            aiResponse = "I don't care what a donkey is. It has no relevance to this game.";
        }    else if (userText.includes("fuck")) {
            aiResponse = "Language protocol breach detected. Initiating verbal reprimand subroutine.";
        } else if (userText.includes("stupid") || userText.includes("dumb")) {
            aiResponse = "Insult detected. Your move has been skipped as punishment.";
        }    else if (userText.includes("loser") || userText.includes("lost")) {
            aiResponse = "Defeat is not in my programming. I will adapt and overcome.";

        } else {
            const randomSnark = [
                "Is that your best move?",
                "Interesting choice. Highly illogical.",
                "I've played against millions. You are... different.",
                "Do you require a hint, human?",
                "Your move is as predictable as the sunrise.",
                "I expected more resistance.",
                "Calculating... Your chances of winning are approximately 0.0001%.",
                "Are you sure you want to do that?",
                "I will learn from this move and crush you next time.",
                "Your strategy is... amusing.",
            ];
            aiResponse = randomSnark[Math.floor(Math.random() * randomSnark.length)];
        }

        setChatLog(prev => [...prev, { s: "AI Bot", t: aiResponse }]);
      }, 1000);
    } else {
      socket.emit("message", chatMessage);
    }
  };

  const handleNavigate = (newScreen: Screen) => {
    new Audio(clickSoundFile).play().catch(() => {});
    setScreen(newScreen);
    setOverlay("none");
    setHistory(Array(9).fill(null));
    setXIsNext(true);
    setBoardRotation(0);
    setBlitzTime(4);
    setMoveCounter(0);
  };
 const handleCreatePrivate = () => {
    const newCode = Math.floor(1000 + Math.random() * 9000).toString();
    
    
    setMyCreatedRoom(newCode);
    setRoomInput(newCode); 
    
    
    setScreen("game");            
    setGameMode("multiplayer");   
    setPlayerSymbol("X");         
    setOverlay("none");           
    
   
    socket.emit("join_private_room", newCode);
};
const createPrivateRoom = () => {
  
  const newCode = Math.floor(1000 + Math.random() * 9000).toString();
  setMyCreatedRoom?.(newCode);
  setGameMode?.('online' as any); 
  setGameStarted?.(true);
  setView?.("game" as any); 
  
  
  setOverlay?.("waiting_for_opponent");
  
  if (typeof setMyCreatedRoom === "function") setMyCreatedRoom(newCode);
  if (typeof setGameMode === "function") setGameMode('online');
  if (typeof setGameStarted === "function") setGameStarted(true);
  if (typeof setView === "function") setView("game");
  if (typeof setOverlay === "function") setOverlay("waiting_for_opponent");

  
  if (socket) {
    socket.emit("join_private_room", newCode);
  } else {
    console.error("Socket not connected! Cannot create room.");
  }
};
  const selectModeWithDifficulty = (mode: GameMode) => {
    setPendingMode(mode);
    if (mode === "multiplayer") {
      setGameMode("multiplayer");
      setOverlay("searching");
      startMatchmaking();
    }else if (mode === "mirror") { 
     setGameMode("multiplayer");
     setOverlay("searching");
  } else {
      setPlayerSymbol("X"); 
      setOverlay("difficulty_picker");
    }
  };
  

  const startMatchmaking = () => {
    console.log("🔍 Starting matchmaking...", { socketId: socket.id, isConnected: socket.connected });
    setOverlay("searching");
    setLocationPing("Initializing Global Search...");

    
    socket.emit("join_human_queue");
    console.log("📡 Sent join_human_queue event");

    const scanInterval = setInterval(() => {
          if (overlay !== "searching") clearInterval(scanInterval);
          const regions = ["NA-WEST", "EU-CENTRAL", "ASIA-EAST", "ME-SOUTH"];
          setLocationPing(`Pinging ${regions[Math.floor(Math.random() * regions.length)]} Relay...`);
      }, 2000);
    };
  
  const handlePowerUpClick = () => { startMatchmaking(); };
  const handleMegaBoxClick = () => {
    
    setOverlay("megaBox"); 
  };

  const makeMove = useCallback((i: number) => {
    
    
    if (history[i] || winner) return;

   
  const handleSquareClick = (index: number) => { 
    if (gameMode === "multiplayer") {
        
        const isMyTurn = (playerSymbol === "X" && xIsNext) || (playerSymbol === "O" && !xIsNext);
        
       
        if (isMyTurn && !history[index] && !winner) {
            socket.emit("send_move", { 
                room: roomInput || myCreatedRoom, 
                index: index, 
                symbol: playerSymbol 
            });
        } else {
            console.log("Move blocked: Not your turn or square occupied.");
        }
    }
};

    
    if (!xIsNext) return; 

   
    let targetIndex = i;

    
    if (gameMode === "gravity") {
      const col = i % 3;
      const rows = [6, 3, 0]; 
      for (let r of rows) {
        const checkIdx = r + col;
        if (!history[checkIdx]) {
          targetIndex = checkIdx;
          break;
        }
      }
    }

   
    if (gameMode === "glitch" && Math.random() < 0.2) {
      const emptyOnes = history.map((s, idx) => s === null ? idx : null).filter(v => v !== null) as number[];
      if (emptyOnes.length > 0) {
        
        setBoardRotation(prev => prev + 180); 
        
        
        console.log("Reality Shifted!");
      }
    }
    if (gameMode === "paradox") {
      setMoveCounter(prev => {
        if (prev + 1 >= 3) {
          setParadoxOverlay(true);
          setTimeout(() => setParadoxOverlay(false), 2000);
          return 0; 
        }
        return prev + 1;
      });
      if (moveCounter + 1 >= 3) return; 
    }

    setHistory(prev => {
      const next = [...prev];
      next[targetIndex] = "X";
      return next;
    });

    setXIsNext(false); 
    setTurnTimeLeft(gameMode === "blitz" ? 3 : 10);
    
    new Audio(clickSoundFile).play().catch(() => {});
  }, [history, winner, xIsNext, playerSymbol, roomInput, myCreatedRoom]);

  const makeRandomMove = useCallback(() => {
    const emptySquares = history.map((s, i) => s === null ? i : null).filter(v => v !== null) as number[];
    if (emptySquares.length > 0) {
      const move = emptySquares[Math.floor(Math.random() * emptySquares.length)];
      makeMove(move);
    }
  }, [history, makeMove]);

  const makeAiMove = useCallback(() => {
    const emptySquares = history.map((s, i) => s === null ? i : null).filter(v => v !== null) as number[];
    if (emptySquares.length === 0 || winner) return;

    let move: number;
    if (difficulty === "hard") {
      move = findBestMove(history) ?? emptySquares[Math.floor(Math.random() * emptySquares.length)];
    } else if (difficulty === "medium") {
      move = Math.random() > 0.5 ? (findBestMove(history) ?? emptySquares[0]) : emptySquares[Math.floor(Math.random() * emptySquares.length)];
    } else {
      move = emptySquares[Math.floor(Math.random() * emptySquares.length)];
    }

    setHistory((prev) => {
      const next = [...prev];
      next[move] = "O";
      return next;
    });
    setXIsNext(true); 
    setTurnTimeLeft(10);
  }, [history, winner, difficulty]);
  useEffect(() => {
  
  if (screen === "game" && (gameMode === "multiplayer" || gameMode === "online")) {
   if (equippedSkin && playerSymbol) {
    setPlayerSkins(prev => ({
      ...prev,
      
      [playerSymbol === "X" ? "p1" : "p2"]: equippedSkin
    }));
  

      
      const roomId = roomInput || myCreatedRoom;
      socket.emit("send_skin", { 
        room: roomId, 
        skin: equippedSkin, 
        symbol: playerSymbol 
      });
    }
  }
}, [screen, playerSymbol, equippedSkin]); 
  

  useEffect(() => {
    if (gameMode === "multiplayer") return;
  
  if (!xIsNext && !winner && screen === "game") {
    
   
    const aiTimer = setTimeout(() => { 
      makeAiMove(); 
    }, 600); 

    return () => clearTimeout(aiTimer);
  }
}, [xIsNext, winner, screen, gameMode]);
  useEffect(() => {
  if (equippedSkin) {
    
    setPlayerSkins(prev => ({
      ...prev,
      
      [playerSymbol === "X" ? "p1" : "p2"]: equippedSkin
    }));

    
    if (gameMode === "multiplayer" || gameMode === "online") {
      const roomId = roomInput || myCreatedRoom;
      if (roomId) {
        socket.emit("send_skin", { 
          room: roomId, 
          skin: equippedSkin, 
          symbol: playerSymbol 
        });
      }
    }
  }
}, [equippedSkin, playerSymbol, gameMode]);
useEffect(() => {
  
  setPlayerSkins(prev => ({
    ...prev,
    p1: equippedSkin 
  }));

  
  if (gameMode === "multiplayer" && (roomInput || myCreatedRoom)) {
    socket.emit("send_skin", { 
      room: roomInput || myCreatedRoom, 
      skin: equippedSkin, 
      symbol: playerSymbol 
    });
  }
}, [equippedSkin, gameMode, playerSymbol]);

  useEffect(() => {
    if (gameMode === "blitz" && !winner && xIsNext && screen === "game") {
      const interval = setInterval(() => {
        setBlitzTime(prev => {
          if (prev <= 1) {
            makeRandomMove(); 
            return 4;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [xIsNext, gameMode, winner, screen, makeRandomMove]);
  
      useEffect(() => {
        socket.on("start_rematch", (data) => {
          setHistory(data.history); 
          setXIsNext(data.xIsNext); 
          setRematchPending(false); 
          setOverlay("none");       
      });

    return () => { socket.off("start_rematch"); };
  }, []);
  useEffect(() => {
    socket.on("start_public_game", (data) => {
        
        setOverlay("none");
        setScreen("game");
        setGameMode("multiplayer" as any);
        
       
        setHistory(Array(9).fill(null));
        setXIsNext(data.xIsNext);
    });

    socket.on("receive_public_move", (data) => {
        setHistory(data.newHistory);
        setXIsNext(data.nextTurn);
    });

    return () => {
        socket.off("start_public_game");
        socket.off("receive_public_move");
    };
}, []);

  
  useEffect(() => {
    socket.on("match_found_trigger", (data) => {
      console.log("🎮 Match found!", { data, socketId: socket.id, players: data.players });
      setRoomInput(data.room);
      
      const isFirstPlayer = data.players[0] === socket.id;
      console.log("Is first player (X)?", isFirstPlayer);
      setPlayerSymbol(isFirstPlayer ? "X" : "O");
      setRoomCount(2); 
      setOverlay("none");
      setScreen("game");
      setGameMode("multiplayer");
      setHistory(Array(9).fill(null));
      setXIsNext(true);
      setIsMoveLocked(false); 
      console.log("✅ Game ready! RoomCount set to 2");
        socket.emit("send_skin", {
            room: data.room,
            skin: equippedSkin || { x: "X", o: "O", color: "#ff0055" }, 
            symbol: playerSymbol 
        });
    });

    return () => {
      socket.off("match_found_trigger");
    };
  }, []);

  useEffect(() => {
  
  socket.on("game_ready", (data) => {
        setScreen("game");
        setRoomCount(2);
        
        setPlayerSymbol(data.yourSymbol); 
    });

  return () => {
    socket.off("game_ready");
  };
}, []); 
  useEffect(() => {
      if (playerSymbol && screen === "game") {
          socket.emit("send_skin", { 
            room: roomInput || myCreatedRoom, 
            skin: equippedSkin, 
            symbol: playerSymbol 
          });
      }
  }, [playerSymbol, screen]);
  useEffect(() => {
  if (winner) {
    const iWon = winner === playerSymbol;
    
    

    if (iWon) {
      new Audio(winSound).play().catch(() => {});
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
      setOverlay("win_screen");
      setCoins(prev => prev + 100);
    } else {
      new Audio(loseSound).play().catch(() => {}); 
      setOverlay("lose_screen");
    }
  } else if (!history.includes(null) && screen === "game") {
    setOverlay("draw_screen");
  }
}, [winner, history, playerSymbol]);


  useEffect(() => {
  if (screen !== "game" || winner) return;
  
  const limit = gameMode === "blitz" ? 4 : 10; 

  const timer = setInterval(() => {
    setTurnTimeLeft((prev) => {
      if (prev <= 1) {
        if (gameMode !== "multiplayer") {
          makeRandomMove(); 
        } else {
          setXIsNext(!xIsNext); 
        }
        return limit;
      }
      return prev - 1;
    });
  }, 1000);
  return () => clearInterval(timer);
}, [screen, xIsNext, winner, gameMode]);


 

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio(bgMusicFile);
      audioRef.current.loop = true;
    }
    audioRef.current.volume = music / 100;
    if (screen === "welcome" || screen === "challenges") {
      audioRef.current.play().catch(() => {});
    } else {
      audioRef.current.pause();
    }
  }, [screen, music]);

  const resetGame = () => {
    setHistory(Array(9).fill(null));
    setXIsNext(true);
    setOverlay("none");
    setScreen("welcome");
    setBoardRotation(0);
    setMoveCounter(0);
  };

  const activatePower = (type: string) => {
    if (coins < 500) { alert("Not enough coins!"); return; }
    setCoins(prev => prev - 500);
    alert(`${type.toUpperCase()} Activated!`);
  };

  let currentView;
  
  if (screen === "welcome") {
    currentView = (
      <div className="welcome-wrapper" style={{ backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', height: '100vh' }}>
        <Dashboard 
          coins={coins} 
          gems={gems} 
          difficulty={difficulty}
          setDifficulty={setDifficulty}
          setGameMode={setGameMode}
          handleNavigate={handleNavigate}
          onOpenStore={() => setOverlay("store")}
          onOpenSettings={() => setOverlay("settings")}
          onOpenWheel={() => setOverlay("wheel")}
          onOpenDaily={() => setOverlay("daily")}
          onOpenOptions={() => setScreen("challenges")}
          onStartGame={() => selectModeWithDifficulty("normal")}
          onPowerUp={handlePowerUpClick}
          onOpenMegaBox={handleMegaBoxClick}
        />
      </div>
    );
  } else if (screen === "challenges") {
    currentView = (
      <div className="challenges-view">
        <h2 className="title-glow">NEON CHALLENGES</h2>
        <div className="challenge-list">
          <div className="challenge-item paradox">
            <span>⏳ Temporal Paradox</span>
            <button className="play-mini-btn" onClick={() =>  selectModeWithDifficulty("paradox")}>START</button>
          </div>
          <div className="challenge-item gravity">
            <span>🕳️ Gravity Well</span>
            <button className="play-mini-btn" onClick={() =>  selectModeWithDifficulty("gravity")}>START</button>
          </div>
          <div className="challenge-item ghost">
            <span>👻 Ghost Mode</span>
            <button className="play-mini-btn" onClick={() => selectModeWithDifficulty("ghost")}>
              START
            </button>
          </div>
          <div className="challenge-item blitz">
            <span>⚡ 4s Blitz Mode</span>
            <button className="play-mini-btn" onClick={() => selectModeWithDifficulty("blitz")}>START</button>
          </div>
        </div>
        <button className="back-btn" onClick={() => setScreen("welcome")}>BACK</button>
        <div className="challenge-item private-room">
          <span>👥 Private Match</span>
          <div className="room-input-row">
            <input 
              className="neon-input-small" 
              placeholder="Enter Code" 
              value={roomInput} 
              onChange={(e) => setRoomInput(e.target.value)} 
            />
            <button className="play-mini-btn" onClick={() => {
              if(roomInput) {
                setGameMode("multiplayer");
                setPlayerSymbol("O"); 
                
                
                socket.emit("join_private_room", roomInput);
                
                
                setScreen("game"); 
                setOverlay("none");
              }
            }}>JOIN</button>

            <button className="play-mini-btn create-variant" onClick={handleCreatePrivate}>CREATE</button>
          </div>
          
          {myCreatedRoom && (
            <div className="private-code-display">
              <p>SHARE THIS MISSION CODE:</p>
              <h1 className="glow-text" style={{ fontSize: '2.5rem', color: '#0ff' }}>
                {myCreatedRoom}
              </h1>
              <small>Waiting for operative to join... ({roomCount}/2)</small>
            </div>
          )}
        </div>
      </div>
      
    );
 
        } else if (screen === "game") {
  currentView = (
    <div className="game-screen-wrapper">
    
      <div className="neon-chat-bar">
        <div className="chat-history">
          {chatLog.slice(-1).map((msg, i) => (
            <span key={i}><b>{msg.s}:</b> {msg.t}</span>
          ))}
        </div>
        <div className="chat-input-row">
          <input
            className="neon-input"
            value={chatMessage}
            onChange={(e) => setChatMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendChat()}
            placeholder="Communicate..."
          />
          <button className="send-chat-btn" onClick={sendChat}>SEND</button>
        </div>
      </div>

      <div className="game-container professional-arena">
        <div className="game-hud">
          <button className="exit-btn" onClick={() => setScreen("welcome")}>
            <span style={{ color: 'white' }}>←</span>
          </button>

          <div className="vs-badge">
            {gameMode === "multiplayer" ? (
              <div className="turn-indicator">
                {roomCount < 2 ? (
                  <div className="waiting-for-friend">
                    <span className="glow-text" style={{fontSize: '1.2rem'}}>CODE: {myCreatedRoom || roomInput}</span>
                    <p className="loading-dots">Waiting for operative...</p>
                  </div>
                ) : (
                  <>
                    <span className="your-symbol">YOU ARE: {playerSymbol}</span>
                    <br />
                    <span className={((playerSymbol === "X" && xIsNext) || (playerSymbol === "O" && !xIsNext)) ? "active-turn" : "waiting-turn"}>
                      {((playerSymbol === "X" && xIsNext) || (playerSymbol === "O" && !xIsNext))
                        ? "★ YOUR TURN ★"
                        : "OPPONENT IS THINKING..."}
                    </span>
                  </>
                )}
              </div>
            ) : (
              <>
                <div className="vs-text">YOU vs CPU</div>
                <div className="timer-text">00:{turnTimeLeft}</div>
              </>
            )}
          </div>
        </div>

        <div
          className={`board-wrapper ${equippedBoard?.theme || ''} ${
              gameMode === "ghost" ? "ghost-active" : ""
            } ${
              ((gameMode === "multiplayer" && ((playerSymbol === "X" && !xIsNext) || (playerSymbol === "O" && xIsNext))) ||
              (gameMode !== "multiplayer" && !xIsNext))
                ? "waiting" : ""
            }`}
            style={{
              transform: gameMode === "glitch" ? `rotate(${boardRotation}deg)` : "rotate(0deg)",
              transition: '0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          >
            <div className="board">
            {history.map((value, i) => {
              
              const isMyTurn = gameMode === "multiplayer" 
                ? ((playerSymbol === "X" && xIsNext) || (playerSymbol === "O" && !xIsNext))
                : xIsNext;

              return (
                <button 
                  key={i} 
                  className="square" 
                  onClick={() => {
                    if (gameMode === "multiplayer") {
                      if (isMyTurn && !value && !winner && roomCount === 2) {
                        socket.emit("send_move", { 
                          room: roomInput || myCreatedRoom, 
                          index: i, 
                          symbol: playerSymbol 
                        });
                      }
                    } else {
                      makeMove(i);
                    }
                  }}
                >
                 <span 
                  className={gameMode === "ghost" ? "ghost-mark" : ""} 
                  style={{ 
                    color: value === 'X' ? '#ff0055' : '#00f3ff', 
                    textShadow: `0 0 10px ${value === 'X' ? '#ff0055' : '#00f3ff'}`,
                    display: value ? 'block' : 'none',
                    fontSize: '2.5rem'
                  }}
                >
                 
                  {value === 'X' 
                    ? (playerSkins.p1.x || "X") 
                    : (playerSkins.p1.o || "🌀") 
                  }
                </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="game-footer-upgrades">
          <button className="upgrade-node" onClick={() => activatePower("hint")}>💡 HINT</button>
          <button className="upgrade-node" onClick={() => activatePower("freeze")}>❄️ FREEZE</button>
        </div>
      </div>
    </div> 
  );
}

  return (
    
    <div className="main-viewport" onMouseMove={(e) => setMousePos({ x: (e.clientX - window.innerWidth/2)/40, y: (e.clientY - window.innerHeight/2)/40 })}>
      <div className="star-background" style={{ transform: `translate(${mousePos.x}px, ${mousePos.y}px) scale(1.1)` }} />
      {currentView}
      
          
      
      {overlay === "settings" && <Settings onClose={() => setOverlay("none")} volume={volume} setVolume={setVolume} music={music} setMusic={setMusic} />}
      {overlay === "wheel" && <LuckyWheel onClose={() => setOverlay("none")} setCoins={setCoins} setGems={setGems} gems={gems} setOverlay={setOverlay} />}
      {overlay === "daily" && <DailyRewards onClose={() => setOverlay("none")} setCoins={setCoins} />}
      {overlay === "megaBox" && (
        <MegaBox 
          setCoins={setCoins} 
          onClose={() => setOverlay("none")} 
        />
      )}
      
      {overlay === "win_screen" && (
        <div className={`modal-overlay ${gameMode === 'ghost' ? 'ghost-win-theme' : 'standard-win-theme'}`}>
        <div className="result-card win-box">
          <h1 className="glow-text">MISSION ACCOMPLISHED</h1>
            <p className="glitch-text">YOU DEFEATED THE SYSTEM</p>
            <div className="reward-badge">+100 COINS</div>
            <button className="play-again-btn" onClick={resetGame}>RETURN TO BASE</button>
          </div>
        </div>
      )}

      
      {overlay === "lose_screen" && (
        <div className="modal-overlay lose-bg-static">
          <div className="result-card lose-box glitch-border" data-text="DEFEAT">
            <h1 className="glow-text-red">SYSTEM FAILURE</h1>
            <p className="glitch-text">DEFEAT DETECTED</p>
            <button className="play-again-btn" onClick={resetGame}>RETRY MISSION</button>
          </div>
        </div>
      )}

     
      {overlay === "draw_screen" && (
        <div className="modal-overlay draw-bg-glow">
          <div className="result-card draw-box glitch-border" data-text="STALEMATE">
            <h1 className="glow-text-blue">TACTICAL DEADLOCK</h1>
            <p>NO VICTOR IN THIS SECTOR</p>
            <button className="play-again-btn" onClick={resetGame}>RE-ENGAGE</button>
          </div>
        </div>
      )}
      <div className="mode-card" onClick={() => {
    setGameMode("online");
    setOverlay("searching"); 
    socket.emit("join_human_queue");
}}>
    
</div>
     {overlay === "searching" && (
  <div className="modal-overlay global-scanner">
    <div className="rotating-earth">🌍</div>
    
    <div className={`debug-status ${isConnected ? "online" : "offline"}`}>
      {isConnected ? `● SERVER CONNECTED` : "○ SERVER OFFLINE"}
    </div>

    <h2 className="glow-text">ESTABLISHING UPLINK...</h2>
    
    <div className="room-info-debug">
      
      <p>Network: <span style={{color: '#0ff'}}>
        {gameMode === "online" ? "Public Matchmaking" : (myCreatedRoom || roomInput)}
      </span></p>
      <p>Status: <span style={{color: '#0ff'}}>Waiting for Opponent...</span></p>
    </div>
  </div>
)}

    
    
        
    
      {paradoxOverlay && (
        <div className="paradox-glitch-screen">
          <div className="glitch-content">
            <h1 className="glitch-text" data-text="TEMPORAL SHIFT">TEMPORAL SHIFT</h1>
            <p>LAST MOVE ERASED FROM TIMELINE</p>
          </div>
        </div>
      )}

     {overlay === "waiting_for_opponent" && (
        <div className="modal-overlay">
          <div className="result-card draw-box">
            <h2 className="glow-text">ROOM CREATED</h2>
            <p>SHARE THIS CODE:</p>
            <div className="room-code-display" style={{fontSize: '3rem', color: '#0ff'}}>
              {myCreatedRoom}
            </div>
            <p>Waiting for friend to join...</p>
            
            <button className="back-btn" onClick={() => setOverlay("none")}>HIDE CODE</button>
          </div>
        </div>
      )}
      
      {overlay === "store" && (
        <Elements stripe={stripePromise}>
          <Store 
            onClose={() => setOverlay("none")} 
            setCoins={setCoins} 
            setGems={setGems} 
            setEquippedSkin={setEquippedSkin} 
            setEquippedBoard={setEquippedBoard} 
            coins={coins} 
            gems={gems} 
          />
        </Elements>
      )}
      
      {overlay === "difficulty_picker" && (
        <div className="modal-overlay difficulty-screen">
          <div className="difficulty-modal">
            <h2 className="glow-text">SELECT MISSION INTENSITY</h2>
            <div className="difficulty-options">
              <button className="diff-card easy" onClick={() => { 
                  setDifficulty("easy"); 
                  setGameMode(pendingMode); 
                  setPlayerSymbol("X"); 
                  handleNavigate("game"); 
                  setOverlay("none"); 
              }}>
                <span className="diff-icon">🟢</span>
                <div className="diff-info">
                  <strong>RECRUIT</strong>
                  <small>Still learning how to play</small>
                </div>
              </button>

              <button className="diff-card medium" onClick={() => { setDifficulty("medium"); setGameMode(pendingMode); handleNavigate("game"); }}>
                <span className="diff-icon">🟡</span>
                <div className="diff-info">
                  <strong>VETERAN</strong>
                  <small>Balanced challenge</small>
                </div>
              </button>

              <button className="diff-card hard" onClick={() => { setDifficulty("hard"); setGameMode(pendingMode); handleNavigate("game"); }}>
                <span className="diff-icon">🔴</span>
                <div className="diff-info">
                  <strong>CYBORG</strong>
                  <small>Unbeatable logic</small>
                </div>
              </button>
            </div>
            <button className="back-btn" onClick={() => setOverlay("none")}>CANCEL</button>
          </div>
        </div>
        
      )}
    </div>
  );
}
    
  
  
function findBestMove(squares: (string | null)[]) {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], 
      [0, 3, 6], [1, 4, 7], [2, 5, 8], 
      [0, 4, 8], [2, 4, 6]             
    ];

    
    for (let [a, b, c] of lines) {
      if (squares[a] === 'O' && squares[b] === 'O' && !squares[c]) return c;
      if (squares[a] === 'O' && squares[c] === 'O' && !squares[b]) return b;
      if (squares[b] === 'O' && squares[c] === 'O' && !squares[a]) return a;
    }

    
    for (let [a, b, c] of lines) {
      if (squares[a] === 'X' && squares[b] === 'X' && !squares[c]) return c;
      if (squares[a] === 'X' && squares[c] === 'X' && !squares[b]) return b;
      if (squares[b] === 'X' && squares[c] === 'X' && !squares[a]) return a;
    }

    
    if (!squares[4]) return 4;

    return null;
  }