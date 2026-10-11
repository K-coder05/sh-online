import { SoundEffect } from "./SoundEffect";
import { AudioContextLike, RECIPES } from "./recipes";

export const MUTE_STORAGE_KEY = "sh-online-muted";

/** How loud all sounds are, from 0 to 1. */
const MASTER_VOLUME = 0.6;

export type StorageLike = Pick<Storage, "getItem" | "setItem">;

export type SoundBoardOptions = {
  /** Creates the audio context, or returns null if Web Audio is unsupported. */
  createContext: () => AudioContextLike | null;
  /** Where the mute setting is remembered. */
  storage: StorageLike;
};

export type SoundBoard = {
  /** Plays a sound effect, unless muted. Never throws. */
  play: (effect: SoundEffect) => void;
  /**
   * Prepares audio for playback. Browsers only allow audio to start after the
   * user interacts with the page, so call this from an input event handler.
   */
  unlock: () => void;
  isMuted: () => boolean;
  setMuted: (muted: boolean) => void;
  /** Flips the mute setting and returns the new value. */
  toggleMuted: () => boolean;
  /** Calls the listener whenever the mute setting changes. Returns an unsubscribe function. */
  subscribe: (listener: (muted: boolean) => void) => () => void;
};

/** Creates a sound board, which synthesizes the game's sound effects. */
export function createSoundBoard(options: SoundBoardOptions): SoundBoard {
  let context: AudioContextLike | null | undefined = undefined;
  let output: AudioNode | undefined = undefined;
  let listeners: ((muted: boolean) => void)[] = [];
  let muted = false;
  try {
    muted = options.storage.getItem(MUTE_STORAGE_KEY) === "true";
  } catch (e) {
    // Storage is unavailable (e.g. blocked cookies); sound defaults to on.
  }

  /** Returns the node to play sounds into, creating the context on first use. */
  const getOutput = (): AudioNode | undefined => {
    if (context === undefined) {
      context = options.createContext();
      if (context) {
        // Keep loud effects (like explosions) from clipping, while compressing
        // gently enough that they still sound louder than quiet ones.
        const compressor = context.createDynamicsCompressor();
        compressor.threshold.setValueAtTime(-10, context.currentTime);
        compressor.knee.setValueAtTime(6, context.currentTime);
        compressor.ratio.setValueAtTime(4, context.currentTime);
        const master = context.createGain();
        master.gain.setValueAtTime(MASTER_VOLUME, context.currentTime);
        master.connect(compressor);
        compressor.connect(context.destination);
        output = master;
      }
    }
    if (context && context.state === "suspended") {
      context.resume().catch(() => {});
    }
    return output;
  };

  const board: SoundBoard = {
    play: (effect) => {
      if (muted) {
        return;
      }
      try {
        const out = getOutput();
        if (context && out) {
          RECIPES[effect](context, out, context.currentTime + 0.01);
        }
      } catch (e) {
        // Sound is a nicety; never let it break the game.
        console.warn("Could not play sound " + effect, e);
      }
    },
    unlock: () => {
      try {
        getOutput();
      } catch (e) {
        // Ignore; play() will try again.
      }
    },
    isMuted: () => muted,
    setMuted: (value) => {
      muted = value;
      try {
        options.storage.setItem(MUTE_STORAGE_KEY, String(value));
      } catch (e) {
        // The setting just won't be remembered.
      }
      listeners.forEach((listener) => listener(value));
    },
    toggleMuted: () => {
      board.setMuted(!muted);
      return muted;
    },
    subscribe: (listener) => {
      listeners.push(listener);
      return () => {
        listeners = listeners.filter((l) => l !== listener);
      };
    },
  };
  return board;
}
