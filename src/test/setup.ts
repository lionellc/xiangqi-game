import { vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import "@testing-library/jest-dom/vitest";

Object.defineProperty(window, "alert", {
  value: vi.fn(),
  writable: true,
  configurable: true,
});

Object.defineProperty(window, "confirm", {
  value: vi.fn(() => true),
  writable: true,
  configurable: true,
});

if (!("speechSynthesis" in window)) {
  Object.defineProperty(window, "speechSynthesis", {
    value: { cancel: vi.fn(), speak: vi.fn() },
    writable: true,
    configurable: true,
  });
}
