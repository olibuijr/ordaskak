
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
    // Fetch all games and filter on the client side
    const records = await pb.collection('games').getList(1, 50, {
      sort: '-created',
      expand: 'players',
    });
    
    // Filter games by user ID in the client
    const userGames = records.items.filter(game => 
      game.created_by === userId || 
      game.userId === userId || 
      (game.players && game.players.includes(userId))
    );
    
    const games = userGames.map(item => ({
      id: item.id,
      created: item.created,
      players: item.playerNames || [], // Use playerNames as fallback
      isActive: item.status === 'in_progress', 
      yourScore: item.yourScore,
      winner: item.winner,
      userId: item.created_by || item.userId,
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

// Search for users to add to a game
export const searchUsers = async (query) => {
  if (!query || query.length < 2) return [];
  
  try {
    const records = await pb.collection('users').getList(1, 10, {
      filter: `username ~ "${query}" || email ~ "${query}" || name ~ "${query}"`,
    });
    
    return records.items.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name || user.username,
    }));
  } catch (error) {
    console.error('Error searching users:', error);
    return [];
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
    
    // Format data to match the required fields for PocketBase
    // The current_player_index is now a relation to the user ID who starts the game
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
      board_state: JSON.stringify(initializeGameBoard())
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
    
    const data = {
      game: moveData.gameId,
      user: moveData.userId,
      word: moveData.word,
      score: moveData.score,
      board_state: moveData.board_state,
      player_index: moveData.player_index
    };
    
    const record = await pb.collection('gamemoves').create(data);
    console.log("Game move saved successfully:", record);
    return record;
  } catch (error) {
    console.error('Error saving game move:', error);
    throw error;
  }
};

// Update the board state in the games collection
export const updateGameBoardState = async (gameId, gameState) => {
  try {
    console.log("Updating game board state for game:", gameId);
    
    const data = {
      board_state: JSON.stringify(gameState.board),
      current_player_index: gameState.players[gameState.currentPlayerIndex].id
    };
    
    const record = await pb.collection('games').update(gameId, data);
    console.log("Game board state updated successfully:", record);
    return record;
  } catch (error) {
    console.error('Error updating game board state:', error);
    throw error;
  }
};
