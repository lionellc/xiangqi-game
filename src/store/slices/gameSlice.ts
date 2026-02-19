import type { StateCreator } from "zustand";
import type { GameData, Fragment } from "../../models/types";
import type { PieceColor } from "../../lib/xiangqi";
import { buildDefaultPieces, clonePieces, getBoardStateAtStep } from "../../lib/boardState";

export interface GameSlice {
  savedGames: GameData[];
  currentGameId: number;
  deletedGames: GameData[];

  newGame: () => void;
  saveGameData: () => void;
  saveGameDataInternal: () => void;
  loadGame: (gameId: number) => void;
  deleteGame: () => void;
  restoreGame: () => void;
  renameGame: (name: string) => void;
  setGameName: (name: string) => void;
  moveGameUp: () => void;
  moveGameDown: () => void;
  prevGame: () => void;
  nextGame: () => void;
}

const nowTimestamp = () => new Date().toLocaleString();

export const createGameSlice: StateCreator<any, [], [], GameSlice> = (set, get) => ({
  savedGames: [],
  currentGameId: 0,
  deletedGames: [],

  saveGameDataInternal: () => {
    const {
      currentGameId,
      currentLine,
      savedFragments,
      comments,
      branchPoints,
      pieces,
      isBoardFlipped,
      savedGames,
    } = get();
    const gameName = get().savedGames.find((g: GameData) => g.id === currentGameId)?.name || "未命名棋局";
    const gameData: GameData = {
      id: currentGameId || Date.now(),
      name: gameName,
      timestamp: nowTimestamp(),
      fragments: JSON.parse(
        JSON.stringify(
          savedFragments.map((f: Fragment) => ({
            ...f,
            underlineMarks: f.underlineMarks || {},
          })),
        ),
      ),
      currentLine: JSON.parse(JSON.stringify(currentLine)),
      comments: JSON.parse(JSON.stringify(comments)),
      branchPoints: JSON.parse(JSON.stringify(branchPoints)),
      boardState: clonePieces(pieces),
      isFlipped: isBoardFlipped,
    };

    const existingIndex = savedGames.findIndex((g: GameData) => g.id === gameData.id);
    const nextSaved = [...savedGames];
    if (existingIndex !== -1) {
      nextSaved[existingIndex] = gameData;
    } else {
      nextSaved.push(gameData);
    }

    set({ savedGames: nextSaved, currentGameId: gameData.id });
    get().markFileModified();
  },

  newGame: () => {
    const ok = window.confirm("开始新棋局将清空当前棋谱，确定吗？");
    if (!ok) return;
    get().resetBoard();
    set({ currentGameId: 0 });
    get().markFileModified();
  },

  saveGameData: () => {
    get().saveGameDataInternal();
  },

  loadGame: (gameId) => {
    const game = get().savedGames.find((g: GameData) => g.id === gameId);
    if (!game) return;
    get().stopClock();

    const currentLine = JSON.parse(JSON.stringify(game.currentLine || []));
    const fragments = JSON.parse(JSON.stringify(game.fragments || []));
    const comments = JSON.parse(JSON.stringify(game.comments || {}));
    const branchPoints = JSON.parse(JSON.stringify(game.branchPoints || {}));
    const rawBoardState = Array.isArray(game.boardState) ? game.boardState : [];
    const boardState =
      rawBoardState.length > 0
        ? rawBoardState.map((piece, index) => ({
            ...piece,
            id: piece.id ?? `loaded_${piece.color}_${piece.type}_${piece.row}_${piece.col}_${index}`,
          }))
        : null;

    fragments.forEach((fragment: Fragment, index: number) => {
      fragment.title = fragment.title || `棋局${index + 1}`;
      fragment.underlineMarks = fragment.underlineMarks || {};
    });

    const isBoardFlipped = game.isFlipped || false;

    set({
      currentLine,
      savedFragments: fragments,
      currentGameId: game.id,
      comments,
      branchPoints,
      selectedMoveIndex: -1,
      selectedFragmentIndex: -1,
      selectedFragmentMoveIndex: -1,
      currentTurn: "red",
      gameOver: false,
      gameMode: "play",
      viewMode: "current",
      isBoardFlipped,
    });

    if (boardState) {
      set({ pieces: boardState });
    } else if (currentLine.length > 0) {
      set({ pieces: getBoardStateAtStep(currentLine, currentLine.length - 1) });
    } else {
      set({ pieces: buildDefaultPieces() });
    }
  },

  deleteGame: () => {
    if (get().currentGameId === 0) {
      window.alert("请先选择一个棋局！");
      return;
    }
    const ok = window.confirm("确定要删除这个棋局吗？");
    if (!ok) return;
    const index = get().savedGames.findIndex((g: GameData) => g.id === get().currentGameId);
    if (index === -1) return;
    const deleted = get().savedGames[index];
    const nextGames = [...get().savedGames];
    nextGames.splice(index, 1);
    nextGames.forEach((game, idx) => {
      game.id = idx + 1;
    });
    set({ savedGames: nextGames, deletedGames: [...get().deletedGames, deleted], currentGameId: 0 });
    get().resetBoard();
    get().markFileModified();
  },

  restoreGame: () => {
    if (get().deletedGames.length === 0) {
      window.alert("没有可恢复的棋局！");
      return;
    }
    const nextDeleted = [...get().deletedGames];
    const gameToRestore = nextDeleted.pop()!;
    const nextGames = [...get().savedGames, gameToRestore];
    nextGames.forEach((game, idx) => {
      game.id = idx + 1;
    });
    set({ savedGames: nextGames, deletedGames: nextDeleted });
    get().markFileModified();
    window.alert(`棋局"${gameToRestore.name}"已恢复！`);
  },

  renameGame: (name) => {
    if (get().currentGameId === 0) {
      window.alert("请先选择一个棋局！");
      return;
    }
    const trimmed = name.trim();
    if (!trimmed) {
      window.alert("请输入棋局名称！");
      return;
    }
    const nextGames = get().savedGames.map((game: GameData) =>
      game.id === get().currentGameId ? { ...game, name: trimmed } : game,
    );
    set({ savedGames: nextGames });
    get().markFileModified();
  },

  setGameName: (name) => {
    const trimmed = name.trim() || "未命名棋局";
    const currentId = get().currentGameId;
    const savedGames = [...get().savedGames];
    if (currentId) {
      const idx = savedGames.findIndex((g: GameData) => g.id === currentId);
      if (idx !== -1) {
        savedGames[idx] = { ...savedGames[idx], name: trimmed };
        set({ savedGames });
      }
    }
    get().markFileModified();
  },

  moveGameUp: () => {
    const index = get().savedGames.findIndex((g: GameData) => g.id === get().currentGameId);
    if (index <= 0) return;
    const nextGames = [...get().savedGames];
    [nextGames[index - 1], nextGames[index]] = [nextGames[index], nextGames[index - 1]];
    nextGames.forEach((game, idx) => {
      game.id = idx + 1;
    });
    set({ savedGames: nextGames, currentGameId: index });
    get().markFileModified();
  },

  moveGameDown: () => {
    const index = get().savedGames.findIndex((g: GameData) => g.id === get().currentGameId);
    if (index < 0 || index >= get().savedGames.length - 1) return;
    const nextGames = [...get().savedGames];
    [nextGames[index], nextGames[index + 1]] = [nextGames[index + 1], nextGames[index]];
    nextGames.forEach((game, idx) => {
      game.id = idx + 1;
    });
    set({ savedGames: nextGames, currentGameId: index + 2 });
    get().markFileModified();
  },

  prevGame: () => {
    if (get().savedGames.length === 0) {
      window.alert("没有保存的棋局！");
      return;
    }
    let index = 0;
    if (get().currentGameId > 0) {
      const currentIndex = get().savedGames.findIndex((g: GameData) => g.id === get().currentGameId);
      index = currentIndex > 0 ? currentIndex - 1 : get().savedGames.length - 1;
    }
    get().loadGame(get().savedGames[index].id);
  },

  nextGame: () => {
    if (get().savedGames.length === 0) {
      window.alert("没有保存的棋局！");
      return;
    }
    let index = 0;
    if (get().currentGameId > 0) {
      const currentIndex = get().savedGames.findIndex((g: GameData) => g.id === get().currentGameId);
      index = currentIndex < get().savedGames.length - 1 ? currentIndex + 1 : 0;
    }
    get().loadGame(get().savedGames[index].id);
  },
});
