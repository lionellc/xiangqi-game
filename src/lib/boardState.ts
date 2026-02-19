import { type MoveRecord, type MoveStep, type Piece, type PieceColor, type PieceType } from "./xiangqi";

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

const buildDefaultPieces = () =>
  DEFAULT_LAYOUT.map((p, index) => ({
    id: `base_${p.color}_${p.type}_${p.row}_${p.col}_${index}`,
    ...p,
  }));

const clonePieces = (pieces: Piece[]) => pieces.map((p) => ({ ...p }));

const getPieceAt = (pieces: Piece[], row: number, col: number) =>
  pieces.find((p) => p.row === row && p.col === col) || null;

const removePieceAt = (pieces: Piece[], row: number, col: number) =>
  pieces.filter((p) => !(p.row === row && p.col === col));

const applyMoveToPieces = (pieces: Piece[], step: MoveStep) => {
  const source = pieces.find((p) => p.row === step.fromRow && p.col === step.fromCol);
  if (!source) {
    return pieces;
  }
  const next = removePieceAt(pieces, step.toRow, step.toCol).map((p) => {
    if (p.row === step.fromRow && p.col === step.fromCol && p.type === step.type && p.color === step.color) {
      return { ...p, row: step.toRow, col: step.toCol };
    }
    return p;
  });
  return next;
};

const rebuildBoardFromMoves = (moves: MoveRecord[]) => {
  let pieces = buildDefaultPieces();
  moves.forEach((move) => {
    if (move.stepInfo) {
      pieces = applyMoveToPieces(pieces, move.stepInfo);
    }
  });
  return pieces;
};

const getBoardStateAtStep = (moves: MoveRecord[], stepIndex: number) => {
  if (stepIndex < 0) return buildDefaultPieces();
  return rebuildBoardFromMoves(moves.slice(0, stepIndex + 1));
};

export {
  applyMoveToPieces,
  buildDefaultPieces,
  clonePieces,
  getBoardStateAtStep,
  getPieceAt,
  rebuildBoardFromMoves,
  removePieceAt,
};
