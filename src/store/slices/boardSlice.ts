import type { StateCreator } from "zustand";
import {
  createPiece,
  getMoveString,
  type MoveStep,
  type Piece,
  type PieceColor,
  type PieceType,
  validateMove,
} from "../../lib/xiangqi";
import { applyMoveToPieces, buildDefaultPieces, getPieceAt, removePieceAt } from "../../lib/boardState";

export interface BoardSlice {
  pieces: Piece[];
  gameMode: "play" | "setup";
  currentTurn: PieceColor;
  selectedPieceId: string | null;
  selectedSetupPiece: { type: PieceType; color: PieceColor } | null;
  gameOver: boolean;
  isBoardFlipped: boolean;

  resetBoard: () => void;
  clearBoard: () => void;
  toggleSetupMode: () => void;
  selectSetupPiece: (piece: { type: PieceType; color: PieceColor } | null) => void;
  onBoardCellClick: (row: number, col: number) => void;
  flipBoard: () => void;
}

export const createBoardSlice: StateCreator<any, [], [], BoardSlice> = (set, get) => {
  const handleClockAfterMove = () => {
    if (!get().clockRunning) return;
    const { clockRule, currentTurn } = get();
    const nextTurn: PieceColor = currentTurn === "red" ? "black" : "red";

    if (clockRule === "increment") {
      if (currentTurn === "red") {
        set((state: any) => ({ redTime: state.redTime + state.incrementTime }));
      } else {
        set((state: any) => ({ blackTime: state.blackTime + state.incrementTime }));
      }
    }

    if (clockRule === "stepTime") {
      if (currentTurn === "red") {
        set((state: any) => ({ redStepTimeRemaining: state.redStepTime }));
      } else {
        set((state: any) => ({ blackStepTimeRemaining: state.blackStepTime }));
      }
    }

    get().startClock(nextTurn);
  };

  const selectPiece = (pieceId: string | null) => set({ selectedPieceId: pieceId });

  const executeMove = (piece: Piece, toRow: number, toCol: number) => {
    const target = getPieceAt(get().pieces, toRow, toCol);
    const moveStep: MoveStep = {
      type: piece.type,
      color: piece.color,
      fromRow: piece.row,
      fromCol: piece.col,
      toRow,
      toCol,
      captured: target ? { type: target.type, color: target.color } : null,
    };
    const moveStr = getMoveString(moveStep);
    const moveIndex = get().currentLine.length;
    const nextLine = [...get().currentLine, { move: moveStr, stepInfo: moveStep, displayNum: moveIndex + 1 }];

    const nextPieces = applyMoveToPieces(get().pieces, moveStep);

    const capturedKing = target && (target.type === "帅" || target.type === "将");

    set({
      pieces: nextPieces,
      currentLine: nextLine,
      gameOver: capturedKing ? true : get().gameOver,
      currentTurn: capturedKing ? get().currentTurn : get().currentTurn === "red" ? "black" : "red",
      selectedPieceId: null,
      selectedMoveIndex: moveIndex,
    });

    if (capturedKing) {
      window.alert(`${get().currentTurn === "red" ? "红方" : "黑方"}获胜`);
      get().stopClock();
    }

    get().markFileModified();
    handleClockAfterMove();
  };

  return {
    pieces: buildDefaultPieces(),
    gameMode: "play",
    currentTurn: "red",
    selectedPieceId: null,
    selectedSetupPiece: null,
    gameOver: false,
    isBoardFlipped: false,

    resetBoard: () => {
      get().stopClock();
      set({
        pieces: buildDefaultPieces(),
        currentLine: [],
        savedFragments: [],
        selectedMoveIndex: -1,
        selectedFragmentIndex: -1,
        selectedFragmentMoveIndex: -1,
        currentTurn: "red",
        gameOver: false,
        comments: {},
        branchPoints: {},
        viewMode: "current",
        isBoardFlipped: false,
      });
      get().resetClock();
    },

    clearBoard: () => {
      set({ pieces: [] });
    },

    toggleSetupMode: () => {
      const nextMode = get().gameMode === "setup" ? "play" : "setup";
      set({ gameMode: nextMode, selectedSetupPiece: null });
    },

    selectSetupPiece: (piece) => {
      set({ selectedSetupPiece: piece });
    },

    onBoardCellClick: (row, col) => {
      if (get().gameOver) return;

      if (get().gameMode === "setup") {
        if (!get().selectedSetupPiece) return;
        const nextPieces = removePieceAt(get().pieces, row, col);
        const newPiece = createPiece(get().selectedSetupPiece!.type, get().selectedSetupPiece!.color, row, col);
        set({ pieces: [...nextPieces, newPiece] });
        return;
      }

      const target = getPieceAt(get().pieces, row, col);
      if (!get().selectedPieceId) {
        if (target && target.color === get().currentTurn) {
          selectPiece(target.id);
        }
        return;
      }

      const selected = get().pieces.find((p: Piece) => p.id === get().selectedPieceId);
      if (!selected) return;

      if (selected.row === row && selected.col === col) {
        selectPiece(null);
        return;
      }

      if (!validateMove(get().pieces, selected, row, col)) {
        window.alert("走法不合法");
        return;
      }

      executeMove(selected, row, col);
    },

    flipBoard: () => {
      set({ isBoardFlipped: !get().isBoardFlipped });
    },
  };
};
