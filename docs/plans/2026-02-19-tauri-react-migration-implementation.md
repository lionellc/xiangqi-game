# 中国象棋棋谱编辑器 Tauri 迁移 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 用 Tauri v2 + React + TypeScript 重建棋谱编辑器 UI，并一次性对齐旧版所有功能（棋盘、棋谱、片段、播放、时钟、文件管理、镜像、摆棋等）。

**Architecture:** React 组件负责布局与交互，Zustand 统一状态与动作；棋盘渲染使用 Konva；纯函数逻辑下沉到 `src/lib/` 并用 Vitest 测试。

**Tech Stack:** Tauri v2, React, TypeScript, Zustand, Konva (react-konva), Vitest.

---

### Task 1: 提取棋盘状态纯函数（可测试）

**Files:**
- Create: `src/lib/boardState.ts`
- Test: `src/lib/boardState.test.ts`
- Modify: `src/store/useXiangqiStore.ts`

**Step 1: Write the failing test**

```ts
// src/lib/boardState.test.ts
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
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- src/lib/boardState.test.ts`
Expected: FAIL (module `boardState` not found)

**Step 3: Write minimal implementation**

```ts
// src/lib/boardState.ts
import { createPiece, type MoveRecord, type MoveStep, type Piece, type PieceColor, type PieceType } from "./xiangqi";

const DEFAULT_LAYOUT: Array<{ type: PieceType; color: PieceColor; row: number; col: number }> = [
  { type: "车", color: "red", row: 9, col: 0 },
  { type: "马", color: "red", row: 9, col: 1 },
  { type: "相", color: "red", row: 9, col: 2 },
  { type: "士", color: "red", row: 9, col: 3 },
  { type: "帅", color: "red", row: 9, col: 4 },
  { type: "士", color: "red", row: 9, col: 5 },
  { type: "相", color: "red", row: 9, col: 6 },
  { type: "马", color: "red", row: 9, col: 7 },
  { type: "车", color: "red", row: 9, col: 8 },
  { type: "炮", color: "red", row: 7, col: 1 },
  { type: "炮", color: "red", row: 7, col: 7 },
  { type: "兵", color: "red", row: 6, col: 0 },
  { type: "兵", color: "red", row: 6, col: 2 },
  { type: "兵", color: "red", row: 6, col: 4 },
  { type: "兵", color: "red", row: 6, col: 6 },
  { type: "兵", color: "red", row: 6, col: 8 },
  { type: "车", color: "black", row: 0, col: 0 },
  { type: "马", color: "black", row: 0, col: 1 },
  { type: "象", color: "black", row: 0, col: 2 },
  { type: "士", color: "black", row: 0, col: 3 },
  { type: "将", color: "black", row: 0, col: 4 },
  { type: "士", color: "black", row: 0, col: 5 },
  { type: "象", color: "black", row: 0, col: 6 },
  { type: "马", color: "black", row: 0, col: 7 },
  { type: "车", color: "black", row: 0, col: 8 },
  { type: "炮", color: "black", row: 2, col: 1 },
  { type: "炮", color: "black", row: 2, col: 7 },
  { type: "卒", color: "black", row: 3, col: 0 },
  { type: "卒", color: "black", row: 3, col: 2 },
  { type: "卒", color: "black", row: 3, col: 4 },
  { type: "卒", color: "black", row: 3, col: 6 },
  { type: "卒", color: "black", row: 3, col: 8 },
];

export const buildDefaultPieces = () => DEFAULT_LAYOUT.map((p) => createPiece(p.type, p.color, p.row, p.col));

export const clonePieces = (pieces: Piece[]) => pieces.map((p) => ({ ...p }));

export const getPieceAt = (pieces: Piece[], row: number, col: number) =>
  pieces.find((p) => p.row === row && p.col === col) || null;

export const removePieceAt = (pieces: Piece[], row: number, col: number) =>
  pieces.filter((p) => !(p.row === row && p.col === col));

export const applyMoveToPieces = (pieces: Piece[], step: MoveStep) => {
  const next = removePieceAt(pieces, step.toRow, step.toCol).map((p) => {
    if (p.row === step.fromRow && p.col === step.fromCol && p.type === step.type && p.color === step.color) {
      return { ...p, row: step.toRow, col: step.toCol };
    }
    return p;
  });
  return next;
};

export const rebuildBoardFromMoves = (moves: MoveRecord[]) => {
  let pieces = buildDefaultPieces();
  moves.forEach((move) => {
    if (move.stepInfo) {
      pieces = applyMoveToPieces(pieces, move.stepInfo);
    }
  });
  return pieces;
};

export const getBoardStateAtStep = (moves: MoveRecord[], stepIndex: number) => {
  if (stepIndex < 0) return buildDefaultPieces();
  return rebuildBoardFromMoves(moves.slice(0, stepIndex + 1));
};
```

