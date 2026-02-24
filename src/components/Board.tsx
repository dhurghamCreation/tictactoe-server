import React from 'react';


interface Skin {
  x: string;
  o: string;
  color: string;
}


interface BoardProps {
  squares: (string | null)[];
  onPlay: (i: number) => void;
  playerSymbol: string; 
  playerSkins: {
    p1: Skin; 
    p2: Skin; 
  };
}


export default function Board({ squares, onPlay, playerSkins, playerSymbol }: BoardProps) {
  return (
    <div className="board-grid">
      
      

      {squares.map((square, i) => (
  <button 
    key={i} 
    className="square" 
    onClick={() => onPlay(i)}
    style={{ position: 'relative' }}
  >
    {square && (
      <span style={{ 
        color: square === 'X' ? playerSkins.p1.color : playerSkins.p2.color,
        fontSize: '3rem', 
        textShadow: `0 0 10px ${square === 'X' ? playerSkins.p1.color : playerSkins.p2.color}`
      }}>
        
        {square === 'X' ? playerSkins.p1.x : playerSkins.p2.o}
      </span>
    )}
  </button>
))}
    </div>
  );
}