import { pb } from './pocketbase';
import { getCurrentUser } from './authentication';
import { GameState, PlacedTile } from '@/utils/gameLogic';

// Create a map of active request signal controllers
const activeRequests = new Map();

// Helper to cancel previous request with the same key
const cancelPreviousRequest = (requestKey) => {
  if (activeRequests.has(requestKey)) {
    activeRequests.get(requestKey).abort();
    activeRequests.delete(requestKey);
  }
};

// User game-related functions
export const fetchUserGames = async (userId) => {
  if (!userId) return { activeGames: [], completedGames: [] };
  
  try {
    const records = await pb.collection('games').getList(1, 50, {
      sort: '-created',
      filter: `created_by = "${userId}" || players ~ "${userId}"`,
      expand: 'players'
    });
    
    console.log("Raw game records:", records.items);
    
    const games = records.items.map(item => {
      let playerIds = [];
      
      if (item.players && Array.isArray(item.players)) {
        playerIds = item.players;
      }
      
      console.log(`Game ${item.id} players:`, playerIds);
      
      return {
        id: item.id,
        created: item.created,
        players: playerIds,
        isActive: item.status === 'in_progress', 
        yourScore: item.yourScore,
        winner: item.winner,
        userId: item.created_by,
        name: item.name
      };
    });
    
    const activeGames = games.filter(game => game.isActive);
    const completedGames = games.filter(game => !game.isActive);
    
    console.log("Processed active games:", activeGames);
    console.log("Processed completed games:", completedGames);
    
    return {
      activeGames,
      completedGames
    };
  } catch (error) {
    console.error('Error fetching games:', error);
    throw error;
  }
};

// Create a new game with all required fields
export const createNewGame = async (data) => {
  try {
    console.log("Creating new game with data:", data);
    
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error("User must be logged in to create a game");
    }
    
    const selectedUserIds = data.selectedUsers ? data.selectedUsers.map(user => user.id) : [];
    const playerIds = [currentUser.id, ...selectedUserIds];
    
    const initialBoard = initializeGameBoard();
    const initialTileBag = JSON.stringify(data.tileBag || []);
    
    const gameData = {
      name: data.name || `Game ${new Date().toLocaleString('is-IS')}`,
      created_by: currentUser.id,
      current_player_index: currentUser.id,
      status: "in_progress",
      playerNames: data.playerNames,
      players: playerIds,
      isActive: true,
      userId: currentUser.id,
      board_state: JSON.stringify(initialBoard),
      tile_bag: initialTileBag
    };
    
    console.log("Sending formatted game data:", gameData);
    
    try {
      const record = await pb.collection('games').create(gameData);
      console.log("Game created successfully:", record);
      return record;
    } catch (firstError) {
      console.error('First attempt error:', firstError);
      
      console.log("Error details:", firstError.response?.data);
      throw firstError;
    }
  } catch (error) {
    console.error('Error creating game:', error);
    throw error;
  }
};

// Create an empty game board for initialization
const initializeGameBoard = () => {
  const board = [];
  for (let y = 0; y < 15; y++) {
    board[y] = [];
    for (let x = 0; x < 15; x++) {
      let bonus = 'none';
      board[y][x] = {
        x,
        y,
        bonus,
        tile: null
      };
    }
  }
  return board;
};

// Save a game move to the gamemoves collection
export const saveGameMove = async (moveData) => {
  try {
    console.log("Saving game move:", moveData);
    
    if (!moveData || !moveData.gameId || !moveData.userId) {
      console.error('Invalid move data:', moveData);
      return null;
    }
    
    // Cancel any previous save for this game/user
    const requestKey = `save_move_${moveData.gameId}_${moveData.userId}`;
    cancelPreviousRequest(requestKey);
    
    // Create a new abort controller for this request
    const controller = new AbortController();
    activeRequests.set(requestKey, controller);
    
    const data = {
      game: moveData.gameId,
      player: moveData.userId,
      move_type: moveData.moveType || 'place_tiles',
      word_played: moveData.word || '',
      score_gained: moveData.score || 0,
      tiles_placed: moveData.placedTiles ? JSON.stringify(moveData.placedTiles) : null
    };
    
    console.log("Formatted move data being saved:", data);
    
    try {
      const record = await pb.collection('gamemoves').create(data, {
        signal: controller.signal
      });
      
      // Clean up the controller after request is complete
      activeRequests.delete(requestKey);
      
      console.log("Game move saved successfully:", record);
      return record;
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log("Request to save game move was cancelled, a newer request takes precedence");
        return null;
      }
      
      console.error('Error saving game move:', error);
      console.error('Error details:', error.response?.data);
      return null;
    }
  } catch (error) {
    console.error('Error in saveGameMove:', error);
    return null;
  }
};

