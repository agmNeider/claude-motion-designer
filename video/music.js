/*
 * Original score for the N.A.R. video, synthesized sample by sample from timeline.js.
 * Cinematic-corporate, 120 BPM, D major. No samples, no third-party audio.
 *
 * Run: node video/music.js [out.wav]
 */
const fs = require("fs");
const path = require("path");
const T = require("./timeline");

const SR = 48000;
const LEN = Math.ceil(T.DURATION * SR);
const L = new Float32Array(LEN);
const R = new Float32Array(LEN);
const SEND = new Float32Array(LEN); // reverb send (mono)
const TAU = Math.PI * 2;

// ---------------------------------------------------------------- helpers
const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
let seed = 1337;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296) * 2 - 1;
const idx = (t) => Math.max(0, Math.min(LEN - 1, Math.round(t * SR)));
function put(i, v, pan, send) {
  if (i < 0 || i >= LEN) return;
  const p = (pan + 1) / 2; // equal-power pan
  L[i] += v * Math.cos(p * Math.PI / 2);
  R[i] += v * Math.sin(p * Math.PI / 2);
  if (send) SEND[i] += v * send;
}

class Biquad {
  constructor() { this.x1 = this.x2 = this.y1 = this.y2 = 0; this.set("lp", 1000, 0.707); }
  set(type, f, q) {
    const w = TAU * Math.min(f, SR * 0.45) / SR, c = Math.cos(w), s = Math.sin(w), a = s / (2 * q);
    let b0, b1, b2, a0, a1, a2;
    if (type === "lp") { b0 = (1 - c) / 2; b1 = 1 - c; b2 = b0; }
    else if (type === "hp") { b0 = (1 + c) / 2; b1 = -(1 + c); b2 = b0; }
    else { b0 = a; b1 = 0; b2 = -a; } // band-pass (0 dB peak)
    a0 = 1 + a; a1 = -2 * c; a2 = 1 - a;
    this.b0 = b0 / a0; this.b1 = b1 / a0; this.b2 = b2 / a0; this.a1 = a1 / a0; this.a2 = a2 / a0;
  }
  run(x) {
    const y = this.b0 * x + this.b1 * this.x1 + this.b2 * this.x2 - this.a1 * this.y1 - this.a2 * this.y2;
    this.x2 = this.x1; this.x1 = x; this.y2 = this.y1; this.y1 = y;
    return y;
  }
}

const CHORDS = {
  D: { bass: 38, pad: [50, 57, 62, 66, 69], arp: [74, 78, 81, 86] },
  Bm: { bass: 35, pad: [47, 54, 59, 62, 66], arp: [71, 74, 78, 83] },
  A: { bass: 33, pad: [45, 52, 57, 61, 64], arp: [69, 73, 76, 81] },
  G: { bass: 31, pad: [43, 50, 55, 59, 62], arp: [67, 71, 74, 79] },
  Em: { bass: 40, pad: [40, 47, 52, 55, 59], arp: [64, 67, 71, 76] },
};
const chordAt = (t) => CHORDS[T.chords[Math.min(15, Math.floor(t / T.BAR))]];

// Kick times → side-chain ducking for pad and bass.
const kicks = [];
function duck(t) {
  let g = 1;
  for (let k = kicks.length - 1; k >= 0; k--) {
    const d = t - kicks[k];
    if (d >= 0 && d < 0.4) { g = Math.min(g, 1 - 0.55 * Math.exp(-d * 9)); break; }
  }
  return g;
}

// ---------------------------------------------------------------- instruments
function pad(t0, t1, notes, gain, cut0, cut1) {
  const voices = [];
  notes.forEach((m, n) => [-7, 0, 7].forEach((cents, v) => voices.push({
    f: hz(m) * Math.pow(2, cents / 1200), ph: (rnd() + 1) / 2, pan: ((n % 2 ? 1 : -1) * 0.35) + (v - 1) * 0.2,
  })));
  const lp = [new Biquad(), new Biquad()];
  const att = 0.35, rel = 0.7;
  const a = idx(t0 - 0.05), b = idx(t1 + rel);
  for (let i = a; i < b; i++) {
    const t = i / SR;
    if ((i & 31) === 0) {
      const p = Math.min(1, Math.max(0, (t - t0) / (t1 - t0)));
      const f = cut0 + (cut1 - cut0) * p;
      lp[0].set("lp", f, 0.8); lp[1].set("lp", f, 0.8);
    }
    let env = Math.min(1, (t - t0 + 0.05) / att);
    if (t > t1) env *= Math.max(0, 1 - (t - t1) / rel);
    let l = 0, r = 0;
    for (const o of voices) {
      o.ph += o.f / SR; if (o.ph >= 1) o.ph -= 1;
      const s = (2 * o.ph - 1) * 0.5 + Math.sin(TAU * o.ph) * 0.5;
      l += s * (1 - o.pan) * 0.5; r += s * (1 + o.pan) * 0.5;
    }
    const g = gain * env * duck(t) / voices.length * 2.2;
    const yl = lp[0].run(l) * g, yr = lp[1].run(r) * g;
    L[i] += yl; R[i] += yr; SEND[i] += (yl + yr) * 0.35;
  }
}

