import { SoundEffect } from "./SoundEffect";

/** The parts of the Web Audio API's AudioContext that the recipes use. */
export type AudioContextLike = Pick<
  AudioContext,
  | "currentTime"
  | "sampleRate"
  | "destination"
  | "state"
  | "resume"
  | "createOscillator"
  | "createGain"
  | "createBiquadFilter"
  | "createBuffer"
  | "createBufferSource"
  | "createDynamicsCompressor"
>;

/**
 * Synthesizes a sound effect.
 * @param ctx the audio context to synthesize with.
 * @param out the node to send the sound to.
 * @param t the context time to start the sound at.
 */
type Recipe = (ctx: AudioContextLike, out: AudioNode, t: number) => void;

// The quietest volume used to fade sounds out, since exponential ramps can't reach 0.
const SILENT = 0.0001;

type ToneOptions = {
  type?: OscillatorType;
  freq: number;
  /** If given, the pitch slides to this frequency over the tone's duration. */
  freqEnd?: number;
  start: number;
  duration: number;
  volume: number;
  attack?: number;
  /** Adds a wobble to the pitch: [rate in Hz, depth in Hz]. */
  vibrato?: [number, number];
  /** If given, the tone is passed through a lowpass filter at this cutoff. */
  lowpass?: number;
};

/** Plays a single oscillator note with a quick attack and exponential decay. */
function tone(ctx: AudioContextLike, out: AudioNode, o: ToneOptions): void {
  const end = o.start + o.duration;
  const attack = o.attack ?? 0.01;

  const osc = ctx.createOscillator();
  osc.type = o.type ?? "sine";
  osc.frequency.setValueAtTime(o.freq, o.start);
  if (o.freqEnd !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(o.freqEnd, end);
  }

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(SILENT, o.start);
  gain.gain.linearRampToValueAtTime(o.volume, o.start + attack);
  gain.gain.exponentialRampToValueAtTime(SILENT, end);

  let input: AudioNode = gain;
  if (o.lowpass !== undefined) {
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(o.lowpass, o.start);
    filter.connect(gain);
    input = filter;
  }
  osc.connect(input);
  gain.connect(out);

  if (o.vibrato) {
    const lfo = ctx.createOscillator();
    lfo.frequency.setValueAtTime(o.vibrato[0], o.start);
    const depth = ctx.createGain();
    depth.gain.setValueAtTime(o.vibrato[1], o.start);
    lfo.connect(depth);
    depth.connect(osc.frequency);
    lfo.start(o.start);
    lfo.stop(end);
  }

  osc.start(o.start);
  osc.stop(end + 0.05);
}

type NoiseOptions = {
  start: number;
  duration: number;
  volume: number;
  filter: BiquadFilterType;
  freq: number;
  /** If given, the filter sweeps to this frequency over the noise's duration. */
  freqEnd?: number;
  q?: number;
  attack?: number;
};

const noiseBuffers = new WeakMap<AudioContextLike, AudioBuffer>();

/** Returns two seconds of white noise, generated once per context. */
function noiseBuffer(ctx: AudioContextLike): AudioBuffer {
  let buffer = noiseBuffers.get(ctx);
  if (!buffer) {
    buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    noiseBuffers.set(ctx, buffer);
  }
  return buffer;
}

/** Plays a burst of filtered white noise: explosions, cracks, breath, crowds. */
function noise(ctx: AudioContextLike, out: AudioNode, o: NoiseOptions): void {
  const end = o.start + o.duration;

  const source = ctx.createBufferSource();
  source.buffer = noiseBuffer(ctx);
  source.loop = true;

  const filter = ctx.createBiquadFilter();
  filter.type = o.filter;
  filter.frequency.setValueAtTime(o.freq, o.start);
  if (o.freqEnd !== undefined) {
    filter.frequency.exponentialRampToValueAtTime(o.freqEnd, end);
  }
  filter.Q.setValueAtTime(o.q ?? 1, o.start);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(SILENT, o.start);
  gain.gain.linearRampToValueAtTime(o.volume, o.start + (o.attack ?? 0.005));
  gain.gain.exponentialRampToValueAtTime(SILENT, end);

  source.connect(filter);
  filter.connect(gain);
  gain.connect(out);
  source.start(o.start);
  source.stop(end + 0.05);
}

