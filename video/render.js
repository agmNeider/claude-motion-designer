/*
 * Renders the N.A.R. video: synthesizes the music, captures every frame from index.html in headless
 * Chromium and pipes them to ffmpeg (H.264 + AAC, 1080×1920, 30 fps).
 *
 *   node video/render.js                      → video/out/nar-abogados.mp4
 *   node video/render.js --stills 4.2,9.5     → video/out/stills/*.png (quick visual checks)
 *
 * Needs Playwright's Chromium and an ffmpeg binary (FFMPEG env var, or imageio-ffmpeg's, or ffmpeg on PATH).
 */
const { chromium } = require(process.env.PLAYWRIGHT || "/opt/node22/lib/node_modules/playwright");
const { spawn, execFileSync } = require("child_process");
const fs = require("fs");
const http = require("http");
const path = require("path");
const T = require("./timeline");

const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(__dirname, "out");
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".wav": "audio/wav" };

function findFfmpeg() {
  if (process.env.FFMPEG) return process.env.FFMPEG;
  try { return execFileSync("python3", ["-c", "import imageio_ffmpeg as i; print(i.get_ffmpeg_exe())"]).toString().trim(); } catch (e) { return "ffmpeg"; }
}

function serve() {
  const server = http.createServer((req, res) => {
    const file = path.join(ROOT, decodeURIComponent(req.url.split("?")[0]));
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream" });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((ok) => server.listen(0, "127.0.0.1", () => ok(server)));
}

(async () => {
  const args = process.argv.slice(2);
  const stills = args.includes("--stills") ? args[args.indexOf("--stills") + 1].split(",").map(Number) : null;
  fs.mkdirSync(OUT, { recursive: true });

  if (!stills) execFileSync("node", [path.join(__dirname, "music.js"), path.join(OUT, "musica.wav")], { stdio: "inherit" });

  const server = await serve();
  const url = `http://127.0.0.1:${server.address().port}/video/index.html`;
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 540, height: 960 } });
  page.on("pageerror", (e) => console.error("page error:", e.message));
  await page.goto(url);
  await page.evaluate(() => { document.body.classList.add("render"); return window.SCENE_READY; });

  const grab = (fn, arg, type) => page.evaluate(([n, ty]) => {
    window.renderFrame(n);
    return document.getElementById("c").toDataURL(ty, 0.95).split(",")[1];
  }, [arg, type]);

  if (stills) {
    const dir = path.join(OUT, "stills");
    fs.mkdirSync(dir, { recursive: true });
    for (const s of stills) {
      const b64 = await grab(null, Math.round(s * T.FPS), "image/png");
      fs.writeFileSync(path.join(dir, `t${s.toFixed(2).padStart(5, "0")}.png`), Buffer.from(b64, "base64"));
    }
    console.log(`wrote ${stills.length} stills to ${dir}`);
  } else {
    const total = Math.round(T.DURATION * T.FPS);
    const mp4 = path.join(OUT, "nar-abogados.mp4");
    const ff = spawn(findFfmpeg(), [
      "-y", "-loglevel", "error",
      "-f", "image2pipe", "-framerate", String(T.FPS), "-c:v", "mjpeg", "-i", "-",
      "-i", path.join(OUT, "musica.wav"),
      "-c:v", "libx264", "-preset", "slow", "-crf", "17", "-pix_fmt", "yuv420p", "-r", String(T.FPS),
      "-c:a", "aac", "-b:a", "256k", "-shortest", "-movflags", "+faststart", mp4,
    ], { stdio: ["pipe", "inherit", "inherit"] });
    const started = Date.now();
    for (let n = 0; n < total; n++) {
      const buf = Buffer.from(await grab(null, n, "image/jpeg"), "base64");
      if (!ff.stdin.write(buf)) await new Promise((ok) => ff.stdin.once("drain", ok));
      if (n % 60 === 0) console.log(`frame ${n}/${total} · ${((Date.now() - started) / 1000).toFixed(0)} s`);
    }
    ff.stdin.end();
    await new Promise((ok, fail) => ff.on("close", (code) => (code === 0 ? ok() : fail(new Error("ffmpeg exited " + code)))));
    console.log(`wrote ${mp4}`);
  }
  await browser.close();
  server.close();
})().catch((e) => { console.error(e); process.exit(1); });
