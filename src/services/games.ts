import { pb } from './pocketbase';
import { getCurrentUser } from './authentication';

// User game-related functions
export const fetchUserGames = async (userId) => {
  if (!userId) return { activeGames: [], completedGames: [] };
  
  try {
    const records = await pb.collection('games').getList(1, 50, {
      sort: '-created',
      filter: `created_by = "${userId}" || players ~ "${userId}"`,
    });
    
    const games = records.items.map(item => ({
      id: item.id,
      created: item.created,
      players: item.playerNames || [],
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
      throw error;
    }
  } catch (error) {
    console.error('Error in saveGameMove:', error);
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
    
    const data = {
      board_state: JSON.stringify(gameState.board),
      current_player_index: currentPlayerId,
      tile_bag: JSON.stringify(gameState.tileBag)
    };
    
    try {
      const record = await pb.collection('games').update(gameId, data);
      console.log("Game board state updated successfully:", record);
      return record;
    } catch (error) {
      console.error('Error updating game board state:', error);
      return null;
    }
  } catch (error) {
    console.error('Error in updateGameBoardState:', error);
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
    
    const record = await pb.collection('games').getOne(gameId);
    
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