Update store imports to use new helpers:

```ts
// src/store/useXiangqiStore.ts (replace local helpers)
import {
  applyMoveToPieces,
  buildDefaultPieces,
  clonePieces,
  getBoardStateAtStep,
  getPieceAt,
  removePieceAt,
  rebuildBoardFromMoves,
} from "../lib/boardState";
```

**Step 4: Run test to verify it passes**

Run: `pnpm test -- src/lib/boardState.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/boardState.ts src/lib/boardState.test.ts src/store/useXiangqiStore.ts
git commit -m "refactor: extract board state helpers"
```

---

### Task 2: 添加棋盘几何映射工具

**Files:**
- Create: `src/lib/boardGeometry.ts`
- Test: `src/lib/boardGeometry.test.ts`

**Step 1: Write the failing test**

```ts
// src/lib/boardGeometry.test.ts
import { describe, it, expect } from "vitest";
import { boardToCanvas, canvasToBoard, BOARD_WIDTH, BOARD_HEIGHT } from "./boardGeometry";

describe("boardGeometry", () => {
  it("boardToCanvas maps logical cell to canvas center", () => {
    const { x, y } = boardToCanvas(0, 0, false);
    expect(x).toBeGreaterThan(0);
    expect(y).toBeGreaterThan(0);
    expect(x).toBeLessThan(BOARD_WIDTH);
    expect(y).toBeLessThan(BOARD_HEIGHT);
  });

  it("canvasToBoard inverts boardToCanvas", () => {
    const pos = boardToCanvas(3, 4, false);
    const cell = canvasToBoard(pos.x, pos.y, false);
    expect(cell).toEqual({ row: 3, col: 4 });
  });

  it("flip mode converts correctly", () => {
    const pos = boardToCanvas(0, 0, true);
    const cell = canvasToBoard(pos.x, pos.y, true);
    expect(cell).toEqual({ row: 0, col: 0 });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- src/lib/boardGeometry.test.ts`
Expected: FAIL (module not found)

**Step 3: Write minimal implementation**

```ts
// src/lib/boardGeometry.ts
export const BOARD_WIDTH = 402;
export const BOARD_HEIGHT = 452;
export const COLS = 9;
export const ROWS = 10;
export const CELL_WIDTH = BOARD_WIDTH / COLS;
export const CELL_HEIGHT = BOARD_HEIGHT / ROWS;

export const boardToCanvas = (row: number, col: number, flipped: boolean) => {
  const displayRow = flipped ? 9 - row : row;
  const displayCol = flipped ? 8 - col : col;
  return {
    x: displayCol * CELL_WIDTH + CELL_WIDTH / 2,
    y: displayRow * CELL_HEIGHT + CELL_HEIGHT / 2,
  };
};

export const canvasToBoard = (x: number, y: number, flipped: boolean) => {
  let col = Math.floor(x / CELL_WIDTH);
  let row = Math.floor(y / CELL_HEIGHT);
  if (flipped) {
    col = 8 - col;
    row = 9 - row;
  }
  if (col < 0 || col >= COLS || row < 0 || row >= ROWS) {
    return null;
  }
  return { row, col };
};
```

**Step 4: Run test to verify it passes**

Run: `pnpm test -- src/lib/boardGeometry.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/boardGeometry.ts src/lib/boardGeometry.test.ts
git commit -m "feat: add board geometry helpers"
```

---

### Task 3: 添加棋谱显示格式化工具

**Files:**
- Create: `src/lib/recordFormat.ts`
- Test: `src/lib/recordFormat.test.ts`

**Step 1: Write the failing test**

```ts
// src/lib/recordFormat.test.ts
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
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- src/lib/recordFormat.test.ts`
Expected: FAIL (module not found)

**Step 3: Write minimal implementation**

```ts
// src/lib/recordFormat.ts
import type { MoveRecord } from "./xiangqi";

export const formatMoveText = (
  move: MoveRecord,
  index: number,
  comment?: string,
  underline?: boolean,
) => {
  const num = move.displayNum || index + 1;
  let text = `${num}. ${move.move}`;
  if (comment) text += ` (${comment})`;
  if (underline) text += " [下划线]";
  return text;
};
```

**Step 4: Run test to verify it passes**

Run: `pnpm test -- src/lib/recordFormat.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/recordFormat.ts src/lib/recordFormat.test.ts
git commit -m "feat: add record format helpers"
```

---

### Task 4: 添加时钟格式化与输入校验工具

**Files:**
- Create: `src/lib/clockFormat.ts`
- Test: `src/lib/clockFormat.test.ts`

**Step 1: Write the failing test**

