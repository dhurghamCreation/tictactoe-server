import React, { useState } from "react";

interface SettingsProps {
  onClose: () => void;
  volume: number;
  setVolume: (val: number) => void;
  music: number;
  setMusic: (val: number) => void;
}

export default function Settings({ onClose, volume, setVolume, music, setMusic }: SettingsProps) {
  const [activeTab, setActiveTab] = useState("audio");

  return (
    <div className="modal-overlay">
      <div className="settings-card">
        <div className="tabs-header">
          <button className={activeTab === "audio" ? "active" : ""} onClick={() => setActiveTab("audio")}>Audio</button>
          <button className={activeTab === "controls" ? "active" : ""} onClick={() => setActiveTab("controls")}>How to Play</button>
        </div>

        <div className="settings-content">
          {activeTab === "audio" ? (
            <div className="slider-group">
              <div className="control-row">
                <label>SFX Volume: {volume}%</label>
                <input type="range" min="0" max="100" value={volume} onChange={(e) => setVolume(Number(e.target.value))} />
              </div>
              <div className="control-row">
                <label>Music: {music}%</label>
                <input type="range" min="0" max="100" value={music} onChange={(e) => setMusic(Number(e.target.value))} />
              </div>
            </div>
          ) : (
            <div className="how-to-play-list">
              <p>🎯 <strong>Objective:</strong> Match 3 symbols in a row/column/diagonal.</p>
              <p>⚡ <strong>Power-ups:</strong> Use coins to activate game-changing abilities.</p>
              <p>💎 <strong>Gems:</strong> Use gems for high-stakes spins and rare skins.</p>
            </div>
          )}
        </div>
        <button className="close-btn-save" onClick={onClose}>SAVE CHANGES</button>
      </div>
    </div>
  );
}