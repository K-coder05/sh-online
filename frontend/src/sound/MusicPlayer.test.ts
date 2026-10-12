import { createMusicPlayer, MUSIC_VOLUME } from "./MusicPlayer";

/** A stand-in for an HTMLAudioElement that records how it was driven. */
class FakeAudio {
  loop = false;
  volume = 1;
  paused = true;
  playCalls = 0;
  rejectPlay = false;

  play(): Promise<void> {
    this.playCalls++;
    if (this.rejectPlay) {
      return Promise.reject(new Error("NotAllowedError"));
    }
    this.paused = false;
    return Promise.resolve();
  }

  pause(): void {
    this.paused = true;
  }
}

/** A stand-in for the sound board's mute setting. */
function fakeMute(initiallyMuted = false) {
  let muted = initiallyMuted;
  let listeners: ((muted: boolean) => void)[] = [];
  return {
    isMuted: () => muted,
    subscribe: (listener: (muted: boolean) => void) => {
      listeners.push(listener);
      return () => {
        listeners = listeners.filter((l) => l !== listener);
      };
    },
    setMuted: (value: boolean) => {
      muted = value;
      listeners.forEach((listener) => listener(value));
    },
  };
}

test("starting plays the music on a quiet loop", () => {
  const audio = new FakeAudio();
  const player = createMusicPlayer({
    createAudio: () => audio,
    mute: fakeMute(),
  });

  player.start();

  expect(audio.paused).toBe(false);
  expect(audio.loop).toBe(true);
  expect(audio.volume).toBe(MUSIC_VOLUME);
});

test("the music is not loaded until it starts", () => {
  const createAudio = jest.fn(() => new FakeAudio());
  const player = createMusicPlayer({ createAudio, mute: fakeMute() });

  expect(createAudio).not.toHaveBeenCalled();
  player.start();
  player.start();
  expect(createAudio).toHaveBeenCalledTimes(1);
});

test("starting while muted stays silent until unmuted", () => {
  const audio = new FakeAudio();
  const mute = fakeMute(true);
  const player = createMusicPlayer({ createAudio: () => audio, mute });

  player.start();
  expect(audio.paused).toBe(true);

  mute.setMuted(false);
  expect(audio.paused).toBe(false);
});

test("muting pauses the music and unmuting resumes it", () => {
  const audio = new FakeAudio();
  const mute = fakeMute();
  const player = createMusicPlayer({ createAudio: () => audio, mute });
  player.start();

  mute.setMuted(true);
  expect(audio.paused).toBe(true);

  mute.setMuted(false);
  expect(audio.paused).toBe(false);
});

test("unmuting before the music has started does not start it", () => {
  const createAudio = jest.fn(() => new FakeAudio());
  const mute = fakeMute(true);
  createMusicPlayer({ createAudio, mute });

  mute.setMuted(false);

  expect(createAudio).not.toHaveBeenCalled();
});

test("starting reports success once the music plays", async () => {
  const player = createMusicPlayer({
    createAudio: () => new FakeAudio(),
    mute: fakeMute(),
  });

  await expect(player.start()).resolves.toBe(true);
});

test("starting while muted reports success, since unmuting will start it", async () => {
  const player = createMusicPlayer({
    createAudio: () => new FakeAudio(),
    mute: fakeMute(true),
  });

  await expect(player.start()).resolves.toBe(true);
});

test("a blocked play reports failure and can be retried", async () => {
  const audio = new FakeAudio();
  audio.rejectPlay = true;
  const player = createMusicPlayer({
    createAudio: () => audio,
    mute: fakeMute(),
  });

  await expect(player.start()).resolves.toBe(false);

  audio.rejectPlay = false;
  await expect(player.start()).resolves.toBe(true);
  expect(audio.paused).toBe(false);
});

test("browsers that cannot create audio stay silent instead of crashing", async () => {
  jest.spyOn(console, "warn").mockImplementation(() => {});
  const player = createMusicPlayer({
    createAudio: () => {
      throw new Error("Audio unsupported");
    },
    mute: fakeMute(),
  });

  // Retrying wouldn't help, so this counts as done.
  await expect(player.start()).resolves.toBe(true);
});
