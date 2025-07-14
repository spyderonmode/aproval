export type GameBoard = Record<string, string>;
export type WinCondition = 'diagonal' | null;

// Valid positions in the 3x5 grid (1-15)
export const VALID_POSITIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

// Position mapping for the 3x5 grid
export const POSITION_MAP = {
  // Row 1
  1: { row: 0, col: 0 },
  2: { row: 0, col: 1 },
  3: { row: 0, col: 2 },
  4: { row: 0, col: 3 },
  5: { row: 0, col: 4 },
  // Row 2
  6: { row: 1, col: 0 },
  7: { row: 1, col: 1 },
  8: { row: 1, col: 2 },
  9: { row: 1, col: 3 },
  10: { row: 1, col: 4 },
  // Row 3
  11: { row: 2, col: 0 },
  12: { row: 2, col: 1 },
  13: { row: 2, col: 2 },
  14: { row: 2, col: 3 },
  15: { row: 2, col: 4 },
};

export function isValidPosition(position: number): boolean {
  return VALID_POSITIONS.includes(position);
}

export function isPositionEmpty(board: GameBoard, position: number): boolean {
  return !board[position.toString()];
}

export function makeMove(board: GameBoard, position: number, player: string): GameBoard {
  if (!isValidPosition(position) || !isPositionEmpty(board, position)) {
    throw new Error('Invalid move');
  }
  
  return {
    ...board,
    [position.toString()]: player,
  };
}

// Horizontal win is no longer used - only diagonal wins are allowed
export function checkHorizontalWin(board: GameBoard, player: string): boolean {
  return false;
}

export function checkDiagonalWin(board: GameBoard, player: string): boolean {
  // Define diagonal patterns for 3 consecutive positions on the 3x5 grid
  const diagonalPatterns = [
    // Main diagonals (top-left to bottom-right)
    [1, 7, 13],   // 1 -> 7 -> 13
    [2, 8, 14],   // 2 -> 8 -> 14  
    [3, 9, 15],   // 3 -> 9 -> 15
    
    // Anti-diagonals (top-right to bottom-left)
    [3, 7, 11],   // 3 -> 7 -> 11
    [4, 8, 12],   // 4 -> 8 -> 12
    [5, 9, 13],   // 5 -> 9 -> 13
    
    // Additional diagonal patterns
    [6, 8, 10],   // 6 -> 8 -> 10
    [11, 7, 3],   // 11 -> 7 -> 3
    [12, 8, 4],   // 12 -> 8 -> 4
    [13, 9, 5],   // 13 -> 9 -> 5
    [1, 8, 15],   // 1 -> 8 -> 15
    [5, 8, 11],   // 5 -> 8 -> 11
  ];

  for (const pattern of diagonalPatterns) {
    if (pattern.every(pos => board[pos.toString()] === player)) {
      return true;
    }
  }

  return false;
}

export function checkWin(board: GameBoard, player: string): { winner: boolean; condition: WinCondition } {
  if (checkDiagonalWin(board, player)) {
    return { winner: true, condition: 'diagonal' };
  }
  
  return { winner: false, condition: null };
}

export function checkDraw(board: GameBoard): boolean {
  return VALID_POSITIONS.every(pos => board[pos.toString()]);
}

export function getAvailableMoves(board: GameBoard): number[] {
  return VALID_POSITIONS.filter(pos => isPositionEmpty(board, pos));
}

export function getOpponentSymbol(player: string): string {
  return player === 'X' ? 'O' : 'X';
}

export function validateMove(board: GameBoard, position: number, player: string): boolean {
  return isValidPosition(position) && isPositionEmpty(board, position);
}
