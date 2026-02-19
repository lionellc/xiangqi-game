import type { StateCreator } from "zustand";
import { rebuildBoardFromMoves } from "../../lib/boardState";

export interface PlaybackSlice {
  isPlaying: boolean;
  playTimerId: number | null;
  currentPlayFragmentIndex: number;
  currentPlayStepIndex: number;
  playFragmentList: number[];
  playingSpeed: number;
  voiceEnabled: boolean;

  playCurrentFragment: () => void;
  playAllFragments: () => void;
  stopPlay: () => void;
  toggleVoice: () => void;
}

export const createPlaybackSlice: StateCreator<any, [], [], PlaybackSlice> = (set, get) => ({
  isPlaying: false,
  playTimerId: null,
  currentPlayFragmentIndex: 0,
  currentPlayStepIndex: 0,
  playFragmentList: [],
  playingSpeed: 2000,
  voiceEnabled: true,

  toggleVoice: () => {
    set({ voiceEnabled: !get().voiceEnabled });
  },

  playCurrentFragment: () => {
    if (get().viewMode !== "fragments") {
      window.alert("请在片段集合模式下使用此功能！");
      return;
    }
    if (get().isPlaying) {
      get().stopPlay();
      return;
    }
    if (get().savedFragments.length === 0) {
      window.alert("没有保存的片段可供播放！");
      return;
    }
    set({ playFragmentList: [0], currentPlayFragmentIndex: 0, currentPlayStepIndex: 0 });
    set({ isPlaying: true });
    get().playAllFragments();
  },

  playAllFragments: () => {
    if (get().viewMode !== "fragments") {
      window.alert("请在片段集合模式下使用此功能！");
      return;
    }
    if (get().isPlaying) {
      get().stopPlay();
      return;
    }
    if (get().savedFragments.length === 0) {
      window.alert("没有保存的片段可供播放！");
      return;
    }
    set({
      isPlaying: true,
      playFragmentList: get().savedFragments.map((_: any, index: number) => index),
      currentPlayFragmentIndex: 0,
      currentPlayStepIndex: 0,
    });

    const playNextStep = () => {
      if (!get().isPlaying) return;
      if (get().currentPlayFragmentIndex >= get().playFragmentList.length) {
        get().stopPlay();
        window.alert("所有片段播放完成！");
        return;
      }
      const fragmentIndex = get().playFragmentList[get().currentPlayFragmentIndex];
      const fragment = get().savedFragments[fragmentIndex];
      if (!fragment) {
        set({ currentPlayFragmentIndex: get().currentPlayFragmentIndex + 1, currentPlayStepIndex: 0 });
        window.setTimeout(playNextStep, 100);
        return;
      }
      if (!fragment.moves || fragment.moves.length === 0) {
        set({ currentPlayFragmentIndex: get().currentPlayFragmentIndex + 1, currentPlayStepIndex: 0 });
        window.setTimeout(playNextStep, 100);
        return;
      }
      if (get().currentPlayStepIndex >= fragment.moves.length) {
        set({ currentPlayFragmentIndex: get().currentPlayFragmentIndex + 1, currentPlayStepIndex: 0 });
        window.setTimeout(playNextStep, 500);
        return;
      }

      let playSpeed = 2000;
      if (fragmentIndex === 0) {
        playSpeed = 2000;
      } else {
        const hasBranchPoint = fragment.branchPoints && Object.keys(fragment.branchPoints).length > 0;
        if (hasBranchPoint) {
          let firstBranchStep: number | null = null;
          for (let i = 0; i < fragment.moves.length; i++) {
            if (fragment.branchPoints[i]) {
              firstBranchStep = i;
              break;
            }
          }
          if (firstBranchStep !== null && get().currentPlayStepIndex <= firstBranchStep) {
            playSpeed = 200;
          } else {
            playSpeed = 2000;
          }
        }
      }

      const move = fragment.moves[get().currentPlayStepIndex];
      if (move?.stepInfo) {
        set({
          pieces: rebuildBoardFromMoves(fragment.moves.slice(0, get().currentPlayStepIndex + 1)),
          playingSpeed: playSpeed,
          selectedFragmentIndex: fragmentIndex,
          selectedFragmentMoveIndex: get().currentPlayStepIndex,
        });
        if (playSpeed === 2000 && get().voiceEnabled) {
          if ("speechSynthesis" in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance();
            utterance.text = move.move;
            utterance.lang = "zh-CN";
            window.speechSynthesis.speak(utterance);
          }
        }
      }

      set({ currentPlayStepIndex: get().currentPlayStepIndex + 1 });
      const timerId = window.setTimeout(playNextStep, playSpeed);
      set({ playTimerId: timerId });
    };

    playNextStep();
  },

  stopPlay: () => {
    if (get().playTimerId) {
      window.clearTimeout(get().playTimerId);
    }
    set({ isPlaying: false, playTimerId: null, playingSpeed: 2000 });
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  },
});