/** Plays several notes at once. */
function chord(
  ctx: AudioContextLike,
  out: AudioNode,
  freqs: number[],
  o: Omit<ToneOptions, "freq">
): void {
  freqs.forEach((freq) => tone(ctx, out, { ...o, freq }));
}

/** A deep, booming thud, like a cannon or a bass drum. */
function boom(
  ctx: AudioContextLike,
  out: AudioNode,
  t: number,
  volume: number,
  duration: number
): void {
  noise(ctx, out, {
    start: t,
    duration,
    volume,
    filter: "lowpass",
    freq: 1500,
    freqEnd: 60,
  });
  tone(ctx, out, {
    freq: 140,
    freqEnd: 30,
    start: t,
    duration: duration * 0.8,
    volume,
  });
}

/** A church-bell-like toll, built from inharmonic partials. */
function bell(
  ctx: AudioContextLike,
  out: AudioNode,
  t: number,
  freq: number,
  volume: number
): void {
  [
    [1, 1],
    [2.76, 0.5],
    [5.4, 0.25],
    [8.93, 0.12],
  ].forEach(([ratio, level]) =>
    tone(ctx, out, {
      freq: freq * ratio,
      start: t,
      duration: 3.5 / ratio + 0.5,
      volume: volume * level,
      attack: 0.005,
    })
  );
}

// Note frequencies (Hz).
const C4 = 261.63;
const E4 = 329.63;
const G4 = 392.0;
const C5 = 523.25;
const E5 = 659.25;
const G5 = 783.99;
const C6 = 1046.5;