function pluck(t0, midi, gain, { decay = 5, index = 2.2, pan = 0, send = 0.3, ratio = 1 } = {}) {
  const f = hz(midi), len = Math.min(4, 6 / decay);
  const a = idx(t0), b = idx(t0 + len);
  for (let i = a; i < b; i++) {
    const t = (i - a) / SR;
    const env = Math.min(1, t / 0.003) * Math.exp(-t * decay);
    const I = index * Math.exp(-t * 7);
    const v = Math.sin(TAU * f * t + I * Math.sin(TAU * f * ratio * t)) * env * gain;
    put(i, v, pan, send);
  }
}

function bassNote(t0, dur, midi, gain) {
  const f = hz(midi), a = idx(t0), b = idx(t0 + dur + 0.05);
  const lp = new Biquad(); lp.set("lp", 420, 0.9);
  for (let i = a; i < b; i++) {
    const t = (i - a) / SR;
    const env = Math.min(1, t / 0.004) * Math.exp(-t * (dur < 0.4 ? 5 : 1.1)) * (t > dur ? Math.max(0, 1 - (t - dur) / 0.05) : 1);
    const ph = TAU * f * t;
    const raw = Math.sin(ph) + 0.35 * Math.sin(2 * ph) + 0.25 * Math.tanh(3 * Math.sin(ph));
    put(i, lp.run(raw) * env * gain * duck(i / SR), 0, 0);
  }
}

function kick(t0, gain = 1) {
  kicks.push(t0);
  const a = idx(t0), b = idx(t0 + 0.5);
  let ph = 0;
  for (let i = a; i < b; i++) {
    const t = (i - a) / SR;
    const f = 45 + 110 * Math.exp(-t * 32);
    ph += TAU * f / SR;
    const click = t < 0.004 ? rnd() * (1 - t / 0.004) * 0.4 : 0;
    put(i, (Math.sin(ph) * Math.exp(-t * 7) + click) * gain * 0.9, 0, 0);
  }
}

function noiseHit(t0, { dur = 0.2, type = "bp", f = 1500, q = 1, gain = 0.3, decay = 20, pan = 0, send = 0.2, bursts = 1 } = {}) {
  const flt = new Biquad(); flt.set(type, f, q);
  const a = idx(t0), b = idx(t0 + dur);
  for (let i = a; i < b; i++) {
    const t = (i - a) / SR;
    let env = Math.exp(-t * decay);
    if (bursts > 1) { const k = Math.floor(t / 0.011); if (k < bursts - 1) env = Math.exp(-(t - k * 0.011) * 90); }
    put(i, flt.run(rnd()) * env * gain, pan, send);
  }
}
const clap = (t, g = 1) => noiseHit(t, { dur: 0.35, f: 1400, q: 0.9, gain: 0.45 * g, decay: 18, send: 0.3, bursts: 3 });
const hat = (t, g = 1, open = false) => noiseHit(t, { dur: open ? 0.25 : 0.06, type: "hp", f: 8000, q: 0.7, gain: 0.09 * g, decay: open ? 18 : 70, pan: 0.25, send: 0 });
const snare = (t, g = 1) => noiseHit(t, { dur: 0.18, f: 2200, q: 0.8, gain: 0.35 * g, decay: 28, pan: -0.1, send: 0.3 });

function sweep(t0, t1, { f0 = 300, f1 = 7000, gain = 0.22, q = 4, reverse = false, send = 0.4 } = {}) {
  const flt = new Biquad();
  const a = idx(t0), b = idx(t1);
  for (let i = a; i < b; i++) {
    const p = (i - a) / (b - a);
    if ((i & 31) === 0) flt.set(reverse ? "hp" : "bp", f0 * Math.pow(f1 / f0, p), q);
    const env = reverse ? Math.pow(p, 3) : Math.pow(p, 2);
    put(i, flt.run(rnd()) * env * gain, Math.sin(p * 6) * 0.3, send);
  }
}

function whoosh(tc, gain = 0.2) {
  const flt = new Biquad();
  const a = idx(tc - 0.28), b = idx(tc + 0.35);
  for (let i = a; i < b; i++) {
    const t = i / SR - tc;
    if ((i & 31) === 0) flt.set("bp", 900 + 3500 * Math.exp(-t * t * 40), 1.2);
    const env = t < 0 ? Math.pow(1 + t / 0.28, 2) : Math.exp(-t * 9);
    put(i, flt.run(rnd()) * env * gain, t * 2, 0.25);
  }
}

