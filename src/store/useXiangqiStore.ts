import { create } from "zustand";
import { createBoardSlice, type BoardSlice } from "./slices/boardSlice";
import { createRecordSlice, type RecordSlice } from "./slices/recordSlice";
import { createClockSlice, type ClockSlice, type ClockRule } from "./slices/clockSlice";
import { createFileSlice, type FileSlice } from "./slices/fileSlice";
import { createGameSlice, type GameSlice } from "./slices/gameSlice";
import { createPlaybackSlice, type PlaybackSlice } from "./slices/playbackSlice";

export type XiangqiState = BoardSlice & RecordSlice & ClockSlice & FileSlice & GameSlice & PlaybackSlice;

export const useXiangqiStore = create<XiangqiState>()((...args) => ({
  ...createBoardSlice(...args),
  ...createRecordSlice(...args),
  ...createClockSlice(...args),
  ...createFileSlice(...args),
  ...createGameSlice(...args),
  ...createPlaybackSlice(...args),
}));

export type { ClockRule };
