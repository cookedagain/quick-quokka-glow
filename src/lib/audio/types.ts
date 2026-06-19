export const EQ_FREQUENCIES = [
  31, 62, 125, 250, 500, 1000, 2000, 4000, 8000, 16000,
] as const;

export interface RebassSettings {
  speed: number; // 0.5 - 1.5
  pitch: number; // semitones -12..12
  lockPitchToSpeed: boolean;
  eq: number[]; // dB per band, length = EQ_FREQUENCIES.length
  bassBoost: number; // dB
  reverbMix: number; // 0..1
  reverbRoomSize: number; // seconds (0.2..5)
  echoMix: number; // 0..1
  echoTime: number; // seconds
  echoFeedback: number; // 0..0.9
  panRate: number; // Hz (8D auto-pan)
  panDepth: number; // 0..1
  stereoPan: number; // -1..1
  gain: number; // 0..2
  fadeIn: number; // seconds
  fadeOut: number; // seconds
}

export const DEFAULT_SETTINGS: RebassSettings = {
  speed: 0.85,
  pitch: 0,
  lockPitchToSpeed: true,
  eq: EQ_FREQUENCIES.map(() => 0),
  bassBoost: 4,
  reverbMix: 0.25,
  reverbRoomSize: 2.4,
  echoMix: 0,
  echoTime: 0.28,
  echoFeedback: 0.3,
  panRate: 0.2,
  panDepth: 0,
  stereoPan: 0,
  gain: 1,
  fadeIn: 0.4,
  fadeOut: 0.8,
};

export const EQ_PRESETS: Record<string, number[]> = {
  Flat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  "Bass Boost": [9, 8, 6, 3, 1, 0, 0, 0, 0, 0],
  Vocal: [-3, -2, 0, 2, 4, 4, 3, 2, 0, -1],
  Bright: [0, 0, 0, 0, 0, 1, 2, 4, 6, 8],
};