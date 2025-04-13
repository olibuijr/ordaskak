
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
    className={`rack-tile letter-tile w-14 h-14 md:w-16 md:h-16 m-1 ${
      isSelected ? 'ring-2 ring-game-accent-pink transform -translate-y-2' : ''
    }`}
    onClick={onClick}
  >
    <span className="text-2xl font-bold">{tile.letter || '?'}</span>
    {tile.letter && <span className="letter-tile-value">{tile.value}</span>}
  </div>
);

const PlayerRack: React.FC<PlayerRackProps> = ({ 
  tiles, 
  isCurrentPlayer, 
  onTileClick, 
  selectedTileId 
}) => {
  return (
    <div className={`player-rack rounded-lg flex flex-row justify-center items-center
      ${isCurrentPlayer ? 'bg-opacity-80 glow-effect' : 'bg-opacity-40 opacity-60'} 
      mx-auto p-4 my-4 max-w-3xl`}
    >
      {tiles.map((tile) => (
        <ReactCardFlip 
          key={tile.id} 
          isFlipped={isCurrentPlayer} 
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
