'use client';

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Synthesizes realistic mechanical switch acoustic profiles ("linear" thock, "tactile" magnetic, "clicky" mouse switch)
 * using zero-weight Web Audio API DSP.
 */
export function playSwitchSound(type: 'linear' | 'tactile' | 'clicky' = 'linear', pitchVariation = 0) {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const detune = (Math.random() - 0.5) * 35 + pitchVariation;

  // Create short noise burst for keycap impact texture
  const bufferSize = ctx.sampleRate * 0.045;
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const output = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.008));
  }

  const whiteNoise = ctx.createBufferSource();
  whiteNoise.buffer = noiseBuffer;

  const filter = ctx.createBiquadFilter();
  const noiseGain = ctx.createGain();

  if (type === 'linear') {
    // Deep "Thocky / Creamy" Gasket sound (Aula F75 style)
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(340 + detune, now);
    filter.Q.setValueAtTime(3.2, now);

    noiseGain.gain.setValueAtTime(0.65, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.042);

    // Sub-thock body resonance
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(165 + detune * 0.5, now);
    osc.frequency.exponentialRampToValueAtTime(62, now + 0.045);

    oscGain.gain.setValueAtTime(0.55, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.048);

    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.05);
  } else if (type === 'tactile') {
    // Crisp Hall-Effect Magnetic Rapid Trigger clack
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(780 + detune, now);
    filter.Q.setValueAtTime(2.5, now);

    noiseGain.gain.setValueAtTime(0.5, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.032);

    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(290 + detune, now);
    osc.frequency.exponentialRampToValueAtTime(95, now + 0.03);

    oscGain.gain.setValueAtTime(0.4, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.038);
  } else {
    // Sharp micro-switch click (Kailh GM 8.0 / LIGHTFORCE Optical Mouse Switch)
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1600 + detune * 2, now);

    noiseGain.gain.setValueAtTime(0.55, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.005, now + 0.018);

    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(1200 + detune, now);
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.014);

    oscGain.gain.setValueAtTime(0.22, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.016);

    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.018);
  }

  whiteNoise.connect(filter);
  filter.connect(noiseGain);
  noiseGain.connect(ctx.destination);
  whiteNoise.start(now);
}
