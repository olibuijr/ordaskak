
import React from 'react';
import PlayerRack from '../PlayerRack';
import GameBoard from '../GameBoard';
import GameControls from '../GameControls';
import ScoreBoard from '../ScoreBoard';
import WordHistoryTable from '../WordHistoryTable';
import { GameState, Tile } from '@/utils/gameLogic';
import { WordHistoryEntry } from '@/hooks/useGameState';

interface GameLayoutProps {
  gameState: GameState;
  selectedTileId: string | null;
  wordHistory: WordHistoryEntry[];
  updateQueued: boolean;
  onTileClick: (tile: Tile) => void;
  onCellClick: (x: number, y: number) => void;
  onPlayWord: () => void;
  onShuffleTiles: () => void;
  onPassTurn: () => void;
  onRecallTiles: () => void;
}

const GameLayout: React.FC<GameLayoutProps> = ({
  gameState,
  selectedTileId,
  wordHistory,
  updateQueued,
  onTileClick,
  onCellClick,
  onPlayWord,
  onShuffleTiles,
  onPassTurn,
  onRecallTiles
}) => {
  const currentPlayerIndex = gameState.currentPlayerIndex >= 0 && 
                            gameState.currentPlayerIndex < gameState.players.length ? 
                            gameState.currentPlayerIndex : 0;
  
  const currentPlayer = gameState.players[currentPlayerIndex];
  
  return (
    <div className="container mx-auto px-4 py-6 flex flex-col gap-6 min-h-screen">
      {updateQueued && (
        <div className="bg-amber-800/20 text-amber-200 p-2 rounded-md text-sm text-center">
          Vista breytingar...
        </div>
      )}
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-3/4 flex flex-col">
          <h2 className="text-2xl font-bold mb-3 text-game-accent-blue">
            {currentPlayer.name} á leik
          </h2>
          
          <div className="h-[60vh] md:h-[65vh] relative rounded-lg overflow-hidden border border-game-accent-blue/30 bg-game-dark">
            <GameBoard 
              board={gameState.board} 
              onCellClick={onCellClick}
            />
          </div>
          
          <div className="mt-3 mb-2 text-center text-sm text-white/70">
            {selectedTileId 
              ? "Smelltu á borðið til að leggja niður valinn staf" 
              : "Veldu staf úr rekkanum þínum til að spila"}
          </div>
          
          <div className="mt-2">
            <PlayerRack
              tiles={currentPlayer.rack}
              isCurrentPlayer={true}
              onTileClick={onTileClick}
              selectedTileId={selectedTileId}
            />
            
            <GameControls
              currentPlayer={currentPlayer}
              onPlayWord={onPlayWord}
              onShuffleTiles={onShuffleTiles}
              onPassTurn={onPassTurn}
              onRecallTiles={onRecallTiles}
              canPlay={gameState.placedTiles.length > 0}
            />
          </div>
        </div>
        
        <div className="lg:w-1/4 flex flex-col gap-4">
          <ScoreBoard
            players={gameState.players}
            tilesRemaining={gameState.tileBag.length}
          />
          
          <WordHistoryTable words={wordHistory} />
        </div>
      </div>
    </div>
  );
};

export default GameLayout;
