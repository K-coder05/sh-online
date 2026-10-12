import { createSoundBoard } from "./SoundBoard";
import { createMusicPlayer } from "./MusicPlayer";
import gameMusic from "../assets/music/game_music.mp3";

export { SoundEffect } from "./SoundEffect";
export * from "./cues";
export type { SoundBoard } from "./SoundBoard";
export type { MusicPlayer } from "./MusicPlayer";

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

/** The game's background music, which the sound board's mute toggle also mutes. */
export const musicPlayer = createMusicPlayer({
  createAudio: () => new Audio(gameMusic),
  mute: soundBoard,
});
