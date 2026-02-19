import { describe, expect, it } from "vitest";
import {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  boardToCanvas,
  canvasToBoard,
} from "./boardGeometry";

describe("boardGeometry", () => {
  it("boardToCanvas maps logical cell to canvas center", () => {
    const { x, y } = boardToCanvas(0, 0, false);
    expect(x).toBeGreaterThan(0);
    expect(y).toBeGreaterThan(0);
    expect(x).toBeLessThan(BOARD_WIDTH);
    expect(y).toBeLessThan(BOARD_HEIGHT);
  });

  it("canvasToBoard inverts boardToCanvas", () => {
    const pos = boardToCanvas(3, 4, false);
    const cell = canvasToBoard(pos.x, pos.y, false);
    expect(cell).toEqual({ row: 3, col: 4 });
  });

  it("flip mode converts correctly", () => {
    const pos = boardToCanvas(0, 0, true);
    const cell = canvasToBoard(pos.x, pos.y, true);
    expect(cell).toEqual({ row: 0, col: 0 });
  });
});
