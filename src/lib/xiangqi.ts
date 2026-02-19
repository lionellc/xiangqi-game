export type PieceColor = "red" | "black";
export type PieceType =
  | "帅"
  | "将"
  | "士"
  | "相"
  | "象"
  | "车"
  | "马"
  | "炮"
  | "兵"
  | "卒";

export interface Piece {
  id: string;
  type: PieceType;
  color: PieceColor;
  row: number;
  col: number;
}

export interface CapturedPiece {
  type: PieceType;
  color: PieceColor;
}

export interface MoveStep {
  type: PieceType;
  color: PieceColor;
  fromRow: number;
  fromCol: number;
  toRow: number;
  toCol: number;
  captured: CapturedPiece | null;
}

export interface MoveRecord {
  move: string;
  stepInfo: MoveStep;
  displayNum: number;
}

export const COL_NAMES_RED = ["九", "八", "七", "六", "五", "四", "三", "二", "一"];
export const COL_NAMES_BLACK = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];
export const NUM_TO_CHINESE = ["", "一", "二", "三", "四", "五", "六", "七", "八", "九"];

let pieceSeed = 0;

export function createPiece(
  type: PieceType,
  color: PieceColor,
  row: number,
  col: number,
): Piece {
  pieceSeed += 1;
  return {
    id: `${color}_${type}_${row}_${col}_${pieceSeed}`,
    type,
    color,
    row,
    col,
  };
}

function getPieceAt(board: Piece[], row: number, col: number): Piece | null {
  return board.find((p) => p.row === row && p.col === col) || null;
}

export function validateMove(
  board: Piece[],
  piece: Piece,
  toRow: number,
  toCol: number,
): boolean {
  const fromRow = piece.row;
  const fromCol = piece.col;
  const target = getPieceAt(board, toRow, toCol);
  if (target && target.color === piece.color) return false;

  switch (piece.type) {
    case "帅":
    case "将": {
      const rMin = piece.color === "red" ? 7 : 0;
      const rMax = piece.color === "red" ? 9 : 2;
      const cMin = 3;
      const cMax = 5;
      if (toRow < rMin || toRow > rMax || toCol < cMin || toCol > cMax) {
        return false;
      }
      const rDiff = Math.abs(fromRow - toRow);
      const cDiff = Math.abs(fromCol - toCol);
      return (rDiff === 1 && cDiff === 0) || (rDiff === 0 && cDiff === 1);
    }
    case "车": {
      if (fromRow !== toRow && fromCol !== toCol) return false;
      if (fromRow === toRow) {
        for (let c = Math.min(fromCol, toCol) + 1; c < Math.max(fromCol, toCol); c++) {
          if (getPieceAt(board, fromRow, c)) return false;
        }
      } else {
        for (let r = Math.min(fromRow, toRow) + 1; r < Math.max(fromRow, toRow); r++) {
          if (getPieceAt(board, r, fromCol)) return false;
        }
      }
      return true;
    }
    case "马": {
      const rD = Math.abs(fromRow - toRow);
      const cD = Math.abs(fromCol - toCol);
      if (!((rD === 2 && cD === 1) || (rD === 1 && cD === 2))) return false;
      const mR = Math.floor((fromRow + toRow) / 2);
      const mC = Math.floor((fromCol + toCol) / 2);
      return cD === 2 ? !getPieceAt(board, fromRow, mC) : !getPieceAt(board, mR, fromCol);
    }
    case "相":
    case "象": {
      if (Math.abs(fromRow - toRow) !== 2 || Math.abs(fromCol - toCol) !== 2) return false;
      const midR = Math.floor((fromRow + toRow) / 2);
      const midC = Math.floor((fromCol + toCol) / 2);
      if (getPieceAt(board, midR, midC)) return false;
      const river = 4;
      return piece.color === "red" ? toRow > river : toRow < river + 1;
    }
    case "士": {
      const srMin = piece.color === "red" ? 7 : 0;
      const srMax = piece.color === "red" ? 9 : 2;
      const scMin = 3;
      const scMax = 5;
      if (toRow < srMin || toRow > srMax || toCol < scMin || toCol > scMax) return false;
      return Math.abs(fromRow - toRow) === 1 && Math.abs(fromCol - toCol) === 1;
    }
    case "炮": {
      if (fromRow !== toRow && fromCol !== toCol) return false;
      let block = 0;
      if (fromRow === toRow) {
        for (let c = Math.min(fromCol, toCol) + 1; c < Math.max(fromCol, toCol); c++) {
          if (getPieceAt(board, fromRow, c)) block += 1;
        }
      } else {
        for (let r = Math.min(fromRow, toRow) + 1; r < Math.max(fromRow, toRow); r++) {
          if (getPieceAt(board, r, fromCol)) block += 1;
        }
      }
      return target ? block === 1 : block === 0;
    }
    case "兵":
    case "卒": {
      const dir = piece.color === "red" ? -1 : 1;
      const riverLine = piece.color === "red" ? 5 : 4;
      const rDiffP = toRow - fromRow;
      const cDiffP = Math.abs(fromCol - toCol);
      if ((piece.color === "red" && fromRow > riverLine) || (piece.color === "black" && fromRow < riverLine)) {
        return rDiffP === dir && cDiffP === 0;
      }
      return (Math.abs(rDiffP) === 1 && cDiffP === 0) || (rDiffP === 0 && cDiffP === 1);
    }
    default:
      return false;
  }
}

