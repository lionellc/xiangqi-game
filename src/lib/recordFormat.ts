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
