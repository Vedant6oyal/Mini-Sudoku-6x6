
// Add your 6x6 Sudoku image URLs here
// The game will randomly pick one, analyze it with AI, and start the game
export const PUZZLE_IMAGES: string[] = [
  // Example: "https://your-domain.com/sudoku-1.jpg",
];


export interface PuzzleData {
  grid: (number | null)[][];
  averageTimeSeconds: number;
}

// Fallback static puzzles (6x6) to ensure the game works instantly
// 0 or null represents an empty cell
export const STATIC_PUZZLES: PuzzleData[] = [
  {
    averageTimeSeconds: 200, // 28 nulls
    grid: [
      [null, 1, null, null, null, null],
      [null, 2, null, null, null, 5],
      [null, null, null, null, null, 6],
      [3, null, null, null, null, null],
      [6, null, null, null, 3, null],
      [null, null, null, null, 4, null]
    ]
  },
  {
    averageTimeSeconds: 150, // 18 nulls
    grid: [
      [1, 2, null, null, null, 5],
      [null, null, 3, null, 1, 2],
      [null, null, null, 2, null, null],
      [2, null, 4, 5, null, null],
      [null, 6, null, 4, 2, null],
      [3, null, 2, null, 5, 6]
    ]
  },
  {
    averageTimeSeconds: 160, // 20 nulls
    grid: [
      [null, 1, null, null, 4, null],
      [2, 3, 4, null, 5, 6],
      [null, null, null, null, 1, null],
      [null, 6, null, null, null, null],
      [6, 5, null, 3, 2, 4],
      [null, 4, null, null, 6, null]
    ]
  },
  {
    averageTimeSeconds: 190, // 26 nulls
    grid: [
      [null, null, 3, 4, null, null],
      [null, 2, null, null, 5, null],
      [null, 1, null, null, 6, null],
      [null, null, 4, 1, null, null],
      [null, null, null, null, null, null],
      [null, null, 1, 2, null, null]
    ]
  },
  {
    averageTimeSeconds: 155, // 19 nulls
    grid: [
      [null, 1, null, null, null, null],
      [2, 3, 4, null, null, null],
      [5, 6, 1, null, 4, null],
      [null, 2, null, 1, 6, 5],
      [null, null, null, 4, 3, 2],
      [null, null, null, null, 1, null]
    ]
  },
  {
    averageTimeSeconds: 160, // 20 nulls
    grid: [
      [null, null, null, 1, 3, null],
      [1, 3, null, null, null, 6],
      [null, null, 4, null, 6, null],
      [null, 6, null, 5, null, null],
      [6, null, null, 3, 4, 5],
      [3, 4, 5, null, null, null]
    ]
  },
  {
    averageTimeSeconds: 160, // 20 nulls
    grid: [
      [null, null, null, null, 1, 2],
      [null, null, 5, 6, 3, 4],
      [3, null, 1, 2, 5, 6],
      [2, null, 6, 3, null, null],
      [4, null, null, null, null, null],
      [null, null, null, null, null, null]
    ]
  },
  {
    averageTimeSeconds: 190, // 26 nulls
    grid: [
      [null, null, null, 3, 2, null],
      [null, null, 4, null, null, 1],
      [null, null, 5, null, null, null],
      [null, null, null, 6, null, null],
      [5, null, null, 1, null, null],
      [null, 3, 2, null, null, null]
    ]
  },
  {
    averageTimeSeconds: 190, // 26 nulls
    grid: [
      [1, null, 2, null, null, null],
      [null, 3, null, null, null, null],
      [4, null, 5, null, null, null],
      [null, null, null, 5, null, 6],
      [null, null, null, null, 6, null],
      [null, null, null, 1, null, 4]
    ]
  }
];