```ts
// src/lib/clockFormat.test.ts
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
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- src/lib/clockFormat.test.ts`
Expected: FAIL (module not found)

**Step 3: Write minimal implementation**

```ts
// src/lib/clockFormat.ts
export const formatSeconds = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.max(seconds % 60, 0);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

export const clampMinutes = (value: number, min = 1, max = 180) => {
  const v = Number.isFinite(value) ? value : min;
  return Math.min(max, Math.max(min, v));
};
```

**Step 4: Run test to verify it passes**

Run: `pnpm test -- src/lib/clockFormat.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/clockFormat.ts src/lib/clockFormat.test.ts
git commit -m "feat: add clock format helpers"
```

---

### Task 5: 完善 Store 行为（悔棋/清空/语音/时钟设置）

**Files:**
- Create: `src/test/setup.ts`
- Modify: `vite.config.ts`
- Modify: `package.json` (devDependency: `jsdom`)
- Modify: `src/store/useXiangqiStore.ts`
- Test: `src/store/useXiangqiStore.test.ts`

**Step 1: Write the failing test**

```ts
// src/store/useXiangqiStore.test.ts
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
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- src/store/useXiangqiStore.test.ts`
Expected: FAIL (missing actions and test env)

**Step 3: Write minimal implementation**

```ts
// src/test/setup.ts
import { vi } from "vitest";

Object.defineProperty(window, "alert", { value: vi.fn() });
Object.defineProperty(window, "confirm", { value: vi.fn(() => true) });

if (!("speechSynthesis" in window)) {
  Object.defineProperty(window, "speechSynthesis", {
    value: { cancel: vi.fn(), speak: vi.fn() },
  });
}
```

```ts
// vite.config.ts (test section)
import { defineConfig } from "vitest/config";

export default defineConfig({
  // ...existing config
  test: {
    environment: "jsdom",
    setupFiles: ["src/test/setup.ts"],
  },
});
```

Update store to add actions and wiring:

```ts
// src/store/useXiangqiStore.ts (add to state interface)
  undoMove: () => void;
  clearBoard: () => void;
  toggleVoice: () => void;
  setGameName: (name: string) => void;
  updateClockSetting: (payload: Partial<{ redBaseTime: number; blackBaseTime: number; redStepTime: number; blackStepTime: number; incrementTime: number }>) => void;
```

```ts
// src/store/useXiangqiStore.ts (implementation snippets)
clearBoard: () => {
  set({ pieces: [] });
},

toggleVoice: () => {
  set({ voiceEnabled: !get().voiceEnabled });
},

setGameName: (name) => {
  const trimmed = name.trim() || "未命名棋局";
  const currentId = get().currentGameId;
  const savedGames = [...get().savedGames];
  if (currentId) {
    const idx = savedGames.findIndex((g) => g.id === currentId);
    if (idx !== -1) {
      savedGames[idx] = { ...savedGames[idx], name: trimmed };
      set({ savedGames });
    }
  }
  markFileModified();
},

updateClockSetting: (payload) => {
  set(payload);
  set(resetClockValues(get().clockRule, payload));
},

undoMove: () => {
  if (get().viewMode !== "current") {
    window.alert("请在当前线路模式下使用悔棋功能！");
    return;
  }
  if (get().currentLine.length === 0) return;
  const nextLine = [...get().currentLine];
  nextLine.pop();

  const nextComments = { ...get().comments };
  delete nextComments[nextLine.length];
  const nextBranchPoints = { ...get().branchPoints };
  delete nextBranchPoints[nextLine.length];

  let nextTurn: PieceColor = "red";
  if (nextLine.length > 0) {
    const lastMove = nextLine[nextLine.length - 1];
    if (lastMove?.stepInfo) {
      nextTurn = lastMove.stepInfo.color === "red" ? "black" : "red";
    } else {
      nextTurn = nextLine.length % 2 === 0 ? "red" : "black";
    }
  }

  set({
    currentLine: nextLine,
    comments: nextComments,
    branchPoints: nextBranchPoints,
    selectedMoveIndex: -1,
    currentTurn: nextTurn,
    pieces: getBoardStateAtStep(nextLine, nextLine.length - 1),
    gameOver: false,
  });
  markFileModified();
},
```

**Step 4: Run test to verify it passes**

Run: `pnpm test -- src/store/useXiangqiStore.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add vite.config.ts package.json src/test/setup.ts src/store/useXiangqiStore.ts src/store/useXiangqiStore.test.ts
git commit -m "feat: add store actions and jsdom test setup"
```

---

### Task 6: 实现 BoardCanvas + SetupPanel 组件

**Files:**
- Create: `src/components/BoardCanvas.tsx`
- Create: `src/components/SetupPanel.tsx`
- Test: `src/components/BoardCanvas.test.tsx`

