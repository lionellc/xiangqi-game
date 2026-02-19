import { describe, expect, it } from "vitest";
import {
  createPiece,
  getMoveString,
  mirrorMoveList,
  validateMove,
} from "./xiangqi";

const makePiece = (
  type: string,
  color: "red" | "black",
  row: number,
  col: number,
) => createPiece(type as any, color, row, col);

describe("validateMove", () => {
  it("允许车在无阻挡时直线移动", () => {
    const rook = makePiece("车", "red", 9, 0);
    const board = [rook];
    expect(validateMove(board, rook, 9, 4)).toBe(true);
  });

  it("阻挡会使车的直线移动非法", () => {
    const rook = makePiece("车", "red", 9, 0);
    const blocker = makePiece("兵", "red", 9, 2);
    const board = [rook, blocker];
    expect(validateMove(board, rook, 9, 4)).toBe(false);
  });

  it("马被别马脚时不可走", () => {
    const horse = makePiece("马", "red", 9, 1);
    const blocker = makePiece("兵", "red", 8, 1);
    const board = [horse, blocker];
    expect(validateMove(board, horse, 7, 2)).toBe(false);
  });

  it("炮吃子必须隔一子", () => {
    const cannon = makePiece("炮", "red", 7, 1);
    const screen = makePiece("兵", "red", 5, 1);
    const target = makePiece("卒", "black", 2, 1);
    const board = [cannon, screen, target];
    expect(validateMove(board, cannon, 2, 1)).toBe(true);
  });

  it("兵过河后可横走", () => {
    const soldier = makePiece("兵", "red", 5, 0);
    const board = [soldier];
    expect(validateMove(board, soldier, 5, 1)).toBe(true);
  });
});

describe("getMoveString", () => {
  it("生成红方平移棋谱", () => {
    const move = {
      type: "车",
      color: "red" as const,
      fromRow: 9,
      fromCol: 0,
      toRow: 9,
      toCol: 4,
      captured: null,
    };
    expect(getMoveString(move)).toBe("车九平五");
  });

  it("生成黑方进步棋谱", () => {
    const move = {
      type: "卒",
      color: "black" as const,
      fromRow: 3,
      fromCol: 0,
      toRow: 4,
      toCol: 0,
      captured: null,
    };
    expect(getMoveString(move)).toBe("卒1进1");
  });
});

describe("mirrorMoveList", () => {
  it("镜像红方平移着法", () => {
    const move = {
      move: "车九平五",
      displayNum: 1,
      stepInfo: {
        type: "车",
        color: "red" as const,
        fromRow: 9,
        fromCol: 0,
        toRow: 9,
        toCol: 4,
        captured: null,
      },
    };
    const mirrored = mirrorMoveList([move]);
    expect(mirrored[0].move).toBe("车九平五");
    expect(mirrored[0].stepInfo.fromCol).toBe(8);
  });
});
