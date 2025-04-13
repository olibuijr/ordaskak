
import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  GameState, 
  Tile, 
  PlacedTile,
  drawTiles,
  initializeGame,
  shuffleArray,
  calculateWordScore,
  createTileBag
} from '@/utils/gameLogic';
import { useToast } from '@/components/ui/use-toast';
import { 
  saveGameMove, 
  updateGameBoardState, 
  fetchGameById, 
  updatePlayerRacks,
  getPlayerRacks,
  fetchGameMoves
} from '@/services/games';
import { getUserById } from '@/services/users';
import { useAuth } from '@/contexts/AuthContext';

export type WordHistoryEntry = {
  id?: string;
  word: string;
  player: string;
  score: number;
  moveType?: 'place_tiles' | 'shuffle' | 'pass';
  created?: string;
};

// Debounce utility
const useDebounce = (callback: (...args: any[]) => void, delay: number) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const debouncedCallback = useCallback((...args: any[]) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]);
  
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  return debouncedCallback;
};

export const useGameState = (initialGameId: string | null) => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [selectedTile, setSelectedTile] = useState<Tile | null>(null);
  const [placedTilesMap, setPlacedTilesMap] = useState<Map<string, PlacedTile>>(new Map());
  const [wordHistory, setWordHistory] = useState<WordHistoryEntry[]>([]);
  const [gameId, setGameId] = useState<string | null>(initialGameId);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isInitialLoad, setIsInitialLoad] = useState<boolean>(true);
  const [updateQueued, setUpdateQueued] = useState<boolean>(false);
  const [rackDataLoaded, setRackDataLoaded] = useState<boolean>(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Save game state to database
  const saveGameState = async (id: string, state: GameState) => {
    if (!id || !state) return;
    
    await updateGameBoardState(id, state);
    
    if (state.players && state.tileBag) {
      await updatePlayerRacks(id, state.players, state.tileBag);
    }
  };
  
  const debouncedSaveGameState = useDebounce((id, state) => {
    saveGameState(id, state);
    setUpdateQueued(false);
  }, 500);

  useEffect(() => {
    if (gameState && gameId && !isInitialLoad && rackDataLoaded) {
      console.log("Game state updated, queuing save to database");
      setUpdateQueued(true);
      debouncedSaveGameState(gameId, gameState);
    }
  }, [gameState, gameId, isInitialLoad, rackDataLoaded]);

  // Fetch existing game from the database
  const fetchExistingGame = async (id: string) => {
    try {
      setIsLoading(true);
      console.log("Fetching game with ID:", id);
      const record = await fetchGameById(id);
      
      if (record) {
        console.log("Fetched game record:", record);
        
        const playerIds = Array.isArray(record.players) ? record.players : [];
        const playerNames = Array.isArray(record.playerNames) ? record.playerNames : [];
        
        if (playerIds.length === 0) {
          console.error("No players found in the game record");
          toast({
            title: "Villa við að sækja leik",
            description: "Engir spilarar fundust í leiknum. Vinsamlegast reyndu aftur.",
            variant: "destructive",
          });
          setIsLoading(false);
          setIsInitialLoad(false);
          return;
        }
        
        console.log("Player IDs from database:", playerIds);
        console.log("Player names from database:", playerNames);
        
        let boardState;
        try {
          boardState = record.board_state ? JSON.parse(record.board_state) : initializeGame(2).board;
          console.log("Loaded board state from database:", boardState);
        } catch (e) {
          console.error("Error parsing board state:", e);
          boardState = initializeGame(2).board;
        }
        
        let tileBagState;
        try {
          tileBagState = record.tile_bag ? JSON.parse(record.tile_bag) : createTileBag();
          console.log("Loaded tile bag from database:", tileBagState);
        } catch (e) {
          console.error("Error parsing tile bag:", e);
          tileBagState = createTileBag();
        }
        
        const playerRacks = await getPlayerRacks(id, playerIds);
        console.log("Retrieved player racks from database:", playerRacks);
        
        const playersArray = [];
        
        for (let i = 0; i < playerIds.length; i++) {
          const playerId = playerIds[i];
          let playerName = '';
          
          if (playerNames && playerNames[i]) {
            playerName = playerNames[i];
          } else {
            try {
              const userRecord = await getUserById(playerId);
              playerName = userRecord ? (userRecord.name || userRecord.username) : `Player ${i + 1}`;
            } catch (error) {
              console.error(`Error fetching name for player ${playerId}:`, error);
              playerName = `Player ${i + 1}`;
            }
          }
          
          const playerRack = playerRacks && playerRacks[playerId] ? playerRacks[playerId] : [];
          console.log(`Rack for player ${playerId}:`, playerRack);
          
          playersArray.push({
            id: playerId,
            name: playerName,
            score: 0,
            rack: playerRack,
            isAI: false,
            isActive: false
          });
        }
        
        let currentPlayerIndex = 0;
        if (record.current_player_index) {
          currentPlayerIndex = playersArray.findIndex(player => player.id === record.current_player_index);
          if (currentPlayerIndex === -1) currentPlayerIndex = 0;
        }
        
        playersArray.forEach((player, index) => {
          player.isActive = index === currentPlayerIndex;
        });
        
        console.log("Current player index:", currentPlayerIndex);
        console.log("Players array with racks:", playersArray);
        
        const loadedGameState: GameState = {
          board: boardState,
          players: playersArray,
          currentPlayerIndex: currentPlayerIndex,
          tileBag: tileBagState,
          isGameOver: record.status !== 'in_progress',
          winner: null,
          placedTiles: []
        };
        
        console.log("Loaded game state:", loadedGameState);
        
        const updatedGameState = { ...loadedGameState };
        let needUpdate = false;
        
        for (let i = 0; i < updatedGameState.players.length; i++) {
          if (!updatedGameState.players[i].rack || updatedGameState.players[i].rack.length === 0) {
            console.log(`Player ${updatedGameState.players[i].name} needs new tiles`);
            const { drawn, remaining } = drawTiles(updatedGameState.tileBag, 7);
            updatedGameState.players[i].rack = drawn;
            updatedGameState.tileBag = remaining;
            needUpdate = true;
          } else {
            console.log(`Player ${updatedGameState.players[i].name} already has tiles:`, updatedGameState.players[i].rack);
          }
        }
        
        try {
          const gameMovesHistory = await fetchGameMoves(id);
          
          if (gameMovesHistory && gameMovesHistory.length > 0) {
            setWordHistory(gameMovesHistory);
            
            console.log("Reconstructing board state from game moves:", gameMovesHistory);
            
            gameMovesHistory.forEach(move => {
              const playerIndex = updatedGameState.players.findIndex(p => p.id === move.playerId);
              if (playerIndex !== -1) {
                updatedGameState.players[playerIndex].score += (move.score || 0);
              }
              
              if (move.moveType === 'place_tiles' && move.placedTiles && move.placedTiles.length > 0) {
                console.log(`Applying move: ${move.word} with tiles:`, move.placedTiles);
                
                move.placedTiles.forEach(placedTile => {
                  if (typeof placedTile.x === 'number' && 
                      typeof placedTile.y === 'number' && 
                      placedTile.x >= 0 && placedTile.x < 15 && 
                      placedTile.y >= 0 && placedTile.y < 15) {
                    
                    updatedGameState.board[placedTile.y][placedTile.x].tile = {
                      ...placedTile,
                      isNew: false
                    };
                  }
                });
              }
            });
          }
        } catch (error) {
          console.error("Error fetching game moves:", error);
        }
        
        setRackDataLoaded(true);
        setGameState(updatedGameState);
        
        if (needUpdate) {
          console.log("Updating game state because some players needed new tiles");
          saveGameState(id, updatedGameState);
        }
      } else {
        toast({
          title: "Villa við að sækja leik",
          description: "Leikur fannst ekki. Vinsamlegast reyndu aftur.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching game:", error);
      toast({
        title: "Villa við að sækja leik",
        description: "Ekki tókst að sækja leikinn. Vinsamlegast reyndu aftur.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsInitialLoad(false);
    }
  };

  // Start a new game
  const handleStartGame = (playerCount: number, playerNames: string[], newGameId?: string) => {
    console.log("Starting game with", playerCount, "players");
    const newGameState = initializeGame(playerCount, playerNames);
    
    if (newGameState.players && newGameState.players.length > 0) {
      if (user && newGameState.players[0]) {
        newGameState.players[0].id = user.id;
      }
    }
    
    console.log("Initial game state:", newGameState);
    setGameState(newGameState);
    setRackDataLoaded(true);
    
    if (newGameId) {
      setGameId(newGameId);
      if (newGameState.players && newGameState.players.length > 0) {
        saveGameState(newGameId, newGameState);
      }
    }
    
    toast({
      title: "Leikur hafinn",
      description: `Nýr leikur hefst með ${playerCount} leikmönnum`,
    });
  };
  
  // Handle tile click in the player rack
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
  
  // Handle clicking on a cell in the game board
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
  
  // Handle playing word action
  const handlePlayWord = () => {
    if (!gameState || !gameId) return;
    
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
      score: scoreToAdd,
      moveType: 'place_tiles' as const
    };
    
    setWordHistory(prev => [...prev, newWord]);
    
    const placedTilesCopy = newGameState.placedTiles.map(tile => ({
      id: tile.id,
      letter: tile.letter,
      value: tile.value,
      isBlank: tile.isBlank,
      x: tile.x,
      y: tile.y,
      isNew: tile.isNew
    }));
    
    console.log("Saving placed tiles:", placedTilesCopy);
    
    if (gameId && user) {
      const userId = user.id || currentPlayer.id;
      if (userId && !userId.startsWith('player-')) {
        saveGameMove({
          gameId: gameId,
          userId: userId,
          word: word,
          score: scoreToAdd,
          moveType: 'place_tiles',
          placedTiles: placedTilesCopy
        });
      }
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
      updatePlayerRacks(gameId, newGameState.players, newGameState.tileBag);
    }
  };
  
  // Handle shuffling tiles in the player rack
  const handleShuffleTiles = () => {
    if (!gameState || !gameId) return;
    
    const newGameState = { ...gameState };
    const currentPlayer = newGameState.players[newGameState.currentPlayerIndex];
    
    const rackCopy = currentPlayer.rack.map(tile => ({ ...tile }));
    currentPlayer.rack = shuffleArray(rackCopy);
    
    setGameState(newGameState);
    
    if (gameId && user) {
      saveGameMove({
        gameId: gameId,
        userId: user.id,
        word: '',
        score: 0,
        moveType: 'shuffle'
      });
      
      const newMoveEntry = {
        player: currentPlayer.name,
        word: '',
        score: 0,
        moveType: 'shuffle' as const
      };
      
      setWordHistory(prev => [...prev, newMoveEntry]);
    }
    
    if (gameId) {
      updatePlayerRacks(gameId, newGameState.players, newGameState.tileBag);
    }
    
    toast({
      title: "Stöfum blandað",
      description: "Stöfunum í rekkanum þínum hefur verið endurraðað",
    });
  };
  
  // Handle passing turn
  const handlePassTurn = () => {
    if (!gameState || !gameId) return;
    
    const newGameState = { ...gameState };
    const currentPlayer = newGameState.players[newGameState.currentPlayerIndex];
    
    if (newGameState.placedTiles.length > 0) {
      handleRecallTiles();
    }
    
    if (gameId && user) {
      saveGameMove({
        gameId: gameId,
        userId: user.id,
        word: '',
        score: 0,
        moveType: 'pass'
      });
      
      const newMoveEntry = {
        player: currentPlayer.name,
        word: '',
        score: 0,
        moveType: 'pass' as const
      };
      
      setWordHistory(prev => [...prev, newMoveEntry]);
    }
    
    currentPlayer.isActive = false;
    newGameState.currentPlayerIndex = (newGameState.currentPlayerIndex + 1) % newGameState.players.length;
    newGameState.players[newGameState.currentPlayerIndex].isActive = true;
    
    toast({
      title: "Umferð sleppt",
      description: `Núna er röðin á ${newGameState.players[newGameState.currentPlayerIndex].name}`,
    });
    
    setGameState(newGameState);
    
    if (gameId) {
      updateGameBoardState(gameId, newGameState);
    }
  };
  
  // Handle recalling tiles from the board
  const handleRecallTiles = () => {
    if (!gameState || !gameId) return;
    
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
    
    if (gameId) {
      updatePlayerRacks(gameId, newGameState.players, newGameState.tileBag);
    }
    
    toast({
      title: "Stöfum skilað",
      description: "Allir lagðir stafir hafa verið skráðir aftur í rekkann þinn",
    });
    
    setGameState(newGameState);
    setPlacedTilesMap(new Map());
  };

  return {
    gameState,
    selectedTile,
    placedTilesMap,
    wordHistory,
    gameId,
    isLoading,
    isInitialLoad,
    updateQueued,
    rackDataLoaded,
    setGameId,
    fetchExistingGame,
    handleStartGame,
    handleTileClick,
    handleCellClick,
    handlePlayWord,
    handleShuffleTiles,
    handlePassTurn,
    handleRecallTiles
  };
};