function impact(t0, gain = 1) {
  const a = idx(t0), b = idx(t0 + 3);
  const lp = new Biquad(); lp.set("lp", 2500, 0.7);
  let ph = 0;
  for (let i = a; i < b; i++) {
    const t = (i - a) / SR;
    const f = 34 + 40 * Math.exp(-t * 6);
    ph += TAU * f / SR;
    const boom = Math.sin(ph) * Math.exp(-t * 1.6) * 1.1;
    const crash = lp.run(rnd()) * Math.exp(-t * 3.2) * 0.16;
    put(i, (boom + crash) * gain, 0, 0.45 * gain);
  }
  kicks.push(t0);
}

// ---------------------------------------------------------------- reverb (Freeverb-style)
function reverb(input, roomDelays, wet) {
  const combs = roomDelays.map((d) => ({ buf: new Float32Array(d), i: 0, store: 0 }));
  const aps = [556, 441, 341, 225].map((d) => ({ buf: new Float32Array(d), i: 0 }));
  const out = new Float32Array(LEN);
  const fb = 0.86, damp = 0.25;
  for (let n = 0; n < LEN; n++) {
    const x = input[n] * 0.015;
    let s = 0;
    for (const c of combs) {
      const y = c.buf[c.i];
      c.store = y * (1 - damp) + c.store * damp;
      c.buf[c.i] = x + c.store * fb;
      c.i = (c.i + 1) % c.buf.length;
      s += y;
    }
    for (const a of aps) {
      const y = a.buf[a.i];
      a.buf[a.i] = s + y * 0.5;
      a.i = (a.i + 1) % a.buf.length;
      s = y - s;
    }
    out[n] = s * wet;
  }
  return out;
}

// ---------------------------------------------------------------- arrangement
const B = T.BEAT, BAR = T.BAR, bar = T.bar;

// Kicks first so ducking knows them.
for (let b = 0; b < 16; b++) {
  const t0 = bar(b);
  if (b === 1) [0, 1, 2, 3].forEach((k) => kick(t0 + k * B, 0.28)); // heartbeat under the question
  if (b === 3) [0, 2].forEach((k) => kick(t0 + k * B, 0.8));
  if ((b >= 4 && b <= 9) || b === 13 || b === 14) [0, 1, 2, 3].forEach((k) => kick(t0 + k * B, 0.95));
  if (b === 10) [0, 2.5].forEach((k) => kick(t0 + k * B, 0.9));
}
kick(bar(15), 1);

// Pads: one chord per bar.
for (let b = 0; b < 16; b++) {
  const c = chordAt(bar(b) + 0.01);
  const last = b === 15;
  const t0 = bar(b), t1 = last ? T.DURATION - 0.9 : bar(b + 1);
  if (b < 2) pad(t0, t1, c.pad, 0.10, 450 + b * 400, 900 + b * 600);
  else if (b >= 11 && b <= 12) pad(t0, t1, c.pad, 0.13, 900 + (b - 11) * 1500, 2400 + (b - 11) * 1800);
  else pad(t0, t1, c.pad, 0.12, 1900, 2300);
}

// Bass.
for (let b = 2; b < 16; b++) {
  const c = chordAt(bar(b) + 0.01), t0 = bar(b);
  if (b === 2 || b === 3) [0, 1, 2, 3].forEach((k) => bassNote(t0 + k * B, B * 0.9, c.bass, 0.32));
  else if ((b >= 4 && b <= 10) || b === 13 || b === 14) for (let k = 0; k < 8; k++) bassNote(t0 + k * B / 2 + 0.01, B / 2 * 0.8, c.bass + (k % 4 === 3 ? 12 : 0), 0.3);
  else if (b === 12) bassNote(t0 + 3 * B, B, c.bass, 0.3);
  else if (b === 15) bassNote(t0, 1.9, c.bass, 0.4);
}

// Drums.
for (let b = 4; b < 15; b++) {
  if (b >= 11 && b <= 12) continue;
  const t0 = bar(b);
  if (b !== 10) [1, 3].forEach((k) => clap(t0 + k * B));
  else clap(t0 + 3 * B, 0.8);
  if (b !== 10) for (let k = 0; k < 4; k++) hat(t0 + k * B + B / 2, 1, k === 3);
  if (b === 8 || b === 14) for (let k = 0; k < 16; k++) if (k % 2) hat(t0 + k * B / 4, 0.5);
}
// Snare build into the close: 8ths → 16ths → 32nds across bar 12.
{
  const t0 = bar(12);
  for (let k = 0; k < 4; k++) snare(t0 + k * B / 2, 0.25 + k * 0.05);
  for (let k = 0; k < 8; k++) snare(t0 + BAR / 2 + k * B / 4, 0.45 + k * 0.03);
  for (let k = 0; k < 8; k++) snare(t0 + BAR * 0.75 + k * B / 8, 0.65 + k * 0.03);
}