**Step 1: Write the failing test**

```tsx
// src/components/BoardCanvas.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BoardCanvas } from "./BoardCanvas";

vi.mock("react-konva", () => ({
  Stage: (props: any) => <div data-testid="stage" {...props} />,
  Layer: (props: any) => <div {...props} />,
  Circle: () => null,
  Text: () => null,
}));

describe("BoardCanvas", () => {
  it("renders board container", () => {
    render(<BoardCanvas />);
    expect(screen.getByTestId("board-canvas")).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- src/components/BoardCanvas.test.tsx`
Expected: FAIL (component missing / testing-library not installed)

**Step 3: Write minimal implementation**

```tsx
// src/components/BoardCanvas.tsx
import { Stage, Layer, Circle, Text } from "react-konva";
import type { KonvaEventObject } from "konva/lib/Node";
import { useXiangqiStore } from "../store/useXiangqiStore";
import { boardToCanvas, canvasToBoard, BOARD_WIDTH, BOARD_HEIGHT } from "../lib/boardGeometry";

export const BoardCanvas = () => {
  const { pieces, onBoardCellClick, selectedPieceId, isBoardFlipped } = useXiangqiStore();

  const handleClick = (e: KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage();
    const pointer = stage?.getPointerPosition();
    if (!pointer) return;
    const cell = canvasToBoard(pointer.x, pointer.y, isBoardFlipped);
    if (!cell) return;
    onBoardCellClick(cell.row, cell.col);
  };

  return (
    <div className="chess-container" data-testid="board-canvas">
      <Stage width={BOARD_WIDTH} height={BOARD_HEIGHT} onClick={handleClick}>
        <Layer>
          {pieces.map((piece) => {
            const pos = boardToCanvas(piece.row, piece.col, isBoardFlipped);
            const isSelected = piece.id === selectedPieceId;
            return (
              <>
                <Circle
                  key={piece.id}
                  x={pos.x}
                  y={pos.y}
                  radius={18}
                  fill={piece.color === "red" ? "#fff" : "#333"}
                  stroke={piece.color === "red" ? "#c00" : "#fff"}
                  strokeWidth={2}
                  shadowBlur={isSelected ? 6 : 0}
                />
                <Text
                  text={piece.type}
                  x={pos.x - 8}
                  y={pos.y - 8}
                  fontSize={14}
                  fill={piece.color === "red" ? "#c00" : "#fff"}
                />
              </>
            );
          })}
        </Layer>
      </Stage>
    </div>
  );
};
```

```tsx
// src/components/SetupPanel.tsx
import { useMemo } from "react";
import { useXiangqiStore } from "../store/useXiangqiStore";
import type { PieceColor, PieceType } from "../lib/xiangqi";

const buildSetupPieces = () => {
  const red: PieceType[] = ["帅", "士", "相", "马", "车", "炮", "兵"];
  const black: PieceType[] = ["将", "士", "象", "马", "车", "炮", "卒"];
  return [
    ...red.map((type) => ({ type, color: "red" as PieceColor })),
    ...black.map((type) => ({ type, color: "black" as PieceColor })),
  ];
};

export const SetupPanel = () => {
  const {
    gameMode,
    selectedSetupPiece,
    selectSetupPiece,
    toggleSetupMode,
    clearBoard,
    resetBoard,
  } = useXiangqiStore();

  const pieces = useMemo(buildSetupPieces, []);

  if (gameMode !== "setup") return null;

  return (
    <div className="setup-panel" id="setupPanel">
      <div className="setup-title">残局摆棋</div>
      <div className="piece-selector" id="pieceSelector">
        {pieces.map((piece) => {
          const selected =
            selectedSetupPiece?.type === piece.type && selectedSetupPiece?.color === piece.color;
          return (
            <div
              key={`${piece.color}-${piece.type}`}
              className={`chess-piece ${piece.color} ${selected ? "selected" : ""}`}
              onClick={() => selectSetupPiece(piece)}
            >
              {piece.type}
            </div>
          );
        })}
      </div>
      <div className="clock-control-buttons">
        <button className="btn btn-danger" onClick={clearBoard}>清空</button>
        <button className="btn btn-success" onClick={toggleSetupMode}>对弈</button>
        <button className="btn btn-secondary" onClick={resetBoard}>开局</button>
        <button className="btn btn-secondary" onClick={toggleSetupMode}>返回</button>
      </div>
    </div>
  );
};
```

**Step 4: Run test to verify it passes**

Run: `pnpm test -- src/components/BoardCanvas.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/BoardCanvas.tsx src/components/SetupPanel.tsx src/components/BoardCanvas.test.tsx
git commit -m "feat: add board canvas and setup panel"
```

---

