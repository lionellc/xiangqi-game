import { describe, it, expect } from "vitest";
import { formatMoveText } from "./recordFormat";
import type { MoveRecord } from "./xiangqi";

describe("recordFormat", () => {
  it("formats move text with comment and underline", () => {
    const move: MoveRecord = { move: "炮八进一", stepInfo: {} as any, displayNum: 3 };
    const text = formatMoveText(move, 2, "好棋", true);
    expect(text).toBe("3. 炮八进一 (好棋) [下划线]");
  });
});
