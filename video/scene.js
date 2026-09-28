/*
 * N.A.R. Abogados & Asociados — motion-design video, drawn on a 1080×1920 canvas.
 * drawFrame(t) is a pure function of time: the same t always paints the same frame,
 * so the renderer can capture frames at any rate and the music (music.js) lines up exactly.
 */
(function () {
  const T = window.TIMELINE;
  const W = T.WIDTH, H = T.HEIGHT, BEAT = T.BEAT, bar = T.bar;
  const canvas = document.getElementById("c");
  const ctx = canvas.getContext("2d");

  // Design-system colors (tokens.json)
  const C = {
    espresso: "#231915", espressoDeep: "#140f0c", marfil: "#f1eae1", lino: "#f3eee7", card: "#fbf8f4",
    nogal: "#75533c", nogalDark: "#c9a184", nogalStrong: "#4e3627", nogalSoft: "#e8dccf", nogalSoftDark: "#3a2a20",
    laton: "#a8834b", latonLight: "#cfae72", ink: "#241a15", inkMuted: "#65564b", mutedDark: "#b8a99b",
  };
  const F = {
    display: (s) => `400 ${s}px "Caslon Display", Georgia, serif`,
    italic: (s) => `italic 400 ${s}px "Caslon Text", Georgia, serif`,
    sans: (s, w = 400) => `${w} ${s}px "Hanken", "Helvetica Neue", Arial, sans-serif`,
  };

  // ------------------------------------------------------------------ easing & time helpers
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const lerp = (a, b, p) => a + (b - a) * p;
  const prog = (t, start, dur) => clamp((t - start) / dur);
  const outQuint = (p) => 1 - Math.pow(1 - p, 5);          // ≈ cubic-bezier(0.22, 1, 0.36, 1)
  const outCubic = (p) => 1 - Math.pow(1 - p, 3);
  const inCubic = (p) => p * p * p;                         // ≈ cubic-bezier(0.64, 0, 0.78, 0)
  const inOutCubic = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
  const outBack = (p, s = 1.7) => (p <= 0 ? 0 : 1 + (s + 1) * Math.pow(p - 1, 3) + s * Math.pow(p - 1, 2));
  const spring = (d, f = 18, k = 7) => (d < 0 ? 0 : 1 - Math.exp(-d * k) * Math.cos(d * f)); // settles to 1
  function mulberry(a) { return function () { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const inGroove = (t) => T.grooveBars.indexOf(Math.floor(t / T.BAR)) >= 0;
  const beatPulse = (t) => (inGroove(t) ? Math.exp(-(t % BEAT) * 10) : 0);
  const barPunch = (t) => (inGroove(t) ? Math.exp(-(t % T.BAR) * 6) : 0);

  // ------------------------------------------------------------------ assets
  const img = (src) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
  const A = {};
  const off = document.createElement("canvas"); off.width = off.height = 800;
  const octx = off.getContext("2d");
  const grain = [];
  function tint(image, color) {
    const c = document.createElement("canvas"); c.width = image.width; c.height = image.height;
    const x = c.getContext("2d"); x.drawImage(image, 0, 0); x.globalCompositeOperation = "source-in"; x.fillStyle = color; x.fillRect(0, 0, c.width, c.height);
    return c;
  }

  window.SCENE_READY = (async function () {
    const [rings, text, mono, icons] = await Promise.all([
      img("assets/sello-rings.svg"), img("assets/sello-text.svg"), img("assets/sello-mono.svg"),
      fetch("assets/icons.json").then((r) => r.json()),
    ]);
    Object.assign(A, { rings, text, mono, icons, textMarfil: tint(text, C.marfil), ringsLaton: tint(rings, C.latonLight) });
    await Promise.all([F.display(100), F.italic(100), F.sans(100, 400), F.sans(100, 500), F.sans(100, 600)].map((f) => document.fonts.load(f, "ÁÉÍÓÚáéíóúñ¿?·&")));
    const rand = mulberry(7);
    for (let k = 0; k < 4; k++) {
      const g = document.createElement("canvas"); g.width = 540; g.height = 960;
      const gx = g.getContext("2d"), d = gx.createImageData(540, 960);
      for (let i = 0; i < d.data.length; i += 4) { const v = rand() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
      gx.putImageData(d, 0, 0); grain.push(g);
    }
  })();

  // ------------------------------------------------------------------ drawing primitives
  function text(str, x, y, font, color, { align = "center", alpha = 1, spacing = 0 } = {}) {
    ctx.save();
    ctx.font = font; ctx.fillStyle = color; ctx.globalAlpha *= alpha; ctx.textAlign = align; ctx.textBaseline = "alphabetic";
    ctx.letterSpacing = spacing + "px";
    ctx.fillText(str, x + (align === "center" ? spacing / 2 : 0), y);
    ctx.restore();
  }
  function measure(str, font, spacing = 0) { ctx.save(); ctx.font = font; ctx.letterSpacing = spacing + "px"; const w = ctx.measureText(str).width; ctx.restore(); return w; }

  // A line of text that rises out of an invisible mask.
  function riseText(str, x, y, size, font, color, p, opts = {}) {
    if (p <= 0) return;
    const e = outQuint(p);
    ctx.save();
    const w = measure(str, font, opts.spacing || 0) + 40;
    const left = opts.align === "left" ? x - 10 : opts.align === "right" ? x - w + 10 : x - w / 2;
    ctx.beginPath(); ctx.rect(left, y - size * 1.05, w, size * 1.45); ctx.clip();
    text(str, x, y + (1 - e) * size * 0.95, font, color, { ...opts, alpha: (opts.alpha ?? 1) * clamp(p * 1.6) });
    ctx.restore();
  }

  /*
   * Kinetic type, one glyph at a time. mode: "drop" (falls in, spinning), "rise", "flip" (unfolds vertically),
   * "fly" (from alternating sides). implode (0–1) pulls every glyph into a point.
   */
  function letters(str, cx, y, font, color, t, t0, { mode = "rise", stagger = 0.035, dur = 0.55, implode = 0, target = [W / 2, H / 2], alpha = 1, align = "center", seed = 3 } = {}) {
    const total = measure(str, font);
    const left = align === "left" ? cx : cx - total / 2;
    const r = mulberry(seed);
    ctx.save(); ctx.font = font; ctx.fillStyle = color; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
    for (let i = 0; i < str.length; i++) {
      const ch = str[i], j1 = r(), j2 = r();
      if (ch === " ") continue;
      const p = prog(t, t0 + i * stagger, dur);
      if (p <= 0) continue;
      const e = outQuint(p), side = i % 2 ? 1 : -1;
      let x = left + measure(str.slice(0, i), font) + measure(ch, font) / 2, yy = y, rot = 0, sx = 1, sy = 1, a = clamp(p * 2.2);
      if (mode === "drop") { yy -= (1 - outBack(p, 1.6)) * 220; rot = (1 - e) * side * (0.6 + j1 * 0.6); }
      else if (mode === "rise") { yy += (1 - e) * 110; }
      else if (mode === "flip") { sy = Math.max(0.02, outBack(p, 1.4)); yy += (1 - e) * 30; }
      else if (mode === "fly") { x += (1 - e) * side * (500 + j2 * 400); rot = (1 - e) * side * 0.9; yy += (1 - e) * (j1 - 0.5) * 300; }
      if (implode > 0) {
        const k = inCubic(clamp(implode * 1.25 - j1 * 0.25));
        x = lerp(x, target[0], k); yy = lerp(yy, target[1], k); rot += k * side * (2 + j2 * 3);
        sx *= 1 - 0.9 * k; sy *= 1 - 0.9 * k; a *= 1 - k * k;
      }
      ctx.save(); ctx.globalAlpha *= a * alpha; ctx.translate(x, yy); ctx.rotate(rot); ctx.scale(sx, sy);
      ctx.fillText(ch, 0, 0); ctx.restore();
    }
    ctx.restore();
  }

  function icon(name, cx, cy, size, color, p = 1, width = 1.5) {
    const els = A.icons[name]; if (!els || p <= 0) return;
    const k = size / 24;
    ctx.save();
    ctx.translate(cx - size / 2, cy - size / 2); ctx.scale(k, k);
    ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = "round"; ctx.lineJoin = "round";
    const L = 90; ctx.setLineDash([L, L]); ctx.lineDashOffset = L * (1 - outCubic(p));
    for (const [tag, a] of els) {
      let path;
      if (tag === "path") path = new Path2D(a.d);
      else {
        path = new Path2D();
        if (tag === "circle") path.arc(+a.cx, +a.cy, +a.r, -Math.PI / 2, Math.PI * 1.5);
        else if (tag === "line") { path.moveTo(+a.x1, +a.y1); path.lineTo(+a.x2, +a.y2); }
        else if (tag === "rect") path.roundRect(+a.x, +a.y, +a.width, +a.height, +(a.rx || 0));
        else { const pts = a.points.trim().split(/[\s,]+/).map(Number); path.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) path.lineTo(pts[i], pts[i + 1]); if (tag === "polygon") path.closePath(); }
      }
      ctx.stroke(path);
    }
    ctx.restore();
  }

  // The seal with true knock-outs: disc on an offscreen canvas, rings/text/monogram cut out.
  function seal(cx, cy, R, color, { scale = 1, alpha = 1, rot = 0, textRot = 0 } = {}) {
    if (alpha <= 0) return;
    octx.save();
    octx.clearRect(0, 0, 800, 800);
    octx.fillStyle = color; octx.beginPath(); octx.arc(400, 400, 400, 0, Math.PI * 2); octx.fill();
    octx.globalCompositeOperation = "destination-out";
    octx.drawImage(A.rings, 0, 0);
    octx.translate(400, 400); octx.rotate(textRot); octx.drawImage(A.text, -400, -400); octx.setTransform(1, 0, 0, 1, 0, 0);
    octx.drawImage(A.mono, 0, 0);
    octx.restore();
    const r = R * scale;
    ctx.save(); ctx.globalAlpha *= alpha; ctx.translate(cx, cy); ctx.rotate(rot);
    ctx.drawImage(off, -r, -r, r * 2, r * 2);
    ctx.restore();
  }

  function ringStroke(cx, cy, r, color, width, p, start = -Math.PI / 2, alpha = 1, dash = null) {
    if (p <= 0 || r <= 0) return;
    ctx.save(); ctx.globalAlpha *= alpha; ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = "round";
    if (dash) { ctx.setLineDash(dash[0]); ctx.lineDashOffset = dash[1]; }
    ctx.beginPath(); ctx.arc(cx, cy, r, start, start + Math.PI * 2 * p); ctx.stroke(); ctx.restore();
  }
  function hline(cx, y, w, color, width = 3, alpha = 1) {
    if (w <= 0) return;
    ctx.save(); ctx.globalAlpha *= alpha; ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(cx - w / 2, y); ctx.lineTo(cx + w / 2, y); ctx.stroke(); ctx.restore();
  }
  function roundRect(x, y, w, h, r, fill) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fillStyle = fill; ctx.fill(); }
  function zoomAround(cx, cy, z, rot = 0) { ctx.translate(cx, cy); ctx.rotate(rot); ctx.scale(z, z); ctx.translate(-cx, -cy); }

  // Ink burst when the seal hits the paper.
  function burst(t, t0, cx, cy, color, seed, n = 44, reach = 1) {
    const d = t - t0; if (d < 0 || d > 1.1) return;
    const r = mulberry(seed);
    ctx.save(); ctx.fillStyle = color;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + r() * 0.3, sp = (700 + r() * 1100) * reach, s = 3 + r() * 9;
      const dist = 260 * reach + (sp * (1 - Math.exp(-d * 5))) / 5;
      const life = clamp(1 - d / (0.6 + r() * 0.5));
      if (life <= 0) continue;
      ctx.globalAlpha = life; ctx.beginPath();
      ctx.arc(cx + Math.cos(a) * dist, cy + Math.sin(a) * dist, s * life, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  // A brass light streak crossing the frame.
  function streak(t, t0, dur, x0, y0, x1, y1, width = 4, len = 700) {
    const p = prog(t, t0, dur); if (p <= 0 || p >= 1) return;
    const e = inOutCubic(p), hx = lerp(x0, x1, e), hy = lerp(y0, y1, e);
    const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy), tx = hx - (dx / L) * len, ty = hy - (dy / L) * len;
    const g = ctx.createLinearGradient(tx, ty, hx, hy);
    g.addColorStop(0, "rgba(207,174,114,0)"); g.addColorStop(1, "rgba(207,174,114,0.95)");
    ctx.save(); ctx.strokeStyle = g; ctx.lineWidth = width; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(hx, hy); ctx.stroke(); ctx.restore();
  }

  // ------------------------------------------------------------------ atmosphere
  const dust = (() => { const r = mulberry(21); return Array.from({ length: 70 }, () => ({ x: r() * W, y: r() * H, v: 12 + r() * 30, s: 1.2 + r() * 3, ph: r() * 6.28, sw: 10 + r() * 30 })); })();

  function darkBackground(t, { leak = 1, suction = 0, target = [W / 2, 760] } = {}) {
    ctx.fillStyle = C.espresso; ctx.fillRect(-60, -60, W + 120, H + 120);
    const lx = W * (0.3 + 0.25 * Math.sin(t * 0.21)), ly = H * (0.28 + 0.08 * Math.cos(t * 0.17));
    const g = ctx.createRadialGradient(lx, ly, 0, lx, ly, H * 0.75);
    g.addColorStop(0, `rgba(201,161,132,${0.2 * leak})`); g.addColorStop(0.45, `rgba(117,83,60,${0.1 * leak})`); g.addColorStop(1, "rgba(35,25,21,0)");
    ctx.fillStyle = g; ctx.fillRect(-60, -60, W + 120, H + 120);
    const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.8);
    v.addColorStop(0, "rgba(20,15,12,0)"); v.addColorStop(1, "rgba(20,15,12,0.78)");
    ctx.fillStyle = v; ctx.fillRect(-60, -60, W + 120, H + 120);
    particles(t, C.latonLight, 0.3, suction, target);
  }
  function lightBackground(t, { ruled = false } = {}) {
    ctx.fillStyle = C.lino; ctx.fillRect(-60, -60, W + 120, H + 120);
    const g = ctx.createRadialGradient(W / 2, H * 0.34, 0, W / 2, H * 0.34, H * 0.8);
    g.addColorStop(0, "rgba(251,248,244,1)"); g.addColorStop(1, "rgba(232,220,207,0.95)");
    ctx.fillStyle = g; ctx.fillRect(-60, -60, W + 120, H + 120);
    if (ruled) {
      // the ruled paper of a case file, drifting up
      const off = (t * 40) % 64;
      ctx.save(); ctx.strokeStyle = "rgba(117,83,60,0.08)"; ctx.lineWidth = 2;
      for (let y = -64 - off; y < H + 64; y += 64) { ctx.beginPath(); ctx.moveTo(-60, y); ctx.lineTo(W + 60, y); ctx.stroke(); }
      ctx.strokeStyle = "rgba(168,131,75,0.35)"; ctx.beginPath(); ctx.moveTo(48, -60); ctx.lineTo(48, H + 60); ctx.stroke();
      ctx.restore();
    }
    particles(t, C.nogal, 0.12, 0);
  }
  function particles(t, color, alpha, suction, target = [W / 2, 760]) {
    ctx.save(); ctx.fillStyle = color;
    for (const d of dust) {
      let x = (d.x + Math.sin(t * 0.6 + d.ph) * d.sw) % W;
      let y = ((d.y - t * d.v) % H + H) % H;
      if (suction > 0) { const e = inCubic(suction); x = lerp(x, target[0], e); y = lerp(y, target[1], e); }
      ctx.globalAlpha = alpha * (0.5 + 0.5 * Math.sin(t * 2 + d.ph)) * (1 - suction * 0.6);
      ctx.beginPath(); ctx.arc(x, y, d.s, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  // Giant outlined words scrolling in alternating directions; they jump forward on every beat.
  function marquee(t, words, { color = C.nogalDark, alpha = 0.16, size = 210, rows = 7, angle = -0.17, top = -200 } = {}) {
    const beats = t / BEAT, jump = Math.floor(beats) + outCubic(beats % 1);
    ctx.save(); zoomAround(W / 2, H / 2, 1, angle);
    ctx.font = F.display(size); ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.globalAlpha = alpha; ctx.textBaseline = "middle";
    for (let r = 0; r < rows; r++) {
      const line = words.slice(r % words.length).concat(words).join("  ·  ");
      const w = measure(line + "  ·  ", F.display(size));
      const dir = r % 2 ? 1 : -1;
      let x = ((dir * (t * 70 + jump * 26) + r * 377) % w + w) % w - w;
      for (; x < W + 400; x += w) ctx.strokeText(line + "  ·  ", x - 300, top + r * (size * 1.25));
    }
    ctx.restore();
  }

  // ------------------------------------------------------------------ scenes
  function sceneIntro(t) {
    const target = [W / 2, 760];
    const imp = prog(t, bar(1, 2), 0.95);
    darkBackground(t, { leak: 0.6 + 0.4 * prog(t, 0, 3), suction: prog(t, bar(1, 2.4), 0.8), target });
    streak(t, 0.05, 0.9, -200, 1650, 1300, 450, 4, 800);
    streak(t, 1.6, 0.7, 1300, 1450, -200, 1150, 3, 600);
    ctx.save();
    zoomAround(W / 2, H / 2, 1 + 0.06 * prog(t, 0, 4), -0.03 * inOutCubic(prog(t, 1.8, 1.4)));
    const [w1, w2, w3] = T.introWords;
    letters(w1.text, W / 2, 820, F.display(128), C.marfil, t, w1.t - 0.12, { mode: "drop", stagger: 0.03, implode: imp, target, seed: 11 });
    letters(w2.text, W / 2, 965, F.display(128), C.marfil, t, w2.t - 0.12, { mode: "fly", stagger: 0.025, implode: imp, target, seed: 12 });
    // "legal?" slams in whole
    const sp = prog(t, w3.t - 0.06, 0.35);
    if (sp > 0 && imp < 1) {
      ctx.save(); ctx.globalAlpha *= clamp(sp * 4) * (1 - inCubic(imp)); zoomAround(W / 2, 1060, lerp(2.4, 1, outQuint(sp)) * (1 - 0.9 * inCubic(imp)), (1 - outQuint(sp)) * -0.15);
      ctx.translate(0, lerp(0, target[1] - 1100, inCubic(imp)));
      text(w3.text, W / 2, 1100, F.italic(124), C.latonLight); ctx.restore();
    }
    ctx.restore();
    // orbit: the seal's rings draw themselves, dashed and turning, with two satellites
    const contract = inCubic(prog(t, bar(1, 2.4), 0.8));
    const cy = lerp(960, 760, contract), r1 = lerp(440, 270 * 0.925, contract), r2 = lerp(340, 270 * 0.64, contract);
    ringStroke(W / 2, cy, r1, C.laton, 3, outCubic(prog(t, bar(1, 0), 1.1)), -Math.PI / 2 + t * 0.6, 0.9, [[18, 12], -t * 60]);
    ringStroke(W / 2, cy, r2, C.latonLight, 2, outCubic(prog(t, bar(1, 0.5), 1.1)), Math.PI / 2 - t * 0.9, 0.8);
    const sat = prog(t, bar(1, 0), 0.4);
    if (sat > 0) {
      ctx.save(); ctx.fillStyle = C.latonLight; ctx.globalAlpha = sat;
      for (const [r, s, k] of [[r1, 1.6, 0], [r2, -2.2, Math.PI]]) {
        const a = t * s + k; ctx.beginPath(); ctx.arc(W / 2 + Math.cos(a) * r, cy + Math.sin(a) * r, 9, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }
  }

  function sceneStamp(t) {
    const t0 = bar(2), cx = W / 2, cy = 760, R = 270;
    darkBackground(t);
    const push = inCubic(prog(t, bar(3, 3), 0.55)); // camera dives into the seal before the iris
    ctx.save(); zoomAround(cx, cy, 1 + 1.2 * push);
    const s = outQuint(prog(t, t0, 0.42));
    for (const [dl, w] of [[0, 7], [0.12, 4]]) {
      const sw = prog(t, t0 + dl, 0.9);
      if (sw > 0 && sw < 1) ringStroke(cx, cy, R * lerp(1, 2.1, outCubic(sw)), C.latonLight, w * (1 - sw), 1, 0, 1 - sw);
    }
    burst(t, t0, cx, cy, C.latonLight, 5);
    seal(cx, cy, R * (1 + 0.02 * beatPulse(t)), C.marfil, {
      scale: lerp(2.8, 1, s), alpha: clamp(prog(t, t0, 0.07)), rot: lerp(0.7, 0, outQuint(prog(t, t0, 0.6))),
      textRot: lerp(-1.4, 0, outQuint(prog(t, t0, 1.3))) + 0.05 * Math.max(0, t - t0 - 1.3),
    });
    letters("N.A.R.", cx, 1255, F.display(156), C.marfil, t, t0 + 0.4, { mode: "drop", stagger: 0.06, dur: 0.7, seed: 21 });
    hline(cx, 1305, 440 * outQuint(prog(t, t0 + 0.85, 0.7)), C.laton, 3);
    const dp = prog(t, t0 + 1.0, 0.9);
    text("ABOGADOS & ASOCIADOS", cx, 1365, F.sans(30, 600), C.marfil, { alpha: 0.9 * outCubic(dp), spacing: lerp(30, 11, outQuint(dp)) });
    // location pin: drops, bounces, ripples on the ground
    const lt = T.location.t, pin = prog(t, lt, 0.75), land = lt + 0.3;
    for (const dl of [0, 0.15]) {
      const q = prog(t, land + dl, 0.8);
      if (q > 0 && q < 1) { ctx.save(); ctx.strokeStyle = C.latonLight; ctx.globalAlpha = 1 - q; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(cx, 1535, 30 + 140 * outCubic(q), 8 + 30 * outCubic(q), 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
    }
    if (pin > 0) { ctx.save(); ctx.globalAlpha *= clamp(pin * 3); icon("map-pin", cx, lerp(1300, 1500, outBack(pin, 2.4)), 70, C.latonLight, 1, 1.6); ctx.restore(); }
    letters(T.location.text, cx, 1640, F.italic(68), C.nogalDark, t, lt + 0.25, { mode: "flip", stagger: 0.03 });
    riseText(T.location.sub.toUpperCase(), cx, 1702, 26, F.sans(26, 600), C.mutedDark, prog(t, lt + 0.55, 0.6), { spacing: 8 });
    ctx.restore();
  }

  function sceneRamas(t) {
    const R = T.ramas, cx = W / 2;
    darkBackground(t, { leak: 0.9 });
    marquee(t, R.list.map((s) => s.replace(/^de /, "")), { alpha: 0.13 * prog(t, bar(4) - 0.2, 0.8) });
    const whip = inCubic(prog(t, bar(7, 3), 0.5)); // whip-pan out
    ctx.save(); ctx.translate(-1500 * whip, 0); zoomAround(cx, H / 2, 1 + 0.02 * barPunch(t));
    // headline: arrives big, then docks at the top
    const dock = outQuint(prog(t, R.dock, 0.6));
    ctx.save(); ctx.translate(0, lerp(0, -560, dock)); zoomAround(cx, 900, lerp(1, 0.5, dock));
    letters("Todas las ramas", cx, 860, F.display(132), C.marfil, t, R.headline - 0.1, { mode: "drop", stagger: 0.028, seed: 31 });
    letters("del derecho", cx, 1000, F.italic(124), C.latonLight, t, R.headline + 0.2, { mode: "flip", stagger: 0.03 });
    ctx.restore();
    // slot machine: "Derecho" + one branch per beat
    const wy = 1130, list = R.list.concat([R.outro.text]), times = R.times.concat([R.outro.t]);
    const wordIn = prog(t, R.rollStart - 0.3, 0.5);
    riseText("Derecho", cx, 960, 150, F.display(150), C.marfil, wordIn);
    const bw = 640 * outQuint(prog(t, R.rollStart - 0.2, 0.5)) * (1 + 0.04 * beatPulse(t));
    hline(cx, wy - 150, bw, C.laton, 2); hline(cx, wy + 64, bw, C.laton, 2);
    let k = -1; for (let i = 0; i < times.length; i++) if (t >= times[i]) k = i;
    if (k >= 0) {
      ctx.save(); ctx.beginPath(); ctx.rect(0, wy - 148, W, 210); ctx.clip();
      const local = t - times[k], p = clamp(local / 0.3), e = outBack(p, 1.3), step = 190;
      const font = k === list.length - 1 ? F.italic(110) : F.italic(132);
      const draw = (str, y, a, blur) => {
        for (let g = -2; g <= 2; g++) text(str, cx, y + g * blur, font, C.latonLight, { alpha: a * (g === 0 ? 1 : 0.18) });
      };
      const blur = (1 - p) * 26;
      draw(list[k], wy + (1 - e) * step, 1, blur);
      if (k > 0 && p < 1) draw(list[k - 1], wy - outCubic(p) * step, 1 - p, blur);
      ctx.restore();
      // progress along the list
      hline(cx - 320 + (320 * (k + 1)) / list.length, wy + 64, (640 * (k + 1)) / list.length, C.latonLight, 5);
    }
    ctx.restore();
  }

  function cardRect(k) { return { x: k % 2 ? 556 : 64, y: 510 + Math.floor(k / 2) * 206, w: 460, h: 176 }; }
  function sceneTramites(t) {
    const S = T.tramites, cx = W / 2;
    lightBackground(t, { ruled: true });
    ctx.save();
    zoomAround(cx, H / 2, 1 + 0.015 * barPunch(t), 0.012 * Math.sin(t * 0.8));
    ctx.translate(0, lerp(30, -30, prog(t, bar(8), 8)));
    // camera nudge on each landing
    let nudge = 0; S.times.forEach((tk) => { const d = t - (tk + 0.38); if (d > 0 && d < 0.4) nudge = 9 * Math.exp(-d * 14) * Math.cos(d * 40); });
    ctx.translate(0, nudge);
    letters("Hacemos", cx, 300, F.display(116), C.ink, t, S.headline - 0.05, { mode: "flip", stagger: 0.035 });
    letters("todo tipo de trámites", cx, 400, F.italic(80), C.nogal, t, S.headline + 0.25, { mode: "rise", stagger: 0.02 });
    S.cards.forEach((c, k) => {
      const tk = S.times[k], p = prog(t, tk - 0.08, 0.46);
      if (p <= 0) return;
      const r = cardRect(k), side = k % 2 ? 1 : -1, e = outCubic(p);
      const tx = r.x + r.w / 2, ty = r.y + r.h / 2, sx = cx + side * 260, sy = 2250;
      // quadratic flight from below the frame
      const qx = lerp(lerp(sx, tx + side * 380, e), lerp(tx + side * 380, tx, e), e);
      const qy = lerp(lerp(sy, ty + 120, e), lerp(ty + 120, ty, e), e);
      let rot = (1 - e) * side * 0.9, sc = lerp(0.7, 1, e) * (p >= 1 ? 1 + 0.05 * Math.exp(-(t - tk - 0.38) * 10) * Math.cos((t - tk - 0.38) * 30) : 1);
      let x = qx, y = qy, a = 1;
      const out = inCubic(prog(t, S.exit + (11 - k) * 0.045, 0.42));
      if (out > 0) { y -= out * 2300; rot += out * side * 1.4; a = 1 - out * 0.3; }
      ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.rotate(rot); ctx.scale(sc, sc);
      ctx.save(); ctx.shadowColor = "rgba(36,26,21,0.18)"; ctx.shadowBlur = 30 + (1 - e) * 40; ctx.shadowOffsetY = 12 + (1 - e) * 30;
      roundRect(-r.w / 2, -r.h / 2, r.w, r.h, 34, C.card); ctx.restore();
      ctx.beginPath(); ctx.arc(-r.w / 2 + 84, 0, 54, 0, Math.PI * 2); ctx.fillStyle = C.nogalSoft; ctx.fill();
      icon(c.icon, -r.w / 2 + 82, 0, 54, C.nogal, prog(t, tk + 0.15, 0.5), 1.6);
      const font = F.sans(40, 600), words = c.text.split(" ");
      const left = -r.w / 2 + 160;
      if (measure(c.text, font) <= r.w - 180) text(c.text, left, 13, font, C.ink, { align: "left" });
      else {
        const mid = Math.ceil(words.length / 2);
        text(words.slice(0, mid).join(" "), left, -10, font, C.ink, { align: "left" });
        text(words.slice(mid).join(" "), left, 38, font, C.ink, { align: "left" });
      }
      ctx.restore();
    });
    ctx.restore();
  }

  function sceneFrase(t) {
    const [a, b] = T.frase, cx = W / 2;
    darkBackground(t, { leak: 1.1 });
    // brass rays turning behind the words
    ctx.save(); ctx.translate(cx, 960); ctx.rotate(t * 0.25);
    const kick = Math.max(...T.slams.map((s) => (t >= s ? Math.exp(-(t - s) * 5) : 0)));
    ctx.fillStyle = C.latonLight; ctx.globalAlpha = 0.05 + 0.08 * kick;
    for (let i = 0; i < 18; i++) { ctx.rotate((Math.PI * 2) / 18); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-40, -1500); ctx.lineTo(40, -1500); ctx.closePath(); ctx.fill(); }
    ctx.restore();
    const slam = (str, y, font, color, t0, from) => {
      const p = prog(t, t0 - 0.04, 0.34); if (p <= 0) return;
      ctx.save(); ctx.globalAlpha *= clamp(p * 5); zoomAround(cx, y - 40, lerp(from, 1, outQuint(p)), (1 - outQuint(p)) * -0.12);
      text(str, cx, y, font, color); ctx.restore();
    };
    slam(a.text, 900, F.display(128), C.marfil, a.t, 2.6);
    slam(b.text, 1060, F.italic(124), C.latonLight, b.t, 0.3);
    hline(cx, 1140, 380 * outQuint(prog(t, b.t + 0.3, 0.5)), C.laton, 3);
  }

  function sceneValores(t) {
    const V = T.valores, cx = W / 2;
    darkBackground(t, { leak: 0.9 });
    riseText("POR QUÉ ELEGIRNOS", cx, 560, 28, F.sans(28, 600), C.latonLight, prog(t, bar(13) + 0.1, 0.5), { spacing: 10 });
    const n = V.filter((v) => t >= v.t - 0.08).length;
    const layout = (k, m) => 980 + (k - (m - 1) / 2) * 260;
    V.forEach((v, k) => {
      if (k >= n) return;
      const since = t - V[n - 1].t + 0.08, mv = outQuint(clamp(since / 0.5));
      const y = k < n - 1 ? lerp(layout(k, n - 1), layout(k, n), mv) : layout(k, n);
      const p = prog(t, v.t - 0.08, 0.6), e = outQuint(p), side = k % 2 ? 1 : -1;
      const dx = 190 + (1 - e) * side * -700;
      ctx.save(); ctx.globalAlpha *= clamp(p * 2);
      ctx.beginPath(); ctx.arc(dx, y, 78 * outBack(p, 1.8) * (1 + 0.04 * beatPulse(t)), 0, Math.PI * 2); ctx.fillStyle = C.nogalSoftDark; ctx.fill();
      ringStroke(dx, y, 98, C.laton, 2, outCubic(p), t * 1.2 * side, 0.9, [[10, 12], t * 40]);
      icon(v.icon, dx, y, 76, C.latonLight, prog(t, v.t + 0.05, 0.6), 1.6);
      ctx.restore();
      letters(v.text, 310, y + 18, F.sans(50, 500), C.marfil, t, v.t, { mode: "fly", stagger: 0.012, dur: 0.5, align: "left", seed: 40 + k });
    });
    hline(cx, 1420, 520 * outQuint(prog(t, bar(14, 2), 0.8)), C.laton, 3);
  }

  function sceneLema(t) {
    const L = T.lema, t0 = bar(15), cx = W / 2;
    const push = prog(t, t0, 4);
    darkBackground(t, { leak: 0.6 + 0.8 * push });
    // the seal's ring text, huge and turning slowly behind the motto
    ctx.save(); ctx.globalAlpha = 0.08 * prog(t, t0 - 0.3, 1); ctx.translate(cx, 960); ctx.rotate(t * 0.12);
    ctx.drawImage(A.textMarfil, -760, -760, 1520, 1520); ctx.rotate(-t * 0.3); ctx.globalAlpha *= 0.8; ctx.drawImage(A.ringsLaton, -560, -560, 1120, 1120);
    ctx.restore();
    const exit = inCubic(prog(t, bar(16, 3), 0.5));
    ctx.save(); zoomAround(cx, H / 2, 1 + 0.05 * push + 0.22 * exit); ctx.globalAlpha *= 1 - exit;
    letters(L[0].text, cx, 900, F.italic(104), C.marfil, t, L[0].t, { mode: "flip", stagger: 0.04, dur: 0.7 });
    letters(L[1].text, cx, 1036, F.italic(104), C.nogalDark, t, L[1].t, { mode: "flip", stagger: 0.04, dur: 0.7 });
    hline(cx, 1110, 360 * outQuint(prog(t, bar(16, 2), 0.9)), C.laton, 3);
    riseText("N.A.R. ABOGADOS & ASOCIADOS", cx, 1180, 24, F.sans(24, 600), C.mutedDark, prog(t, bar(16, 2.5), 0.6), { spacing: 8 });
    ctx.restore();
  }

  function sceneCierre(t) {
    const t0 = bar(17), cx = W / 2, cy = 600, R = 240, K = T.contact;
    lightBackground(t);
    ctx.save(); zoomAround(cx, H / 2, 1 + 0.012 * barPunch(t) - 0.03 * outCubic(prog(t, K.t.final, 2)));
    const s = outQuint(prog(t, t0, 0.42));
    for (const [dl, w] of [[0, 8], [0.12, 4]]) {
      const sw = prog(t, t0 + dl, 0.9);
      if (sw > 0 && sw < 1) ringStroke(cx, cy, R * lerp(1, 2.1, outCubic(sw)), C.nogal, w * (1 - sw), 1, 0, (1 - sw) * 0.7);
    }
    burst(t, t0, cx, cy, C.nogal, 9, 40, 0.9);
    const fin = t - K.t.final;
    seal(cx, cy, R * (1 + 0.015 * beatPulse(t) + (fin > 0 ? 0.05 * Math.exp(-fin * 5) : 0)), C.nogal, {
      scale: lerp(2.6, 1, s), alpha: clamp(prog(t, t0, 0.07)), rot: lerp(-0.6, 0, outQuint(prog(t, t0, 0.6))),
      textRot: lerp(1.3, 0, outQuint(prog(t, t0, 1.2))) + (Math.PI / 3) * inOutCubic(prog(t, K.t.final, 1.6)),
    });
    letters("N.A.R.", cx, 1010, F.display(136), C.nogal, t, t0 + 0.35, { mode: "drop", stagger: 0.06, dur: 0.7, seed: 51 });
    const dp = prog(t, t0 + 0.6, 0.9);
    text("ABOGADOS & ASOCIADOS", cx, 1066, F.sans(28, 600), C.ink, { alpha: outCubic(dp), spacing: lerp(26, 10, outQuint(dp)) });
    riseText("Tu tranquilidad, nuestra prioridad", cx, 1130, 40, F.italic(40), C.nogal, prog(t, t0 + 0.9, 0.6));
    // call to action: pops, then sends out a ripple
    const cp = prog(t, K.t.cta, 0.5);
    if (cp > 0) {
      const bw = 640, bh = 116;
      const rp = prog(t, K.t.cta + 0.25, 0.9);
      if (rp > 0 && rp < 1) { ctx.save(); ctx.strokeStyle = C.nogal; ctx.globalAlpha = 1 - rp; ctx.lineWidth = 4; const g = 60 * outCubic(rp); ctx.beginPath(); ctx.roundRect(cx - bw / 2 - g, 1266 - bh / 2 - g, bw + 2 * g, bh + 2 * g, bh / 2 + g); ctx.stroke(); ctx.restore(); }
      ctx.save(); ctx.globalAlpha *= clamp(cp * 3); zoomAround(cx, 1266, outBack(cp, 2)); ctx.translate(cx, 1266);
      roundRect(-bw / 2, -bh / 2, bw, bh, bh / 2, C.nogal);
      text(K.cta, -24, 16, F.sans(44, 600), C.card);
      icon("arrow-right", bw / 2 - 78, 0, 44, C.card, prog(t, K.t.cta + 0.2, 0.4), 2);
      ctx.restore();
    }
    // contact strip slides up; each number rolls in digit by digit
    const sp = outQuint(prog(t, K.t.phones - 0.15, 0.55));
    if (sp > 0) {
      ctx.save(); ctx.globalAlpha *= sp; ctx.translate(0, (1 - sp) * 220);
      roundRect(90, 1356, W - 180, 290, 60, C.nogalSoft);
      ctx.beginPath(); ctx.arc(206, 1501, 62, 0, Math.PI * 2); ctx.fillStyle = C.nogal; ctx.fill();
      icon("phone", 206, 1501, 56, C.card, prog(t, K.t.phones, 0.6), 1.8);
      riseText("LLÁMANOS", 312, 1416, 22, F.sans(22, 600), C.inkMuted, prog(t, K.t.phones, 0.5), { align: "left", spacing: 7 });
      K.phones.forEach((n, k) => letters(n, 310, 1482 + k * 62, F.sans(50, 600), C.ink, t, K.t.phones + 0.1 + k * 0.18, { mode: "rise", stagger: 0.025, align: "left" }));
      ctx.restore();
    }
    const ap = prog(t, K.t.address, 0.5);
    if (ap > 0) { ctx.save(); ctx.globalAlpha *= clamp(ap * 2); icon("map-pin", 250, 1722, 38, C.nogal, ap, 1.8); ctx.restore(); }
    riseText(K.address, 290, 1736, 36, F.sans(36, 500), C.inkMuted, ap, { align: "left" });
    const hp = prog(t, K.t.handle, 0.5);
    if (hp > 0) { ctx.save(); ctx.globalAlpha *= clamp(hp * 2); icon("message-circle", 250, 1796, 38, C.nogal, hp, 1.8); ctx.restore(); }
    riseText(K.handle, 290, 1810, 36, F.sans(36, 500), C.inkMuted, hp, { align: "left" });
    ctx.restore();
  }

  // ------------------------------------------------------------------ sequencing & transitions
  const S = T.scenes;
  const segments = [
    [S.intro, sceneIntro], [S.stamp, sceneStamp], [S.ramas, sceneRamas], [S.tramites, sceneTramites],
    [S.frase, sceneFrase], [S.valores, sceneValores], [S.lema, sceneLema], [S.cierre, sceneCierre],
  ].map(([s, draw]) => ({ start: s.start, end: s.end, draw }));
  const WIN = { iris: [0.05, 0.6], slices: [0.35, 0.35], wipe: [0.32, 0.32], fade: [0.45, 0.05] };

  function iris(t, tr, from, to) {
    const p = inOutCubic(prog(t, tr.t - WIN.iris[0], WIN.iris[0] + WIN.iris[1]));
    const r = 2300 * p, c = [W / 2, 760];
    from(t);
    ctx.save(); ctx.beginPath(); ctx.arc(c[0], c[1], r, 0, Math.PI * 2); ctx.clip(); to(t); ctx.restore();
    ringStroke(c[0], c[1], r + 14, C.nogal, 28, 1); ringStroke(c[0], c[1], r + 30, C.latonLight, 4, 1);
  }
  function slices(t, tr, from, to) {
    from(t);
    const n = 8, h = H / n;
    for (let i = 0; i < n; i++) {
      const p = inOutCubic(prog(t, tr.t - WIN.slices[0] + i * 0.035, 2 * WIN.slices[0] - 0.12));
      if (p <= 0) continue;
      const dir = i % 2 ? 1 : -1, reveal = W * p;
      const x = dir > 0 ? W - reveal : 0;
      ctx.save(); ctx.beginPath(); ctx.rect(x, i * h - 1, reveal, h + 2); ctx.clip();
      ctx.translate(dir * (1 - p) * 300, 0); to(t); ctx.restore();
      if (p < 1) { ctx.fillStyle = i % 2 ? C.nogal : C.laton; ctx.fillRect(dir > 0 ? x - 16 : reveal, i * h, 16, h); }
    }
  }
  function wipe(t, tr, from, to) {
    const p = inOutCubic(prog(t, tr.t - WIN.wipe[0], WIN.wipe[0] + WIN.wipe[1]));
    const slant = Math.tan((18 * Math.PI) / 180) * H, e = lerp(-slant - 200, W + 200, p), band = 110;
    from(t);
    ctx.save(); ctx.beginPath(); ctx.moveTo(-60, -60); ctx.lineTo(e + slant / 2, -60); ctx.lineTo(e - slant / 2, H + 60); ctx.lineTo(-60, H + 60); ctx.closePath(); ctx.clip(); to(t); ctx.restore();
    ctx.save(); ctx.beginPath(); ctx.moveTo(e + slant / 2, -60); ctx.lineTo(e + slant / 2 + band, -60); ctx.lineTo(e - slant / 2 + band, H + 60); ctx.lineTo(e - slant / 2, H + 60); ctx.closePath();
    ctx.fillStyle = C.nogal; ctx.fill(); ctx.strokeStyle = C.latonLight; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(e + slant / 2 + band, -60); ctx.lineTo(e - slant / 2 + band, H + 60); ctx.stroke(); ctx.restore();
  }
  function fade(t, tr, from, to) {
    const p = prog(t, tr.t - WIN.fade[0], WIN.fade[0] + WIN.fade[1]);
    from(t); ctx.save(); ctx.globalAlpha *= p; to(t); ctx.restore();
  }
  const TRANS = { iris, slices, wipe, fade };

  function drawFrame(t) {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = C.espresso; ctx.fillRect(0, 0, W, H);
    // camera: shake on hits and slams, a slow breathing drift everywhere
    for (const h of T.hits.concat(T.slams)) {
      const d = t - h, amp = T.hits.indexOf(h) >= 0 ? 16 : 9;
      if (d >= 0 && d < 0.45) { const a = amp * Math.exp(-d * 10); ctx.translate(Math.sin(d * 97) * a, Math.cos(d * 83) * a); }
    }
    zoomAround(W / 2, H / 2, 1.02 + 0.008 * Math.sin(t * 0.7), 0.004 * Math.sin(t * 0.45));

    const i = segments.findIndex((s) => t >= s.start && t < s.end);
    const idx = i < 0 ? segments.length - 1 : i;
    const seg = segments[idx], next = segments[idx + 1], prev = segments[idx - 1];
    const trNext = next && T.transitions.find((x) => x.t === next.start);
    const trHere = prev && T.transitions.find((x) => x.t === seg.start);
    if (trNext && TRANS[trNext.type] && t > next.start - WIN[trNext.type][0]) TRANS[trNext.type](t, trNext, seg.draw, next.draw);
    else if (trHere && TRANS[trHere.type] && t < seg.start + WIN[trHere.type][1]) TRANS[trHere.type](t, trHere, prev.draw, seg.draw);
    else seg.draw(t);
    ctx.restore();

    // lower third: the three numbers ride along the bottom during the drop and the values
    const LT = T.contact.lowerThird, lin = outQuint(prog(t, LT.start, 0.6)), lout = inCubic(prog(t, LT.end - 0.45, 0.45));
    if (lin > 0 && lout < 1) {
      const font = F.sans(34, 600), str = T.contact.phones.join("   ·   "), tw = measure(str, font), bw = tw + 150, bh = 96;
      const y = 1770 + (1 - lin) * 220 + lout * 220;
      ctx.save(); ctx.globalAlpha = Math.min(lin, 1 - lout);
      roundRect(W / 2 - bw / 2, y - bh / 2, bw, bh, bh / 2, "rgba(58,42,32,0.92)");
      ctx.strokeStyle = C.laton; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(W / 2 - bw / 2, y - bh / 2, bw, bh, bh / 2); ctx.stroke();
      icon("phone", W / 2 - bw / 2 + 58, y, 36, C.latonLight, prog(t, LT.start + 0.2, 0.5), 1.8);
      text(str, W / 2 + 36, y + 12, font, C.marfil);
      ctx.restore();
    }
    // flashes
    for (const h of T.hits.concat(T.slams)) {
      const d = t - h, amp = T.hits.indexOf(h) >= 0 ? 0.55 : 0.18;
      if (d >= 0 && d < 0.5) { ctx.fillStyle = C.marfil; ctx.globalAlpha = amp * Math.exp(-d * 9); ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
    }
    if (grain.length) {
      ctx.save(); ctx.globalAlpha = 0.07; ctx.globalCompositeOperation = "overlay";
      ctx.drawImage(grain[Math.floor(t * T.FPS) % grain.length], 0, 0, W, H);
      ctx.restore();
    }
    const fadeIn = 1 - clamp(t / 0.4), fadeOut = clamp((t - T.contact.t.fade) / (T.DURATION - T.contact.t.fade));
    const f = Math.max(fadeIn, fadeOut);
    if (f > 0) { ctx.fillStyle = C.espressoDeep; ctx.globalAlpha = f; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
  }

  window.drawFrame = drawFrame;
  window.renderFrame = (n) => drawFrame(n / T.FPS);
})();
