
import React from 'react';
import { Tile } from '@/utils/gameLogic';
import ReactCardFlip from 'react-card-flip';

interface PlayerRackProps {
  tiles: Tile[];
  isCurrentPlayer: boolean;
  onTileClick: (tile: Tile) => void;
  selectedTileId: string | null;
}

const TileComponent: React.FC<{
  tile: Tile;
  isSelected: boolean;
  onClick: () => void;
}> = ({ tile, isSelected, onClick }) => (
  <div 
    className={`rack-tile letter-tile w-14 h-14 md:w-16 md:h-16 m-1 cursor-pointer bg-amber-100 flex flex-col items-center justify-center rounded-md border border-amber-200 shadow-md relative ${
      isSelected ? 'ring-2 ring-[#9b87f5] transform -translate-y-4' : ''
    }`}
    onClick={onClick}
    draggable="true"
    data-tile-id={tile.id}
  >
    <span className="text-2xl font-bold text-[#1A1F2C]">{tile.letter || '?'}</span>
    {tile.letter && (
      <span className="letter-tile-value absolute bottom-1 right-1 text-xs font-bold text-[#1A1F2C]">
        {tile.value}
      </span>
    )}
  </div>
);

const PlayerRack: React.FC<PlayerRackProps> = ({ 
  tiles, 
  isCurrentPlayer, 
  onTileClick, 
  selectedTileId 
}) => {
  // Always show tiles face up for better usability
  const showTiles = true;

  return (
    <div className="player-rack rounded-lg flex flex-row justify-center items-center
      mx-auto p-4 my-4 max-w-3xl bg-[#1A1F2C]/70 border border-game-accent-blue/30"
    >
      {tiles.map((tile) => (
        <ReactCardFlip 
          key={tile.id} 
          isFlipped={showTiles} 
          flipDirection="horizontal"
          containerClassName="inline-block"
        >
          {/* Hidden back side */}
          <div className="w-14 h-14 md:w-16 md:h-16 m-1 bg-game-light rounded-md
            flex items-center justify-center text-center shadow-md border border-game-accent-blue/20">
            <span className="text-game-accent-blue">Orðaskák</span>
          </div>
          
          {/* Tile front side */}
          <TileComponent
            tile={tile}
            isSelected={selectedTileId === tile.id}
            onClick={() => onTileClick(tile)}
          />
        </ReactCardFlip>
      ))}
    </div>
  );
};

export default PlayerRack;
