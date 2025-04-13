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
      players: item.players || [],
      isActive: item.status === 'in_progress', // Updated to match valid status
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
    // Based on the error message, we need to:
    // 1. Set current_player_index correctly
    // 2. Include players field as an array
    // 3. Use a valid status value (not "active")
    
    // Format data to match the required fields from the error message
    const gameData = {
      name: data.name || `Game ${new Date().toLocaleString('is-IS')}`,
      created_by: data.userId, // Required field
      current_player_index: 0, // Required field, starting with first player
      status: 'in_progress', // Changed from "active" to "in_progress"
      players: data.players.map(name => ({ name })), // Format players as array of objects
      // Any other fields we want to keep
      playerNames: data.players, // Store player names for easy access
      isActive: true,
      userId: data.userId
    };
    
    const record = await pb.collection('games').create(gameData);
    return record;
  } catch (error) {
    console.error('Error creating game:', error);
    throw error;
  }
};
