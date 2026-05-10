// Audia — Web Audio Engine
// Gera binaural beats, ruídos e tons terapêuticos via Web Audio API

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.outputNode = null;
    this.eqFilters = null;
    this.activeNodes = [];
    this.isPlaying = false;
    this.timerInterval = null;
    this.timerCallback = null;
    this._onTick = null;
    this.elapsedSeconds = 0;
    this.totalSeconds = 0;
    this.currentVolume = 0.7;
    this.currentEqPreset = 'balanced';
    this.fadeTime = 2.5; // segundos de fade in/out
  }

  // Inicializa o contexto de áudio (deve ser chamado por gesto do usuário)
  init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.outputNode = this.ctx.createGain();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this.currentVolume;

    const low = this.ctx.createBiquadFilter();
    const mid = this.ctx.createBiquadFilter();
    const high = this.ctx.createBiquadFilter();

    low.type = 'lowshelf';
    low.frequency.value = 180;
    mid.type = 'peaking';
    mid.frequency.value = 1000;
    mid.Q.value = 0.9;
    high.type = 'highshelf';
    high.frequency.value = 4200;

    this.eqFilters = { low, mid, high };
    this.outputNode.connect(low);
    low.connect(mid);
    mid.connect(high);
    high.connect(this.masterGain);
    this.masterGain.connect(this.ctx.destination);
    this.setEqPreset(this.currentEqPreset);
  }

  getOutputNode() {
    return this.outputNode || this.masterGain;
  }

  getEqPresets() {
    return [
      { id: 'balanced', label: 'Equilibrado', hint: 'Som natural', low: 0, mid: 0, high: 0 },
      { id: 'deep-sleep', label: 'Sono profundo', hint: 'Graves macios', low: 4, mid: -2, high: -4 },
      { id: 'focus-clear', label: 'Foco claro', hint: 'Médios precisos', low: -2, mid: 3, high: 2 },
      { id: 'warm-bass', label: 'Grave quente', hint: 'Mais corpo', low: 5, mid: 0, high: -1 },
      { id: 'soft-air', label: 'Ar suave', hint: 'Menos peso', low: -3, mid: 0, high: 4 },
      { id: 'noise-smooth', label: 'Ruído suave', hint: 'Menos aspereza', low: 2, mid: -1, high: -5 },
    ];
  }

  setEqPreset(presetId = 'balanced') {
    this.currentEqPreset = presetId;
    if (!this.eqFilters || !this.ctx) return;

    const preset = this.getEqPresets().find(item => item.id === presetId) || this.getEqPresets()[0];
    const now = this.ctx.currentTime;
    this.eqFilters.low.gain.linearRampToValueAtTime(preset.low, now + 0.12);
    this.eqFilters.mid.gain.linearRampToValueAtTime(preset.mid, now + 0.12);
    this.eqFilters.high.gain.linearRampToValueAtTime(preset.high, now + 0.12);
  }

  // ── BINAURAL BEATS ──────────────────────────────────────────────────────
  // Cria dois osciladores com frequências ligeiramente diferentes, pan L/R
  createBinaural(baseFreq, beatFreq, gain) {
    const merger = this.ctx.createChannelMerger(2);

    const leftOsc = this.ctx.createOscillator();
    const rightOsc = this.ctx.createOscillator();
    const leftGain = this.ctx.createGain();
    const rightGain = this.ctx.createGain();
    const leftSplitter = this.ctx.createChannelSplitter(1);
    const rightSplitter = this.ctx.createChannelSplitter(1);

    leftOsc.frequency.value = baseFreq;
    rightOsc.frequency.value = baseFreq + beatFreq;
    leftOsc.type = 'sine';
    rightOsc.type = 'sine';

    leftGain.gain.value = gain;
    rightGain.gain.value = gain;

    leftOsc.connect(leftGain);
    rightOsc.connect(rightGain);

    // Canal esquerdo → merger input 0, canal direito → merger input 1
    leftGain.connect(merger, 0, 0);
    rightGain.connect(merger, 0, 1);

    const binauralGain = this.ctx.createGain();
    binauralGain.gain.value = 0;
    merger.connect(binauralGain);
    binauralGain.connect(this.getOutputNode());

    leftOsc.start();
    rightOsc.start();

    // Fade in suave
    binauralGain.gain.linearRampToValueAtTime(1, this.ctx.currentTime + this.fadeTime);

    return { leftOsc, rightOsc, binauralGain, type: 'binaural' };
  }

  // ── NOISE GENERATORS ────────────────────────────────────────────────────
  createWhiteNoise(gain) {
    const bufferSize = this.ctx.sampleRate * 4;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return this._createNoiseSource(buffer, gain, null);
  }

  createPinkNoise(gain) {
    const bufferSize = this.ctx.sampleRate * 4;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886*b0 + white*0.0555179;
      b1 = 0.99332*b1 + white*0.0750759;
      b2 = 0.96900*b2 + white*0.1538520;
      b3 = 0.86650*b3 + white*0.3104856;
      b4 = 0.55000*b4 + white*0.5329522;
      b5 = -0.7616*b5 - white*0.0168980;
      data[i] = (b0+b1+b2+b3+b4+b5+b6 + white*0.5362) * 0.11;
      b6 = white * 0.115926;
    }
    return this._createNoiseSource(buffer, gain, null);
  }

  createBrownNoise(gain) {
    const bufferSize = this.ctx.sampleRate * 4;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (last + (0.02 * white)) / 1.02;
      last = data[i];
      data[i] *= 3.5;
    }
    return this._createNoiseSource(buffer, gain, null);
  }

  _createNoiseSource(buffer, gain, filter) {
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.value = 0;

    if (filter) {
      source.connect(filter);
      filter.connect(noiseGain);
    } else {
      source.connect(noiseGain);
    }

    noiseGain.connect(this.getOutputNode());
    source.start();

    noiseGain.gain.linearRampToValueAtTime(gain, this.ctx.currentTime + this.fadeTime);

    return { source, noiseGain, type: 'noise' };
  }

  // ── AMBIENT LAYERS (rain, ocean, forest) ───────────────────────────────
  createAmbient(type, gain) {
    const base = this.createPinkNoise(gain);
    const filter = this.ctx.createBiquadFilter();
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();

    filter.type = type === 'rain' ? 'highpass' : 'lowpass';
    filter.frequency.value = type === 'rain' ? 900 : type === 'forest' ? 1800 : 520;
    filter.Q.value = type === 'ocean' ? 0.7 : 0.35;

    try {
      base.source.disconnect();
      base.source.connect(filter);
      filter.connect(base.noiseGain);
    } catch (_) {}

    lfo.type = 'sine';
    lfo.frequency.value = type === 'ocean' ? 0.08 : type === 'forest' ? 0.22 : 0.45;
    lfoGain.gain.value = type === 'ocean' ? gain * 0.55 : gain * 0.18;
    lfo.connect(lfoGain);
    lfoGain.connect(base.noiseGain.gain);
    lfo.start();

    if (type === 'forest') {
      const chirp = this.createTone(1760, 0.006);
      const chirpLfo = this.ctx.createOscillator();
      const chirpLfoGain = this.ctx.createGain();
      chirpLfo.frequency.value = 0.12;
      chirpLfoGain.gain.value = 520;
      chirpLfo.connect(chirpLfoGain);
      chirpLfoGain.connect(chirp.osc.frequency);
      chirpLfo.start();
      return { ...base, filter, lfo, chirp, chirpLfo, type: 'ambient' };
    }

    return { ...base, filter, lfo, type: 'ambient' };
  }

  // ── TONE GENERATOR (432Hz, 528Hz etc.) ──────────────────────────────────
  createTone(frequency, gain) {
    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.frequency.value = frequency;
    osc.type = 'sine';
    filter.type = 'lowpass';
    filter.frequency.value = frequency * 3;

    gainNode.gain.value = 0;

    osc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.getOutputNode());
    osc.start();

    gainNode.gain.linearRampToValueAtTime(gain, this.ctx.currentTime + this.fadeTime);

    return { osc, gainNode, filter, type: 'tone' };
  }

  // ── PLAY SESSION ─────────────────────────────────────────────────────────
  async play(config, durationMinutes, onTick, onEnd) {
    if (this.isPlaying) await this.stop(false);
    this.init();

    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    this.activeNodes = [];

    // Binaural beats
    if (config.binaural) {
      const node = this.createBinaural(
        config.binaural.base,
        config.binaural.beat,
        config.binauralGain || 0.15,
      );
      this.activeNodes.push(node);
    }

    if (config.secondaryBinaural) {
      const node = this.createBinaural(
        config.secondaryBinaural.base,
        config.secondaryBinaural.beat,
        config.secondaryGain || 0.08,
      );
      this.activeNodes.push(node);
    }

    // Ruído
    if (config.noise && config.noiseGain > 0) {
      let noiseNode;
      switch (config.noise) {
        case 'white':  noiseNode = this.createWhiteNoise(config.noiseGain); break;
        case 'pink':   noiseNode = this.createPinkNoise(config.noiseGain);  break;
        case 'brown':  noiseNode = this.createBrownNoise(config.noiseGain); break;
      }
      if (noiseNode) this.activeNodes.push(noiseNode);
    }

    if (config.ambient && config.ambientGain > 0) {
      this.activeNodes.push(this.createAmbient(config.ambient, config.ambientGain));
    }

    // Tom puro (432Hz, 528Hz etc.)
    if (config.tone && config.toneGain > 0) {
      const toneNode = this.createTone(config.tone, config.toneGain);
      this.activeNodes.push(toneNode);
    }

    this.isPlaying = true;
    this.elapsedSeconds = 0;
    this.totalSeconds = durationMinutes * 60;
    this.timerCallback = onEnd;
    this._onTick = onTick;

    // Timer tick a cada segundo
    this.timerInterval = setInterval(() => {
      this.elapsedSeconds++;
      if (onTick) onTick(this.elapsedSeconds, this.totalSeconds);

      if (this.elapsedSeconds >= this.totalSeconds) {
        this.stop(true);
      }
    }, 1000);
  }

  // ── STOP ──────────────────────────────────────────────────────────────────
  stop(callEndCallback = true) {
    return new Promise((resolve) => {
      if (!this.isPlaying) { resolve(); return; }

      clearInterval(this.timerInterval);
      this.timerInterval = null;
      const endCallback = this.timerCallback;

      const now = this.ctx.currentTime;
      const fade = this.fadeTime;

      // Fade out todos os nós
      this.activeNodes.forEach((node) => {
        if (node.type === 'binaural') {
          node.binauralGain.gain.linearRampToValueAtTime(0, now + fade);
          setTimeout(() => {
            try { node.leftOsc.stop(); node.rightOsc.stop(); } catch(_) {}
          }, (fade + 0.1) * 1000);
        } else if (node.type === 'noise' || node.type === 'ambient') {
          node.noiseGain.gain.linearRampToValueAtTime(0, now + fade);
          setTimeout(() => {
            try { node.source.stop(); } catch(_) {}
            try { node.lfo?.stop(); } catch(_) {}
            try { node.chirp?.osc?.stop(); } catch(_) {}
            try { node.chirpLfo?.stop(); } catch(_) {}
          }, (fade + 0.1) * 1000);
        } else if (node.type === 'tone') {
          node.gainNode.gain.linearRampToValueAtTime(0, now + fade);
          setTimeout(() => {
            try { node.osc.stop(); } catch(_) {}
          }, (fade + 0.1) * 1000);
        }
      });

      this.isPlaying = false;
      this.activeNodes = [];
      this.timerCallback = null;
      this._onTick = null;

      setTimeout(() => {
        if (callEndCallback && endCallback) endCallback();
        resolve();
      }, fade * 1000);
    });
  }

  // ── VOLUME ────────────────────────────────────────────────────────────────
  setVolume(value) {
    this.currentVolume = Math.max(0, Math.min(1, value));
    if (this.masterGain) {
      this.masterGain.gain.linearRampToValueAtTime(
        this.currentVolume,
        this.ctx.currentTime + 0.1,
      );
    }
  }

  // ── PAUSE / RESUME ────────────────────────────────────────────────────────
  async pause() {
    if (this.ctx && this.ctx.state === 'running') {
      await this.ctx.suspend();
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  async resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
      if (!this.isPlaying || this.timerInterval) return;
      this.timerInterval = setInterval(() => {
        this.elapsedSeconds++;
        if (this._onTick) this._onTick(this.elapsedSeconds, this.totalSeconds);
        if (this.elapsedSeconds >= this.totalSeconds) this.stop(true);
      }, 1000);
    }
  }

  getProgress() {
    if (this.totalSeconds === 0) return 0;
    return this.elapsedSeconds / this.totalSeconds;
  }

  formatTime(seconds) {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }
}

// Singleton
const audioEngine = new AudioEngine();
