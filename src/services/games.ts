
import { pb } from './pocketbase';
import { getCurrentUser } from './authentication';

// User game-related functions
export const fetchUserGames = async (userId) => {
  if (!userId) return { activeGames: [], completedGames: [] };
  
  try {
    // Updated filter to use created_by instead of userId
    const records = await pb.collection('games').getList(1, 50, {
      sort: '-created',
      filter: `created_by = "${userId}" || players ~ "${userId}"`,
    });
    
    const games = records.items.map(item => ({
      id: item.id,
      created: item.created,
      players: item.playerNames || [], // Use playerNames as fallback
      isActive: item.status === 'in_progress', 
      yourScore: item.yourScore,
      winner: item.winner,
      userId: item.created_by,
      name: item.name
    }));
    
    return {
      activeGames: games.filter(game => game.isActive),
      completedGames: games.filter(game => !game.isActive)
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
    
    // Set up the current user as the first player
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error("User must be logged in to create a game");
    }
    
    // Get player IDs from the selected players
    const selectedUserIds = data.selectedUsers ? data.selectedUsers.map(user => user.id) : [];
    
    // Make sure the current user is included in the players array
    const playerIds = [currentUser.id, ...selectedUserIds];
    
    // Initialize game board and tile bag
    const initialBoard = initializeGameBoard();
    const initialTileBag = JSON.stringify(data.tileBag || []);
    
    // Format data to match the required fields for PocketBase
    const gameData = {
      name: data.name || `Game ${new Date().toLocaleString('is-IS')}`,
      created_by: currentUser.id,
      current_player_index: currentUser.id, // Set to the ID of the user who creates the game
      status: "in_progress",
      // Store player names in a separate field for our UI
      playerNames: data.playerNames,
      // The players field must be a valid relation to user IDs
      players: playerIds, // Include both the current user and selected players
      isActive: true,
      userId: currentUser.id,
      board_state: JSON.stringify(initialBoard),
      tile_bag: initialTileBag
    };
    
    console.log("Sending formatted game data:", gameData);
    
    try {
      // Create the game with the current user as the current player and selected players
      const record = await pb.collection('games').create(gameData);
      console.log("Game created successfully:", record);
      return record;
    } catch (firstError) {
      console.error('First attempt error:', firstError);
      
      // If that fails, let's try to handle any potential issues
      console.log("Error details:", firstError.response?.data);
      throw firstError; // Re-throw the error for proper handling upstream
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
    
    const data = {
      game: moveData.gameId,
      user: moveData.userId,
      word: moveData.word || '',
      score: moveData.score || 0,
      board_state: moveData.board_state || '{}',
      player_index: moveData.player_index || 0,
      move_type: 'word', // Add required field
      player: moveData.userId, // Add required field
      score_gained: moveData.score || 0 // Add required field
    };
    
    try {
      const record = await pb.collection('gamemoves').create(data);
      console.log("Game move saved successfully:", record);
      return record;
    } catch (error) {
      console.error('Error saving game move:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in saveGameMove:', error);
    return null; // Return null instead of throwing to prevent app crashes
  }
};

// Update the board state in the games collection
export const updateGameBoardState = async (gameId, gameState) => {
  try {
    console.log("Updating game board state for game:", gameId);
    
    // Safety check to make sure gameState and its properties exist
    if (!gameState || !gameState.players) {
      console.error("Invalid game state:", gameState);
      return null;
    }
    
    // Log the players array for debugging
    console.log("Players array:", gameState.players);
    
    // Get current player index
    const currentPlayerIndex = gameState.currentPlayerIndex;
    
    // Make sure currentPlayerIndex is a valid index
    if (typeof currentPlayerIndex !== 'number' || currentPlayerIndex < 0 || currentPlayerIndex >= gameState.players.length) {
      console.error("Current player not found:", currentPlayerIndex, gameState.players);
      return null;
    }
    
    // Get the current player
    const currentPlayer = gameState.players[currentPlayerIndex];
    
    if (!currentPlayer) {
      console.error("Current player is null or undefined");
      return null;
    }
    
    // Get the current player's ID
    // If it's a real user ID (from database), use that. Otherwise, use the database ID if available
    const currentPlayerId = currentPlayer.id;
    console.log("Current player ID to be set:", currentPlayerId);
    
    // Only allow updates if currentPlayerId is a valid string
    if (!currentPlayerId || typeof currentPlayerId !== 'string') {
      console.error("Invalid current player ID:", currentPlayerId);
      return null;
    }
    
    // Check if the ID is in the format "player-X" which would be a local ID, not a database ID
    const isLocalId = currentPlayerId.startsWith('player-');
    
    // If it's a local ID and we have real database IDs in the players array, try to use them
    let finalPlayerId = currentPlayerId;
    if (isLocalId && gameState.players.length > 0) {
      // Try to fetch the game to get the real player IDs
      try {
        const gameRecord = await pb.collection('games').getOne(gameId);
        if (gameRecord && gameRecord.players && gameRecord.players.length > currentPlayerIndex) {
          // Use the real player ID from the database record
          finalPlayerId = gameRecord.players[currentPlayerIndex];
          console.log("Using real player ID from database:", finalPlayerId);
        }
      } catch (error) {
        console.warn("Could not fetch game record to get real player IDs:", error);
        // Continue with the local ID as fallback
      }
    }
    
    const data = {
      board_state: JSON.stringify(gameState.board),
      current_player_index: finalPlayerId,  // Use the finalized player ID
      tile_bag: JSON.stringify(gameState.tileBag)
    };
    
    try {
      const record = await pb.collection('games').update(gameId, data);
      console.log("Game board state updated successfully:", record);
      return record;
    } catch (error) {
      console.error('Error updating game board state:', error);
      return null;
    }
  } catch (error) {
    console.error('Error in updateGameBoardState:', error);
    return null;
  }
};

// Fetch a game by ID
export const fetchGameById = async (gameId) => {
  try {
    if (!gameId) {
      console.error("No game ID provided to fetchGameById");
      return null;
    }
    
    const record = await pb.collection('games').getOne(gameId, {
      expand: 'players'
    });
    
    return record;
  } catch (error) {
    console.error("Error fetching game by ID:", error);
    return null;
  }
};
