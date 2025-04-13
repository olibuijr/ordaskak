
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
    
    // Format data to match the required fields for PocketBase
    const gameData = {
      name: data.name || `Game ${new Date().toLocaleString('is-IS')}`,
      created_by: data.userId,
      // The current_player_index must be sent as a number (0)
      current_player_index: 0,
      status: "in_progress",
      // Store player names in a separate field for our UI
      playerNames: data.players,
      // Since the 'players' field requires valid relation records and we don't have them,
      // we'll omit this field and let the API handle the default values or send an empty array
      // which is more likely to work than invalid relation ids
      players: [],
      isActive: true,
      userId: data.userId
    };
    
    console.log("Sending formatted game data:", gameData);
    
    // First try with players as empty array
    try {
      const record = await pb.collection('games').create(gameData);
      console.log("Game created successfully:", record);
      return record;
    } catch (err) {
      // If that fails, try without the players field entirely
      delete gameData.players;
      console.log("Retrying without players field:", gameData);
      const record = await pb.collection('games').create(gameData);
      console.log("Game created successfully on retry:", record);
      return record;
    }
  } catch (error) {
    console.error('Error creating game:', error);
    throw error;
  }
};
