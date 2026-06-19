export async function decodeFile(file: File): Promise<AudioBuffer> {
  const arrayBuffer = await file.arrayBuffer();
  const Ctx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext })
      .webkitAudioContext;
  const ctx = new Ctx();
  try {
    return await ctx.decodeAudioData(arrayBuffer.slice(0));
  } finally {
    ctx.close();
  }
}