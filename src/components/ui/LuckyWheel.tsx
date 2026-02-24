import React, { useState, useEffect, useRef } from "react";
import tickSoundFile from "../../assets/tick.mp3";

interface WheelProps {
  onClose: () => void;
  setCoins: React.Dispatch<React.SetStateAction<number>>;
  setGems: React.Dispatch<React.SetStateAction<number>>;
  gems: number;
  setOverlay: (val: any) => void;
}

export default function LuckyWheel({ onClose, setCoins, setGems, gems, setOverlay }: WheelProps) {
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>("");
  const tickIntervalRef = useRef<NodeJS.Timeout | null>(null);

  
  const colors = ["#FF3D00", "#FFEA00", "#00E676", "#2979FF", "#D500F9", "#FF9100"];
  const rewards = [100, 500, 1000, 50, 200, 10];

  
   
useEffect(() => {
  const updateTimer = () => {
    const lockTime = localStorage.getItem("wheel_lock");
    if (lockTime) {
      const diff = parseInt(lockTime) - Date.now();
      if (diff > 0) {
        const hours = Math.floor(diff / 3600000);
        const mins = Math.floor((diff % 3600000) / 60000);
        setTimeLeft(`${hours}h ${mins}m`);
        setIsLocked(true); 
      } else {
        setIsLocked(false); 
      }
    }
  };

  updateTimer();
  const timerId = setInterval(updateTimer, 1000);
  return () => clearInterval(timerId);
}, []);
    
  const handleSpin = () => {
  if (isSpinning || isLocked || gems === 0) return;

  setGems(prev => prev - 1);
  setResult(null);
  setIsSpinning(true);

  
  const audio = new Audio(tickSoundFile);
  audio.volume = 0.4;
  
  
  const soundInterval = setInterval(() => {
    audio.currentTime = 0; 
    audio.play().catch(() => {});
  }, 150);
  

  const currentRotation = rotation % 360; 
  const winIndex = Math.floor(Math.random() * rewards.length);
  const actualPrize = rewards[winIndex];

  const extraSpins = 1800; 
  const stopAngle = (360 - (winIndex * 60)) - 30; 
  const newRotationJump = (360 - currentRotation) + extraSpins + stopAngle;
  const finalTotalRotation = rotation + newRotationJump;

  setRotation(finalTotalRotation);

  setTimeout(() => {
    clearInterval(soundInterval);
    setCoins(prev => prev + actualPrize);
    setResult(actualPrize);
    setIsSpinning(false);

   
    const nextAvailable = Date.now() + (24 * 60 * 60 * 1000); 
    localStorage.setItem("wheel_lock", nextAvailable.toString());
    setIsLocked(true); 
  }, 4000);
};
  return (
    <div className="modal-overlay">
      <div className="wheel-modal">
        <h2 className="glow-text">LUCKY SPIN</h2>
        
        <div className="wheel-wrapper">
        
          <div className={`internal-ticker ${isSpinning ? "ticking" : ""}`}>▼</div>
          
          <div 
            className="actual-wheel-visual" 
            style={{ 
              transform: `rotate(${rotation}deg)`,
              transition: 'transform 4s cubic-bezier(0.15, 0, 0.15, 1)' 
            }}
          >
            {rewards.map((amt, i) => (
              <div 
                key={i} 
                className={`segment s${i+1}`} 
                style={{ 
                  backgroundColor: colors[i], 
                  transform: `rotate(${i * 60}deg) skewY(-30deg)`,
                  border: '2px solid rgba(0,0,0,0.2)'
                }}
              >
                <span style={{ transform: `skewY(30deg) rotate(30deg)`, fontWeight: 'bold' }}>
                  🪙 {amt}
                </span>
              </div>
            ))}
          </div>
        </div>

        {result && <div className="result-announcement">WON: 🪙 {result}</div>}
        {isLocked && !isSpinning && <div className="lock-notice">Next spin in: {timeLeft}</div>}

        <div className="wheel-buttons">
          <button 
            className={`spin-launch-btn ${isLocked ? 'btn-disabled' : ''}`} 
            onClick={handleSpin} 
            disabled={isSpinning || isLocked}
          >
            {isSpinning ? "SPINNING..." : isLocked ? "LOCKED" : "SPIN (1 💎)"}
          </button>
          <button className="back-btn" onClick={onClose}>CLOSE</button>
        </div>
      </div>
    </div>
  );
}