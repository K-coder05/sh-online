/**
 * A minimal stand-in for the Web Audio API's AudioContext, for tests. It
 * records how many sources were started instead of making any sound.
 */
class FakeParam {
  value = 0;
  setValueAtTime = jest.fn((value: number) => {
    this.value = value;
    return this;
  });
  linearRampToValueAtTime = jest.fn(() => this);
  exponentialRampToValueAtTime = jest.fn((value: number) => {
    if (value <= 0) {
      // Mirrors the real API, which rejects non-positive targets.
      throw new RangeError("exponential ramp target must be positive");
    }
    return this;
  });
  setTargetAtTime = jest.fn(() => this);
}

class FakeNode {
  connect = jest.fn((destination: unknown) => destination);
  disconnect = jest.fn();
}

export class FakeAudioContext {
  state: AudioContextState = "running";
  currentTime = 0;
  sampleRate = 8000;
  destination: any = new FakeNode();
  startedSources = 0;
  resume = jest.fn(() => Promise.resolve());

  private source() {
    const node = Object.assign(new FakeNode(), {
      start: jest.fn(() => {
        this.startedSources++;
      }),
      stop: jest.fn(),
    });
    return node;
  }

  createOscillator(): any {
    return Object.assign(this.source(), {
      type: "sine",
      frequency: new FakeParam(),
      detune: new FakeParam(),
    });
  }

  createBufferSource(): any {
    return Object.assign(this.source(), {
      buffer: null,
      loop: false,
      playbackRate: new FakeParam(),
    });
  }

  createGain(): any {
    return Object.assign(new FakeNode(), { gain: new FakeParam() });
  }

  createBiquadFilter(): any {
    return Object.assign(new FakeNode(), {
      type: "lowpass",
      frequency: new FakeParam(),
      Q: new FakeParam(),
    });
  }

  createDynamicsCompressor(): any {
    return Object.assign(new FakeNode(), {
      threshold: new FakeParam(),
      knee: new FakeParam(),
      ratio: new FakeParam(),
    });
  }

  createBuffer(channels: number, length: number, sampleRate: number): any {
    const data = new Float32Array(length);
    return {
      length,
      sampleRate,
      numberOfChannels: channels,
      getChannelData: () => data,
    };
  }
}
