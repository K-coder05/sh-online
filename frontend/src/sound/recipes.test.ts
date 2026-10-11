import { RECIPES } from "./recipes";
import { SoundEffect } from "./SoundEffect";
import { FakeAudioContext } from "./FakeAudioContext";

const effects = Object.values(SoundEffect) as SoundEffect[];

test.each(effects)("%s synthesizes a sound", (effect: SoundEffect) => {
  const context = new FakeAudioContext();

  RECIPES[effect](context as any, context.destination, 0);

  expect(context.startedSources).toBeGreaterThan(0);
});