// Arpeggio (16ths).
const ARP = [0, 1, 2, 3, 2, 1, 2, 3];
for (let b = 2; b < 15; b++) {
  if (b === 11 || b === 12) continue;
  const c = chordAt(bar(b) + 0.01);
  const g = b < 4 ? 0.05 : 0.07;
  for (let k = 0; k < 16; k++) pluck(bar(b) + k * B / 4, c.arp[ARP[k % 8]], g * (k % 4 === 0 ? 1.2 : 0.85), { decay: 9, index: 1.6, pan: k % 2 ? 0.4 : -0.4, send: 0.25 });
}

// Melodic ticks locked to on-screen text.
T.introWords.forEach((w, i) => pluck(w.t, [66, 69, 71][i], 0.2, { decay: 2.5, index: 1.2, send: 0.6 }));
T.services.forEach((s, i) => T.serviceItemTimes(i).forEach((t, k) => {
  const c = chordAt(t);
  pluck(t, c.arp[(k + 1) % 4] + 12, 0.07, { decay: 7, index: 0.8, pan: 0.2, send: 0.4 });
}));
T.values.forEach((v, i) => pluck(v.t, [78, 81, 83][i], 0.13, { decay: 4, index: 1.1, send: 0.5 }));
pluck(T.caseLine.t, 74, 0.16, { decay: 1.6, index: 0.9, send: 0.7 });
// Breakdown piano: a chord under each motto word.
T.lemaWords.forEach((w) => {
  const c = chordAt(w.t);
  c.pad.slice(1).forEach((m, j) => pluck(w.t + j * 0.018, m + 12, 0.07, { decay: 1.1, index: 1.4, pan: -0.3 + j * 0.2, send: 0.7 }));
  pluck(w.t, c.arp[0], 0.1, { decay: 1.3, index: 1, send: 0.7 });
});
// Close: sparkle on each contact element.
Object.entries(T.contact.t).forEach(([k, t], i) => { if (k !== "fade" && k !== "logo") pluck(t, [81, 86, 90, 93][i % 4], 0.1, { decay: 3, index: 1, send: 0.6 }); });
// Final chord hit.
chordAt(bar(15) + 0.01).pad.forEach((m, j) => pluck(bar(15) + j * 0.012, m + 12, 0.08, { decay: 0.7, index: 1.6, pan: -0.4 + j * 0.2, send: 0.8 }));

// FX.
sweep(bar(1), bar(2), { gain: 0.13 });
sweep(bar(1, 2), bar(2), { reverse: true, f0: 3000, f1: 9000, gain: 0.18 });
sweep(bar(12), bar(13), { gain: 0.15 });
sweep(bar(12, 2), bar(13), { reverse: true, f0: 3000, f1: 9000, gain: 0.2 });
T.hits.forEach((t) => impact(t, 1));
impact(bar(15), 0.55);
T.wipes.forEach((t) => whoosh(t, 0.13));

// ---------------------------------------------------------------- mix
const rvL = reverb(SEND, [1557, 1617, 1491, 1422, 1277, 1356], 1);
const rvR = reverb(SEND, [1580, 1640, 1514, 1445, 1300, 1379], 1);
let peak = 0;
const fadeOut = 1.2;
for (let i = 0; i < LEN; i++) {
  const t = i / SR;
  let g = Math.min(1, t / 0.05);
  if (t > T.DURATION - fadeOut) g *= Math.max(0, (T.DURATION - t) / fadeOut);
  L[i] = Math.tanh((L[i] + rvL[i] * 0.55) * 1.1) * g;
  R[i] = Math.tanh((R[i] + rvR[i] * 0.55) * 1.1) * g;
  peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
}
const norm = 0.89 / peak;

// ---------------------------------------------------------------- WAV
const out = process.argv[2] || path.join(__dirname, "out", "musica.wav");
fs.mkdirSync(path.dirname(out), { recursive: true });
const buf = Buffer.alloc(44 + LEN * 4);
buf.write("RIFF", 0); buf.writeUInt32LE(36 + LEN * 4, 4); buf.write("WAVE", 8);
buf.write("fmt ", 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22);
buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34);
buf.write("data", 36); buf.writeUInt32LE(LEN * 4, 40);
for (let i = 0; i < LEN; i++) {
  buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i] * norm)) * 32767), 44 + i * 4);
  buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i] * norm)) * 32767), 46 + i * 4);
}
fs.writeFileSync(out, buf);
console.log(`wrote ${out} (${T.DURATION}s, peak ${peak.toFixed(2)} → normalized)`);
