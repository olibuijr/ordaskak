
import { pb } from './pocketbase';
import { getCurrentUser } from './authentication';

// User game-related functions
export const fetchUserGames = async (userId) => {
  if (!userId) return { activeGames: [], completedGames: [] };
  
  try {
    const records = await pb.collection('games').getList(1, 50, {
      sort: '-created',
      filter: `created_by = "${userId}" || players ~ "${userId}"`,
      expand: 'players'
    });
    
    console.log("Raw game records:", records.items);
    
    const games = records.items.map(item => {
      // Correctly handle player IDs and names from the database
      let playerIds = [];
      
      // Check if players array is available and use it for IDs
      if (item.players && Array.isArray(item.players)) {
        playerIds = item.players;
      }
      
      console.log(`Game ${item.id} players:`, playerIds);
      
      return {
        id: item.id,
        created: item.created,
        players: playerIds, // Always use IDs here, we'll resolve to names in the component
        isActive: item.status === 'in_progress', 
        yourScore: item.yourScore,
        winner: item.winner,
        userId: item.created_by,
        name: item.name
      };
    });
    
    const activeGames = games.filter(game => game.isActive);
    const completedGames = games.filter(game => !game.isActive);
    
    console.log("Processed active games:", activeGames);
    console.log("Processed completed games:", completedGames);
    
    return {
      activeGames,
      completedGames
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
    
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error("User must be logged in to create a game");
    }
    
    const selectedUserIds = data.selectedUsers ? data.selectedUsers.map(user => user.id) : [];
    const playerIds = [currentUser.id, ...selectedUserIds];
    
    const initialBoard = initializeGameBoard();
    const initialTileBag = JSON.stringify(data.tileBag || []);
    
    const gameData = {
      name: data.name || `Game ${new Date().toLocaleString('is-IS')}`,
      created_by: currentUser.id,
      current_player_index: currentUser.id,
      status: "in_progress",
      playerNames: data.playerNames,
      players: playerIds,
      isActive: true,
      userId: currentUser.id,
      board_state: JSON.stringify(initialBoard),
      tile_bag: initialTileBag
    };
    
    console.log("Sending formatted game data:", gameData);
    
    try {
      const record = await pb.collection('games').create(gameData);
      console.log("Game created successfully:", record);
      return record;
    } catch (firstError) {
      console.error('First attempt error:', firstError);
      
      console.log("Error details:", firstError.response?.data);
      throw firstError;
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
      move_type: 'word',
      player: moveData.userId,
      score_gained: moveData.score || 0
    };
    
    try {
      const record = await pb.collection('gamemoves').create(data);
      console.log("Game move saved successfully:", record);
      return record;
    } catch (error) {
      console.error('Error saving game move:', error);
      console.error('Error details:', error.response?.data);
      return null;
    }
  } catch (error) {
    console.error('Error in saveGameMove:', error);
    return null;
  }
};

// Improved function to fetch a game by ID with expanded player data
export const fetchGameById = async (gameId) => {
  try {
    if (!gameId) {
      console.error("No game ID provided to fetchGameById");
      return null;
    }
    
    const record = await pb.collection('games').getOne(gameId, {
      expand: 'players'
    });
    
    if (!record) {
      console.error("Game record not found:", gameId);
      return null;
    }
    
    console.log("Fetched game record:", record);
    
    return record;
  } catch (error) {
    console.error("Error fetching game by ID:", error);
    return null;
  }
};

// Save the player racks and tile bag state to maintain consistency
export const updatePlayerRacks = async (gameId, players, tileBag) => {
  try {
    if (!gameId) {
      console.error("Cannot update player racks: No game ID provided");
      return null;
    }
    
    console.log("Updating player racks for game:", gameId);
    console.log("Players data:", players);
    
    // Store the rack data for each player
    const playerRacks = {};
    players.forEach((player, index) => {
      if (player && player.id && player.rack) {
        console.log(`Saving rack for player ${player.id}:`, player.rack);
        playerRacks[`player_${player.id}_rack`] = JSON.stringify(player.rack);
      } else {
        console.error(`Invalid player data at index ${index}:`, player);
      }
    });
    
    const data = {
      ...playerRacks,
      tile_bag: JSON.stringify(tileBag)
    };
    
    console.log("Data being sent to update racks:", data);
    
    const record = await pb.collection('games').update(gameId, data);
    console.log("Player racks and tile bag updated successfully:", record);
    return record;
  } catch (error) {
    console.error("Error updating player racks:", error);
    console.error("Error details:", error.response?.data);
    return null;
  }
};

