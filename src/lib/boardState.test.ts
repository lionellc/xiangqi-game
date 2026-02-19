import { describe, it, expect } from "vitest";
import { buildDefaultPieces, applyMoveToPieces, getBoardStateAtStep } from "./boardState";
import type { MoveRecord, MoveStep } from "./xiangqi";

describe("boardState", () => {
  it("buildDefaultPieces should create 32 pieces", () => {
    expect(buildDefaultPieces()).toHaveLength(32);
  });

  it("getBoardStateAtStep should apply steps", () => {
    const step: MoveStep = {
      type: "炮",
      color: "red",
      fromRow: 7,
      fromCol: 1,
      toRow: 6,
      toCol: 1,
      captured: null,
    };
    const moves: MoveRecord[] = [{ move: "炮八进一", stepInfo: step, displayNum: 1 }];
    const pieces = getBoardStateAtStep(moves, 0);
    expect(pieces.some((p) => p.row === 6 && p.col === 1 && p.type === "炮" && p.color === "red")).toBe(true);
  });

  it("applyMoveToPieces should remove captured piece", () => {
    const pieces = buildDefaultPieces();
    const step: MoveStep = {
      type: "炮",
      color: "red",
      fromRow: 7,
      fromCol: 1,
      toRow: 2,
      toCol: 1,
      captured: { type: "炮", color: "black" },
    };
    const next = applyMoveToPieces(pieces, step);
    expect(next.some((p) => p.row === 2 && p.col === 1 && p.color === "black")).toBe(false);
  });

  it("buildDefaultPieces should generate stable ids", () => {
    const ids1 = buildDefaultPieces().map((p) => p.id);
    const ids2 = buildDefaultPieces().map((p) => p.id);
    expect(ids1).toEqual(ids2);
  });

  it("applyMoveToPieces should not remove target when source missing", () => {
    const pieces = buildDefaultPieces();
    const step: MoveStep = {
      type: "车",
      color: "red",
      fromRow: 5,
      fromCol: 5,
      toRow: 0,
      toCol: 0,
      captured: { type: "车", color: "black" },
    };
    const next = applyMoveToPieces(pieces, step);
    expect(next.some((p) => p.row === 0 && p.col === 0 && p.color === "black" && p.type === "车")).toBe(true);
  });
});
