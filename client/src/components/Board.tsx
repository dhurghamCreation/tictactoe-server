import React from "react";
import Square from "./Square";

interface BoardProps {
  squares: (string | null)[];
  onPlay: (i: number) => void;
  winningSquares: number[];
}

export default function Board({ squares, onPlay, winningSquares }: BoardProps) {
  return (
    <div className="board">
      {squares.map((sq, i) => (
        <Square
          key={i}
          value={sq}
          onClick={() => onPlay(i)}
          isWinning={winningSquares.includes(i)}
        />
      ))}
    </div>
  );
}
