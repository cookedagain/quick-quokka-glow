export interface BandSpec {
  type: BiquadFilterType;
  freq: number;
  gain: number;
  q?: number;
}

export interface DeviceProfile {
  id: string;
  name: string;
  blurb: string;
  bands: BandSpec[];
}

export const DEVICE_PROFILES: DeviceProfile[] = [
  {
    id: "flat",
    name: "Studio Flat",
    blurb: "No coloration — reference monitoring",
    bands: [],
  },
  {
    id: "subtest",
    name: "Sub Test",
    blurb: "Heavy low-end to stress-test a subwoofer",
    bands: [
      { type: "lowshelf", freq: 90, gain: 10 },
      { type: "peaking", freq: 40, gain: 6, q: 1 },
      { type: "peaking", freq: 60, gain: 4, q: 1.2 },
    ],
  },
  {
    id: "z906",
    name: "Logitech Z906",
    blurb: "5.1 THX system with a punchy subwoofer",
    bands: [
      { type: "lowshelf", freq: 95, gain: 5 },
      { type: "peaking", freq: 45, gain: 3, q: 1.1 },
      { type: "peaking", freq: 500, gain: -1, q: 1 },
      { type: "highshelf", freq: 11000, gain: 2 },
    ],
  },
  {
    id: "sc9s",
    name: "LG SC9S",
    blurb: "Mid-forward soundbar, IMAX-tuned dialog",
    bands: [
      { type: "lowshelf", freq: 100, gain: 2 },
      { type: "peaking", freq: 1500, gain: 2, q: 0.9 },
      { type: "peaking", freq: 350, gain: -1, q: 1.2 },
      { type: "highshelf", freq: 10000, gain: 1 },
    ],
  },
  {
    id: "pixelbuds",
    name: "Pixel Buds Pro 2",
    blurb: "Earbuds with a consumer V-shaped tuning",
    bands: [
      { type: "lowshelf", freq: 110, gain: 4 },
      { type: "peaking", freq: 3000, gain: -1.5, q: 1 },
      { type: "highshelf", freq: 8000, gain: 3 },
    ],
  },
];

export function getDeviceProfile(id: string): DeviceProfile {
  return DEVICE_PROFILES.find((d) => d.id === id) ?? DEVICE_PROFILES[0];
}

export function applyDeviceChain(
  ctx: BaseAudioContext,
  input: AudioNode,
  bands: BandSpec[],
): AudioNode {
  let node = input;
  bands.forEach((b) => {
    const f = ctx.createBiquadFilter();
    f.type = b.type;
    f.frequency.value = b.freq;
    f.gain.value = b.gain;
    if (b.q !== undefined) f.Q.value = b.q;
    node.connect(f);
    node = f;
  });
  return node;
}