### Task 7: 实现 ClockPanel 组件

**Files:**
- Create: `src/components/ClockPanel.tsx`
- Test: `src/components/ClockPanel.test.tsx`

**Step 1: Write the failing test**

```tsx
// src/components/ClockPanel.test.tsx
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
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- src/components/ClockPanel.test.tsx`
Expected: FAIL (component missing)

**Step 3: Write minimal implementation**

```tsx
// src/components/ClockPanel.tsx
import { useXiangqiStore } from "../store/useXiangqiStore";
import { formatSeconds, clampMinutes } from "../lib/clockFormat";

export const ClockPanel = () => {
  const {
    clockRule,
    redTime,
    blackTime,
    redStepTimeRemaining,
    blackStepTimeRemaining,
    redBaseTime,
    blackBaseTime,
    redStepTime,
    blackStepTime,
    incrementTime,
    startClock,
    pauseClock,
    resetClock,
    selectRule,
    updateClockSetting,
    toggleSetupMode,
    voiceEnabled,
    toggleVoice,
  } = useXiangqiStore();

  const redBaseMinutes = Math.floor(redBaseTime / 60);
  const blackBaseMinutes = Math.floor(blackBaseTime / 60);

  return (
    <div className="clock-container">
      <div className="clock-title">象棋时钟</div>
      <div className="clock-display">
        <div className="clock-player">
          <div className="clock-player-label">红方</div>
          <div className="clock-time red" id="redClock">{formatSeconds(redTime)}</div>
          <div className="step-time-display" id="redStepTime">
            {clockRule === "stepTime" ? `步时: ${formatSeconds(redStepTimeRemaining)}` : null}
          </div>
        </div>
        <div className="clock-player">
          <div className="clock-player-label">黑方</div>
          <div className="clock-time black" id="blackClock">{formatSeconds(blackTime)}</div>
          <div className="step-time-display" id="blackStepTime">
            {clockRule === "stepTime" ? `步时: ${formatSeconds(blackStepTimeRemaining)}` : null}
          </div>
        </div>
      </div>

      <div className="clock-rule-selector">
        <div className={`rule-option ${clockRule === "suddenDeath" ? "selected" : ""}`}>
          <input type="radio" checked={clockRule === "suddenDeath"} readOnly /> 包干制
        </div>
        <div className={`rule-option ${clockRule === "increment" ? "selected" : ""}`} onClick={() => selectRule("increment")}>
          <input type="radio" checked={clockRule === "increment"} readOnly /> 加秒制
        </div>
        <div className={`rule-option ${clockRule === "stepTime" ? "selected" : ""}`} onClick={() => selectRule("stepTime")}>
          <input type="radio" checked={clockRule === "stepTime"} readOnly /> 步时制
        </div>
      </div>

      <div className="clock-setter" id="clockSettings">
        <div className="clock-setter-group">
          <label>红方时间(分):</label>
          <input
            type="number"
            value={redBaseMinutes}
            min={1}
            max={180}
            onChange={(e) => updateClockSetting({ redBaseTime: clampMinutes(Number(e.target.value)) * 60 })}
          />
        </div>
        <div className="clock-setter-group">
          <label>黑方时间(分):</label>
          <input
            type="number"
            value={blackBaseMinutes}
            min={1}
            max={180}
            onChange={(e) => updateClockSetting({ blackBaseTime: clampMinutes(Number(e.target.value)) * 60 })}
          />
        </div>
        {clockRule === "increment" && (
          <div className="clock-setter-group">
            <label>每步加时(秒):</label>
            <input
              type="number"
              value={incrementTime}
              min={0}
              max={60}
              onChange={(e) => updateClockSetting({ incrementTime: Number(e.target.value) })}
            />
          </div>
        )}
        {clockRule === "stepTime" && (
          <>
            <div className="clock-setter-group">
              <label>红方步时(秒):</label>
              <input
                type="number"
                value={redStepTime}
                min={5}
                max={300}
                onChange={(e) => updateClockSetting({ redStepTime: Number(e.target.value) })}
              />
            </div>
            <div className="clock-setter-group">
              <label>黑方步时(秒):</label>
              <input
                type="number"
                value={blackStepTime}
                min={5}
                max={300}
                onChange={(e) => updateClockSetting({ blackStepTime: Number(e.target.value) })}
              />
            </div>
          </>
        )}
      </div>

      <div className="clock-control-buttons">
        <button className="btn btn-success" onClick={() => startClock("red")}>开始</button>
        <button className="btn btn-secondary" onClick={pauseClock}>暂停</button>
        <button className="btn btn-danger" onClick={resetClock}>重置</button>
      </div>

      <div className="voice-control">
        <label>
          <input type="checkbox" checked={voiceEnabled} onChange={toggleVoice} /> 语音朗读
        </label>
      </div>

      <button className="btn btn-secondary" id="toggleSetupModeBtn" style={{ marginTop: 6, padding: 4, fontSize: 11 }} onClick={toggleSetupMode}>
        进入摆棋
      </button>
    </div>
  );
};
```

