import type { StateCreator } from "zustand";
import type { PieceColor } from "../../lib/xiangqi";

export type ClockRule = "suddenDeath" | "increment" | "stepTime";

export interface ClockSlice {
  clockRule: ClockRule;
  redBaseTime: number;
  blackBaseTime: number;
  redStepTime: number;
  blackStepTime: number;
  incrementTime: number;

  redTime: number;
  blackTime: number;
  redStepTimeRemaining: number;
  blackStepTimeRemaining: number;

  clockRunning: boolean;
  currentClock: PieceColor | null;
  clockIntervalId: number | null;

  startClock: (turn: PieceColor) => void;
  pauseClock: () => void;
  resetClock: () => void;
  selectRule: (rule: ClockRule) => void;
  updateClockSetting: (payload: Partial<{
    redBaseTime: number;
    blackBaseTime: number;
    redStepTime: number;
    blackStepTime: number;
    incrementTime: number;
  }>) => void;
  stopClock: () => void;
}

export const createClockSlice: StateCreator<any, [], [], ClockSlice> = (set, get) => {
  const resetClockValues = (rule: ClockRule, state: Partial<ClockSlice> = {}) => {
    const redBaseTime = state.redBaseTime ?? get().redBaseTime;
    const blackBaseTime = state.blackBaseTime ?? get().blackBaseTime;
    const redStepTime = state.redStepTime ?? get().redStepTime;
    const blackStepTime = state.blackStepTime ?? get().blackStepTime;
    return {
      redTime: redBaseTime,
      blackTime: blackBaseTime,
      redStepTimeRemaining: redStepTime,
      blackStepTimeRemaining: blackStepTime,
    };
  };

  const stopClock = () => {
    const timer = get().clockIntervalId;
    if (timer) {
      window.clearInterval(timer);
    }
    set({ clockRunning: false, clockIntervalId: null });
  };

  return {
    clockRule: "suddenDeath",
    redBaseTime: 20 * 60,
    blackBaseTime: 20 * 60,
    redStepTime: 60,
    blackStepTime: 60,
    incrementTime: 5,

    redTime: 20 * 60,
    blackTime: 20 * 60,
    redStepTimeRemaining: 60,
    blackStepTimeRemaining: 60,

    clockRunning: false,
    currentClock: null,
    clockIntervalId: null,

    startClock: (turn) => {
      stopClock();
      set({ currentClock: turn, clockRunning: true });
      const timer = window.setInterval(() => {
        if (get().currentClock === "red") {
          set((state: ClockSlice) => ({ redTime: state.redTime - 1 }));
        } else {
          set((state: ClockSlice) => ({ blackTime: state.blackTime - 1 }));
        }

        if (get().clockRule === "stepTime") {
          if (get().currentClock === "red") {
            set((state: ClockSlice) => ({ redStepTimeRemaining: state.redStepTimeRemaining - 1 }));
          } else {
            set((state: ClockSlice) => ({ blackStepTimeRemaining: state.blackStepTimeRemaining - 1 }));
          }
        }

        const { redTime, blackTime, redStepTimeRemaining, blackStepTimeRemaining, clockRule, currentClock } = get();
        if (redTime <= 0) {
          set({ gameOver: true });
          window.alert("红方时间到，黑方获胜！");
          stopClock();
        } else if (blackTime <= 0) {
          set({ gameOver: true });
          window.alert("黑方时间到，红方获胜！");
          stopClock();
        }
        if (clockRule === "stepTime") {
          if (currentClock === "red" && redStepTimeRemaining <= 0) {
            set({ gameOver: true });
            window.alert("红方步时用尽，黑方获胜！");
            stopClock();
          } else if (currentClock === "black" && blackStepTimeRemaining <= 0) {
            set({ gameOver: true });
            window.alert("黑方步时用尽，红方获胜！");
            stopClock();
          }
        }
      }, 1000);
      set({ clockIntervalId: timer });
    },

    pauseClock: () => {
      if (get().clockRunning) {
        stopClock();
      } else if (get().currentClock) {
        get().startClock(get().currentClock);
      }
    },

    resetClock: () => {
      stopClock();
      set({ currentClock: "red", clockRunning: false });
      set(resetClockValues(get().clockRule));
    },

    selectRule: (rule) => {
      set({ clockRule: rule });
      set(resetClockValues(rule));
      get().resetClock();
    },

    updateClockSetting: (payload) => {
      set(payload);
      set(resetClockValues(get().clockRule, payload));
    },

    stopClock,
  };
};
