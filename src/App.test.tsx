import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "./App";

vi.mock("./components/BoardCanvas", () => ({
  BoardCanvas: () => <div data-testid="board-canvas-mock" />,
}));

describe("App", () => {
  it("renders header", () => {
    render(<App />);
    expect(screen.getByText("中国象棋棋谱编辑器")).toBeInTheDocument();
  });
});
