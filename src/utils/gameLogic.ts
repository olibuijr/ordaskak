export interface Tile {
  id: string;
  letter: string;
  value: number;
  isBlank: boolean;
}

export interface PlacedTile extends Tile {
  x: number;
  y: number;
  isNew: boolean;
}

export interface BoardCell {
  x: number;
  y: number;
  bonus: string; // 'none', 'dl', 'tl', 'dw', 'tw', 'star'
  tile: PlacedTile | null;
}

export interface Player {
  id: string;
  name: string;
  score: number;
  rack: Tile[];
  isAI: boolean;
  isActive: boolean;
}

export interface GameState {
  board: BoardCell[][];
  players: Player[];
  currentPlayerIndex: number;
  tileBag: Tile[];
  isGameOver: boolean;
  winner: Player | null;
  placedTiles: PlacedTile[];
}

// Icelandic letter distribution (adjusted to include Icelandic characters)
export const LETTER_DISTRIBUTION: { [key: string]: { count: number; value: number } } = {
  'A': { count: 10, value: 1 },
  'Á': { count: 3, value: 3 },
  'B': { count: 1, value: 5 },
  'D': { count: 4, value: 2 },
  'Ð': { count: 2, value: 4 },
  'E': { count: 9, value: 1 },
  'É': { count: 1, value: 6 },
  'F': { count: 3, value: 3 },
  'G': { count: 3, value: 3 },
  'H': { count: 3, value: 3 },
  'I': { count: 7, value: 1 },
  'Í': { count: 2, value: 4 },
  'J': { count: 1, value: 8 },
  'K': { count: 3, value: 3 },
  'L': { count: 4, value: 2 },
  'M': { count: 2, value: 4 },
  'N': { count: 8, value: 1 },
  'O': { count: 2, value: 4 },
  'Ó': { count: 2, value: 4 },
  'P': { count: 1, value: 8 },
  'R': { count: 6, value: 1 },
  'S': { count: 5, value: 1 },
  'T': { count: 5, value: 1 },
  'U': { count: 3, value: 3 },
  'Ú': { count: 1, value: 6 },
  'V': { count: 2, value: 4 },
  'X': { count: 1, value: 10 },
  'Y': { count: 2, value: 4 },
  'Ý': { count: 1, value: 6 },
  'Þ': { count: 1, value: 8 },
  'Æ': { count: 1, value: 8 },
  'Ö': { count: 1, value: 8 },
  '?': { count: 2, value: 0 } // Blank tiles
};

// Create the initial tile bag based on letter distribution
export const createTileBag = (): Tile[] => {
  const bag: Tile[] = [];
  
  Object.entries(LETTER_DISTRIBUTION).forEach(([letter, { count, value }]) => {
    for (let i = 0; i < count; i++) {
      bag.push({
        id: `${letter}-${i}`,
        letter: letter === '?' ? '' : letter,
        value: value,
        isBlank: letter === '?'
      });
    }
  });
  
  // Shuffle the bag
  return shuffleArray(bag);
};

