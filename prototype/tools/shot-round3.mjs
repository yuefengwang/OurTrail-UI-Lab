// OurTrail Round 3 — 单页截图（Playwright, headless chromium）
// 用法:
//   node tools/shot-round3.mjs --view=editorial --vp=390 --kind=fold
//   node tools/shot-round3.mjs --view=curated --vp=375 --kind=full
//   node tools/shot-round3.mjs --view=hybrid --vp=414 --kind=fold --state=empty
// 参数: --view --vp --kind(fold|full) --state --wait --out
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const OUT = fileURLToPath(new URL('../round3/screenshots/', import.meta.url));
const BASE = process.env.R3_BASE || 'http://127.0.0.1:4173/round3/index.html';

const args = Object.fromEntries(
  process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => {
    const [k, v] = a.slice(2).split('=');
    return [k, v === undefined ? true : v];
  })
);

const view = String(args.view || 'editorial');
const vp = Number(args.vp || 390);
const kind = String(args.kind || 'fold');
const stateFlag = args.state ? String(args.state) : '';
const wait = Number(args.wait || 250);
const height = vp === 375 ? 667 : vp === 414 ? 896 : 844;
const url = `${BASE}?view=${view}&vp=${vp}&bare=1${stateFlag ? `&state=${stateFlag}` : ''}`;

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: vp, height } });

await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__LAB_READY__ === true, null, { timeout: 15000 });
await page.waitForTimeout(wait);

if (kind === 'full') {
  // 展开 html→.lab→.device→#app→.page 的滚动链，让内层滚动内容进入文档高度
  await page.evaluate(async () => {
    for (const el of document.querySelectorAll('html, body, .lab, .lab__stage, .device, .device__screen, #app, .page')) {
      el.style.height = 'auto';
      el.style.minHeight = '0';
      el.style.maxHeight = 'none';
      el.style.overflow = 'visible';
      el.style.flex = 'none';
    }
    // 底部 sticky/fixed 操作条在 fullPage 捕获中会遮挡正文 → 改为流内静态
    for (const el of document.querySelectorAll('*')) {
      const pos = getComputedStyle(el).position;
      if (pos === 'fixed' || pos === 'sticky') el.style.setProperty('position', 'static', 'important');
    }
    const imgs = [...document.querySelectorAll('img')];
    imgs.forEach((img) => { img.loading = 'eager'; });
    await Promise.all(imgs.map((img) => (img.decode ? img.decode().catch(() => {}) : 0)));
  });
  await page.waitForTimeout(120);
}

const name = args.out
  ? String(args.out)
  : `${view}-${vp}-${kind}${stateFlag ? `-${stateFlag}` : ''}.png`;
await page.screenshot({ path: OUT + name, fullPage: kind === 'full' });
console.log('✓', OUT + name);
await browser.close();
