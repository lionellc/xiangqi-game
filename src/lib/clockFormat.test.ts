import { describe, it, expect } from "vitest";
import { formatSeconds, clampMinutes } from "./clockFormat";

describe("clockFormat", () => {
  it("formats seconds to mm:ss", () => {
    expect(formatSeconds(65)).toBe("01:05");
    expect(formatSeconds(0)).toBe("00:00");
  });

  it("clamps minutes", () => {
    expect(clampMinutes(0)).toBe(1);
    expect(clampMinutes(200)).toBe(180);
    expect(clampMinutes(30)).toBe(30);
  });
});
