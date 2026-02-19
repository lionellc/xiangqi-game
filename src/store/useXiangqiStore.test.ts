import { describe, it, expect, vi } from "vitest";
import { useXiangqiStore } from "./useXiangqiStore";
import type { MoveRecord, MoveStep } from "../lib/xiangqi";
import { buildDefaultPieces } from "../lib/boardState";

vi.spyOn(window, "alert").mockImplementation(() => {});
vi.spyOn(window, "confirm").mockImplementation(() => true);

describe("useXiangqiStore", () => {
  it("clearBoard should remove all pieces", () => {
    const store = useXiangqiStore.getState();
    store.clearBoard();
    expect(useXiangqiStore.getState().pieces).toHaveLength(0);
  });

  it("undoMove should pop last move and reset board", () => {
    const step: MoveStep = {
      type: "炮",
      color: "red",
      fromRow: 7,
      fromCol: 1,
      toRow: 6,
      toCol: 1,
      captured: null,
    };
    const move: MoveRecord = { move: "炮八进一", stepInfo: step, displayNum: 1 };
    useXiangqiStore.setState({
      currentLine: [move],
      pieces: buildDefaultPieces().map((p) => (p.row === 7 && p.col === 1 ? { ...p, row: 6, col: 1 } : p)),
      viewMode: "current",
      currentTurn: "black",
    });
    useXiangqiStore.getState().undoMove();
    expect(useXiangqiStore.getState().currentLine).toHaveLength(0);
    expect(useXiangqiStore.getState().currentTurn).toBe("red");
  });
});
