import React, { useState, useEffect } from 'react';
import GameBoardCanvas from './GameBoard';
import PlayerRack from './PlayerRack';
import ScoreBoard from './ScoreBoard';
import GameControls from './GameControls';
import GameSetup from './GameSetup';
import { 
  initializeGame, 
  GameState, 
  Tile, 
  PlacedTile,
  shuffleArray,
  drawTiles
} from '@/utils/gameLogic';
import { useToast } from '@/components/ui/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import WordHistoryTable from './WordHistoryTable';

const Game: React.FC = () => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [selectedTile, setSelectedTile] = useState<Tile | null>(null);
  const [placedTilesMap, setPlacedTilesMap] = useState<Map<string, PlacedTile>>(new Map());
  const [wordHistory, setWordHistory] = useState<Array<{word: string, player: string, score: number}>>([]);
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  const handleStartGame = (playerCount: number, playerNames: string[]) => {
    const newGameState = initializeGame(playerCount, playerNames);
    setGameState(newGameState);
    toast({
      title: "Game Started",
      description: `Starting a new game with ${playerCount} players`,
    });
  };
  
  const handleTileClick = (tile: Tile) => {
    // Toggle selection
    if (selectedTile?.id === tile.id) {
      setSelectedTile(null);
    } else {
      setSelectedTile(tile);
    }
  };
  
  const handleCellClick = (x: number, y: number) => {
    if (!gameState || !selectedTile) return;
    
    // Check if the cell already has a tile
    if (gameState.board[y][x].tile) {
      toast({
        title: "Cell occupied",
        description: "This cell already has a tile",
        variant: "destructive",
      });
      return;
    }
    
    // Create a copy of the game state
    const newGameState = { ...gameState };
    
    // Get the current player
    const currentPlayer = newGameState.players[newGameState.currentPlayerIndex];
    
    // Remove the tile from the player's rack
    const tileIndex = currentPlayer.rack.findIndex(t => t.id === selectedTile.id);
    if (tileIndex === -1) return; // Tile not found in rack
    
    currentPlayer.rack.splice(tileIndex, 1);
    
    // Create a new placed tile
    const placedTile: PlacedTile = {
      ...selectedTile,
      x,
      y,
      isNew: true
    };
    
    // Place the tile on the board
    newGameState.board[y][x].tile = placedTile;
    
    // Add to placed tiles array
    newGameState.placedTiles.push(placedTile);
    
    // Update placed tiles map for easy access
    const newPlacedTilesMap = new Map(placedTilesMap);
    newPlacedTilesMap.set(`${x}-${y}`, placedTile);
    setPlacedTilesMap(newPlacedTilesMap);
    
    // Clear selection
    setSelectedTile(null);
    
    // Update game state
    setGameState(newGameState);
  };
  
  const handlePlayWord = () => {
    if (!gameState) return;
    
    // Here we would validate the word and calculate score
    // For the demo, we'll just calculate a simple score and proceed to next turn
    
    const newGameState = { ...gameState };
    const currentPlayer = newGameState.players[newGameState.currentPlayerIndex];
    
    if (newGameState.placedTiles.length === 0) {
      toast({
        title: "No tiles played",
        description: "You need to place at least one tile to play a word",
        variant: "destructive",
      });
      return;
    }
    
    // Simple scoring - just add the value of placed tiles
    const scoreToAdd = newGameState.placedTiles.reduce((score, tile) => {
      return score + tile.value;
    }, 0);
    
    currentPlayer.score += scoreToAdd;
    
    // Create a word from the newly placed tiles (simplified for demo)
    const word = newGameState.placedTiles.map(tile => tile.letter).join('');
    
    // Add to word history
    setWordHistory(prev => [...prev, {
      word,
      player: currentPlayer.name,
      score: scoreToAdd
    }]);
    
    // Draw new tiles for the current player
    const tilesToDraw = 7 - currentPlayer.rack.length;
    if (tilesToDraw > 0 && newGameState.tileBag.length > 0) {
      const { drawn, remaining } = drawTiles(newGameState.tileBag, tilesToDraw);
      currentPlayer.rack.push(...drawn);
      newGameState.tileBag = remaining;
    }
    
    // Clear placed tiles
    newGameState.placedTiles = [];
    
    // Mark all board tiles as no longer 'new'
    for (let y = 0; y < 15; y++) {
      for (let x = 0; x < 15; x++) {
        if (newGameState.board[y][x].tile?.isNew) {
          newGameState.board[y][x].tile.isNew = false;
        }
      }
    }
    
    // Move to next player
    currentPlayer.isActive = false;
    newGameState.currentPlayerIndex = (newGameState.currentPlayerIndex + 1) % newGameState.players.length;
    newGameState.players[newGameState.currentPlayerIndex].isActive = true;
    
    toast({
      title: "Word played",
      description: `Added ${scoreToAdd} points to ${currentPlayer.name}'s score`,
    });
    
    setGameState(newGameState);
    setPlacedTilesMap(new Map());
  };
  
  const handleShuffleTiles = () => {
    if (!gameState) return;
    
    const newGameState = { ...gameState };
    const currentPlayer = newGameState.players[newGameState.currentPlayerIndex];
    
    // Shuffle the player's rack
    currentPlayer.rack = shuffleArray(currentPlayer.rack);
    
    setGameState(newGameState);
    
    toast({
      title: "Tiles shuffled",
      description: "Your rack has been rearranged",
    });
  };
  
  const handlePassTurn = () => {
    if (!gameState) return;
    
    const newGameState = { ...gameState };
    const currentPlayer = newGameState.players[newGameState.currentPlayerIndex];
    
    // Handle any placed tiles - put them back in the rack
    if (newGameState.placedTiles.length > 0) {
      handleRecallTiles();
    }
    
    // Move to next player
    currentPlayer.isActive = false;
    newGameState.currentPlayerIndex = (newGameState.currentPlayerIndex + 1) % newGameState.players.length;
    newGameState.players[newGameState.currentPlayerIndex].isActive = true;
    
    toast({
      title: "Turn passed",
      description: `Now it's ${newGameState.players[newGameState.currentPlayerIndex].name}'s turn`,
    });
    
    setGameState(newGameState);
  };
  
  const handleRecallTiles = () => {
    if (!gameState) return;
    
    const newGameState = { ...gameState };
    const currentPlayer = newGameState.players[newGameState.currentPlayerIndex];
    
    // Return all newly placed tiles to the rack
    for (const placedTile of newGameState.placedTiles) {
      // Add tile back to rack
      currentPlayer.rack.push({
        id: placedTile.id,
        letter: placedTile.letter,
        value: placedTile.value,
        isBlank: placedTile.isBlank
      });
      
      // Remove from board
      newGameState.board[placedTile.y][placedTile.x].tile = null;
    }
    
    // Clear placed tiles
    newGameState.placedTiles = [];
    
    toast({
      title: "Tiles recalled",
      description: "All placed tiles have been returned to your rack",
    });
    
    setGameState(newGameState);
    setPlacedTilesMap(new Map());
  };
  
  if (!gameState) {
    return <GameSetup onStartGame={handleStartGame} />;
  }
  
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  
  return (
    <div className="container mx-auto px-4 py-6 flex flex-col gap-6 min-h-screen">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main game section */}
        <div className="lg:w-3/4 flex flex-col">
          {/* 3D Game board */}
          <div className="h-[60vh] md:h-[65vh] relative rounded-lg overflow-hidden border border-game-accent-blue/30">
            <GameBoardCanvas 
              board={gameState.board} 
              onCellClick={handleCellClick}
            />
          </div>
          
          {/* Player rack */}
          <div className="mt-4">
            <PlayerRack
              tiles={currentPlayer.rack}
              isCurrentPlayer={true}
              onTileClick={handleTileClick}
              selectedTileId={selectedTile?.id || null}
            />
            
            <GameControls
              currentPlayer={currentPlayer}
              onPlayWord={handlePlayWord}
              onShuffleTiles={handleShuffleTiles}
              onPassTurn={handlePassTurn}
              onRecallTiles={handleRecallTiles}
              canPlay={gameState.placedTiles.length > 0}
            />
          </div>
        </div>
        
        {/* Sidebar */}
        <div className="lg:w-1/4 flex flex-col gap-4">
          <ScoreBoard
            players={gameState.players}
            tilesRemaining={gameState.tileBag.length}
          />
          
          {/* Word history table */}
          <WordHistoryTable words={wordHistory} />
        </div>
      </div>
    </div>
  );
};

export default Game;
