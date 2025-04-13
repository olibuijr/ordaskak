
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
    console.log("Starting getUsersByIds with IDs:", userIds);
    
    // Check for valid IDs and filter out any invalid ones
    const validUserIds = userIds.filter(id => {
      if (!id || typeof id !== 'string') {
        console.warn(`Invalid user ID type: ${typeof id}`);
        return false;
      }
      return id.length > 0;
    });
    
    if (validUserIds.length === 0) {
      console.warn("No valid user IDs provided to getUsersByIds");
      return [];
    }
    
    console.log("Valid user IDs:", validUserIds);
    
    // PocketBase's filter syntax for ID lists needs double quotes
    // First build a comma-separated list of user IDs with double quotes
    let filterStr = validUserIds.map(id => `"${id}"`).join(',');
    const filter = validUserIds.length === 1 
      ? `id = "${validUserIds[0]}"` 
      : `id IN [${filterStr}]`;
    
    console.log("Fetching users with filter:", filter);
    
    const records = await pb.collection('users').getList(1, validUserIds.length, {
      filter: filter,
      fields: 'id,username,email,name,avatar'
    });
    
    console.log(`Found ${records.items.length} users for ${validUserIds.length} IDs`);
    
    // Map the raw records to our consistent user object format
    const users = records.items.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name || user.username, // Fallback to username if name is not available
      avatar: user.avatar ? `${pb.baseUrl}/api/files/users/${user.id}/avatar?t=${Date.now()}` : null
    }));
    
    // Log if any IDs weren't found
    const foundIds = new Set(users.map(u => u.id));
    const missingIds = validUserIds.filter(id => !foundIds.has(id));
    
    if (missingIds.length > 0) {
      console.warn("Some user IDs were not found:", missingIds);
      
      // For missing IDs, provide fallback data
      const fallbackUsers = missingIds.map(id => ({
        id: id,
        username: `User-${id.substring(0, 5)}`,
        email: '',
        name: `User-${id.substring(0, 5)}`,
        avatar: null
      }));
      
      users.push(...fallbackUsers);
    }
    
    console.log("Returning user data:", users);
    return users;
  } catch (error) {
    console.error('Error batch fetching users:', error);
    console.error('Error details:', error);
    
    // Return basic data for all IDs to prevent UI issues
    return userIds.map(id => ({
      id: id || '',
      username: `User-${id.substring(0, 5)}`,
      email: '',
      name: `User-${id.substring(0, 5)}`,
      avatar: null
    }));
  }
};
