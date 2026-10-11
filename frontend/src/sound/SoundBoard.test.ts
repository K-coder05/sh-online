import { createSoundBoard, MUTE_STORAGE_KEY } from "./SoundBoard";
import { SoundEffect } from "./SoundEffect";
import { FakeAudioContext } from "./FakeAudioContext";

function memoryStorage(initial: Record<string, string> = {}) {
  const data: Record<string, string> = { ...initial };
  return {
    getItem: (key: string) => (key in data ? data[key] : null),
    setItem: (key: string, value: string) => {
      data[key] = value;
    },
    data,
  };
}

test("playing an effect schedules audio on the context", () => {
  const context = new FakeAudioContext();
  const board = createSoundBoard({
    createContext: () => context,
    storage: memoryStorage(),
  });

  board.play(SoundEffect.EXECUTION);

  expect(context.startedSources).toBeGreaterThan(0);
});

test("the audio context is not created until the first sound plays", () => {
  const createContext = jest.fn(() => new FakeAudioContext());
  const board = createSoundBoard({ createContext, storage: memoryStorage() });

  expect(createContext).not.toHaveBeenCalled();
  board.play(SoundEffect.PROMPT);
  board.play(SoundEffect.PROMPT);
  expect(createContext).toHaveBeenCalledTimes(1);
});

test("a suspended context is resumed so sounds can be heard", () => {
  const context = new FakeAudioContext();
  context.state = "suspended";
  const board = createSoundBoard({
    createContext: () => context,
    storage: memoryStorage(),
  });

  board.play(SoundEffect.PROMPT);

  expect(context.resume).toHaveBeenCalled();
});

test("muted boards play nothing", () => {
  const context = new FakeAudioContext();
  const board = createSoundBoard({
    createContext: () => context,
    storage: memoryStorage(),
  });

  board.setMuted(true);
  board.play(SoundEffect.EXECUTION);

  expect(board.isMuted()).toBe(true);
  expect(context.startedSources).toBe(0);
});

test("the mute setting is remembered across sessions", () => {
  const storage = memoryStorage();
  createSoundBoard({ createContext: () => null, storage }).setMuted(true);

  const nextSession = createSoundBoard({ createContext: () => null, storage });

  expect(storage.data[MUTE_STORAGE_KEY]).toBe("true");
  expect(nextSession.isMuted()).toBe(true);
});

test("toggling flips the mute setting and returns the new value", () => {
  const board = createSoundBoard({
    createContext: () => null,
    storage: memoryStorage(),
  });

  expect(board.toggleMuted()).toBe(true);
  expect(board.toggleMuted()).toBe(false);
});

test("browsers without Web Audio play silently instead of crashing", () => {
  const board = createSoundBoard({
    createContext: () => null,
    storage: memoryStorage(),
  });

  expect(() => board.play(SoundEffect.LIBERAL_VICTORY)).not.toThrow();
});

test("unavailable or throwing storage does not break sound", () => {
  const storage = {
    getItem: () => {
      throw new Error("blocked");
    },
    setItem: () => {
      throw new Error("blocked");
    },
  };
  const context = new FakeAudioContext();
  const board = createSoundBoard({ createContext: () => context, storage });

  expect(board.isMuted()).toBe(false);
  expect(() => board.setMuted(true)).not.toThrow();
  expect(board.isMuted()).toBe(true);
});

test("errors while synthesizing a sound are swallowed", () => {
  jest.spyOn(console, "warn").mockImplementation(() => {});
  const context = new FakeAudioContext();
  context.createOscillator = () => {
    throw new Error("audio device lost");
  };
  const board = createSoundBoard({
    createContext: () => context,
    storage: memoryStorage(),
  });

  expect(() => board.play(SoundEffect.PROMPT)).not.toThrow();
});

test("listeners hear about mute changes", () => {
  const board = createSoundBoard({
    createContext: () => null,
    storage: memoryStorage(),
  });
  const listener = jest.fn();
  const unsubscribe = board.subscribe(listener);

  board.setMuted(true);
  unsubscribe();
  board.setMuted(false);

  expect(listener).toHaveBeenCalledTimes(1);
  expect(listener).toHaveBeenCalledWith(true);
});

test("unlocking creates and resumes the context ahead of the first sound", () => {
  const context = new FakeAudioContext();
  context.state = "suspended";
  const createContext = jest.fn(() => context);
  const board = createSoundBoard({ createContext, storage: memoryStorage() });

  board.unlock();

  expect(createContext).toHaveBeenCalledTimes(1);
  expect(context.resume).toHaveBeenCalled();
  expect(context.startedSources).toBe(0);
});
