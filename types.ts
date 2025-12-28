
export type CellValue = number | null;

export interface Cell {
  row: number;
  col: number;
  value: CellValue;
  isInitial: boolean;
  notes: Set<number>;
}

export type Board = Cell[][];

export interface Position {
  row: number;
  col: number;
}

export enum GameStatus {
  PLAYING = 'PLAYING',
  WON = 'WON',
  PAUSED = 'PAUSED'
}
