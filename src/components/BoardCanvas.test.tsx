import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BoardCanvas } from "./BoardCanvas";

vi.mock("react-konva", () => ({
  Stage: (props: any) => <div data-testid="stage" {...props} />,
  Layer: (props: any) => <div {...props} />,
  Group: (props: any) => <div {...props} />,
  Circle: () => null,
  Text: () => null,
}));

describe("BoardCanvas", () => {
  it("renders board container", () => {
    render(<BoardCanvas />);
    expect(screen.getByTestId("board-canvas")).toBeInTheDocument();
  });
});
