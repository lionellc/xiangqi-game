import { Stage, Layer, Circle, Text, Group } from "react-konva";
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
              <Group key={piece.id}>
                <Circle
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
              </Group>
            );
          })}
        </Layer>
      </Stage>
    </div>
  );
};