export const RECIPES: Record<SoundEffect, Recipe> = {
  [SoundEffect.PROMPT]: (ctx, out, t) => {
    // A friendly "ding-ding!"
    tone(ctx, out, { freq: 880, start: t, duration: 0.25, volume: 0.25 });
    tone(ctx, out, {
      freq: 1318.5,
      start: t + 0.12,
      duration: 0.4,
      volume: 0.25,
    });
  },

  [SoundEffect.ROLE_REVEAL]: (ctx, out, t) => {
    // A drumroll building up to a dramatic minor stinger.
    const hits = 16;
    for (let i = 0; i < hits; i++) {
      noise(ctx, out, {
        start: t + i * 0.06,
        duration: 0.08,
        volume: 0.08 + (0.25 * i) / hits,
        filter: "bandpass",
        freq: 900,
        q: 0.8,
      });
    }
    const hit = t + hits * 0.06;
    boom(ctx, out, hit, 0.6, 1.0);
    chord(ctx, out, [146.83, 174.61, 220.0, 293.66], {
      type: "sawtooth",
      start: hit,
      duration: 1.6,
      volume: 0.08,
      lowpass: 1400,
    });
  },

  [SoundEffect.VOTES_REVEALED]: (ctx, out, t) => {
    // Ballots being flipped over.
    [0, 0.09, 0.16, 0.27].forEach((offset) =>
      noise(ctx, out, {
        start: t + offset,
        duration: 0.07,
        volume: 0.3,
        filter: "bandpass",
        freq: 3000,
        q: 1.5,
      })
    );
  },

  [SoundEffect.VOTE_PASSED]: (ctx, out, t) => {
    // A short, triumphant "ta-daa!"
    tone(ctx, out, {
      type: "square",
      freq: G4,
      start: t,
      duration: 0.15,
      volume: 0.1,
      lowpass: 2500,
    });
    chord(ctx, out, [C5, E5, G5], {
      type: "square",
      start: t + 0.15,
      duration: 0.6,
      volume: 0.07,
      lowpass: 2500,
    });
  },

  [SoundEffect.VOTE_FAILED]: (ctx, out, t) => {
    // A game-show "wrong answer" buzzer.
    tone(ctx, out, {
      type: "sawtooth",
      freq: 155.56,
      start: t,
      duration: 0.25,
      volume: 0.15,
      lowpass: 1200,
    });
    tone(ctx, out, {
      type: "sawtooth",
      freq: 116.54,
      start: t + 0.25,
      duration: 0.6,
      volume: 0.15,
      lowpass: 1200,
    });
  },

  [SoundEffect.ELECTION_TRACKER]: (ctx, out, t) => {
    // The sad trombone: "wah wah wah waaaah".
    const notes = [293.66, 277.18, 261.63];
    notes.forEach((freq, i) =>
      tone(ctx, out, {
        type: "sawtooth",
        freq,
        start: t + i * 0.4,
        duration: 0.38,
        volume: 0.15,
        attack: 0.05,
        lowpass: 900,
      })
    );
    tone(ctx, out, {
      type: "sawtooth",
      freq: 246.94,
      freqEnd: 233.08,
      start: t + 1.2,
      duration: 1.3,
      volume: 0.15,
      attack: 0.05,
      vibrato: [5, 6],
      lowpass: 900,
    });
  },

  [SoundEffect.CHAOS]: (ctx, out, t) => {
    // An air-raid siren wailing over rumbling crowds.
    tone(ctx, out, {
      type: "sawtooth",
      freq: 700,
      start: t,
      duration: 2.5,
      volume: 0.12,
      attack: 0.3,
      vibrato: [1.5, 200],
      lowpass: 2000,
    });
    noise(ctx, out, {
      start: t,
      duration: 2.5,
      volume: 0.15,
      attack: 0.5,
      filter: "bandpass",
      freq: 500,
      q: 0.5,
    });
  },

  [SoundEffect.LIBERAL_POLICY]: (ctx, out, t) => {
    // A bright, hopeful chime.
    [C5, E5, G5, C6].forEach((freq, i) =>
      tone(ctx, out, {
        type: "triangle",
        freq,
        start: t + i * 0.09,
        duration: 1.2,
        volume: 0.18,
      })
    );
  },

  [SoundEffect.FASCIST_POLICY]: (ctx, out, t) => {
    // A dissonant, low brass stab with a thud.
    boom(ctx, out, t, 0.4, 0.8);
    chord(ctx, out, [73.42, 77.78, 110.0], {
      type: "sawtooth",
      start: t,
      duration: 1.8,
      volume: 0.12,
      attack: 0.02,
      lowpass: 700,
    });
  },

  [SoundEffect.VETO]: (ctx, out, t) => {
    // A record scratch: "wikka-wikka".
    [
      [t, 600, 3000],
      [t + 0.12, 3000, 400],
      [t + 0.26, 500, 2500],
    ].forEach(([start, from, to]) =>
      noise(ctx, out, {
        start,
        duration: 0.12,
        volume: 0.35,
        filter: "bandpass",
        freq: from,
        freqEnd: to,
        q: 4,
      })
    );
  },

  [SoundEffect.INVESTIGATION]: (ctx, out, t) => {
    // "Dun dun DUNNN!"
    const stab = { type: "sawtooth" as OscillatorType, lowpass: 1000 };
    chord(ctx, out, [196.0, 98.0], {
      ...stab,
      start: t,
      duration: 0.25,
      volume: 0.12,
    });
    chord(ctx, out, [185.0, 92.5], {
      ...stab,
      start: t + 0.3,
      duration: 0.25,
      volume: 0.12,
    });
    chord(ctx, out, [174.61, 87.31, 207.65], {
      ...stab,
      start: t + 0.6,
      duration: 1.8,
      volume: 0.12,
      vibrato: [5, 3],
    });
  },

  [SoundEffect.EXECUTION]: (ctx, out, t) => {
    // A loud BOOM, followed by a rolling rumble.
    noise(ctx, out, {
      start: t,
      duration: 0.06,
      volume: 0.9,
      filter: "highpass",
      freq: 1500,
    });
    boom(ctx, out, t, 1.0, 2.2);
    noise(ctx, out, {
      start: t,
      duration: 0.7,
      volume: 0.8,
      filter: "bandpass",
      freq: 500,
      freqEnd: 150,
      q: 0.7,
    });
    tone(ctx, out, {
      type: "square",
      freq: 90,
      freqEnd: 40,
      start: t,
      duration: 0.6,
      volume: 0.35,
      lowpass: 800,
    });
    noise(ctx, out, {
      start: t + 0.2,
      duration: 2.5,
      volume: 0.35,
      attack: 0.3,
      filter: "lowpass",
      freq: 200,
      freqEnd: 50,
    });
  },

  [SoundEffect.GUNSHOT]: (ctx, out, t) => {
    // A sharp crack that echoes around the room.
    [0, 0.25, 0.45].forEach((offset, i) => {
      const volume = 1.0 / (i * 2 + 1);
      noise(ctx, out, {
        start: t + offset,
        duration: 0.05,
        volume,
        filter: "highpass",
        freq: 1000,
      });
      noise(ctx, out, {
        start: t + offset,
        duration: 0.35,
        volume: volume * 0.6,
        filter: "lowpass",
        freq: 2500,
        freqEnd: 200,
      });
    });
    tone(ctx, out, {
      freq: 180,
      freqEnd: 45,
      start: t,
      duration: 0.3,
      volume: 0.7,
    });
  },

  [SoundEffect.HECKLE]: (ctx, out, t) => {
    // A cartoon ghost: "wooOOOooo".
    tone(ctx, out, {
      freq: 330,
      freqEnd: 520,
      start: t,
      duration: 0.6,
      volume: 0.12,
      attack: 0.2,
      vibrato: [6, 15],
    });
    tone(ctx, out, {
      freq: 520,
      freqEnd: 260,
      start: t + 0.55,
      duration: 0.9,
      volume: 0.12,
      attack: 0.1,
      vibrato: [6, 15],
    });
  },

  [SoundEffect.WHISPER]: (ctx, out, t) => {
    // A breathy, eerie "psst... shhhh".
    noise(ctx, out, {
      start: t,
      duration: 0.15,
      volume: 0.25,
      filter: "bandpass",
      freq: 5000,
      q: 2,
    });
    noise(ctx, out, {
      start: t + 0.25,
      duration: 1.2,
      volume: 0.2,
      attack: 0.3,
      filter: "bandpass",
      freq: 2500,
      freqEnd: 4500,
      q: 1.5,
    });
    tone(ctx, out, {
      freq: 880,
      freqEnd: 830,
      start: t + 0.2,
      duration: 1.4,
      volume: 0.03,
      attack: 0.4,
      vibrato: [4, 8],
    });
  },

  [SoundEffect.LIBERAL_VICTORY]: (ctx, out, t) => {
    // A trumpet fanfare, with a cheering, applauding crowd.
    const trumpet = {
      type: "square" as OscillatorType,
      volume: 0.08,
      lowpass: 3000,
    };
    [G4, G4, G4, C5].forEach((freq, i) =>
      tone(ctx, out, {
        ...trumpet,
        freq,
        start: t + i * 0.15,
        duration: 0.14,
      })
    );
    tone(ctx, out, { ...trumpet, freq: G4, start: t + 0.65, duration: 0.2 });
    chord(ctx, out, [C4, E4, G4, C5, E5], {
      ...trumpet,
      volume: 0.06,
      start: t + 0.9,
      duration: 2.2,
      vibrato: [5, 2],
    });
    tone(ctx, out, {
      type: "triangle",
      freq: C6,
      start: t + 0.9,
      duration: 2.0,
      volume: 0.1,
    });

    // The crowd roars...
    noise(ctx, out, {
      start: t + 0.8,
      duration: 3.5,
      volume: 0.18,
      attack: 0.6,
      filter: "bandpass",
      freq: 1200,
      q: 0.4,
    });
    // ...and applauds.
    for (let i = 0; i < 70; i++) {
      noise(ctx, out, {
        start: t + 0.9 + Math.random() * 3,
        duration: 0.03,
        volume: 0.15 + Math.random() * 0.15,
        filter: "bandpass",
        freq: 1500 + Math.random() * 1500,
        q: 1,
      });
    }
  },

  [SoundEffect.FASCIST_VICTORY]: (ctx, out, t) => {
    // Funeral bells tolling over a dark, swelling organ.
    chord(ctx, out, [65.41, 77.78, 98.0, 130.81], {
      type: "sawtooth",
      start: t,
      duration: 6.5,
      volume: 0.07,
      attack: 1.5,
      vibrato: [0.3, 1],
      lowpass: 600,
    });
    tone(ctx, out, {
      type: "sawtooth",
      freq: 92.5, // A tritone above C: the devil's interval.
      start: t + 3.2,
      duration: 3.3,
      volume: 0.06,
      attack: 1.0,
      lowpass: 500,
    });
    [0, 1.6, 3.2].forEach((offset) => bell(ctx, out, t + offset, 110, 0.3));
    boom(ctx, out, t + 4.8, 0.6, 2.0);
  },
};
