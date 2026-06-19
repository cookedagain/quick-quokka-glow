import type { RebassSettings } from "./types";

export interface RebassPreset {
  id: string;
  name: string;
  emoji: string;
  settings: Partial<RebassSettings>;
}

export const BUILTIN_PRESETS: RebassPreset[] = [
  {
    id: "slowed-reverb",
    name: "Slowed + Reverb",
    emoji: "🌙",
    settings: {
      speed: 0.82,
      lockPitchToSpeed: true,
      reverbMix: 0.4,
      reverbRoomSize: 3,
      bassBoost: 5,
      echoMix: 0,
    },
  },
  {
    id: "nightcore",
    name: "Nightcore",
    emoji: "⚡",
    settings: {
      speed: 1.3,
      lockPitchToSpeed: false,
      pitch: 0,
      reverbMix: 0.1,
      bassBoost: 2,
    },
  },
  {
    id: "vaporwave",
    name: "Vaporwave",
    emoji: "🌸",
    settings: {
      speed: 0.7,
      lockPitchToSpeed: true,
      reverbMix: 0.5,
      reverbRoomSize: 4,
      echoMix: 0.18,
      echoTime: 0.36,
      bassBoost: 6,
    },
  },
  {
    id: "bass-boosted",
    name: "Bass Boosted",
    emoji: "🔊",
    settings: {
      speed: 1,
      lockPitchToSpeed: true,
      bassBoost: 12,
      eq: [10, 9, 6, 2, 0, 0, 0, 0, 1, 2],
      reverbMix: 0.1,
    },
  },
  {
    id: "8d",
    name: "8D Audio",
    emoji: "🌀",
    settings: {
      speed: 0.95,
      panDepth: 0.9,
      panRate: 0.18,
      reverbMix: 0.35,
      reverbRoomSize: 3,
    },
  },
  {
    id: "lofi",
    name: "Lo-Fi",
    emoji: "📻",
    settings: {
      speed: 0.9,
      lockPitchToSpeed: true,
      bassBoost: 4,
      eq: [2, 2, 1, 0, -1, -2, -4, -6, -9, -12],
      reverbMix: 0.2,
      echoMix: 0.08,
    },
  },
];