// Fetch game moves for a specific game
export const fetchGameMoves = async (gameId) => {
  try {
    if (!gameId) {
      console.error("Cannot fetch game moves: No game ID provided");
      return [];
    }
    
    // Cancel any previous fetch for this game's moves
    const requestKey = `fetch_moves_${gameId}`;
    cancelPreviousRequest(requestKey);
    
    // Create a new abort controller for this request
    const controller = new AbortController();
    activeRequests.set(requestKey, controller);
    
    console.log("Fetching moves for game:", gameId);
    
    const records = await pb.collection('gamemoves').getList(1, 200, {  // Increased from 100 to 200
      filter: `game = "${gameId}"`,
      sort: 'created',  // Sort by creation time to ensure proper order
      expand: 'player',
      signal: controller.signal
    });
    
    // Clean up the controller after request is complete
    activeRequests.delete(requestKey);
    
    console.log(`Fetched ${records.items.length} game moves for game ${gameId}:`, records.items);
    
    return records.items.map(move => {
      let parsedTiles = [];
      
      try {
        if (move.tiles_placed && typeof move.tiles_placed === 'string') {
          const parsed = JSON.parse(move.tiles_placed);
          if (Array.isArray(parsed)) {
            parsedTiles = parsed;
            console.log(`Successfully parsed ${parsed.length} tiles for move ${move.id}:`, parsedTiles);
          } else {
            console.error(`Tiles data for move ${move.id} is not an array:`, parsed);
          }
        }
      } catch (error) {
        console.error(`Error parsing tiles for move ${move.id}:`, error);
      }
      
      return {
        id: move.id,
        player: move.expand?.player ? (move.expand.player.name || move.expand.player.username) : 'Unknown',
        playerId: move.player,
        word: move.word_played || '',
        score: move.score_gained || 0,
        moveType: move.move_type,
        created: move.created,
        placedTiles: parsedTiles
      };
    });
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log("Request to fetch game moves was cancelled, a newer request takes precedence");
      return [];
    }
    
    console.error("Error fetching game moves:", error);
    return [];
  }
};

// Improved function to fetch a game by ID with expanded player data
export const fetchGameById = async (gameId) => {
  try {
    if (!gameId) {
      console.error("No game ID provided to fetchGameById");
      return null;
    }
    
    // Cancel any previous fetch for this game
    const requestKey = `fetch_game_${gameId}`;
    cancelPreviousRequest(requestKey);
    
    // Create a new abort controller for this request
    const controller = new AbortController();
    activeRequests.set(requestKey, controller);
    
    const record = await pb.collection('games').getOne(gameId, {
      expand: 'players',
      signal: controller.signal
    });
    
    // Clean up the controller after request is complete
    activeRequests.delete(requestKey);
    
    if (!record) {
      console.error("Game record not found:", gameId);
      return null;
    }
    
    console.log("Fetched game record:", record);
    
    return record;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log("Request to fetch game was cancelled, a newer request takes precedence");
      return null;
    }
    
    console.error("Error fetching game by ID:", error);
    return null;
  }
};

// Save the player racks and tile bag state to maintain consistency with proper cancellation handling
export const updatePlayerRacks = async (gameId, players, tileBag) => {
  try {
    if (!gameId) {
      console.error("Cannot update player racks: No game ID provided");
      return null;
    }
    
    console.log("Updating player racks for game:", gameId);
    console.log("Players data:", players);
    
    // Cancel any previous update for this game
    const requestKey = `update_racks_${gameId}`;
    cancelPreviousRequest(requestKey);
    
    // Create a new abort controller for this request
    const controller = new AbortController();
    activeRequests.set(requestKey, controller);

    const playerRacks = {};
    players.forEach((player, index) => {
      if (player && player.id && player.rack) {
        console.log(`Saving rack for player ${player.id}:`, player.rack);
        playerRacks[`player_${player.id}_rack`] = JSON.stringify(player.rack);
      } else {
        console.error(`Invalid player data at index ${index}:`, player);
      }
    });
    
    const data = {
      ...playerRacks,
      tile_bag: JSON.stringify(tileBag)
    };
    
    console.log("Data being sent to update racks:", data);
    
    const record = await pb.collection('games').update(gameId, data, {
      signal: controller.signal
    });
    
    // Clean up the controller after request is complete
    activeRequests.delete(requestKey);
    
    console.log("Player racks and tile bag updated successfully:", record);
    return record;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log("Request to update player racks was cancelled, a newer request takes precedence");
      return null;
    }
    
    console.error("Error updating player racks:", error);
    console.error("Error details:", error.response?.data);
    return null;
  }
};

