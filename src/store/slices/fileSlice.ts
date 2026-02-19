import type { StateCreator } from "zustand";
import { open, save } from "@tauri-apps/plugin-dialog";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { basename } from "@tauri-apps/api/path";
import type { GameData } from "../../models/types";

export interface FileSlice {
  currentFilePath: string | null;
  currentFileName: string;
  isFileModified: boolean;

  markFileModified: () => void;
  newFile: () => Promise<void>;
  openFile: () => Promise<void>;
  saveFile: () => Promise<void>;
  saveAsFile: () => Promise<void>;
}

export const createFileSlice: StateCreator<any, [], [], FileSlice> = (set, get) => ({
  currentFilePath: null,
  currentFileName: "未命名棋谱书.json",
  isFileModified: false,

  markFileModified: () => {
    if (!get().isFileModified) {
      set({ isFileModified: true });
    }
  },

  newFile: async () => {
    if (get().isFileModified) {
      const ok = window.confirm("当前文件已修改，是否保存？");
      if (!ok) return;
      await get().saveFile();
    }
    set({ currentFilePath: null, currentFileName: "未命名棋谱书.json", isFileModified: false });
    set({ savedGames: [], currentGameId: 0, deletedGames: [] });
    get().resetBoard();
    window.alert("已创建新文件");
  },

  openFile: async () => {
    if (get().isFileModified) {
      const ok = window.confirm("当前文件已修改，是否保存？");
      if (!ok) return;
      await get().saveFile();
    }
    const filePath = await open({
      multiple: false,
      filters: [{ name: "棋谱文件", extensions: ["json"] }],
    });
    if (!filePath || Array.isArray(filePath)) return;
    const content = await readTextFile(filePath);
    const name = await basename(filePath);
    set({ currentFilePath: filePath, currentFileName: name, isFileModified: false });
    try {
      const data = JSON.parse(content);
      let games: GameData[] = [];
      if (data.version && data.games) {
        games = data.games || [];
      } else if (Array.isArray(data)) {
        games = data;
      } else {
        window.alert("文件格式不正确！");
        return;
      }
      games.forEach((game) => {
        if (game.fragments) {
          game.fragments.forEach((fragment) => {
            if (!fragment.underlineMarks) {
              fragment.underlineMarks = {};
            }
          });
        }
      });
      set({ savedGames: games });
      if (games.length > 0) {
        get().loadGame(games[0].id);
      } else {
        get().resetBoard();
      }
      window.alert(`成功打开文件: ${name}`);
    } catch {
      window.alert("文件解析失败！");
    }
  },

  saveFile: async () => {
    const data = {
      version: "1.0",
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      games: get().savedGames,
    };
    const content = JSON.stringify(data, null, 2);
    if (get().currentFilePath) {
      await writeTextFile(get().currentFilePath!, content);
      set({ isFileModified: false });
      window.alert(`已保存到: ${get().currentFileName}`);
    } else {
      await get().saveAsFile();
    }
  },

  saveAsFile: async () => {
    const data = {
      version: "1.0",
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      games: get().savedGames,
    };
    const content = JSON.stringify(data, null, 2);
    const filePath = await save({
      defaultPath: get().currentFileName,
      filters: [{ name: "棋谱文件", extensions: ["json"] }],
    });
    if (!filePath) return;
    await writeTextFile(filePath, content);
    const name = await basename(filePath);
    set({ currentFilePath: filePath, currentFileName: name, isFileModified: false });
    window.alert(`已保存到: ${name}`);
  },
});
