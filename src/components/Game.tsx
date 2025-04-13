import React, { useState, useEffect } from 'react';
import GameBoard from './GameBoard';
import PlayerRack from './PlayerRack';
import ScoreBoard from './ScoreBoard';
import GameControls from './GameControls';
import GameSetup from './GameSetup';
import WordHistoryTable from './WordHistoryTable';
import { 
  initializeGame, 
  GameState, 
  Tile, 
  PlacedTile,
  shuffleArray,
  drawTiles,
  calculateWordScore
} from '@/utils/gameLogic';
import { useToast } from '@/components/ui/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

const Game: React.FC = () => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [selectedTile, setSelectedTile] = useState<Tile | null>(null);
  const [placedTilesMap, setPlacedTilesMap] = useState<Map<string, PlacedTile>>(new Map());
  const [wordHistory, setWordHistory] = useState<Array<{word: string, player: string, score: number}>>([]);
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  useEffect(() => {
    if (gameState) {
      console.log("Game state updated:", gameState);
    }
  }, [gameState]);
  
  const handleStartGame = (playerCount: number, playerNames: string[]) => {
    console.log("Starting game with", playerCount, "players");
    const newGameState = initializeGame(playerCount, playerNames);
    console.log("Initial game state:", newGameState);
    setGameState(newGameState);
    toast({
      title: "Leikur hafinn",
      description: `Nýr leikur hefst með ${playerCount} leikmönnum`,
    });
  };
  
  const handleTileClick = (tile: Tile) => {
    console.log("Tile clicked:", tile);
    if (selectedTile?.id === tile.id) {
      setSelectedTile(null);
    } else {
      setSelectedTile(tile);
      toast({
        title: "Stafur valinn",
        description: `Valdir stafinn ${tile.letter || 'Auður'}. Smelltu á borðið til að leggja hann niður.`,
      });
    }
  };
  
  const handleCellClick = (x: number, y: number) => {
    console.log("Cell clicked:", x, y);
    if (!gameState || !selectedTile) {
      if (!selectedTile) {
        toast({
          title: "Enginn stafur valinn",
          description: "Vinsamlegast veldu staf úr rekkanum þínum fyrst",
          variant: "destructive",
        });
      }
      return;
    }
    
    if (gameState.board[y][x].tile) {
      toast({
        title: "Reitur upptekinn",
        description: "Þessi reitur er nú þegar með staf",
        variant: "destructive",
      });
      return;
    }
    
    const newGameState = { ...gameState };
    const currentPlayer = newGameState.players[newGameState.currentPlayerIndex];
    
    const tileIndex = currentPlayer.rack.findIndex(t => t.id === selectedTile.id);
    if (tileIndex === -1) return;
    
    currentPlayer.rack.splice(tileIndex, 1);
    
    const placedTile: PlacedTile = {
      ...selectedTile,
      x,
      y,
      isNew: true
    };
    
    newGameState.board[y][x].tile = placedTile;
    newGameState.placedTiles.push(placedTile);
    
    const newPlacedTilesMap = new Map(placedTilesMap);
    newPlacedTilesMap.set(`${x}-${y}`, placedTile);
    setPlacedTilesMap(newPlacedTilesMap);
    
    setSelectedTile(null);
    
    toast({
      title: "Stafur lagður niður",
      description: `Lagðir ${placedTile.letter || 'Auðan staf'} á stöðu (${x+1}, ${y+1})`,
    });
    
    setGameState(newGameState);
  };
  
  const handlePlayWord = function() {
    if (!gameState) return;
    
    const newGameState = { ...gameState };
    const currentPlayer = newGameState.players[newGameState.currentPlayerIndex];
    
    if (newGameState.placedTiles.length === 0) {
      toast({
        title: "Engir stafir lagðir niður",
        description: "Þú þarft að leggja niður að minnsta kosti einn staf til að spila orð",
        variant: "destructive",
      });
      return;
    }
    
    let isHorizontal = true;
    let isVertical = true;
    const positions = newGameState.placedTiles.map(tile => ({ x: tile.x, y: tile.y }));
    
    const firstY = positions[0].y;
    const firstX = positions[0].x;
    
    for (const pos of positions) {
      if (pos.y !== firstY) isHorizontal = false;
      if (pos.x !== firstX) isVertical = false;
    }
    
    if (!isHorizontal && !isVertical) {
      toast({
        title: "Ógilt leggja",
        description: "Stafirnir þurfa að vera í beinni línu (láréttri eða lóðréttri)",
        variant: "destructive",
      });
      return;
    }
    
    let allTilesInWord: { x: number, y: number }[] = [...positions];
    
    if (isHorizontal) {
      positions.sort((a, b) => a.x - b.x);
      const minX = positions[0].x;
      const maxX = positions[positions.length - 1].x;
      const y = positions[0].y;
      
      for (let x = minX - 1; x >= 0; x--) {
        if (newGameState.board[y][x].tile) {
          allTilesInWord.push({ x, y });
        } else {
          break;
        }
      }
      
      for (let x = maxX + 1; x < 15; x++) {
        if (newGameState.board[y][x].tile) {
          allTilesInWord.push({ x, y });
        } else {
          break;
        }
      }
      
      allTilesInWord.sort((a, b) => a.x - b.x);
    } else if (isVertical) {
      positions.sort((a, b) => a.y - b.y);
      const minY = positions[0].y;
      const maxY = positions[positions.length - 1].y;
      const x = positions[0].x;
      
      for (let y = minY - 1; y >= 0; y--) {
        if (newGameState.board[y][x].tile) {
          allTilesInWord.push({ x, y });
        } else {
          break;
        }
      }
      
      for (let y = maxY + 1; y < 15; y++) {
        if (newGameState.board[y][x].tile) {
          allTilesInWord.push({ x, y });
        } else {
          break;
        }
      }
      
      allTilesInWord.sort((a, b) => a.y - b.y);
    }
    
    const scoreToAdd = calculateWordScore(newGameState.board, newGameState.placedTiles, allTilesInWord);
    currentPlayer.score += scoreToAdd;
    
    const wordLetters = allTilesInWord.map(pos => {
      const cell = newGameState.board[pos.y][pos.x];
      return cell.tile?.letter || '';
    });
    
    const word = wordLetters.join('');
    
    setWordHistory(prev => [...prev, {
      word,
      player: currentPlayer.name,
      score: scoreToAdd
    }]);
    
    const tilesToDraw = 7 - currentPlayer.rack.length;
    if (tilesToDraw > 0 && newGameState.tileBag.length > 0) {
      const { drawn, remaining } = drawTiles(newGameState.tileBag, tilesToDraw);
      currentPlayer.rack.push(...drawn);
      newGameState.tileBag = remaining;
    }
    
    newGameState.placedTiles = [];
    
    for (let y = 0; y < 15; y++) {
      for (let x = 0; x < 15; x++) {
        if (newGameState.board[y][x].tile?.isNew) {
          newGameState.board[y][x].tile.isNew = false;
        }
      }
    }
    
    currentPlayer.isActive = false;
    newGameState.currentPlayerIndex = (newGameState.currentPlayerIndex + 1) % newGameState.players.length;
    newGameState.players[newGameState.currentPlayerIndex].isActive = true;
    
    toast({
      title: "Orð spilað",
      description: `Bættir ${scoreToAdd} stigum við skor ${currentPlayer.name}`,
    });
    
    setGameState(newGameState);
    setPlacedTilesMap(new Map());
  };
  
  const handleShuffleTiles = function() {
    if (!gameState) return;
    
    const newGameState = { ...gameState };
    const currentPlayer = newGameState.players[newGameState.currentPlayerIndex];
    
    currentPlayer.rack = shuffleArray(currentPlayer.rack);
    
    setGameState(newGameState);
    
    toast({
      title: "Stöfum blandað",
      description: "Stöfunum í rekkanum þínum hefur verið endurraðað",
    });
  };
  
  const handlePassTurn = function() {
    if (!gameState) return;
    
    const newGameState = { ...gameState };
    const currentPlayer = newGameState.players[newGameState.currentPlayerIndex];
    
    if (newGameState.placedTiles.length > 0) {
      handleRecallTiles();
    }
    
    currentPlayer.isActive = false;
    newGameState.currentPlayerIndex = (newGameState.currentPlayerIndex + 1) % newGameState.players.length;
    newGameState.players[newGameState.currentPlayerIndex].isActive = true;
    
    toast({
      title: "Umferð sleppt",
      description: `Núna er röðin á ${newGameState.players[newGameState.currentPlayerIndex].name}`,
    });
    
    setGameState(newGameState);
  };
  
  const handleRecallTiles = function() {
    if (!gameState) return;
    
    const newGameState = { ...gameState };
    const currentPlayer = newGameState.players[newGameState.currentPlayerIndex];
    
    for (const placedTile of newGameState.placedTiles) {
      currentPlayer.rack.push({
        id: placedTile.id,
        letter: placedTile.letter,
        value: placedTile.value,
        isBlank: placedTile.isBlank
      });
      
      newGameState.board[placedTile.y][placedTile.x].tile = null;
    }
    
    newGameState.placedTiles = [];
    
    toast({
      title: "Stöfum skilað",
      description: "Allir lagðir stafir hafa verið skráðir aftur í rekkann þinn",
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
        <div className="lg:w-3/4 flex flex-col">
          <h2 className="text-2xl font-bold mb-3 text-game-accent-blue">
            {currentPlayer.name} á leik
          </h2>
          
          <div className="h-[60vh] md:h-[65vh] relative rounded-lg overflow-hidden border border-game-accent-blue/30 bg-game-dark">
            <GameBoard 
              board={gameState.board} 
              onCellClick={handleCellClick}
            />
          </div>
          
          <div className="mt-3 mb-2 text-center text-sm text-white/70">
            {selectedTile 
              ? "Smelltu á borðið til að leggja niður valinn staf" 
              : "Veldu staf úr rekkanum þínum til að spila"}
          </div>
          
          <div className="mt-2">
            <PlayerRack
              tiles={currentPlayer.rack}
              isCurrentPlayer={true}
              onTileClick={handleTileClick}
              selectedTileId={selectedTile?.id || null}
            />
            
            <GameControls
              currentPlayer={currentPlayer}
              onPlayWord={() => handlePlayWord()}
              onShuffleTiles={() => handleShuffleTiles()}
              onPassTurn={() => handlePassTurn()}
              onRecallTiles={() => handleRecallTiles()}
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

export default Game;
