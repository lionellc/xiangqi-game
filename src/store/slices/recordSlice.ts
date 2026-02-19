import type { StateCreator } from "zustand";
import { mirrorMoveList, type MoveRecord, type PieceColor } from "../../lib/xiangqi";
import type { Fragment } from "../../models/types";
import { buildDefaultPieces, getBoardStateAtStep, rebuildBoardFromMoves } from "../../lib/boardState";

export interface RecordSlice {
  currentLine: MoveRecord[];
  savedFragments: Fragment[];
  selectedMoveIndex: number;
  comments: Record<number, string>;
  branchPoints: Record<number, boolean>;

  selectedFragmentIndex: number;
  selectedFragmentMoveIndex: number;

  viewMode: "current" | "fragments";

  selectMoveIndex: (index: number) => void;
  switchViewMode: (mode: "current" | "fragments") => void;
  undoMove: () => void;

  addComment: (text: string) => void;
  saveComment: (text: string) => void;
  markBranchPoint: () => void;
  deleteBranchPoint: () => void;
  markUnderline: () => void;
  toggleFragmentEdit: (fragmentIndex: number) => void;
  selectFragmentMove: (fragmentIndex: number, moveIndex: number) => void;
  viewFragmentMove: (fragmentIndex: number, moveIndex: number) => void;
  branchFromHere: () => void;

  mirrorRecord: () => void;
  copyRecord: () => Promise<void>;
}

const nowTimestamp = () => new Date().toLocaleString();

