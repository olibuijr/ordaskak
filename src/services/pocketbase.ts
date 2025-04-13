
import PocketBase from 'pocketbase';

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
    });
    
    // Filter games by user ID in the client
    const userGames = records.items.filter(game => 
      game.created_by === userId || game.userId === userId
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

// Create a new game with all required fields
export const createNewGame = async (data) => {
  try {
    console.log("Creating new game with data:", data);
    
    // Based on the API errors, we need to modify our approach:
    // 1. For current_player_index: ensure it's properly set and matches expected format
    // 2. For players: don't try to create dummy relation records
    
    // Format data to match the required fields for PocketBase
    const gameData = {
      name: data.name || `Game ${new Date().toLocaleString('is-IS')}`,
      created_by: data.userId,
      current_player_index: 0, // Use a number instead of string "0"
      status: "in_progress",
      // Store player names for our UI
      playerNames: data.players,
      // Don't include the players field at all for now since it's causing relation errors
      // players: playerIds,  (removed this field)
      isActive: true,
      userId: data.userId
    };
    
    console.log("Sending formatted game data:", gameData);
    
    const record = await pb.collection('games').create(gameData);
    console.log("Game created successfully:", record);
    return record;
  } catch (error) {
    console.error('Error creating game:', error);
    throw error;
  }
};
