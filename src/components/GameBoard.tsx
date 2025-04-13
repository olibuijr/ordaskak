
import React from 'react';
import { BoardCell } from '@/utils/gameLogic';

interface GameBoardProps {
  board: BoardCell[][];
  onCellClick: (x: number, y: number) => void;
}

const GameBoard: React.FC<GameBoardProps> = ({ board, onCellClick }) => {
  return (
    <div className="board-container relative w-full h-full overflow-auto">
      <div className="board-grid grid grid-cols-15 gap-0.5 bg-[#1A1F2C] p-1 rounded-lg">
        {board.map((row, y) =>
          row.map((cell, x) => {
            // Determine cell class based on bonus
            let bonusClass = '';
            let label = '';
            
            switch (cell.bonus) {
              case 'dl':
                bonusClass = 'bg-[#4A7FBA] text-white';
                label = 'DL';
                break;
              case 'tl':
                bonusClass = 'bg-[#396592] text-white';
                label = 'TL';
                break;
              case 'dw':
                bonusClass = 'bg-[#9D5884] text-white';
                label = 'DW';
                break;
              case 'tw':
                bonusClass = 'bg-[#8B3E3E] text-white';
                label = 'TW';
                break;
              case 'star':
                bonusClass = 'bg-[#FFD700]/80 text-[#1A1F2C]';
                label = '★';
                break;
              default:
                bonusClass = 'bg-[#243748] text-white';
            }
            
            return (
              <div
                key={`${x}-${y}`}
                className={`board-cell relative w-10 h-10 md:w-12 md:h-12 ${bonusClass} 
                  flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-[#9b87f5]
                  transition-all duration-200 border border-[#8E9196]/40`}
                onClick={() => onCellClick(x, y)}
                data-position={`${x}-${y}`}
              >
                {/* Display bonus label when no tile */}
                {!cell.tile && cell.bonus !== 'none' && (
                  <span className="text-xs font-bold opacity-80">{label}</span>
                )}
                
                {/* Display placed tile */}
                {cell.tile && (
                  <div className={`letter-tile absolute inset-0 flex items-center justify-center
                    ${cell.tile.isNew ? 'ring-2 ring-[#9b87f5] animate-pulse' : ''}`}>
                    <span className="text-xl font-bold text-[#1A1F2C] drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]">
                      {cell.tile.letter || '?'}
                    </span>
                    {cell.tile.letter && (
                      <span className="absolute bottom-0.5 right-1 text-xs font-bold text-[#1A1F2C]">
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
