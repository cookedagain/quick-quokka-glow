import { RebassSettings, EQ_FREQUENCIES } from "./types";
import { createImpulseResponse } from "./reverb";
import { buildStemStage } from "./stems";
import { applyDeviceChain, getDeviceProfile } from "./devices";

export interface RenderOptions {
  cropStart: number;
  cropEnd: number;
  loop: boolean;
  applyFades: boolean;
  startTime: number;
}

export interface GraphHandles {
  source: AudioBufferSourceNode;
  oscillators: OscillatorNode[];
}

export function buildGraph(
  ctx: BaseAudioContext,
  buffer: AudioBuffer,
  s: RebassSettings,
  opts: RenderOptions,
): GraphHandles {
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.playbackRate.value = s.speed;
  source.detune.value = s.lockPitchToSpeed ? 0 : s.pitch * 100;

  if (opts.loop) {
    source.loop = true;
    source.loopStart = opts.cropStart;
    source.loopEnd = opts.cropEnd;
  }

  // Stem separation stage (runs before EQ / effects)
  let node: AudioNode = buildStemStage(ctx, source, s.stemMode);

  // Full-range graphic EQ
  EQ_FREQUENCIES.forEach((freq, i) => {
    const f = ctx.createBiquadFilter();
    f.type = "peaking";
    f.frequency.value = freq;
    f.Q.value = 1.1;
    f.gain.value = s.eq[i] ?? 0;
    node.connect(f);
    node = f;
  });

  // Bass boost
  const bass = ctx.createBiquadFilter();
  bass.type = "lowshelf";
  bass.frequency.value = 120;
  bass.gain.value = s.bassBoost;
  node.connect(bass);
  node = bass;

  const mixBus = ctx.createGain();

  // Dry path
  const dry = ctx.createGain();
  dry.gain.value = 1;
  node.connect(dry);
  dry.connect(mixBus);

  // Reverb send
  if (s.reverbMix > 0) {
    const conv = ctx.createConvolver();
    conv.buffer = createImpulseResponse(ctx, s.reverbRoomSize, 3);
    const wet = ctx.createGain();
    wet.gain.value = s.reverbMix;
    node.connect(conv);
    conv.connect(wet);
    wet.connect(mixBus);
  }

  // Echo / delay send
  if (s.echoMix > 0) {
    const delay = ctx.createDelay(5);
    delay.delayTime.value = s.echoTime;
    const fb = ctx.createGain();
    fb.gain.value = Math.min(0.9, s.echoFeedback);
    delay.connect(fb);
    fb.connect(delay);
    const echoGain = ctx.createGain();
    echoGain.gain.value = s.echoMix;
    node.connect(delay);
    delay.connect(echoGain);
    echoGain.connect(mixBus);
  }

  // Device / speaker voicing (colors the whole mix like the target playback gear)
  const profile = getDeviceProfile(s.deviceProfile);
  const deviceOut = applyDeviceChain(ctx, mixBus, profile.bands);

  // Stereo / 8D panner
  const panner = ctx.createStereoPanner();
  panner.pan.value = Math.max(-1, Math.min(1, s.stereoPan));
  deviceOut.connect(panner);

  const oscillators: OscillatorNode[] = [];
  if (s.panDepth > 0 && s.panRate > 0) {
    const lfo = ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = s.panRate;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = Math.min(1, s.panDepth);
    lfo.connect(lfoGain);
    lfoGain.connect(panner.pan);
    oscillators.push(lfo);
  }

  // Master gain with fades
  const master = ctx.createGain();
  const g = master.gain;
  const t0 = opts.startTime;
  const realDur = (opts.cropEnd - opts.cropStart) / s.speed;

  if (opts.applyFades && s.fadeIn > 0) {
    g.setValueAtTime(0.0001, t0);
    g.linearRampToValueAtTime(s.gain, t0 + Math.min(s.fadeIn, realDur));
  } else {
    g.setValueAtTime(s.gain, t0);
  }
  if (opts.applyFades && s.fadeOut > 0) {
    const foStart = t0 + Math.max(0, realDur - s.fadeOut);
    g.setValueAtTime(s.gain, foStart);
    g.linearRampToValueAtTime(0.0001, t0 + realDur);
  }

  panner.connect(master);
  master.connect(ctx.destination);

  return { source, oscillators };
}