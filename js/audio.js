// VICTORY LAP — audio.js
// WebAudio synth only, no files. All continuous beds are tracked in ambNodes and
// stopped on every switch — beds that leak, stack (the Age of Toys lesson).

export class Sfx {
  constructor() {
    this.ac = null; this.master = null; this.ambNodes = []; this.ambTimers = [];
    this.ambKind = null; this.muted = false;
  }
  ensure() {
    if (this.ac) return true;
    try {
      this.ac = new (window.AudioContext || window.webkitAudioContext)();
      this.master = this.ac.createGain(); this.master.gain.value = 0.5;
      this.master.connect(this.ac.destination);
    } catch { return false; }
    return true;
  }
  setMute(m) { this.muted = m; if (this.master) this.master.gain.value = m ? 0 : 0.5; }

  tone(freq, dur, type = 'sine', gain = 0.15, glide = 0, delay = 0) {
    if (!this.ensure() || this.muted) return;
    const t0 = this.ac.currentTime + delay;
    const o = this.ac.createOscillator(), g = this.ac.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t0);
    if (glide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + glide), t0 + dur);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(gain, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(this.master);
    o.start(t0); o.stop(t0 + dur + 0.05);
  }
  noise(dur, gain = 0.12, fc = 1200, q = 1, delay = 0) {
    if (!this.ensure() || this.muted) return;
    const t0 = this.ac.currentTime + delay;
    const len = Math.max(1, Math.floor(this.ac.sampleRate * dur));
    const buf = this.ac.createBuffer(1, len, this.ac.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ac.createBufferSource(); src.buffer = buf;
    const f = this.ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = fc; f.Q.value = q;
    const g = this.ac.createGain(); g.gain.value = gain;
    src.connect(f); f.connect(g); g.connect(this.master);
    src.start(t0);
  }

  play(name) {
    const S = {
      swing:    () => this.noise(0.09, 0.05, 900, 0.8),
      thud:     () => { this.tone(95, 0.09, 'square', 0.16, -40); this.noise(0.08, 0.10, 300, 1); },
      bodyfall: () => { this.tone(70, 0.16, 'square', 0.18, -30); this.noise(0.2, 0.12, 220, 1); },
      shatter:  () => { this.noise(0.28, 0.14, 3200, 0.6); this.noise(0.18, 0.08, 5200, 0.5, 0.03); },
      whoosh:   () => this.noise(0.16, 0.06, 1400, 2),
      pickup:   () => this.tone(420, 0.07, 'triangle', 0.08, 120),
      register: () => { this.tone(880, 0.07, 'square', 0.07); this.tone(1320, 0.09, 'square', 0.06, 0, 0.08); },
      doorchime:() => { this.tone(1180, 0.14, 'sine', 0.08); this.tone(940, 0.18, 'sine', 0.07, 0, 0.1); },
      crack:    () => { this.noise(0.05, 0.14, 2600, 1); this.tone(180, 0.1, 'sawtooth', 0.05, 60, 0.03); },
      pry:      () => { this.tone(120, 0.3, 'sawtooth', 0.07, 40); this.noise(0.2, 0.08, 800, 2, 0.18); },
      trunk:    () => this.tone(110, 0.12, 'square', 0.14, -30),
      bark:     () => { this.tone(360, 0.08, 'square', 0.1, 80); this.tone(320, 0.08, 'square', 0.1, 60, 0.14); },
      yell:     () => this.tone(300, 0.2, 'sawtooth', 0.05, 120),
      siren:    () => { this.tone(620, 0.4, 'sine', 0.05, 240); this.tone(860, 0.4, 'sine', 0.05, -240, 0.4); },
      cuff:     () => { this.noise(0.05, 0.1, 4200, 2); this.noise(0.05, 0.1, 4200, 2, 0.09); },
      train:    () => { this.tone(196, 1.6, 'sawtooth', 0.025, 0); this.tone(233, 1.6, 'sawtooth', 0.025); this.tone(311, 1.6, 'sawtooth', 0.02); },
      sip:      () => this.noise(0.12, 0.05, 900, 3),
      bus:      () => { this.tone(80, 1.2, 'sawtooth', 0.06, 20); this.noise(0.9, 0.05, 500, 1, 0.1); },
      shifthorn:() => { this.tone(174, 1.8, 'sawtooth', 0.045, 8); this.tone(220, 1.8, 'sawtooth', 0.035); this.noise(1.4, 0.02, 300, 1, 0.1); },
    };
    if (S[name]) S[name]();
  }

  // ---- ambient beds by block ---------------------------------------------
  stopAmbience() {
    for (const n of this.ambNodes) { try { n.stop ? n.stop() : n.disconnect(); } catch {} }
    for (const t of this.ambTimers) clearInterval(t);
    this.ambNodes = []; this.ambTimers = []; this.ambKind = null;
  }

  startAmbience(kind, weather) {
    if (!this.ensure()) return;
    if (this.ambKind === kind + weather) return;
    this.stopAmbience();
    this.ambKind = kind + weather;
    const bed = (freq, type, gain, lfoF = 0, lfoA = 0) => {
      const o = this.ac.createOscillator(), g = this.ac.createGain();
      o.type = type; o.frequency.value = freq; g.gain.value = gain;
      if (lfoF) {
        const l = this.ac.createOscillator(), lg = this.ac.createGain();
        l.frequency.value = lfoF; lg.gain.value = lfoA;
        l.connect(lg); lg.connect(g.gain); l.start();
        this.ambNodes.push(l);
      }
      o.connect(g); g.connect(this.master); o.start();
      this.ambNodes.push(o, g);
    };
    const hiss = (gain, fc) => { // traffic wash / wind
      const len = this.ac.sampleRate * 2;
      const buf = this.ac.createBuffer(1, len, this.ac.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      const src = this.ac.createBufferSource(); src.buffer = buf; src.loop = true;
      const f = this.ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = fc;
      const g = this.ac.createGain(); g.gain.value = gain;
      src.connect(f); f.connect(g); g.connect(this.master); src.start();
      this.ambNodes.push(src, g);
    };
    const every = (msLo, msHi, fn) => {
      const tick = () => { if (!this.muted) fn(); };
      const t = setInterval(tick, msLo + Math.random() * (msHi - msLo));
      this.ambTimers.push(t);
    };
    if (weather === 'rain' && !kind.startsWith('in:')) hiss(0.05, 900);
    // ---- interiors: every room in Hopewell has its own machine noise ----
    if (kind === 'in:wingbarn') {
      hiss(0.045, 2600);                                  // the fryer, always
      bed(120, 'sawtooth', 0.008, 0.7, 0.004);            // ballast buzz
      every(5000, 11000, () => this.tone(2400, 0.05, 'square', 0.012)); // a timer nobody answers
      return;
    }
    if (kind === 'in:qwikstop') {
      bed(112, 'triangle', 0.016, 0.25, 0.006);           // the cooler wall
      hiss(0.012, 400);
      every(7000, 15000, () => { this.tone(1180, 0.1, 'sine', 0.03); this.tone(940, 0.13, 'sine', 0.025, 0, 0.09); });
      return;
    }
    if (kind === 'in:buffet') {
      hiss(0.03, 700);                                    // steam table
      bed(96, 'triangle', 0.01, 0.4, 0.005);
      every(4000, 9000, () => this.noise(0.25, 0.02, 1500, 1.5)); // a lid, a ladle
      return;
    }
    if (kind === 'in:cashking') {
      bed(60, 'triangle', 0.014, 0.15, 0.005);            // fluorescent + bulletproof hush
      every(9000, 20000, () => this.tone(70, 0.6, 'sine', 0.014, 10));
      return;
    }
    if (kind === 'in:hardware' || kind === 'in:gamebarn' || kind === 'in:pawn') {
      bed(118, 'triangle', 0.009, 0.5, 0.004);
      every(11000, 24000, () => this.noise(0.4, 0.014, 300, 1));
      return;
    }
    if (kind === 'in:splitlip') {
      bed(88, 'triangle', 0.014, 0.3, 0.006);              // cooler + the hum of held opinions
      hiss(0.014, 500);
      every(3500, 8000, () => this.noise(0.12, 0.03, 900, 2));           // glass on wood
      every(9000, 18000, () => this.tone(200 + Math.random() * 120, 0.3, 'sawtooth', 0.012, 60)); // a laugh, far end
      return;
    }
    if (kind === 'in:daybreak') {
      bed(140, 'sine', 0.008, 0.4, 0.003);                 // clean hum. suspiciously clean
      every(5000, 12000, () => this.noise(0.5, 0.03, 2400, 1.2));        // the milk steamer, screaming politely
      every(10000, 22000, () => { this.tone(1180, 0.1, 'sine', 0.02); this.tone(1560, 0.1, 'sine', 0.016, 0, 0.1); });
      return;
    }
    if (kind === 'in:foxhole') {
      bed(56, 'triangle', 0.02, 2.1, 0.01);                // bass through a wall
      bed(112, 'triangle', 0.008, 2.1, 0.005);
      hiss(0.012, 300);
      return;
    }
    if (kind === 'in:unionhall') {
      bed(96, 'triangle', 0.011, 0.3, 0.005);              // fluorescents Denny replaces himself
      every(8000, 16000, () => this.noise(0.2, 0.02, 600, 1.4));         // a folding chair, adjusting
      every(15000, 30000, () => this.tone(1400, 0.06, 'sine', 0.012));   // the urn, percolating out of spite
      return;
    }
    if (kind === 'in:garage') {
      bed(52, 'triangle', 0.012, 0.2, 0.004);             // the beer fridge, the whole house asleep
      every(6000, 13000, () => this.tone(1600, 0.03, 'sine', 0.008)); // a clock somewhere
      return;
    }
    if (kind === 'morning') {
      hiss(0.018, 600);
      every(2400, 6000, () => { const f = 1800 + Math.random() * 1400; this.tone(f, 0.12, 'sine', 0.03, 300); this.tone(f * 1.2, 0.1, 'sine', 0.025, -200, 0.15); });
    } else if (kind === 'afternoon') {
      hiss(0.022, 800);
      every(9000, 18000, () => this.noise(0.7, 0.03, 400, 1)); // a passing truck
    } else if (kind === 'evening') {
      hiss(0.015, 500);
      bed(84, 'triangle', 0.012, 0.4, 0.006);                  // neon transformer breath
      every(1400, 2600, () => this.tone(4200, 0.04, 'sine', 0.014)); // crickets begin
    } else {
      bed(62, 'triangle', 0.014, 0.3, 0.007);
      every(900, 1800, () => this.tone(4200, 0.045, 'sine', 0.02)); // crickets own the night
      every(8000, 16000, () => { const d = Math.random(); this.tone(380 + d * 60, 0.5, 'sine', 0.012, -30); }); // a dog, far
      every(24000, 48000, () => this.play('train'));           // the loneliest sound in America
    }
  }
}
