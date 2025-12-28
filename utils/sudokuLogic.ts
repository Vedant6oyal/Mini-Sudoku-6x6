
import { Board, CellValue, Position } from '../types';

export const GRID_SIZE = 6;
export const BLOCK_ROWS = 2;
export const BLOCK_COLS = 3;

export const INITIAL_IMAGE_BOARD: (number | null)[][] = [
  [1, 2, null, null, null, null],
  [3, 4, null, null, null, null],
  [null, null, null, null, 6, 4],
  [5, 6, null, null, null, null],
  [null, null, null, null, 4, 5],
  [null, null, null, null, 2, 3],
];

export function isValid(board: Board, row: number, col: number, num: number): boolean {
  // Check row
  for (let x = 0; x < GRID_SIZE; x++) {
    if (x !== col && board[row][x].value === num) return false;
  }

  // Check column
  for (let x = 0; x < GRID_SIZE; x++) {
    if (x !== row && board[x][col].value === num) return false;
  }

  // Check block
  const startRow = Math.floor(row / BLOCK_ROWS) * BLOCK_ROWS;
  const startCol = Math.floor(col / BLOCK_COLS) * BLOCK_COLS;
  for (let i = 0; i < BLOCK_ROWS; i++) {
    for (let j = 0; j < BLOCK_COLS; j++) {
      const r = startRow + i;
      const c = startCol + j;
      if ((r !== row || c !== col) && board[r][c].value === num) return false;
    }
  }

  return true;
}

export function isBoardComplete(board: Board): boolean {
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const val = board[r][c].value;
      if (val === null || !isValid(board, r, c, val)) return false;
    }
  }
  return true;
}

export function solveSudoku(boardValues: (number | null)[][]): (number | null)[][] | null {
  const grid = boardValues.map(row => [...row]);

  function solve(): boolean {
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        if (grid[row][col] === null) {
          for (let num = 1; num <= GRID_SIZE; num++) {
            if (checkValidity(grid, row, col, num)) {
              grid[row][col] = num;
              if (solve()) return true;
              grid[row][col] = null;
            }
          }
          return false;
        }
      }
    }
    return true;
  }

  function checkValidity(g: (number | null)[][], row: number, col: number, num: number): boolean {
    for (let x = 0; x < GRID_SIZE; x++) if (g[row][x] === num) return false;
    for (let x = 0; x < GRID_SIZE; x++) if (g[x][col] === num) return false;
    const startRow = Math.floor(row / BLOCK_ROWS) * BLOCK_ROWS;
    const startCol = Math.floor(col / BLOCK_COLS) * BLOCK_COLS;
    for (let i = 0; i < BLOCK_ROWS; i++) {
      for (let j = 0; j < BLOCK_COLS; j++) {
        if (g[startRow + i][startCol + j] === num) return false;
      }
    }
    return true;
  }

  if (solve()) return grid;
  return null;
}

export interface CompletionResult {
  rowCompleted: boolean;
  colCompleted: boolean;
  blockCompleted: boolean;
  isAnyCompleted: boolean;
}

export function checkMoveCompletion(
  board: Board, 
  solution: (number | null)[][], 
  row: number, 
  col: number
): CompletionResult {
  const result = { rowCompleted: false, colCompleted: false, blockCompleted: false, isAnyCompleted: false };
  if (!solution) return result;

  // Check if current row matches solution row completely
  const isRowCorrect = () => {
    for(let c = 0; c < GRID_SIZE; c++) {
      if (board[row][c].value !== solution[row][c]) return false;
    }
    return true;
  };

  // Check if current col matches solution col completely
  const isColCorrect = () => {
    for(let r = 0; r < GRID_SIZE; r++) {
      if (board[r][col].value !== solution[r][col]) return false;
    }
    return true;
  };

  // Check if current block matches solution block completely
  const isBlockCorrect = () => {
    const startRow = Math.floor(row / BLOCK_ROWS) * BLOCK_ROWS;
    const startCol = Math.floor(col / BLOCK_COLS) * BLOCK_COLS;
    for(let r = 0; r < BLOCK_ROWS; r++) {
      for(let c = 0; c < BLOCK_COLS; c++) {
        if (board[startRow + r][startCol + c].value !== solution[startRow + r][startCol + c]) return false;
      }
    }
    return true;
  };

  result.rowCompleted = isRowCorrect();
  result.colCompleted = isColCorrect();
  result.blockCompleted = isBlockCorrect();
  result.isAnyCompleted = result.rowCompleted || result.colCompleted || result.blockCompleted;

  return result;
}