**Step 4: Run test to verify it passes**

Run: `pnpm test -- src/components/ClockPanel.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/ClockPanel.tsx src/components/ClockPanel.test.tsx
git commit -m "feat: add clock panel"
```

---

### Task 8: 实现 RecordPanel + ControlPanel

**Files:**
- Create: `src/components/RecordPanel.tsx`
- Create: `src/components/ControlPanel.tsx`
- Test: `src/components/RecordPanel.test.tsx`

**Step 1: Write the failing test**

```tsx
// src/components/RecordPanel.test.tsx
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
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- src/components/RecordPanel.test.tsx`
Expected: FAIL (component missing)

**Step 3: Write minimal implementation**

```tsx
// src/components/RecordPanel.tsx
import { useXiangqiStore } from "../store/useXiangqiStore";
import { formatMoveText } from "../lib/recordFormat";

export const RecordPanel = () => {
  const {
    viewMode,
    switchViewMode,
    currentLine,
    savedFragments,
    selectedMoveIndex,
    selectedFragmentIndex,
    selectedFragmentMoveIndex,
    selectMoveIndex,
    toggleFragmentEdit,
  } = useXiangqiStore();

  const currentMoveInfo = selectedMoveIndex >= 0 ? `第${selectedMoveIndex + 1}着` : "第0着";
  const statusInfo = `显示模式：${viewMode === "current" ? "当前线路" : "片段集合"} | 当前线路：${currentLine.length}步 | 已保存片段：${savedFragments.length}个`;

  return (
    <div className="record-panel">
      <div className="record-header">
        <div className="record-title">棋谱记录</div>
        <div id="currentMoveInfo">{currentMoveInfo}</div>
      </div>
      <div className="view-mode">
        <button className="btn btn-secondary" id="viewCurrentBtn" style={{ fontSize: 10, padding: 2 }} onClick={() => switchViewMode("current")}>
          当前线路
        </button>
        <button className="btn btn-secondary" id="viewFragmentsBtn" style={{ fontSize: 10, padding: 2 }} onClick={() => switchViewMode("fragments")}>
          片段集合
        </button>
        <button className="btn play-control-btn" id="playBtn" style={{ fontSize: 10, padding: 2 }}>
          播放当前片段
        </button>
      </div>
      <div className="record-area" id="recordArea">
        {viewMode === "current" && currentLine.length === 0 && "请开始对弈"}
        {viewMode === "current" && currentLine.map((move, index) => (
          <span
            key={`${move.move}-${index}`}
            className={`record-line ${selectedMoveIndex === index ? "active" : ""}`}
            onClick={() => selectMoveIndex(index)}
          >
            {formatMoveText(move, index, undefined, false)}
          </span>
        ))}
        {viewMode === "fragments" && savedFragments.map((fragment, fragmentIndex) => (
          <div key={`${fragment.title}-${fragmentIndex}`}>
            <div className="fragment-title" onClick={() => toggleFragmentEdit(fragmentIndex)}>{fragment.title}</div>
            {fragment.moves.map((move, moveIndex) => (
              <span
                key={`${fragmentIndex}-${moveIndex}`}
                className={`record-line ${selectedFragmentIndex === fragmentIndex && selectedFragmentMoveIndex === moveIndex ? "active" : ""}`}
              >
                {formatMoveText(move, moveIndex, fragment.comments?.[moveIndex], fragment.underlineMarks?.[moveIndex])}
              </span>
            ))}
          </div>
        ))}
      </div>
      <div className="status-info" id="gameStatusInfo">{statusInfo}</div>
    </div>
  );
};
```

