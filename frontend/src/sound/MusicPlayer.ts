import { SoundBoard } from "./SoundBoard";

/** How loud the background music is, from 0 to 1. Kept low so effects cut through. */
export const MUSIC_VOLUME = 0.25;

/** The parts of an HTMLAudioElement that the music player uses. */
export type AudioLike = Pick<
  HTMLAudioElement,
  "loop" | "volume" | "play" | "pause"
>;

/** A mute setting the music follows, such as the sound board's. */
export type MuteSource = Pick<SoundBoard, "isMuted" | "subscribe">;

export type MusicPlayerOptions = {
  /** Creates the audio element that plays the music track. */
  createAudio: () => AudioLike;
  /** The mute setting to follow; muting pauses the music. */
  mute: MuteSource;
};

export type MusicPlayer = {
  /**
   * Starts the looping background music, unless muted. Browsers only allow
   * audio to start after the user interacts with the page, so call this from an
   * input event handler. Never throws.
   * @return resolves to false if the browser blocked playback, in which case
   *         call this again on the next interaction; true otherwise.
   */
  start: () => Promise<boolean>;
};

/** Creates a music player, which loops the game's background music. */
export function createMusicPlayer(options: MusicPlayerOptions): MusicPlayer {
  let audio: AudioLike | undefined = undefined;

  /** Plays the music unless muted; resolves to false if playback was blocked. */
  const resume = (): Promise<boolean> => {
    if (!audio || options.mute.isMuted()) {
      return Promise.resolve(true);
    }
    return audio.play().then(
      () => true,
      () => false
    );
  };

  options.mute.subscribe((muted) => {
    if (!audio) {
      return;
    }
    if (muted) {
      audio.pause();
    } else {
      resume();
    }
  });

  return {
    start: () => {
      try {
        if (!audio) {
          audio = options.createAudio();
          audio.loop = true;
          audio.volume = MUSIC_VOLUME;
        }
        return resume();
      } catch (e) {
        // Music is a nicety; never let it break the game.
        console.warn("Could not play music", e);
        return Promise.resolve(true);
      }
    },
  };
}
