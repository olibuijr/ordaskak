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
  calculateWordScore,
  createTileBag
} from '@/utils/gameLogic';
import { useToast } from '@/components/ui/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';
import { pb, saveGameMove, updateGameBoardState } from '@/services/pocketbase';
import { useLocation } from 'react-router-dom';

const Game: React.FC = () => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [selectedTile, setSelectedTile] = useState<Tile | null>(null);
  const [placedTilesMap, setPlacedTilesMap] = useState<Map<string, PlacedTile>>(new Map());
  const [wordHistory, setWordHistory] = useState<Array<{word: string, player: string, score: number}>>([]);
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const location = useLocation();
  const [gameId, setGameId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const id = params.get('id');
    if (id) {
      setGameId(id);
      fetchExistingGame(id);
    }
  }, [location]);

  const fetchExistingGame = async (id: string) => {
    try {
      const record = await pb.collection('games').getOne(id, {
        expand: 'players'
      });
      
      if (record) {
        console.log("Fetched game:", record);
        
        // Convert player string IDs to player objects
        const playersArray = record.players ? 
          record.players.map((playerId, index) => ({
            id: playerId,
            name: record.playerNames && record.playerNames[index] ? record.playerNames[index] : `Player ${index + 1}`,
            score: 0,
            rack: [],
            isAI: false,
            // Mark the current player as active
            isActive: playerId === record.current_player_index
          })) : [];
        
        // Find the index of the current player in the players array
        const currentPlayerIndex = playersArray.findIndex(player => player.id === record.current_player_index);
        
        console.log("Current player index:", currentPlayerIndex);
        console.log("Players array:", playersArray);
        
        const loadedGameState: GameState = {
          board: record.board_state ? JSON.parse(record.board_state) : initializeGame(2).board,
          players: playersArray,
          currentPlayerIndex: currentPlayerIndex !== -1 ? currentPlayerIndex : 0,
          tileBag: record.tile_bag ? JSON.parse(record.tile_bag) : createTileBag(),
          isGameOver: record.status !== 'in_progress',
          winner: null,
          placedTiles: []
        };
        
        console.log("Converted game state:", loadedGameState);
        setGameState(loadedGameState);
      }
    } catch (error) {
      console.error("Error fetching game:", error);
      toast({
        title: "Villa við að sækja leik",
        description: "Ekki tókst að sækja leikinn. Vinsamlegast reyndu aftur.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (gameState) {
      console.log("Game state updated:", gameState);
      
      if (gameId) {
        updateGameBoardState(gameId, gameState);
      }
    }
  }, [gameState, gameId]);
  
  const handleStartGame = (playerCount: number, playerNames: string[], newGameId?: string) => {
    console.log("Starting game with", playerCount, "players");
    const newGameState = initializeGame(playerCount, playerNames);
    
    // Make sure we have valid players with appropriate structure
    if (newGameState.players && newGameState.players.length > 0) {
      // Only set the first player's ID to the current user if the user is logged in
      if (user && newGameState.players[0]) {
        newGameState.players[0].id = user.id;
      }
    }
    
    console.log("Initial game state:", newGameState);
    setGameState(newGameState);
    
    if (newGameId) {
      setGameId(newGameId);
      updateGameBoardState(newGameId, newGameState);
    }
    
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
    
    const newWord = {
      word,
      player: currentPlayer.name,
      score: scoreToAdd
    };
    
    setWordHistory(prev => [...prev, newWord]);
    
    if (gameId && user) {
      saveGameMove({
        gameId: gameId,
        userId: user.id,
        word: word,
        score: scoreToAdd,
        board_state: JSON.stringify(newGameState.board),
        player_index: newGameState.currentPlayerIndex
      });
    }
    
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
    
    if (gameId) {
      updateGameBoardState(gameId, newGameState);
    }
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
