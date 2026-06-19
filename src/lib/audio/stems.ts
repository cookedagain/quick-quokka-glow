import type { StemMode } from "./types";

/**
 * Builds a lightweight DSP "stem" stage. This is NOT AI separation — it uses
 * mid/side and filtering tricks that work well on many stereo mixes:
 *  - karaoke: side signal (L-R) cancels center-panned vocals
 *  - vocals:  mid signal (L+R) band-passed to the vocal range
 *  - bass:    aggressive low-pass
 *  - drums:   high-pass to emphasise transients/cymbals
 */
export function buildStemStage(
  ctx: BaseAudioContext,
  source: AudioNode,
  mode: StemMode,
): AudioNode {
  if (mode === "full") return source;

  if (mode === "bass") {
    const lp1 = ctx.createBiquadFilter();
    lp1.type = "lowpass";
    lp1.frequency.value = 180;
    lp1.Q.value = 0.7;
    const lp2 = ctx.createBiquadFilter();
    lp2.type = "lowpass";
    lp2.frequency.value = 180;
    source.connect(lp1);
    lp1.connect(lp2);
    return lp2;
  }

  if (mode === "drums") {
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 1600;
    const peak = ctx.createBiquadFilter();
    peak.type = "peaking";
    peak.frequency.value = 5000;
    peak.gain.value = 3;
    peak.Q.value = 1;
    source.connect(hp);
    hp.connect(peak);
    return peak;
  }

  if (mode === "karaoke") {
    const splitter = ctx.createChannelSplitter(2);
    source.connect(splitter);
    const lGain = ctx.createGain();
    lGain.gain.value = 1;
    const rGain = ctx.createGain();
    rGain.gain.value = -1;
    splitter.connect(lGain, 0);
    splitter.connect(rGain, 1);
    const side = ctx.createGain();
    side.gain.value = 1;
    lGain.connect(side);
    rGain.connect(side);
    return side;
  }

  if (mode === "vocals") {
    const splitter = ctx.createChannelSplitter(2);
    source.connect(splitter);
    const lGain = ctx.createGain();
    lGain.gain.value = 0.5;
    const rGain = ctx.createGain();
    rGain.gain.value = 0.5;
    splitter.connect(lGain, 0);
    splitter.connect(rGain, 1);
    const mid = ctx.createGain();
    lGain.connect(mid);
    rGain.connect(mid);
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 250;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 4000;
    mid.connect(hp);
    hp.connect(lp);
    return lp;
  }

  return source;
}