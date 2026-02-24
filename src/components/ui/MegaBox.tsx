import React, { useState } from "react";

interface MegaBoxProps {
  onClose: () => void;
  setCoins: React.Dispatch<React.SetStateAction<number>>;
}

export default function MegaBox({ onClose, setCoins }: MegaBoxProps) {
  const [isOpening, setIsOpening] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showReward, setShowReward] = useState(false);

  const savedStreak = parseInt(localStorage.getItem("daily_streak_count") || "0");
  const isEligible = savedStreak >= 7;

  const handleOpenBox = () => {
    
    if (isOpening || isOpen || !isEligible) return;

    
    const lastMegaClaim = localStorage.getItem("last_mega_claim_date");
    const today = new Date().toDateString();
    if (lastMegaClaim === today) {
      alert("You already claimed your Mega Loot today! Come back in 24 hours.");
      onClose();
      return;
    }
    
    setIsOpening(true); 
    
    setTimeout(() => {
      setIsOpening(false);
      setIsOpen(true); 
      
      setTimeout(() => {
        const loot = 1000;
        setCoins(prev => {
          const newTotal = prev + loot;
          localStorage.setItem("userCoins", newTotal.toString());
          return newTotal;
        });

        
        localStorage.setItem("last_mega_claim_date", today);

        
        localStorage.setItem("daily_streak_count", "0");

        setShowReward(true);
        playLootSound();
      }, 400);
    }, 1000);
  };

  const playLootSound = () => {
    const audio = new Audio("/assets/dh so.m4a"); 
    audio.play().catch(() => {});
  };

  return (
    <div className="mega-modal-overlay">
      <div className="mega-container">
        {!isOpen ? (
          <div className={`chest-card ${isOpening ? "shake-anim" : ""}`}>
            <div className="chest-visual" onClick={handleOpenBox}>
              <div className="chest-glow"></div>
              <span className="chest-emoji">{isEligible ? "🎁" : "🔒"}</span>
            </div>
            
            <h2 className="mega-title">MEGA CHEST</h2>
            <div className="streak-bar-bg">
              <div className="streak-bar-fill" style={{ width: `${(savedStreak / 7) * 100}%` }}></div>
            </div>
            <p className="mega-status">{savedStreak}/7 DAYS COMPLETED</p>
            
            {isEligible ? (
              <button className="claim-prompt-btn" onClick={handleOpenBox}>TAP TO UNLOCK</button>
            ) : (
              <button className="close-btn-simple" onClick={onClose}>RETURN TO BASE</button>
            )}
          </div>
        ) : (
          <div className={`reward-reveal ${showReward ? "fade-in" : ""}`}>
            <div className="light-rays"></div>
            <h1 className="epic-text">MEGA LOOT!</h1>
            <div className="coin-display">
               <span className="large-coin">🪙</span>
               <span className="loot-amount">+1,000</span>
            </div>
            <button className="collect-btn" onClick={onClose}>AWESOME!</button>
          </div>
        )}
        
      </div>
    </div>
  );
}