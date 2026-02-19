export const BOARD_WIDTH = 402;
export const BOARD_HEIGHT = 452;
export const COLS = 9;
export const ROWS = 10;
export const CELL_WIDTH = BOARD_WIDTH / COLS;
export const CELL_HEIGHT = BOARD_HEIGHT / ROWS;

export const boardToCanvas = (row: number, col: number, flipped: boolean) => {
  const displayRow = flipped ? 9 - row : row;
  const displayCol = flipped ? 8 - col : col;
  return {
    x: displayCol * CELL_WIDTH + CELL_WIDTH / 2,
    y: displayRow * CELL_HEIGHT + CELL_HEIGHT / 2,
  };
};

export const canvasToBoard = (x: number, y: number, flipped: boolean) => {
  let col = Math.floor(x / CELL_WIDTH);
  let row = Math.floor(y / CELL_HEIGHT);
  if (flipped) {
    col = 8 - col;
    row = 9 - row;
  }
  if (col < 0 || col >= COLS || row < 0 || row >= ROWS) {
    return null;
  }
  return { row, col };
};
