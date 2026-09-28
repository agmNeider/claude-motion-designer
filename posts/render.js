/*
 * Exports the Instagram posts in posts.html to PNG (1080×1350): node posts/render.js → posts/out/*.png
 */
const { chromium } = require(process.env.PLAYWRIGHT || "/opt/node22/lib/node_modules/playwright");
const fs = require("fs");
const http = require("http");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(__dirname, "out");
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".svg": "image/svg+xml", ".woff2": "font/woff2" };
const NAMES = ["1-todas-las-ramas", "2-tutela-10-dias", "3-derecho-de-peticion", "4-cuota-alimentaria", "5-agenda-tu-consulta"];

(async () => {
  const server = http.createServer((req, res) => {
    const file = path.join(ROOT, decodeURIComponent(req.url.split("?")[0]));
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream" });
    fs.createReadStream(file).pipe(res);
  });
  await new Promise((ok) => server.listen(0, "127.0.0.1", ok));
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 1500 } });
  page.on("pageerror", (e) => console.error("page error:", e.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/posts/posts.html`);
  await page.evaluate(() => window.POSTS_READY);
  const posts = await page.$$("section.post");
  for (let i = 0; i < posts.length; i++) {
    const file = path.join(OUT, `nar-post-${NAMES[i] || i + 1}.png`);
    await posts[i].screenshot({ path: file });
    console.log("wrote", path.relative(ROOT, file));
  }
  await browser.close();
  server.close();
})().catch((e) => { console.error(e); process.exit(1); });
