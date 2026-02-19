import { describe, it, expect } from "vitest";
import { useXiangqiStore } from "./useXiangqiStore";

describe("store contract", () => {
  it("exposes core actions", () => {
    const state = useXiangqiStore.getState();
    expect(typeof state.resetBoard).toBe("function");
    expect(typeof state.onBoardCellClick).toBe("function");
    expect(typeof state.playAllFragments).toBe("function");
    expect(typeof state.saveFile).toBe("function");
  });
});