// Retrieve player racks from the database to maintain consistency
export const getPlayerRacks = async (gameId, playerIds) => {
  try {
    if (!gameId || !playerIds || playerIds.length === 0) {
      console.error("Cannot retrieve player racks: Invalid parameters");
      return null;
    }
    
    // Cancel any previous fetch for this game's racks
    const requestKey = `get_racks_${gameId}`;
    cancelPreviousRequest(requestKey);
    
    // Create a new abort controller for this request
    const controller = new AbortController();
    activeRequests.set(requestKey, controller);
    
    const record = await pb.collection('games').getOne(gameId, {
      signal: controller.signal
    });
    
    // Clean up the controller after request is complete
    activeRequests.delete(requestKey);
    
    if (!record) {
      console.error("Game record not found when retrieving player racks:", gameId);
      return null;
    }
    
    console.log("Retrieved game record for racks:", record);
    
    const playerRacks = {};
    playerIds.forEach(playerId => {
      const rackKey = `player_${playerId}_rack`;
      if (record[rackKey]) {
        try {
          console.log(`Found rack for player ${playerId}:`, record[rackKey]);
          playerRacks[playerId] = JSON.parse(record[rackKey]);
        } catch (e) {
          console.error(`Error parsing rack for player ${playerId}:`, e);
          playerRacks[playerId] = [];
        }
      } else {
        console.log(`No rack found for player ${playerId}, using empty array`);
        playerRacks[playerId] = [];
      }
    });
    
    console.log("Returning player racks:", playerRacks);
    return playerRacks;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log("Request to get player racks was cancelled, a newer request takes precedence");
      return null;
    }
    
    console.error("Error retrieving player racks:", error);
    return null;
  }
};

// Update the board state in the games collection with proper cancellation handling
export const updateGameBoardState = async (gameId: string, gameState: GameState) => {
  try {
    console.log("Updating game board state for game:", gameId);
    
    if (!gameState) {
      console.error("Invalid game state:", gameState);
      return null;
    }
    
    // Cancel any previous update for this game
    const requestKey = `update_board_${gameId}`;
    cancelPreviousRequest(requestKey);
    
    // Create a new abort controller for this request
    const controller = new AbortController();
    activeRequests.set(requestKey, controller);
    
    // Handling empty players array
    if (!gameState.players || gameState.players.length === 0) {
      try {
        console.log("Empty players array, fetching game details");
        const gameRecord = await fetchGameById(gameId);
        
        if (gameRecord && gameRecord.players && gameRecord.players.length > 0) {
          console.log("Using players from database:", gameRecord.players);
          
          const playerIds = gameRecord.players;
          const playerNames = gameRecord.playerNames || [];
          
          gameState.players = playerIds.map((playerId, index) => ({
            id: playerId,
            name: playerNames[index] || `Player ${index + 1}`,
            score: 0,
            rack: [],
            isAI: false,
            isActive: index === 0
          }));
          
          gameState.currentPlayerIndex = 0;
        } else {
          console.error("No players found in the game record");
          return null;
        }
      } catch (error) {
        console.error("Error fetching game record:", error);
        return null;
      }
    }
    
    console.log("Players array:", gameState.players);
    
    if (!gameState.players || gameState.players.length === 0) {
      console.error("Still no players available after fetching");
      return null;
    }
    
    const currentPlayerIndex = gameState.currentPlayerIndex;
    
    if (typeof currentPlayerIndex !== 'number' || 
        currentPlayerIndex < 0 || 
        currentPlayerIndex >= gameState.players.length) {
      console.error("Current player not found:", currentPlayerIndex, gameState.players);
      return null;
    }
    
    const currentPlayer = gameState.players[currentPlayerIndex];
    
    if (!currentPlayer) {
      console.error("Current player is null or undefined");
      return null;
    }
    
    // Make sure the current player ID is a valid user ID from the database
    // If it starts with "player-", it's a temporary ID and we shouldn't try to use it as a relation
    const currentPlayerId = currentPlayer.id;
    console.log("Current player ID to be set:", currentPlayerId);
    
    if (!currentPlayerId) {
      console.error("Invalid current player ID: undefined or null");
      return null;
    }
    
    // Check if the ID is a temporary one (like "player-1")
    const isTemporaryId = typeof currentPlayerId === 'string' && currentPlayerId.startsWith('player-');
    
    const playerRacks = {};
    gameState.players.forEach(player => {
      if (player && player.id && player.rack) {
        playerRacks[`player_${player.id}_rack`] = JSON.stringify(player.rack);
      }
    });
    
    // Define the data object with its type explicitly
    const data: {
      board_state: string;
      tile_bag: string;
      current_player_index?: string;
      [key: string]: any;
    } = {
      board_state: JSON.stringify(gameState.board),
      tile_bag: JSON.stringify(gameState.tileBag),
      ...playerRacks
    };
    
    // Only include current_player_index if it's a valid user ID
    if (!isTemporaryId) {
      data.current_player_index = currentPlayerId;
    }
    
    console.log("Data being sent to update game state:", data);
    
    try {
      const record = await pb.collection('games').update(gameId, data, {
        signal: controller.signal
      });
      
      // Clean up the controller after request is complete
      activeRequests.delete(requestKey);
      
      console.log("Game board state updated successfully:", record);
      return record;
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log("Request to update game board state was cancelled, a newer request takes precedence");
        return null;
      }
      
      console.error('Error updating game board state:', error);
      console.error('Error details:', error.response?.data);
      return null;
    }
  } catch (error) {
    console.error('Error in updateGameBoardState:', error);
    return null;
  }
};
