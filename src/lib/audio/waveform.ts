export interface Peak {
  min: number;
  max: number;
}

export function computePeaks(
  channel: Float32Array,
  startSample: number,
  endSample: number,
  width: number,
): Peak[] {
  const peaks: Peak[] = [];
  const total = Math.max(1, endSample - startSample);
  const samplesPerPixel = total / width;

  for (let x = 0; x < width; x++) {
    const s0 = Math.floor(startSample + x * samplesPerPixel);
    const s1 = Math.floor(startSample + (x + 1) * samplesPerPixel);
    let min = 1;
    let max = -1;
    let counted = false;
    for (let i = s0; i < s1; i++) {
      const v = channel[i] ?? 0;
      if (v < min) min = v;
      if (v > max) max = v;
      counted = true;
    }
    if (!counted) {
      min = 0;
      max = 0;
    }
    peaks.push({ min, max });
  }
  return peaks;
}