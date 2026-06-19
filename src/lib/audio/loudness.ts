export interface LoudnessResult {
  rms: number; // linear
  peakDb: number;
  lufs: number; // ungated approximation
}

export function computeLoudness(buffer: AudioBuffer): LoudnessResult {
  let sumSquares = 0;
  let peak = 0;
  let count = 0;

  for (let c = 0; c < buffer.numberOfChannels; c++) {
    const data = buffer.getChannelData(c);
    for (let i = 0; i < data.length; i++) {
      const v = data[i];
      sumSquares += v * v;
      const abs = Math.abs(v);
      if (abs > peak) peak = abs;
      count++;
    }
  }

  const meanSquare = count > 0 ? sumSquares / count : 0;
  const rms = Math.sqrt(meanSquare);
  const peakDb = peak > 0 ? 20 * Math.log10(peak) : -Infinity;
  // Ungated, no K-weighting — a rough LUFS estimate.
  const lufs = meanSquare > 0 ? -0.691 + 10 * Math.log10(meanSquare) : -Infinity;

  return { rms, peakDb, lufs };
}

/** Gain multiplier needed to move `currentLufs` to `targetLufs`. */
export function gainForTarget(currentLufs: number, targetLufs: number): number {
  if (!isFinite(currentLufs)) return 1;
  return Math.pow(10, (targetLufs - currentLufs) / 20);
}