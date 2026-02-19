import type { MoveRecord, Piece } from "../lib/xiangqi";

export interface Fragment {
  startStep: number;
  moves: MoveRecord[];
  comments: Record<number, string>;
  branchPoints: Record<number, boolean>;
  title: string;
  boardState: Piece[];
  totalSteps: number;
  underlineMarks?: Record<number, boolean>;
  editable?: boolean;
}

export interface GameData {
  id: number;
  name: string;
  timestamp: string;
  fragments: Fragment[];
  currentLine: MoveRecord[];
  comments: Record<number, string>;
  branchPoints: Record<number, boolean>;
  boardState: Piece[];
  isFlipped: boolean;
}
