
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
    
    // Format data to match the required fields for PocketBase
    // Making sure current_player_index is explicitly set as a number
    const gameData = {
      name: data.name || `Game ${new Date().toLocaleString('is-IS')}`,
      created_by: currentUser.id,
      current_player_index: 0, // Explicitly set this to 0 (first player's turn)
      status: "in_progress",
      // Store player names in a separate field for our UI
      playerNames: data.playerNames,
      // The players field must be a valid relation to user IDs
      players: [currentUser.id], // Include only the current user as a player
      isActive: true,
      userId: currentUser.id
    };
    
    console.log("Sending formatted game data:", gameData);
    
    try {
      // First attempt with the players array and explicitly setting the current_player_index
      const recordData = {
        ...gameData,
        current_player_index: Number(0) // Ensure it's explicitly a number
      };
      
      const record = await pb.collection('games').create(recordData);
      console.log("Game created successfully:", record);
      return record;
    } catch (firstError) {
      console.error('First attempt error:', firstError);
      
      // If that fails, try again with a different approach
      console.log("Retrying with different format");
      // Sometimes PocketBase needs the field as a string when sending it
      const recordData = {
        ...gameData,
        current_player_index: "0", // Try as string instead
        players: [currentUser.id]
      };
      
      const record = await pb.collection('games').create(recordData);
      console.log("Game created successfully on second attempt:", record);
      return record;
    }
  } catch (error) {
    console.error('Error creating game:', error);
    throw error;
  }
};
