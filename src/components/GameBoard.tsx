
import React from 'react';
import { BoardCell } from '@/utils/gameLogic';

interface GameBoardProps {
  board: BoardCell[][];
  onCellClick: (x: number, y: number) => void;
}

const GameBoard: React.FC<GameBoardProps> = ({ board, onCellClick }) => {
  return (
    <div className="board-container relative w-full h-full overflow-auto">
      <div className="board-grid grid grid-cols-15 gap-0.5 bg-game-accent-blue/20 p-1 rounded-lg">
        {board.map((row, y) =>
          row.map((cell, x) => {
            // Determine cell class based on bonus
            let bonusClass = '';
            let label = '';
            
            switch (cell.bonus) {
              case 'dl':
                bonusClass = 'bg-blue-500/30';
                label = 'DL';
                break;
              case 'tl':
                bonusClass = 'bg-blue-800/30';
                label = 'TL';
                break;
              case 'dw':
                bonusClass = 'bg-pink-500/30';
                label = 'DW';
                break;
              case 'tw':
                bonusClass = 'bg-red-600/30';
                label = 'TW';
                break;
              case 'star':
                bonusClass = 'bg-yellow-400/30';
                label = '★';
                break;
              default:
                bonusClass = 'bg-game-light/20';
            }
            
            return (
              <div
                key={`${x}-${y}`}
                className={`board-cell relative w-10 h-10 md:w-12 md:h-12 ${bonusClass} 
                  flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-game-accent-blue
                  transition-all duration-200 border border-game-dark/30`}
                onClick={() => onCellClick(x, y)}
                data-position={`${x}-${y}`}
              >
                {/* Display bonus label when no tile */}
                {!cell.tile && cell.bonus !== 'none' && (
                  <span className="text-xs font-bold text-white/70">{label}</span>
                )}
                
                {/* Display placed tile */}
                {cell.tile && (
                  <div className={`letter-tile absolute inset-0 flex items-center justify-center 
                    ${cell.tile.isNew ? 'ring-2 ring-game-accent-blue animate-pulse' : ''}`}>
                    <span className="text-xl font-bold">{cell.tile.letter || '?'}</span>
                    {cell.tile.letter && (
                      <span className="absolute bottom-0.5 right-1 text-xs font-bold">
                        {cell.tile.value}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default GameBoard;
