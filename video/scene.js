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
    espresso: "#231915", espressoDeep: "#140f0c", surfaceDark: "#251d18", marfil: "#f1eae1", lino: "#f3eee7",
    card: "#fbf8f4", nogal: "#75533c", nogalDark: "#c9a184", nogalStrong: "#4e3627", nogalSoft: "#e8dccf",
    nogalSoftDark: "#3a2a20", laton: "#a8834b", latonLight: "#cfae72", ink: "#241a15", inkMuted: "#65564b",
    mutedDark: "#b8a99b", tinta: "#23434d",
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
  const outBack = (p, s = 1.9) => 1 + (s + 1) * Math.pow(p - 1, 3) + s * Math.pow(p - 1, 2);
  function mulberry(a) { return function () { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  // Beat pulse during the groove (bars 4–9 and 13–14): a small swell on every kick.
  function pulse(t) {
    const b = Math.floor(t / T.BAR);
    if (!((b >= 4 && b <= 9) || b === 13 || b === 14)) return 0;
    return Math.exp(-(t % BEAT) * 10);
  }

  // ------------------------------------------------------------------ assets
  const img = (src) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
  const A = {};
  const off = document.createElement("canvas"); off.width = off.height = 800;
  const octx = off.getContext("2d");
  const grain = [];

  window.SCENE_READY = (async function () {
    const [rings, text, mono, icons] = await Promise.all([
      img("assets/sello-rings.svg"), img("assets/sello-text.svg"), img("assets/sello-mono.svg"),
      fetch("assets/icons.json").then((r) => r.json()),
    ]);
    Object.assign(A, { rings, text, mono, icons });
    await Promise.all([F.display(100), F.italic(100), F.sans(100, 400), F.sans(100, 600)].map((f) => document.fonts.load(f, "ÁÉÍÓÚáéíóúñ¿?·&")));
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

  // A line of text that rises out of an invisible mask (the design system's entrance: 24px → 0, fade).
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
        else { const pts = a.points.trim().split(/[\s,]+/).map(Number); path.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) path.lineTo(pts[i], pts[i + 1]); if (tag === "polygon") path.closePath(); }
      }
      ctx.stroke(path);
    }
    ctx.restore();
  }

  // The seal with true knock-outs: disc on an offscreen canvas, rings/text/monogram cut out.
  function seal(cx, cy, R, color, { scale = 1, alpha = 1, textRot = 0, textAlpha = 1, monoAlpha = 1 } = {}) {
    if (alpha <= 0) return;
    octx.save();
    octx.clearRect(0, 0, 800, 800);
    octx.fillStyle = color; octx.beginPath(); octx.arc(400, 400, 400, 0, Math.PI * 2); octx.fill();
    octx.globalCompositeOperation = "destination-out";
    octx.drawImage(A.rings, 0, 0);
    octx.globalAlpha = textAlpha;
    octx.translate(400, 400); octx.rotate(textRot); octx.drawImage(A.text, -400, -400); octx.setTransform(1, 0, 0, 1, 0, 0);
    octx.globalAlpha = monoAlpha; octx.drawImage(A.mono, 0, 0);
    octx.restore();
    ctx.save(); ctx.globalAlpha *= alpha;
    const r = R * scale;
    ctx.drawImage(off, cx - r, cy - r, r * 2, r * 2);
    ctx.restore();
  }

  function ringStroke(cx, cy, r, color, width, p, start = -Math.PI / 2, alpha = 1) {
    if (p <= 0) return;
    ctx.save(); ctx.globalAlpha *= alpha; ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = "round";
    ctx.beginPath(); ctx.arc(cx, cy, r, start, start + Math.PI * 2 * p); ctx.stroke(); ctx.restore();
  }
  function hline(cx, y, w, color, width = 3, alpha = 1) {
    if (w <= 0) return;
    ctx.save(); ctx.globalAlpha *= alpha; ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(cx - w / 2, y); ctx.lineTo(cx + w / 2, y); ctx.stroke(); ctx.restore();
  }
  function roundRect(x, y, w, h, r, fill) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fillStyle = fill; ctx.fill(); }

  // ------------------------------------------------------------------ atmosphere
  const dust = (() => { const r = mulberry(21); return Array.from({ length: 70 }, () => ({ x: r() * W, y: r() * H, v: 12 + r() * 30, s: 1.2 + r() * 3, ph: r() * 6.28, sw: 10 + r() * 30 })); })();

  function darkBackground(t, { leak = 1, suction = 0 } = {}) {
    ctx.fillStyle = C.espresso; ctx.fillRect(-40, -40, W + 80, H + 80);
    // warm light leak drifting slowly, the room lamp over a wooden desk
    const lx = W * (0.3 + 0.25 * Math.sin(t * 0.21)), ly = H * (0.28 + 0.08 * Math.cos(t * 0.17));
    const g = ctx.createRadialGradient(lx, ly, 0, lx, ly, H * 0.75);
    g.addColorStop(0, `rgba(201,161,132,${0.2 * leak})`); g.addColorStop(0.45, `rgba(117,83,60,${0.1 * leak})`); g.addColorStop(1, "rgba(35,25,21,0)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // vignette
    const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.78);
    v.addColorStop(0, "rgba(20,15,12,0)"); v.addColorStop(1, "rgba(20,15,12,0.75)");
    ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
    particles(t, C.latonLight, 0.28, suction);
  }
  function lightBackground(t) {
    ctx.fillStyle = C.lino; ctx.fillRect(-40, -40, W + 80, H + 80);
    const g = ctx.createRadialGradient(W / 2, H * 0.34, 0, W / 2, H * 0.34, H * 0.8);
    g.addColorStop(0, "rgba(251,248,244,1)"); g.addColorStop(1, "rgba(232,220,207,0.9)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    particles(t, C.nogal, 0.12, 0);
  }
  function particles(t, color, alpha, suction) {
    ctx.save(); ctx.fillStyle = color;
    for (const d of dust) {
      let x = (d.x + Math.sin(t * 0.6 + d.ph) * d.sw) % W;
      let y = ((d.y - t * d.v) % H + H) % H;
      if (suction > 0) { const e = inCubic(suction); x = lerp(x, W / 2, e); y = lerp(y, 760, e); }
      ctx.globalAlpha = alpha * (0.5 + 0.5 * Math.sin(t * 2 + d.ph)) * (1 - suction * 0.6);
      ctx.beginPath(); ctx.arc(x, y, d.s, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  // ------------------------------------------------------------------ scenes
  function sceneIntro(t) {
    const suck = prog(t, bar(1, 2.4), 0.8);
    darkBackground(t, { leak: 0.7 + 0.3 * prog(t, 0, 3), suction: suck });
    const cx = W / 2;
    // hairline and the three words of the question, one per beat
    hline(cx, 1150, 560 * outQuint(prog(t, 0.1, 1.2)) * (1 - inCubic(prog(t, 2.6, 0.6))), C.laton, 3);
    const out = inCubic(prog(t, 2.6, 0.7));
    ctx.save(); ctx.globalAlpha = 1 - out; ctx.translate(0, -90 * out);
    const [w1, w2, w3] = T.introWords;
    riseText(w1.text, cx, 820, 124, F.display(124), C.marfil, prog(t, w1.t - 0.1, 0.6));
    riseText(w2.text, cx, 960, 124, F.display(124), C.marfil, prog(t, w2.t - 0.1, 0.6));
    riseText(w3.text, cx, 1090, 118, F.italic(118), C.latonLight, prog(t, w3.t - 0.1, 0.6));
    ctx.restore();
    // the seal's two rings draw themselves, then contract into the stamp
    const contract = inCubic(prog(t, bar(1, 2.4), 0.8));
    const r1 = lerp(430, 270 * 0.925, contract), r2 = lerp(330, 270 * 0.64, contract);
    ringStroke(cx, lerp(960, 760, contract), r1, C.laton, 3, outCubic(prog(t, bar(1, 0), 1.2)), -Math.PI / 2, 0.9);
    ringStroke(cx, lerp(960, 760, contract), r2, C.latonLight, 2, outCubic(prog(t, bar(1, 0.5), 1.2)), Math.PI / 2, 0.8);
  }

  function sceneStamp(t) {
    darkBackground(t);
    const t0 = bar(2), cx = W / 2, cy = 760, R = 270;
    const s = outQuint(prog(t, t0, 0.35));
    const exit = inCubic(prog(t, bar(3, 3), 0.5));
    ctx.save(); ctx.globalAlpha = 1 - exit; ctx.translate(cx, H / 2); ctx.scale(1 - 0.06 * exit, 1 - 0.06 * exit); ctx.translate(-cx, -H / 2);
    // shockwave
    const sw = prog(t, t0, 0.8);
    if (sw > 0 && sw < 1) ringStroke(cx, cy, R * lerp(1, 1.9, outCubic(sw)), C.latonLight, 6 * (1 - sw), 1, 0, 1 - sw);
    seal(cx, cy, R, C.marfil, { scale: lerp(1.28, 1, s), alpha: clamp(prog(t, t0, 0.06)), textRot: lerp(-0.45, 0, outQuint(prog(t, t0, 0.9))) });
    // wordmark, rule, descriptor with tracking-in
    const letters = "N.A.R.";
    const size = 150, font = F.display(size), sp = 6;
    const total = measure(letters, font, sp);
    let x = cx - total / 2;
    for (let i = 0; i < letters.length; i++) {
      const ch = letters[i], w = measure(ch, font, sp);
      riseText(ch, x + w / 2, 1250, size, font, C.marfil, prog(t, t0 + 0.45 + i * 0.05, 0.6));
      x += w;
    }
    hline(cx, 1300, 440 * outQuint(prog(t, t0 + 0.8, 0.7)), C.laton, 3);
    const dp = prog(t, t0 + 1.0, 0.9);
    text("ABOGADOS & ASOCIADOS", cx, 1360, F.sans(30, 600), C.marfil, { alpha: 0.9 * outCubic(dp), spacing: lerp(26, 11, outQuint(dp)) });
    // location: the only bounce in the system, the pin
    const lt = T.location.t;
    const pin = prog(t, lt, 0.7);
    if (pin > 0) {
      const y = lerp(1380, 1500, outBack(pin, 2.2));
      ctx.save(); ctx.globalAlpha *= clamp(pin * 3); icon("map-pin", cx, y, 64, C.latonLight, 1, 1.6); ctx.restore();
    }
    riseText(T.location.text, cx, 1620, 64, F.italic(64), C.nogalDark, prog(t, lt + 0.2, 0.6));
    riseText(T.location.sub.toUpperCase(), cx, 1680, 26, F.sans(26, 600), C.mutedDark, prog(t, lt + 0.45, 0.6), { spacing: 8 });
    ctx.restore();
  }

  function sceneService(i, t) {
    const s = T.services[i], t0 = bar(4 + i), cx = W / 2;
    darkBackground(t, { leak: 0.8 });
    const local = t - t0;
    // the card: the firm's ivory post card on the dark desk
    const zoom = 1 + 0.02 * clamp(local / 2);
    const pl = pulse(t);
    ctx.save(); ctx.translate(cx, H / 2); ctx.scale(zoom, zoom); ctx.translate(-cx, -H / 2);
    ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.45)"; ctx.shadowBlur = 60; ctx.shadowOffsetY = 24;
    roundRect(72, 250, W - 144, 1420, 70, C.card); ctx.restore();
    // progress: which of the five services
    for (let k = 0; k < 5; k++) {
      ctx.beginPath(); ctx.arc(cx - 64 + k * 32, 330, k === i ? 8 : 5, 0, Math.PI * 2);
      ctx.fillStyle = k === i ? C.nogal : C.nogalSoft; ctx.fill();
    }
    // icon disc
    const dp = outQuint(prog(t, t0 - 0.15, 0.55));
    const dr = 120 * dp * (1 + 0.035 * pl);
    ctx.beginPath(); ctx.arc(cx, 560, dr, 0, Math.PI * 2); ctx.fillStyle = C.nogalSoft; ctx.fill();
    ringStroke(cx, 560, 142 * dp, C.laton, 2, outCubic(prog(t, t0, 0.8)), -Math.PI / 2, 0.8);
    icon(s.icon, cx, 560, 132, C.nogal, prog(t, t0 + 0.05, 0.7), 1.5);
    // area, title, items
    riseText(s.area.toUpperCase(), cx, 790, 28, F.sans(28, 600), C.inkMuted, prog(t, t0 + 0.1, 0.5), { spacing: 9 });
    const tSize = s.title.length > 1 ? 112 : 128;
    s.title.forEach((line, k) => riseText(line, cx, 920 + k * 116, tSize, F.display(tSize), C.ink, prog(t, t0 + 0.18 + k * 0.08, 0.6)));
    const top = 920 + (s.title.length - 1) * 116 + 120;
    hline(cx, top - 20, 120 * outQuint(prog(t, t0 + 0.4, 0.5)), C.laton, 3);
    const times = T.serviceItemTimes(i);
    s.items.forEach((it, k) => {
      const p = prog(t, times[k] - 0.05, 0.45);
      if (p <= 0) return;
      const e = outQuint(p), y = top + 70 + k * 84;
      ctx.save(); ctx.globalAlpha *= clamp(p * 2);
      const font = F.sans(46, 400), w = measure(it, font);
      const x0 = cx - w / 2 + 18 + (1 - e) * 50;
      ctx.beginPath(); ctx.arc(x0 - 30, y - 15, 7 * e, 0, Math.PI * 2); ctx.fillStyle = C.laton; ctx.fill();
      text(it, x0, y, font, C.ink, { align: "left", alpha: 0.92 });
      ctx.restore();
    });
    // signature at the foot of the card
    text("N.A.R.", cx, 1590, F.display(40), C.nogal, { spacing: 3 });
    text("ABOGADOS & ASOCIADOS", cx, 1626, F.sans(15, 600), C.inkMuted, { spacing: 5 });
    ctx.restore();
  }

  function sceneValues(t) {
    darkBackground(t, { leak: 0.9 });
    const cx = W / 2;
    const out = inCubic(prog(t, T.caseLine.t - 0.2, 0.45));
    ctx.save(); ctx.globalAlpha = 1 - out; ctx.translate(0, -120 * out);
    riseText("POR QUÉ ELEGIRNOS", cx, 560, 28, F.sans(28, 600), C.latonLight, prog(t, bar(9) - 0.2, 0.5), { spacing: 10 });
    T.values.forEach((v, k) => {
      const p = prog(t, v.t - 0.08, 0.55), y = 760 + k * 230;
      if (p <= 0) return;
      const e = outQuint(p), x = 180 + (1 - e) * -60;
      ctx.save(); ctx.globalAlpha *= clamp(p * 2);
      ctx.beginPath(); ctx.arc(x + 70, y, 70 * (0.6 + 0.4 * e) * (1 + 0.04 * pulse(t)), 0, Math.PI * 2); ctx.fillStyle = C.nogalSoftDark; ctx.fill();
      icon(v.icon, x + 70, y, 70, C.latonLight, prog(t, v.t, 0.6), 1.6);
      ctx.restore();
      riseText(v.text, x + 175, y + 18, 50, F.sans(50, 500), C.marfil, p, { align: "left" });
    });
    ctx.restore();
    const c = T.caseLine;
    riseText("Cada caso", cx, 900, 136, F.display(136), C.marfil, prog(t, c.t, 0.6));
    riseText("es diferente.", cx, 1050, 128, F.italic(128), C.latonLight, prog(t, c.t + BEAT / 2, 0.6));
    hline(cx, 1150, 300 * outQuint(prog(t, c.t + 0.6, 0.8)), C.laton, 3);
  }

  function sceneLema(t) {
    const t0 = bar(11), cx = W / 2;
    const push = prog(t, t0, 4);
    darkBackground(t, { leak: 0.6 + 0.8 * push });
    const exit = inCubic(prog(t, bar(12, 3), 0.5));
    ctx.save();
    const z = 1 + 0.05 * push + 0.22 * exit;
    ctx.translate(cx, H / 2); ctx.scale(z, z); ctx.translate(-cx, -H / 2); ctx.globalAlpha = 1 - exit;
    const lines = [0, 1].map((l) => T.lemaWords.filter((w) => w.line === l));
    const size = 100, font = F.italic(size), gap = measure(" ", font);
    lines.forEach((ws, l) => {
      const total = ws.reduce((a, w) => a + measure(w.text, font), 0) + gap * (ws.length - 1);
      let x = cx - total / 2;
      ws.forEach((w) => {
        const ww = measure(w.text, font);
        riseText(w.text, x + ww / 2, 890 + l * 132, size, font, l === 0 ? C.marfil : C.nogalDark, prog(t, w.t - 0.08, 0.8));
        x += ww + gap;
      });
    });
    hline(cx, 1100, 360 * outQuint(prog(t, bar(12, 2), 0.9)), C.laton, 3);
    riseText("N.A.R. ABOGADOS & ASOCIADOS", cx, 1170, 24, F.sans(24, 600), C.mutedDark, prog(t, bar(12, 2.5), 0.6), { spacing: 8 });
    ctx.restore();
  }

  function sceneClose(t) {
    lightBackground(t);
    const t0 = bar(13), cx = W / 2, cy = 600, R = 240, K = T.contact;
    const s = outQuint(prog(t, t0, 0.35));
    const sw = prog(t, t0, 0.9);
    if (sw > 0 && sw < 1) ringStroke(cx, cy, R * lerp(1, 2, outCubic(sw)), C.nogal, 7 * (1 - sw), 1, 0, (1 - sw) * 0.7);
    seal(cx, cy, R * (1 + 0.012 * pulse(t)), C.nogal, { scale: lerp(1.25, 1, s), alpha: clamp(prog(t, t0, 0.06)), textRot: lerp(0.5, 0, outQuint(prog(t, t0, 1))) });
    riseText("N.A.R.", cx, 1010, 132, F.display(132), C.nogal, prog(t, t0 + 0.35, 0.6), { spacing: 6 });
    const dp = prog(t, t0 + 0.55, 0.9);
    text("ABOGADOS & ASOCIADOS", cx, 1066, F.sans(28, 600), C.ink, { alpha: outCubic(dp), spacing: lerp(22, 10, outQuint(dp)) });
    riseText("Tu tranquilidad, nuestra prioridad", cx, 1130, 40, F.italic(40), C.nogal, prog(t, t0 + 0.8, 0.6));
    // call to action
    const cp = prog(t, K.t.cta, 0.5);
    if (cp > 0) {
      const e = outBack(cp, 1.4), bw = 640, bh = 116;
      ctx.save(); ctx.globalAlpha *= clamp(cp * 3); ctx.translate(cx, 1266); ctx.scale(e, e);
      roundRect(-bw / 2, -bh / 2, bw, bh, bh / 2, C.nogal);
      text(K.cta, -24, 16, F.sans(44, 600), C.card);
      icon("arrow-right", bw / 2 - 78, 0, 44, C.card, prog(t, K.t.cta + 0.2, 0.4), 2);
      ctx.restore();
    }
    // the contact strip: four numbers, two by two
    const sp = outQuint(prog(t, K.t.phones - 0.1, 0.5));
    if (sp > 0) {
      ctx.save(); ctx.globalAlpha *= sp;
      roundRect(90, 1370, W - 180, 250, 60, C.nogalSoft);
      ctx.beginPath(); ctx.arc(190, 1495, 54, 0, Math.PI * 2); ctx.fillStyle = C.nogal; ctx.fill();
      icon("phone", 190, 1495, 50, C.card, prog(t, K.t.phones, 0.6), 1.8);
      ctx.restore();
      K.phones.forEach((n, k) => {
        const col = k % 2, row = Math.floor(k / 2);
        riseText(n, 300 + col * 340, 1470 + row * 80, 44, F.sans(44, 600), C.ink, prog(t, K.t.phones + 0.08 + k * 0.12, 0.5), { align: "left" });
      });
    }
    const ap = prog(t, K.t.address, 0.5);
    if (ap > 0) { ctx.save(); ctx.globalAlpha *= clamp(ap * 2); icon("map-pin", 250, 1700, 38, C.nogal, ap, 1.8); ctx.restore(); }
    riseText(K.address, 290, 1714, 36, F.sans(36, 500), C.inkMuted, ap, { align: "left" });
    const hp = prog(t, K.t.handle, 0.5);
    if (hp > 0) { ctx.save(); ctx.globalAlpha *= clamp(hp * 2); icon("message-circle", 250, 1782, 38, C.nogal, hp, 1.8); ctx.restore(); }
    riseText(K.handle, 290, 1796, 36, F.sans(36, 500), C.inkMuted, hp, { align: "left" });
  }

  // ------------------------------------------------------------------ sequencing
  const segments = [
    { start: 0, end: bar(2), draw: sceneIntro },
    { start: bar(2), end: bar(4), draw: sceneStamp },
    ...T.services.map((_, i) => ({ start: bar(4 + i), end: bar(5 + i), draw: (t) => sceneService(i, t) })),
    { start: bar(9), end: bar(11), draw: sceneValues },
    { start: bar(11), end: bar(13), draw: sceneLema },
    { start: bar(13), end: T.DURATION + 1, draw: sceneClose },
  ];
  const WIPE = 0.32; // half-length of a wipe, seconds

  // Diagonal wipe: the new scene is revealed behind a slanted edge carrying a nogal band and a brass hairline.
  function wipe(t, tw, from, to) {
    const p = inOutCubic(clamp((t - (tw - WIPE)) / (2 * WIPE)));
    const slant = Math.tan((18 * Math.PI) / 180) * H;
    const e = lerp(-slant - 200, W + 200, p);
    from(t);
    ctx.save();
    ctx.beginPath(); ctx.moveTo(-10, -10); ctx.lineTo(e + slant / 2, -10); ctx.lineTo(e - slant / 2, H + 10); ctx.lineTo(-10, H + 10); ctx.closePath();
    ctx.clip(); to(t); ctx.restore();
    const band = 110;
    ctx.save();
    ctx.beginPath(); ctx.moveTo(e + slant / 2, -10); ctx.lineTo(e + slant / 2 + band, -10); ctx.lineTo(e - slant / 2 + band, H + 10); ctx.lineTo(e - slant / 2, H + 10); ctx.closePath();
    ctx.fillStyle = C.nogal; ctx.fill();
    ctx.strokeStyle = C.latonLight; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(e + slant / 2 + band, -10); ctx.lineTo(e - slant / 2 + band, H + 10); ctx.stroke();
    ctx.restore();
  }

  function drawFrame(t) {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    // camera shake on the two hits
    for (const h of T.hits) {
      const d = t - h;
      if (d >= 0 && d < 0.45) { const a = 14 * Math.exp(-d * 10); ctx.translate(Math.sin(d * 97) * a, Math.cos(d * 83) * a); }
    }
    const i = segments.findIndex((s) => t >= s.start && t < s.end);
    const seg = segments[Math.max(0, i)];
    const next = segments[i + 1], prev = segments[i - 1];
    const isWipe = (tw) => T.wipes.some((w) => Math.abs(w - tw) < 1e-6);
    if (next && isWipe(next.start) && t > next.start - WIPE) wipe(t, next.start, seg.draw, next.draw);
    else if (prev && isWipe(seg.start) && t < seg.start + WIPE) wipe(t, seg.start, prev.draw, seg.draw);
    else if (next && next.start === bar(11) && t > next.start - 0.4) {
      // values → motto: a soft crossfade into the breakdown
      seg.draw(t); ctx.save(); ctx.globalAlpha *= clamp((t - (next.start - 0.4)) / 0.4); next.draw(t); ctx.restore();
    } else seg.draw(t);
    ctx.restore();

    // flash on the hits
    for (const h of T.hits) {
      const d = t - h;
      if (d >= 0 && d < 0.5) { ctx.fillStyle = C.marfil; ctx.globalAlpha = 0.55 * Math.exp(-d * 9); ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
    }
    // film grain
    if (grain.length) {
      ctx.save(); ctx.globalAlpha = 0.07; ctx.globalCompositeOperation = "overlay";
      ctx.drawImage(grain[Math.floor(t * T.FPS) % grain.length], 0, 0, W, H);
      ctx.restore();
    }
    // fade in / out
    const fadeIn = 1 - clamp(t / 0.4), fadeOut = clamp((t - T.contact.t.fade) / (T.DURATION - T.contact.t.fade));
    const f = Math.max(fadeIn, fadeOut);
    if (f > 0) { ctx.fillStyle = C.espressoDeep; ctx.globalAlpha = f; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
  }

  window.drawFrame = drawFrame;
  window.renderFrame = (n) => drawFrame(n / T.FPS);
})();
