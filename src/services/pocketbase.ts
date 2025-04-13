
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
    // The API call was failing because there's no "user" field in the collection
    // Let's try to fetch games without filtering by user first and handle it on the client side
    const records = await pb.collection('games').getList(1, 50, {
      sort: '-created',
    });
    
    // Filter games by user ID in the client
    const userGames = records.items.filter(game => game.userId === userId || game.created_by === userId);
    
    const games = userGames.map(item => ({
      id: item.id,
      created: item.created,
      players: item.players || [],
      isActive: item.isActive,
      yourScore: item.yourScore,
      winner: item.winner,
      userId: item.userId || item.created_by
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

// Create a new game
export const createNewGame = async (data) => {
  try {
    const record = await pb.collection('games').create(data);
    return record;
  } catch (error) {
    console.error('Error creating game:', error);
    throw error;
  }
};