```tsx
// src/components/ControlPanel.tsx
import { useState } from "react";
import { useXiangqiStore } from "../store/useXiangqiStore";

export const ControlPanel = () => {
  const {
    newGame,
    restoreGame,
    copyRecord,
    renameGame,
    undoMove,
    addComment,
    saveComment,
    markBranchPoint,
    deleteBranchPoint,
    markUnderline,
    branchFromHere,
    playAllFragments,
    stopPlay,
  } = useXiangqiStore();

  const [commentText, setCommentText] = useState("");

  return (
    <div className="control-panel">
      <input className="game-name-input" placeholder="棋局名称" />
      <button className="btn btn-secondary" onClick={restoreGame}>恢复棋局</button>
      <button className="btn btn-secondary" onClick={copyRecord}>复制棋谱</button>
      <button className="btn btn-warning" onClick={newGame}>新局</button>
      <button className="btn btn-secondary" onClick={() => renameGame(window.prompt("请输入棋局名称") || "")}>棋局更名</button>
      <button className="btn btn-secondary" onClick={undoMove}>悔棋</button>
      <button className="btn btn-secondary" onClick={() => addComment(commentText)}>注释</button>
      <button className="btn mark-branch-btn" onClick={markBranchPoint}>标记为分支点</button>
      <button className="btn btn-danger" onClick={deleteBranchPoint}>删除分支点</button>
      <button className="btn mark-underline-btn" onClick={markUnderline}>添加下划线</button>
      <button className="btn btn-warning" onClick={branchFromHere}>从此变着</button>
      <button className="btn play-control-btn" onClick={playAllFragments}>播放所有片段</button>
      <button className="btn btn-secondary" onClick={stopPlay}>停止播放</button>

      <div className="comment-area">
        <div style={{ marginBottom: 2 }}>棋谱注释</div>
        <textarea
          className="comment-input"
          placeholder="输入注释..."
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
        />
        <button className="btn btn-secondary" style={{ marginTop: 2, width: "100%", padding: 3, fontSize: 11 }} onClick={() => saveComment(commentText)}>
          保存注释
        </button>
        <div className="comment-display" id="commentDisplay"></div>
      </div>
    </div>
  );
};
```

**Step 4: Run test to verify it passes**

Run: `pnpm test -- src/components/RecordPanel.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/RecordPanel.tsx src/components/ControlPanel.tsx src/components/RecordPanel.test.tsx
git commit -m "feat: add record and control panels"
```

---

### Task 9: 实现文件/棋局管理栏 + App 布局

**Files:**
- Create: `src/components/FileManagementBar.tsx`
- Create: `src/components/GameManagementBar.tsx`
- Create: `src/components/StatusBar.tsx`
- Modify: `src/App.tsx`
- Modify: `src/main.tsx`

**Step 1: Write the failing test**

```tsx
// src/App.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "./App";

describe("App", () => {
  it("renders header", () => {
    render(<App />);
    expect(screen.getByText("中国象棋棋谱编辑器")).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- src/App.test.tsx`
Expected: FAIL (App layout not updated)

**Step 3: Write minimal implementation**

```tsx
// src/components/FileManagementBar.tsx
import { useXiangqiStore } from "../store/useXiangqiStore";

export const FileManagementBar = () => {
  const { newFile, openFile, saveFile, saveAsFile, currentFileName, isFileModified } = useXiangqiStore();
  const status = `${currentFileName}${isFileModified ? "（已修改）" : ""}`;
  return (
    <div className="file-management">
      <div className="file-management-buttons">
        <button className="btn btn-primary small-btn" onClick={newFile}>新建文件</button>
        <button className="btn btn-primary small-btn" onClick={openFile}>打开文件</button>
        <button className="btn btn-success small-btn" onClick={saveFile}>保存文件</button>
        <button className="btn btn-info small-btn" onClick={saveAsFile}>另存为</button>
      </div>
      <div className="file-status" id="fileStatus">{status}</div>
    </div>
  );
};
```

```tsx
// src/components/GameManagementBar.tsx
import { useXiangqiStore } from "../store/useXiangqiStore";

export const GameManagementBar = () => {
  const {
    savedGames,
    currentGameId,
    loadGame,
    prevGame,
    nextGame,
    moveGameUp,
    moveGameDown,
    deleteGame,
  } = useXiangqiStore();

  return (
    <div className="game-management">
      <select
        id="gameSelect"
        value={currentGameId || ""}
        onChange={(e) => loadGame(Number(e.target.value))}
      >
        <option value="">选择棋局</option>
        {savedGames.map((game) => (
          <option key={game.id} value={game.id}>{game.name}</option>
        ))}
      </select>
      <div className="game-management-buttons">
        <button className="btn btn-secondary small-btn" onClick={prevGame}>上一局</button>
        <button className="btn btn-secondary small-btn" onClick={nextGame}>下一局</button>
        <button className="btn btn-secondary small-btn" onClick={moveGameUp}>前移</button>
        <button className="btn btn-secondary small-btn" onClick={moveGameDown}>后移</button>
        <button className="btn btn-danger small-btn" onClick={deleteGame}>删除</button>
      </div>
    </div>
  );
};
```

```tsx
// src/components/StatusBar.tsx
export const StatusBar = () => {
  return null;
};
```

