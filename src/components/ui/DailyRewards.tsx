import React, { useState, useEffect } from "react"; 

export default function DailyRewards({ onClose, setCoins }: any) {
  
  const [streak, setStreak] = useState(0);
  const [isReady, setIsReady] = useState(true);
  const [claimedDay, setClaimedDay] = useState<number | null>(null);

  
  const streakRewards = [100, 200, 300, 500, 1000, 2000, 5000];
  const currentDay = 3; 
  
  

useEffect(() => {
  const savedStreak = parseInt(localStorage.getItem("daily_streak_count") || "0");
  const lastClaimDate = localStorage.getItem("daily_last_claim_date");
  const today = new Date().toDateString();

  setStreak(savedStreak % 7);

  
  if (lastClaimDate !== today) {
    setIsReady(true);
  } else {
    setIsReady(false); 
  }
}, []);

const handleClaim = (dayIndex: number) => {
  
  if (dayIndex !== streak || !isReady) {
    console.log("Not ready yet! Come back tomorrow.");
    return; 
  }

  const reward = streakRewards[dayIndex];
  setCoins((prev: number) => {
    const newTotal = prev + reward;
    localStorage.setItem("userCoins", newTotal.toString());
    return newTotal;
  });

  setClaimedDay(dayIndex);
  playClaimSound();

  
  const today = new Date().toDateString();
  localStorage.setItem("daily_last_claim_date", today);

 
  const nextStreak = streak + 1;
  localStorage.setItem("daily_streak_count", nextStreak.toString());
  
  
  setIsReady(false);
  setStreak(nextStreak % 7);

  setTimeout(() => onClose(), 1500);
};

  const playClaimSound = () => {
    const audio = new Audio("/assets/dh so.m4a"); 
    audio.volume = 1.0;
    audio.play().catch(e => console.log("Audio failed:", e));
  };
  return (
  <div className="modal-overlay">
    
    <div className="streak-modal premium-style reward-container-box">
      <h2 className="title-glow">7-DAY STREAK</h2>
      <p className="subtitle">Awards visible: Claim your daily login prize!</p>
      
      <div className="streak-grid">
        {streakRewards.map((amt, i) => (
          <div 
            key={i} 
            className={`streak-item 
              ${i < streak ? 'past' : ''} 
              ${i === streak && isReady ? 'current-glow' : ''} 
              ${i === streak && !isReady ? 'waiting-tomorrow' : ''}
              ${i > streak ? 'future' : ''}
              ${claimedDay === i ? 'claimed' : ''}`}
            onClick={() => handleClaim(i)}
          >
            
            {i < streak && <div className="claimed-overlay">CLAIMED</div>}
            
            <div className="day-label">DAY {i + 1}</div>
            <div className="reward-icon">
              {i === 6 ? "🔥" : "💰"}
            </div>
            <div className="reward-amt">🪙 {amt}</div>
          </div>
        ))}
      </div>

      <div className="status-notice">
          <p className="ready-text">Progress based on total logins: {streak}/7</p>
      </div>

      <button className="back-btn" onClick={onClose}>CLOSE</button>
    </div>
  </div>
);
  
}