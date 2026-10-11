import { createSoundBoard } from "./SoundBoard";

export { SoundEffect } from "./SoundEffect";
export * from "./cues";
export type { SoundBoard } from "./SoundBoard";

/** The game's shared sound board. */
export const soundBoard = createSoundBoard({
  createContext: () => {
    const AudioContextClass =
      window.AudioContext || (window as any).webkitAudioContext;
    return AudioContextClass ? new AudioContextClass() : null;
  },
  storage: {
    getItem: (key) => window.localStorage.getItem(key),
    setItem: (key, value) => window.localStorage.setItem(key, value),
  },
});