export const createRecordSlice: StateCreator<any, [], [], RecordSlice> = (set, get) => ({
  currentLine: [],
  savedFragments: [],
  selectedMoveIndex: -1,
  comments: {},
  branchPoints: {},

  selectedFragmentIndex: -1,
  selectedFragmentMoveIndex: -1,

  viewMode: "current",

  selectMoveIndex: (index) => {
    set({ selectedMoveIndex: index });
    const nextPieces = getBoardStateAtStep(get().currentLine, index);
    set({ pieces: nextPieces });
  },

  switchViewMode: (mode) => {
    set({ viewMode: mode, selectedMoveIndex: -1 });
    if (mode === "current") {
      if (get().currentLine.length > 0) {
        set({ pieces: getBoardStateAtStep(get().currentLine, get().currentLine.length - 1) });
      } else {
        set({ pieces: buildDefaultPieces() });
      }
    }
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
    get().markFileModified();
  },

  addComment: (text) => {
    if (get().viewMode !== "current") {
      window.alert("请在当前线路模式下添加注释！");
      return;
    }
    if (get().selectedMoveIndex < 0) {
      window.alert("请先选择一个着法！");
      return;
    }
    if (!text.trim()) {
      window.alert("请输入注释内容！");
      return;
    }
    set((state: any) => ({ comments: { ...state.comments, [state.selectedMoveIndex]: text.trim() } }));
    get().markFileModified();
  },

  saveComment: (text) => {
    if (get().viewMode !== "current") {
      window.alert("请在当前线路模式下保存注释！");
      return;
    }
    if (get().selectedMoveIndex < 0) {
      window.alert("请先选择一个着法！");
      return;
    }
    const trimmed = text.trim();
    set((state: any) => {
      const nextComments = { ...state.comments };
      if (trimmed) {
        nextComments[state.selectedMoveIndex] = trimmed;
      } else {
        delete nextComments[state.selectedMoveIndex];
      }
      return { comments: nextComments };
    });
    get().markFileModified();
  },

  markBranchPoint: () => {
    if (get().viewMode !== "current") {
      window.alert("请在当前线路模式下标记分支点！");
      return;
    }
    if (get().selectedMoveIndex < 0) {
      window.alert("请先选择一个着法！");
      return;
    }
    const existing = Object.keys(get().branchPoints);
    if (existing.length > 0) {
      const ok = window.confirm("当前线路已有一个分支点标记。是否替换为新的分支点？");
      if (!ok) return;
    }
    set({ branchPoints: { [get().selectedMoveIndex]: true } });
    get().markFileModified();
  },

  deleteBranchPoint: () => {
    if (Object.keys(get().branchPoints).length === 0) {
      window.alert("当前没有分支点标记！");
      return;
    }
    set({ branchPoints: {} });
    get().markFileModified();
  },

  markUnderline: () => {
    if (get().viewMode !== "fragments") {
      window.alert("请在片段集合模式下使用此功能！");
      return;
    }
    const fragIndex = get().selectedFragmentIndex;
    const moveIndex = get().selectedFragmentMoveIndex;
    if (fragIndex < 0 || moveIndex < 0) {
      window.alert("请先选择一个着法！");
      return;
    }
    const fragment = get().savedFragments[fragIndex];
    if (!fragment || !fragment.editable) {
      window.alert("请先进入编辑模式！");
      return;
    }
    const underlineMarks = { ...(fragment.underlineMarks || {}) };
    if (underlineMarks[moveIndex]) {
      delete underlineMarks[moveIndex];
    } else {
      underlineMarks[moveIndex] = true;
    }
    const nextFragments = [...get().savedFragments];
    nextFragments[fragIndex] = { ...fragment, underlineMarks };
    set({ savedFragments: nextFragments });
    get().saveGameDataInternal();
    get().markFileModified();
  },

  toggleFragmentEdit: (fragmentIndex) => {
    const nextFragments = get().savedFragments.map((fragment: Fragment, idx: number) => {
      if (idx === fragmentIndex) {
        return { ...fragment, editable: !fragment.editable };
      }
      return { ...fragment, editable: false };
    });
    set({
      savedFragments: nextFragments,
      selectedFragmentIndex: -1,
      selectedFragmentMoveIndex: -1,
    });
    get().markFileModified();
  },

  selectFragmentMove: (fragmentIndex, moveIndex) => {
    set({ selectedFragmentIndex: fragmentIndex, selectedFragmentMoveIndex: moveIndex });
  },

  viewFragmentMove: (fragmentIndex, moveIndex) => {
    const fragment = get().savedFragments[fragmentIndex];
    if (!fragment) return;
    if (get().clockRunning) {
      get().stopClock();
    }
    set({
      selectedFragmentIndex: fragmentIndex,
      selectedFragmentMoveIndex: moveIndex,
      pieces: rebuildBoardFromMoves(fragment.moves.slice(0, moveIndex + 1)),
    });
  },

  branchFromHere: () => {
    if (get().selectedMoveIndex < 0) {
      window.alert("请先在棋谱记录中选择一个着法！");
      return;
    }
    const selectedStepNum = get().selectedMoveIndex + 1;
    const currentStepCount = get().currentLine.length;
    const isLastMove = selectedStepNum === currentStepCount;

    const fragmentTitle = `棋局${get().savedFragments.length + 1}（1-${currentStepCount}着）`;
    const fragmentMoves = JSON.parse(JSON.stringify(get().currentLine));
    const fragmentComments = JSON.parse(JSON.stringify(get().comments));
    const fragmentBranchPoints = JSON.parse(JSON.stringify(get().branchPoints));

    fragmentMoves.forEach((move: MoveRecord, index: number) => {
      move.displayNum = index + 1;
    });

    const fragment: Fragment = {
      startStep: 1,
      moves: fragmentMoves,
      comments: fragmentComments,
      branchPoints: fragmentBranchPoints,
      title: fragmentTitle,
      boardState: getBoardStateAtStep(get().currentLine, 0),
      totalSteps: currentStepCount,
    };

    const nextFragments = [...get().savedFragments, fragment];

    if (isLastMove) {
      set({ savedFragments: nextFragments, gameOver: true });
      window.alert(`已保存完整棋局"${fragmentTitle}"！棋局已结束，可以开始新局。`);
      get().saveGameDataInternal();
      get().markFileModified();
      return;
    }

    const newLine = JSON.parse(JSON.stringify(get().currentLine.slice(0, selectedStepNum)));
    newLine.forEach((move: MoveRecord, index: number) => {
      move.displayNum = index + 1;
    });

    let nextTurn: PieceColor = "red";
    if (selectedStepNum > 0) {
      const lastMove = newLine[newLine.length - 1];
      if (lastMove?.stepInfo) {
        nextTurn = lastMove.stepInfo.color === "red" ? "black" : "red";
      } else {
        nextTurn = newLine.length % 2 === 0 ? "red" : "black";
      }
    }

    const newBranchPoints: Record<number, boolean> = {};
    if (selectedStepNum > 0) {
      newBranchPoints[selectedStepNum - 1] = true;
    }

    set({
      savedFragments: nextFragments,
      currentLine: newLine,
      comments: {},
      branchPoints: newBranchPoints,
      selectedMoveIndex: -1,
      currentTurn: nextTurn,
      pieces: getBoardStateAtStep(newLine, newLine.length - 1),
    });

    window.alert(
      `已保存片段"${fragmentTitle}"，当前线路变为1-${selectedStepNum}着。已在线路2的第${selectedStepNum}着自动添加分支点标记。`,
    );
    get().saveGameDataInternal();
    get().markFileModified();
  },

  mirrorRecord: () => {
    if (get().savedGames.length === 0) {
      window.alert("没有已保存的棋局，无法进行镜像！");
      return;
    }
    if (get().savedFragments.length !== 1) {
      window.alert("当前棋局不包含片段或包含多个片段，请选择只包含一个片段的棋局！");
      return;
    }
    const ok = window.confirm("确定要镜像当前棋局吗？这将创建一个新的镜像棋局。");
    if (!ok) return;

    const originalName = get().savedGames.find((g: any) => g.id === get().currentGameId)?.name || "未命名棋局";
    const mirroredCurrentLine = mirrorMoveList(get().currentLine);
    const mirroredFragments = get().savedFragments.map((fragment: Fragment) => ({
      ...fragment,
      moves: mirrorMoveList(fragment.moves),
      title: fragment.title.replace("棋局", "镜像棋局"),
    }));
    const mirroredBoardState = get().pieces.map((piece: any) => ({
      ...piece,
      col: 8 - piece.col,
    }));

    const mirroredGame = {
      id: Date.now(),
      name: `镜像${originalName}`,
      timestamp: nowTimestamp(),
      fragments: mirroredFragments,
      currentLine: mirroredCurrentLine,
      comments: JSON.parse(JSON.stringify(get().comments)),
      branchPoints: JSON.parse(JSON.stringify(get().branchPoints)),
      boardState: mirroredBoardState,
      isFlipped: get().isBoardFlipped,
    };

    set({ savedGames: [...get().savedGames, mirroredGame] });
    get().markFileModified();
    get().loadGame(mirroredGame.id);
    window.alert(`镜像棋局创建成功！新棋局名称：${mirroredGame.name}`);
  },

  copyRecord: async () => {
    let text = "";
    if (get().viewMode === "current") {
      get().currentLine.forEach((move: MoveRecord, index: number) => {
        let moveText = `${move.displayNum}. ${move.move}`;
        if (get().comments[index]) {
          moveText += ` (${get().comments[index]})`;
        }
        text += `${moveText}\n`;
      });
    } else {
      get().savedFragments.forEach((fragment: Fragment, fragmentIndex: number) => {
        text += `片段${fragmentIndex + 1}: ${fragment.title}\n`;
        fragment.moves.forEach((move, moveIndex) => {
          let moveText = `  ${move.displayNum}. ${move.move}`;
          if (fragment.comments && fragment.comments[moveIndex]) {
            moveText += ` (${fragment.comments[moveIndex]})`;
          }
          if (fragment.underlineMarks && fragment.underlineMarks[moveIndex]) {
            moveText += " [下划线]";
          }
          text += `${moveText}\n`;
        });
        text += "\n";
      });
    }
    if (!text) text = "棋谱为空";
    try {
      await navigator.clipboard.writeText(text);
      window.alert(`已复制${get().viewMode === "current" ? "当前线路" : "片段集合"}棋谱！`);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      window.alert(`已复制${get().viewMode === "current" ? "当前线路" : "片段集合"}棋谱！`);
    }
  },
});
