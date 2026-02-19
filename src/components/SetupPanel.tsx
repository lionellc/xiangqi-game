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
  const { gameMode, selectedSetupPiece, selectSetupPiece, toggleSetupMode, clearBoard, resetBoard } =
    useXiangqiStore();

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
        <button className="btn btn-danger" onClick={clearBoard}>
          清空
        </button>
        <button className="btn btn-success" onClick={toggleSetupMode}>
          对弈
        </button>
        <button className="btn btn-secondary" onClick={resetBoard}>
          开局
        </button>
        <button className="btn btn-secondary" onClick={toggleSetupMode}>
          返回
        </button>
      </div>
    </div>
  );
};