// Fisher-Yates shuffle algorithm
export const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Create a standard 15x15 Scrabble board
export const createBoard = (): BoardCell[][] => {
  const board: BoardCell[][] = [];
  
  // Define bonus positions
  const tripleWordCells = [
    [0, 0], [0, 7], [0, 14], 
    [7, 0], [7, 14], 
    [14, 0], [14, 7], [14, 14]
  ];
  
  const doubleWordCells = [
    [1, 1], [2, 2], [3, 3], [4, 4], 
    [1, 13], [2, 12], [3, 11], [4, 10], 
    [10, 4], [11, 3], [12, 2], [13, 1], 
    [10, 10], [11, 11], [12, 12], [13, 13]
  ];
  
  const tripleLetterCells = [
    [1, 5], [1, 9], 
    [5, 1], [5, 5], [5, 9], [5, 13], 
    [9, 1], [9, 5], [9, 9], [9, 13], 
    [13, 5], [13, 9]
  ];
  
  const doubleLetterCells = [
    [0, 3], [0, 11], 
    [2, 6], [2, 8], 
    [3, 0], [3, 7], [3, 14], 
    [6, 2], [6, 6], [6, 8], [6, 12], 
    [7, 3], [7, 11], 
    [8, 2], [8, 6], [8, 8], [8, 12], 
    [11, 0], [11, 7], [11, 14], 
    [12, 6], [12, 8], 
    [14, 3], [14, 11]
  ];
  
  for (let y = 0; y < 15; y++) {
    board[y] = [];
    for (let x = 0; x < 15; x++) {
      let bonus = 'none';
      
      if (x === 7 && y === 7) {
        bonus = 'star';
      } else if (tripleWordCells.some(cell => cell[0] === y && cell[1] === x)) {
        bonus = 'tw';
      } else if (doubleWordCells.some(cell => cell[0] === y && cell[1] === x)) {
        bonus = 'dw';
      } else if (tripleLetterCells.some(cell => cell[0] === y && cell[1] === x)) {
        bonus = 'tl';
      } else if (doubleLetterCells.some(cell => cell[0] === y && cell[1] === x)) {
        bonus = 'dl';
      }
      
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

// Draw tiles from the bag
export const drawTiles = (bag: Tile[], count: number): { drawn: Tile[], remaining: Tile[] } => {
  if (count > bag.length) {
    count = bag.length;
  }
  
  const drawn = bag.slice(0, count);
  const remaining = bag.slice(count);
  
  return { drawn, remaining };
};

// Initialize game with specified number of players
export const initializeGame = (playerCount: number, playerNames: string[] = []): GameState => {
  const tileBag = createTileBag();
  const players: Player[] = [];
  
  for (let i = 0; i < playerCount; i++) {
    const { drawn, remaining } = drawTiles(tileBag, 7);
    
    players.push({
      id: `player-${i}`,
      name: playerNames[i] || `Player ${i + 1}`,
      score: 0,
      rack: drawn,
      isAI: i > 0, // First player is human, rest are AI for now
      isActive: i === 0
    });
    
    tileBag.splice(0, tileBag.length, ...remaining);
  }
  
  return {
    board: createBoard(),
    players,
    currentPlayerIndex: 0,
    tileBag,
    isGameOver: false,
    winner: null,
    placedTiles: []
  };
};

export const getBonusDescription = (bonus: string): string => {
  switch (bonus) {
    case 'dl': return 'Tvöfaldur stafur';
    case 'tl': return 'Þrefaldur stafur';
    case 'dw': return 'Tvöfalt orð';
    case 'tw': return 'Þrefalt orð';
    case 'star': return 'Miðjureitur';
    default: return '';
  }
};

// Calculate score for placed tiles, accounting for bonus squares
export const calculateWordScore = (
  board: BoardCell[][],
  placedTiles: PlacedTile[],
  allTilesInWord: { x: number, y: number }[]
): number => {
  let letterScore = 0;
  let wordMultiplier = 1;
  
  // First pass: Calculate letter scores including letter multipliers
  for (const position of allTilesInWord) {
    const { x, y } = position;
    const cell = board[y][x];
    
    if (cell.tile) {
      let tileValue = cell.tile.value;
      
      // Check if this is a newly placed tile that landed on a bonus square
      const isNewTile = placedTiles.some(tile => tile.x === x && tile.y === y);
      
      if (isNewTile) {
        // Apply letter multipliers for newly placed tiles
        if (cell.bonus === 'dl') {
          tileValue *= 2;
        } else if (cell.bonus === 'tl') {
          tileValue *= 3;
        } else if (cell.bonus === 'dw') {
          // Store word multiplier for second pass
          wordMultiplier *= 2;
        } else if (cell.bonus === 'tw') {
          // Store word multiplier for second pass
          wordMultiplier *= 3;
        }
      }
      
      letterScore += tileValue;
    }
  }
  
  // Second pass: Apply word multipliers
  const totalScore = letterScore * wordMultiplier;
  
  return totalScore;
};
