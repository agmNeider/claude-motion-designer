// Exports every SVG in final/ to PNG with a transparent background: node brand/logo/export_png.js
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs = require('fs'), path = require('path');
const dir = path.join(__dirname, 'final');
(async () => {
  const b = await chromium.launch();
  for (const f of fs.readdirSync(dir).filter((f) => f.endsWith('.svg'))) {
    const svg = fs.readFileSync(path.join(dir, f), 'utf8');
    const [, w, h] = svg.match(/width="(\d+)" height="(\d+)"/);
    const scale = f.includes('perfil') ? 1 : 2;
    const p = await b.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: scale });
    await p.setContent(`<style>html,body{margin:0;background:transparent}</style>${svg}`);
    await p.screenshot({ path: path.join(dir, f.replace('.svg', '.png')), omitBackground: true });
    await p.close();
  }
  await b.close();
})();
