import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { RecordPanel } from "./RecordPanel";

describe("RecordPanel", () => {
  it("renders view mode buttons", () => {
    render(<RecordPanel />);
    expect(screen.getByText("当前线路")).toBeInTheDocument();
    expect(screen.getByText("片段集合")).toBeInTheDocument();
  });
});
