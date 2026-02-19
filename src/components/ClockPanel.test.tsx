import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ClockPanel } from "./ClockPanel";

describe("ClockPanel", () => {
  it("renders rule options", () => {
    render(<ClockPanel />);
    expect(screen.getByText("包干制")).toBeInTheDocument();
    expect(screen.getByText("加秒制")).toBeInTheDocument();
    expect(screen.getByText("步时制")).toBeInTheDocument();
  });
});
