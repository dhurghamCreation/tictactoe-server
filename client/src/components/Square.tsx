import React from "react";

interface SquareProps {
  value: string | null;
  onClick: () => void;
  isWinning: boolean;
}

export default function Square({ value, onClick, isWinning }: SquareProps) {
  const className = `square ${value?.toLowerCase()} ${isWinning ? "win" : ""} ${value ? "animate" : ""}`;
  return <div className={className} onClick={onClick}>{value}</div>;
}