// Update the board state in the games collection
export const updateGameBoardState = async (gameId, gameState) => {
  try {
    console.log("Updating game board state for game:", gameId);
    
    if (!gameState) {
      console.error("Invalid game state:", gameState);
      return null;
    }
    
    if (!gameState.players || gameState.players.length === 0) {
      try {
        console.log("Empty players array, fetching game details");
        const gameRecord = await fetchGameById(gameId);
        
        if (gameRecord && gameRecord.players && gameRecord.players.length > 0) {
          console.log("Using players from database:", gameRecord.players);
          
          const playerIds = gameRecord.players;
          const playerNames = gameRecord.playerNames || [];
          
          gameState.players = playerIds.map((playerId, index) => ({
            id: playerId,
            name: playerNames[index] || `Player ${index + 1}`,
            score: 0,
            rack: [],
            isAI: false,
            isActive: index === 0
          }));
          
          gameState.currentPlayerIndex = 0;
        } else {
          console.error("No players found in the game record");
          return null;
        }
      } catch (error) {
        console.error("Error fetching game record:", error);
        return null;
      }
    }
    
    console.log("Players array:", gameState.players);
    
    if (!gameState.players || gameState.players.length === 0) {
      console.error("Still no players available after fetching");
      return null;
    }
    
    const currentPlayerIndex = gameState.currentPlayerIndex;
    
    if (typeof currentPlayerIndex !== 'number' || 
        currentPlayerIndex < 0 || 
        currentPlayerIndex >= gameState.players.length) {
      console.error("Current player not found:", currentPlayerIndex, gameState.players);
      return null;
    }
    
    const currentPlayer = gameState.players[currentPlayerIndex];
    
    if (!currentPlayer) {
      console.error("Current player is null or undefined");
      return null;
    }
    
    const currentPlayerId = currentPlayer.id;
    console.log("Current player ID to be set:", currentPlayerId);
    
    if (!currentPlayerId || typeof currentPlayerId !== 'string') {
      console.error("Invalid current player ID:", currentPlayerId);
      return null;
    }
    
    // Update both the board state and persist player racks
    const playerRacks = {};
    gameState.players.forEach(player => {
      if (player && player.id && player.rack) {
        playerRacks[`player_${player.id}_rack`] = JSON.stringify(player.rack);
      }
    });
    
    const data = {
      board_state: JSON.stringify(gameState.board),
      current_player_index: currentPlayerId,
      tile_bag: JSON.stringify(gameState.tileBag),
      ...playerRacks
    };
    
    console.log("Data being sent to update game state:", data);
    
    try {
      const record = await pb.collection('games').update(gameId, data);
      console.log("Game board state updated successfully:", record);
      return record;
    } catch (error) {
      console.error('Error updating game board state:', error);
      console.error('Error details:', error.response?.data);
      return null;
    }
  } catch (error) {
    console.error('Error in updateGameBoardState:', error);
    return null;
  }
};

// Retrieve player racks from the database to maintain consistency
export const getPlayerRacks = async (gameId, playerIds) => {
  try {
    if (!gameId || !playerIds || playerIds.length === 0) {
      console.error("Cannot retrieve player racks: Invalid parameters");
      return null;
    }
    
    const record = await pb.collection('games').getOne(gameId);
    if (!record) {
      console.error("Game record not found when retrieving player racks:", gameId);
      return null;
    }
    
    const playerRacks = {};
    playerIds.forEach(playerId => {
      const rackKey = `player_${playerId}_rack`;
      if (record[rackKey]) {
        try {
          playerRacks[playerId] = JSON.parse(record[rackKey]);
        } catch (e) {
          console.error(`Error parsing rack for player ${playerId}:`, e);
          playerRacks[playerId] = [];
        }
      } else {
        playerRacks[playerId] = [];
      }
    });
    
    return playerRacks;
  } catch (error) {
    console.error("Error retrieving player racks:", error);
    return null;
  }
};