```tsx
// src/App.tsx
import "./styles/app.css";
import { FileManagementBar } from "./components/FileManagementBar";
import { GameManagementBar } from "./components/GameManagementBar";
import { BoardCanvas } from "./components/BoardCanvas";
import { ClockPanel } from "./components/ClockPanel";
import { SetupPanel } from "./components/SetupPanel";
import { RecordPanel } from "./components/RecordPanel";
import { ControlPanel } from "./components/ControlPanel";

function App() {
  return (
    <div>
      <div className="header"><h1>中国象棋棋谱编辑器</h1></div>
      <FileManagementBar />
      <GameManagementBar />
      <div className="main-container">
        <div className="left-panel">
          <ClockPanel />
          <SetupPanel />
        </div>
        <div className="board-area">
          <BoardCanvas />
          <div className="board-bottom-controls">
            <button className="btn btn-info small-btn" id="flipBoardBtn">翻转棋盘</button>
            <button className="btn btn-info small-btn" id="mirrorRecordBtn">棋谱镜像</button>
          </div>
        </div>
        <div className="right-panel">
          <RecordPanel />
          <ControlPanel />
        </div>
      </div>
    </div>
  );
}

export default App;
```

```tsx
// src/main.tsx (ensure global styles)
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

**Step 4: Run test to verify it passes**

Run: `pnpm test -- src/App.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/FileManagementBar.tsx src/components/GameManagementBar.tsx src/components/StatusBar.tsx src/App.tsx src/main.tsx src/App.test.tsx
git commit -m "feat: wire app layout and management bars"
```

---

### Task 10: 拆分 Store 为可维护 Slice（结构优化阶段）

**Files:**
- Create: `src/store/slices/boardSlice.ts`
- Create: `src/store/slices/recordSlice.ts`
- Create: `src/store/slices/clockSlice.ts`
- Create: `src/store/slices/fileSlice.ts`
- Create: `src/store/slices/gameSlice.ts`
- Create: `src/store/slices/playbackSlice.ts`
- Modify: `src/store/useXiangqiStore.ts`
- Test: `src/store/storeContract.test.ts`

**Step 1: Write the failing test**

```ts
// src/store/storeContract.test.ts
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
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- src/store/storeContract.test.ts`
Expected: FAIL (test file missing)

**Step 3: Write minimal implementation**

```ts
// src/store/slices/boardSlice.ts (example slice)
import type { StateCreator } from "zustand";
import type { Piece, PieceColor, PieceType } from "../../lib/xiangqi";
import { buildDefaultPieces } from "../../lib/boardState";

export interface BoardSlice {
  pieces: Piece[];
  gameMode: "play" | "setup";
  currentTurn: PieceColor;
  selectedPieceId: string | null;
  selectedSetupPiece: { type: PieceType; color: PieceColor } | null;
  gameOver: boolean;
  isBoardFlipped: boolean;
  resetBoard: () => void;
  toggleSetupMode: () => void;
  selectSetupPiece: (piece: { type: PieceType; color: PieceColor } | null) => void;
  flipBoard: () => void;
}

export const createBoardSlice: StateCreator<BoardSlice, [], [], BoardSlice> = (set) => ({
  pieces: buildDefaultPieces(),
  gameMode: "play",
  currentTurn: "red",
  selectedPieceId: null,
  selectedSetupPiece: null,
  gameOver: false,
  isBoardFlipped: false,
  resetBoard: () => set({ pieces: buildDefaultPieces(), currentTurn: "red", gameOver: false }),
  toggleSetupMode: () => set((s) => ({ gameMode: s.gameMode === "setup" ? "play" : "setup", selectedSetupPiece: null })),
  selectSetupPiece: (piece) => set({ selectedSetupPiece: piece }),
  flipBoard: () => set((s) => ({ isBoardFlipped: !s.isBoardFlipped })),
});
```

```ts
// src/store/useXiangqiStore.ts (compose slices)
import { create } from "zustand";
import { createBoardSlice, type BoardSlice } from "./slices/boardSlice";
// ...import other slices

type XiangqiState = BoardSlice /* & RecordSlice & ... */;

export const useXiangqiStore = create<XiangqiState>()((...args) => ({
  ...createBoardSlice(...args),
  // ...spread other slices
}));
```

**Step 4: Run test to verify it passes**

Run: `pnpm test -- src/store/storeContract.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/store/slices src/store/useXiangqiStore.ts src/store/storeContract.test.ts
git commit -m "refactor: split store into slices"
```

---

## Final Verification

1. `pnpm test`
2. `pnpm tauri dev`（手动验证：棋盘、棋谱、片段、时钟、文件、镜像、摆棋、播放）

---

## Notes
- 功能对齐优先，现代化样式作为后续单独阶段迭代。
- 如果 Konva 渲染在 jsdom 下有问题，可在组件测试中 mock `react-konva`（已在 Task 6）。
- 走子合法性与棋谱生成已在 `src/lib/xiangqi.ts` 覆盖，后续新增棋规继续按 TDD 扩展。
