
import PocketBase from 'pocketbase';
import { GameState } from '@/utils/gameLogic';

// Create a single PocketBase instance for the entire app
export const pb = new PocketBase('https://ordaskak.olibuijr.com/api/');

// Helper to check if the user is authenticated
export const isLoggedIn = () => {
  return pb.authStore.isValid;
};

// Get the current user data
export const getCurrentUser = () => {
  if (!isLoggedIn()) return null;
  return pb.authStore.model;
};

// Logout the current user
export const logout = () => {
  pb.authStore.clear();
};

// Game-related functions
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

// Search for users to add to a game - improved with documentation details
export const searchUsers = async (query) => {
  if (!query || query.length < 2) return [];
  
  try {
    // Using the proper filter syntax based on documentation
    const records = await pb.collection('users').getList(1, 10, {
      filter: `username ~ "${query}" || email ~ "${query}" || name ~ "${query}"`,
      sort: 'username',
      fields: 'id,username,email,name,avatar' // Only fetch the fields we need
    });
    
    // Map to a consistent user object format
    return records.items.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name || user.username,
      avatar: user.avatar ? `${pb.baseUrl}/api/files/users/${user.id}/avatar?t=${Date.now()}` : null
    }));
  } catch (error) {
    console.error('Error searching users:', error);
    return [];
  }
};

// Get a specific user by ID
export const getUserById = async (userId) => {
  if (!userId) return null;
  
  try {
    const user = await pb.collection('users').getOne(userId, {
      fields: 'id,username,email,name,avatar,total_games_played,total_wins,rating'
    });
    
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name || user.username,
      avatar: user.avatar ? `${pb.baseUrl}/api/files/users/${user.id}/avatar?t=${Date.now()}` : null,
      totalGamesPlayed: user.total_games_played || 0,
      totalWins: user.total_wins || 0,
      rating: user.rating || 0
    };
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
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
    
    const record = await pb.collection('gamemoves').create(data);
    console.log("Game move saved successfully:", record);
    return record;
  } catch (error) {
    console.error('Error saving game move:', error);
    return null; // Return null instead of throwing to prevent app crashes
  }
};

// Update the board state in the games collection
export const updateGameBoardState = async (gameId, gameState) => {
  try {
    console.log("Updating game board state for game:", gameId);
    
    // Safety check to make sure gameState and its properties exist
    if (!gameState || !gameState.players || !Array.isArray(gameState.players)) {
      console.error("Invalid game state:", gameState);
      return null;
    }
    
    // Get the current player's ID (not the index) with safety checks
    const currentPlayerIndex = typeof gameState.currentPlayerIndex === 'number' && 
                              gameState.currentPlayerIndex >= 0 && 
                              gameState.currentPlayerIndex < gameState.players.length ? 
                              gameState.currentPlayerIndex : 0;
    
    const currentPlayer = gameState.players[currentPlayerIndex];
    
    if (!currentPlayer) {
      console.error("Current player not found:", currentPlayerIndex, gameState.players);
      return null;
    }

    // Make sure the current player has an ID
    const currentPlayerId = currentPlayer.id || `player-${currentPlayerIndex}`;
    console.log("Current player ID to be set:", currentPlayerId);
    
    const data = {
      board_state: JSON.stringify(gameState.board),
      current_player_index: currentPlayerId, // Set the ID not the index
      tile_bag: JSON.stringify(gameState.tileBag)
    };
    
    try {
      const record = await pb.collection('games').update(gameId, data);
      console.log("Game board state updated successfully:", record);
      return record;
    } catch (error) {
      console.error('Error updating game board state:', error);
      // Don't throw, just return null to prevent app crashes
      return null;
    }
  } catch (error) {
    console.error('Error in updateGameBoardState:', error);
    return null;
  }
};