export function getMoveString(step: MoveStep): string {
  const { type, color, fromCol, toRow, fromRow, toCol } = step;
  const fCol = color === "red" ? COL_NAMES_RED[fromCol] : COL_NAMES_BLACK[fromCol];
  const tCol = color === "red" ? COL_NAMES_RED[toCol] : COL_NAMES_BLACK[toCol];
  const rDiff = Math.abs(fromRow - toRow);

  let dir: string;
  let stepText: string;

  if (fromRow === toRow) {
    dir = "平";
    stepText = tCol;
  } else {
    dir = color === "red" ? (toRow < fromRow ? "进" : "退") : (toRow > fromRow ? "进" : "退");
    if (["帅", "将"].includes(type)) {
      stepText = color === "red" ? "一" : "1";
    } else if (["马", "相", "象", "士"].includes(type)) {
      stepText = tCol;
    } else {
      stepText = color === "red" ? NUM_TO_CHINESE[rDiff] : rDiff.toString();
    }
  }

  return `${type}${fCol}${dir}${stepText}`;
}

function getMirroredMoveString(step: MoveStep, color: PieceColor): string {
  const RED_COL_MIRROR: Record<string, string> = {
    九: "一",
    八: "二",
    七: "三",
    六: "四",
    五: "五",
    四: "六",
    三: "七",
    二: "八",
    一: "九",
  };

  const BLACK_COL_MIRROR: Record<string, string> = {
    1: "9",
    2: "8",
    3: "7",
    4: "6",
    5: "5",
    6: "4",
    7: "3",
    8: "2",
    9: "1",
  };

  const fCol = color === "red" ? COL_NAMES_RED[step.fromCol] : COL_NAMES_BLACK[step.fromCol];
  const tCol = color === "red" ? COL_NAMES_RED[step.toCol] : COL_NAMES_BLACK[step.toCol];

  const mirroredFCol = color === "red" ? RED_COL_MIRROR[fCol] || fCol : BLACK_COL_MIRROR[fCol] || fCol;
  const mirroredTCol = color === "red" ? RED_COL_MIRROR[tCol] || tCol : BLACK_COL_MIRROR[tCol] || tCol;

  const rDiff = Math.abs(step.fromRow - step.toRow);

  let dir: string;
  let stepText: string;

  if (step.fromRow === step.toRow) {
    dir = "平";
    stepText = mirroredTCol;
  } else {
    dir = color === "red" ? (step.toRow < step.fromRow ? "进" : "退") : (step.toRow > step.fromRow ? "进" : "退");
    if (["帅", "将"].includes(step.type)) {
      stepText = color === "red" ? "一" : "1";
    } else if (["马", "相", "象", "士"].includes(step.type)) {
      stepText = mirroredTCol;
    } else {
      stepText = color === "red" ? NUM_TO_CHINESE[rDiff] : rDiff.toString();
    }
  }

  return `${step.type}${mirroredFCol}${dir}${stepText}`;
}

export function mirrorMoveList(moveList: MoveRecord[]): MoveRecord[] {
  return moveList.map((move) => {
    if (!move.stepInfo) return move;
    const stepInfo = move.stepInfo;
    const mirroredFromCol = 8 - stepInfo.fromCol;
    const mirroredToCol = 8 - stepInfo.toCol;
    const mirroredStepInfo: MoveStep = {
      ...stepInfo,
      fromCol: mirroredFromCol,
      toCol: mirroredToCol,
    };
    const mirroredMoveStr = getMirroredMoveString(mirroredStepInfo, stepInfo.color);
    return {
      ...move,
      move: mirroredMoveStr,
      stepInfo: mirroredStepInfo,
    };
  });
}
