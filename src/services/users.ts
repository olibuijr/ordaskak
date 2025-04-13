
import { pb } from './pocketbase';

// Search for users to add to a game
export const searchUsers = async (query: string) => {
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
export const getUserById = async (userId: string) => {
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

// Batch fetch multiple users by their IDs
export const getUsersByIds = async (userIds: string[]) => {
  if (!userIds || userIds.length === 0) return [];
  
  try {
    // Create a filter to get all users with IDs in the provided array
    const filter = userIds.map(id => `id = "${id}"`).join(' || ');
    
    console.log("Fetching users with filter:", filter);
    
    const records = await pb.collection('users').getList(1, 100, {
      filter: filter,
      fields: 'id,username,email,name,avatar'
    });
    
    console.log(`Found ${records.items.length} users for ${userIds.length} IDs`);
    
    return records.items.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name || user.username,
      avatar: user.avatar ? `${pb.baseUrl}/api/files/users/${user.id}/avatar?t=${Date.now()}` : null
    }));
  } catch (error) {
    console.error('Error batch fetching users:', error);
    return [];
  }
};
