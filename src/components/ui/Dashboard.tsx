import React, { useState, useEffect } from "react";

interface DashboardProps {
  coins: number;
  gems: number;
  
  difficulty: "easy" | "medium" | "hard";
  setDifficulty: React.Dispatch<React.SetStateAction<"easy" | "medium" | "hard">>;
  setGameMode: React.Dispatch<React.SetStateAction<any>>;
  handleNavigate: (screen: any) => void;
  
  onOpenStore: () => void;
  onOpenSettings: () => void;
  onOpenWheel: () => void;
  onOpenDaily: () => void;
  onOpenOptions: () => void;
  onStartGame: () => void;
  onPowerUp: () => void;
  onOpenMegaBox: () => void;
}

export default function Dashboard({ 
  coins, 
  gems, 
  difficulty, 
  setDifficulty, 
  setGameMode, 
  handleNavigate,
  onOpenStore, 
  onOpenSettings, 
  onOpenWheel, 
  onOpenDaily, 
  onOpenOptions, 
  onStartGame, 
  onPowerUp, 
  onOpenMegaBox
}: DashboardProps) {
  
  const [locks, setLocks] = useState({ box: false, daily: false, wheel: false });
  const [timers, setTimers] = useState({ box: "", daily: "", wheel: "" });

  useEffect(() => {
    const checkLocks = () => {
      const boxTime = localStorage.getItem("box_lock");
      const dailyTime = localStorage.getItem("daily_lock");
      const wheelTime = localStorage.getItem("wheel_lock");
      const now = Date.now();

      const formatTime = (lockStr: string | null) => {
        if (!lockStr) return "";
        const diff = parseInt(lockStr) - now;
        if (diff <= 0) return "";
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        return `${h}h ${m}m ${s}s`;
      };
      
   setLocks({  
        box: false,
        daily: false,
        wheel: false
    });
    setTimers({ box: "", daily: "", wheel: "" });
    }
    
    checkLocks();
    const interval = setInterval(checkLocks, 1000);
    return () => clearInterval(interval);
  }, []);


  return (  
    <div className="mobile-dashboard-container">
      <div className="dashboard-top-nav">
        <button className="gear-btn" onClick={onOpenSettings}>⚙️</button>
        <div className="currency-cluster">
          <div className="pill gem-pill" onClick={onOpenStore}>💎 {gems} <span className="plus">+</span></div>
          <div className="pill coin-pill" onClick={onOpenStore}>🪙 {coins.toLocaleString()} <span className="plus">+</span></div>
        </div>
      </div>

      <div className="main-stage">
        <div className="stage-header">NEON GALAXY</div>
        <div className="big-center-square">
            <h1 className="title-glow">TIC-TAC-TOE</h1>
            <div className="character-preview">
               <span className="shiny-x">X</span>
               <span className="shiny-o-blue">O</span>
            </div>
            
            <button className="tap-to-start" onClick={onStartGame}>TAP TO START</button>
        </div>
      </div>

      <div className="sidebar-tools">
        <div className={`side-node red-btn ${locks.wheel ? 'locked-node' : ''}`} onClick={onOpenWheel}>
           🎡<small>{locks.wheel ? timers.wheel : "SPIN"}</small>
        </div>
        
        <div className={`side-node red-btn ${locks.daily ? 'locked-node' : ''}`} onClick={onOpenDaily}>
           🎁<small>{locks.daily ? timers.daily : "DAILY"}</small>
        </div>
        
        <div className={`side-node red-btn ${locks.box ? 'locked-node' : ''}`} onClick={onOpenMegaBox}>
           📦<small>{locks.box ? timers.box : "BOX"}</small>
        </div>
      </div>

      <div className="bottom-upgrades">
        <button className="upgrade-card" onClick={onOpenOptions}>
          <div className="up-top">MODES</div>
          <div className="up-price">CHALLENGES <br/>⚡</div>
        </button>

        
        <button className="upgrade-card blue" onClick={() => { 
            setGameMode("glitch"); 
            handleNavigate("game"); 
        }}>
            <div className="up-top">QUANTUM GLITCH</div>
            <div className="up-price">REALITY SHIFTING <br/>🌀</div>
        </button>

        <button className="upgrade-card orange" onClick={onPowerUp}>
          <div className="up-top">ONLINE</div>
          <div className="up-price">PvP HUMAN <br/>🤝</div>
        </button>
      </div>
    </div>
  );
}