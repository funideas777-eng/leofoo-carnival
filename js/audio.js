// ============================================================
// Web Audio 音效引擎 + 震動回饋
// ============================================================

const AudioEngine = {
  ctx: null,
  enabled: true,
  vibrationEnabled: true,

  init() {
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.warn('Web Audio API 不支援', e);
      this.enabled = false;
    }
  },

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  },

  // === 基礎音效合成 ===
  playTone(freq, duration, type = 'sine', gain = 0.1) {
    if (!this.enabled || !this.ctx) return;
    this.resume();
    const osc = this.ctx.createOscillator();
    const vol = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    vol.gain.value = gain;
    vol.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    osc.connect(vol);
    vol.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  },

  playSweep(freqStart, freqEnd, duration, type = 'sine', gain = 0.1) {
    if (!this.enabled || !this.ctx) return;
    this.resume();
    const osc = this.ctx.createOscillator();
    const vol = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freqStart;
    osc.frequency.linearRampToValueAtTime(freqEnd, this.ctx.currentTime + duration);
    vol.gain.value = gain;
    vol.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    osc.connect(vol);
    vol.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  },

  playNoise(duration, gain = 0.05) {
    if (!this.enabled || !this.ctx) return;
    this.resume();
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const source = this.ctx.createBufferSource();
    const vol = this.ctx.createGain();
    source.buffer = buffer;
    vol.gain.value = gain;
    vol.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    source.connect(vol);
    vol.connect(this.ctx.destination);
    source.start();
  },

  playSequence(notes, interval) {
    notes.forEach((note, i) => {
      setTimeout(() => {
        this.playTone(note.freq, note.dur || 0.12, note.type || 'sine', note.gain || 0.15);
      }, i * interval * 1000);
    });
  },

  vibrate(pattern) {
    if (this.vibrationEnabled && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  },

  // === UI 音效 ===
  tapButton() {
    this.playTone(800, 0.05, 'sine', 0.1);
    this.vibrate(10);
  },

  pageTransition() {
    this.playSweep(400, 600, 0.15, 'triangle', 0.08);
  },

  error() {
    this.playTone(200, 0.2, 'sawtooth', 0.08);
    this.vibrate(40);
  },

  // === GPS 音效 ===
  enterZone() {
    this.playSequence([
      { freq: 523 }, { freq: 784 }, { freq: 1047 }
    ], 0.1);
    this.vibrate([30, 20, 30]);
  },

  unlockGame() {
    this.playSequence([
      { freq: 523 }, { freq: 659 }, { freq: 784 }, { freq: 1047 }
    ], 0.12);
    this.vibrate([50, 30, 80]);
  },

  // === 通知音效 ===
  broadcastAlert() {
    this.playSequence([
      { freq: 880, dur: 0.08 }, { freq: 1320, dur: 0.08 }
    ], 0.18);
    setTimeout(() => {
      this.playSequence([
        { freq: 880, dur: 0.08 }, { freq: 1320, dur: 0.08 }
      ], 0.18);
    }, 400);
    this.vibrate([200, 100, 200]);
  },

  // === 遊戲共用音效 ===
  countdown() { this.playTone(440, 0.15, 'sine', 0.15); },
  countdownGo() { this.playTone(880, 0.3, 'sine', 0.2); },

  gameStart() {
    this.playSequence([
      { freq: 523 }, { freq: 659 }, { freq: 784 }, { freq: 1047, dur: 0.2 }
    ], 0.1);
  },

  gameEnd() {
    this.playSequence([
      { freq: 784 }, { freq: 659 }, { freq: 523 }, { freq: 392, dur: 0.3 }
    ], 0.15);
    this.vibrate([50, 30, 50, 30, 100]);
  },

  scoreUp() { this.playTone(1000, 0.05, 'sine', 0.1); },

  comboHit(n) {
    this.playTone(600 + n * 20, 0.08, 'sine', 0.12);
    this.vibrate(10);
  },

  comboBroken() {
    this.playTone(200, 0.15, 'sawtooth', 0.08);
    this.vibrate(60);
  },

  bonusItem() {
    this.playSweep(1200, 1600, 0.1, 'triangle', 0.12);
    this.vibrate(15);
  },

  penalty() {
    this.playTone(150, 0.2, 'square', 0.08);
    this.vibrate(80);
  },

  // === 拍照音效 ===
  shutter() {
    this.playNoise(0.05, 0.15);
  },

  uploadSuccess() {
    this.playTone(880, 0.1, 'sine', 0.1);
    setTimeout(() => this.playTone(1320, 0.1, 'sine', 0.1), 120);
    this.vibrate(20);
  },

  // === 排行榜音效 ===
  rankUp() {
    this.playSequence([
      { freq: 523 }, { freq: 659 }, { freq: 784 }, { freq: 1047, dur: 0.2 }
    ], 0.08);
    this.vibrate([30, 20, 30, 20, 50]);
  },

  // === 遊戲專屬音效 ===
  snakeEat() { this.playSweep(600, 900, 0.06, 'sine', 0.1); },
  snakeDie() {
    this.playSweep(400, 100, 0.3, 'sawtooth', 0.1);
    this.vibrate([50, 30, 50, 30, 100]);
  },

  engineHum() { /* 由賽車遊戲內部管理持續音效 */ },
  crash() {
    this.playNoise(0.2, 0.15);
    this.playTone(100, 0.3, 'sine', 0.1);
    this.vibrate(150);
  },
  coinCollect() { this.playTone(1200, 0.04, 'sine', 0.1); },

  cardFlip() { this.playTone(800, 0.06, 'triangle', 0.08); },
  cardMatch() {
    this.playSweep(880, 1320, 0.08, 'sine', 0.12);
    this.vibrate(15);
  },
  cardMismatch() { this.playTone(300, 0.15, 'sawtooth', 0.06); },

  whack() {
    this.playNoise(0.03, 0.12);
    this.playTone(500, 0.05, 'sine', 0.1);
    this.vibrate(20);
  },
  animalPop() { this.playTone(600, 0.04, 'triangle', 0.08); },

  correct() {
    this.playSweep(800, 1200, 0.1, 'sine', 0.12);
    this.vibrate(15);
  },
  wrong() {
    this.playTone(200, 0.2, 'square', 0.08);
    this.vibrate(40);
  },
  timerTick() { this.playTone(1000, 0.02, 'sine', 0.08); }
};
