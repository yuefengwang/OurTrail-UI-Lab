// OurTrail Round 4 — 单页截图（Playwright, headless chromium）
// 用法:
//   node tools/shot-round4.mjs --view=hybrid --vp=390 --kind=fold
//   node tools/shot-round4.mjs --view=hybrid --vp=390 --kind=fold --scroll=seam
//   node tools/shot-round4.mjs --view=hybrid --vp=390 --kind=full --out=baseline/hybrid-390-full.png
// 参数: --view --vp --kind(fold|full) --state --scroll(<px>|seam|rail|mid|bottom) --out --wait
// 输出目录: prototype/round4/screenshots/
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = fileURLToPath(new URL('../round4/screenshots/', import.meta.url));
const BASE = process.env.R4_BASE || 'http://127.0.0.1:4174/round4/index.html';

const args = Object.fromEntries(
  process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => {
    const [k, v] = a.slice(2).split('=');
    return [k, v === undefined ? true : v];
  })
);

const view = String(args.view || 'hybrid');
const vp = Number(args.vp || 390);
const kind = String(args.kind || 'fold');
const stateFlag = args.state ? String(args.state) : '';
const scrollArg = args.scroll !== undefined ? String(args.scroll) : '';
const wait = Number(args.wait || 300);
const height = vp === 375 ? 667 : vp === 414 ? 896 : 844;
const url = `${BASE}?view=${view}&vp=${vp}&bare=1${stateFlag ? `&state=${stateFlag}` : ''}`;

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: vp, height } });
await page.emulateMedia({ reducedMotion: 'reduce' });

await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__LAB_READY__ === true, null, { timeout: 15000 });
await page.waitForTimeout(wait);

if (kind === 'full') {
  // 展开 html→lab→device→app→page 的滚动链，让内层滚动内容进入文档高度
  await page.evaluate(async () => {
    for (const el of document.querySelectorAll('html, body, .lab, .lab__stage, .device, .device__screen, #app, .page')) {
      el.style.height = 'auto';
      el.style.minHeight = '0';
      el.style.maxHeight = 'none';
      el.style.overflow = 'visible';
      el.style.flex = 'none';
    }
    // 固定/吸顶元素在整页长图中会遮挡正文 → 改为流内静态
    for (const el of document.querySelectorAll('*')) {
      const pos = getComputedStyle(el).position;
      if (pos === 'fixed' || pos === 'sticky') el.style.setProperty('position', 'static', 'important');
    }
    const imgs = [...document.querySelectorAll('img')];
    imgs.forEach((img) => { img.loading = 'eager'; });
    await Promise.all(imgs.map((img) => (img.decode ? img.decode().catch(() => {}) : 0)));
  });
  await page.waitForTimeout(150);
} else if (scrollArg) {
  await page.evaluate(async (arg) => {
    const pageEl = document.querySelector('.page');
    const top = (node) => node.getBoundingClientRect().top - pageEl.getBoundingClientRect().top + pageEl.scrollTop;
    let target = 0;
    if (arg === 'seam') {
      const seam = document.querySelector('[data-testid="r3-seam"]');
      target = seam ? top(seam) : 0;
    } else if (arg === 'rail') {
      const rail = document.querySelector('[data-testid="r3-rail"]');
      target = rail ? Math.max(0, top(rail) - 110) : 0;
    } else if (arg === 'mid') {
      target = Math.round(pageEl.scrollHeight * 0.5);
    } else if (arg === 'bottom') {
      target = pageEl.scrollHeight;
    } else {
      target = Number(arg) || 0;
    }
    pageEl.scrollTop = target;
    await new Promise((r) => setTimeout(r, 260));
  }, scrollArg);
  await page.waitForTimeout(200);
}

const suffix = `${stateFlag ? `-${stateFlag}` : ''}${scrollArg ? `-s${scrollArg}` : ''}`;
const name = args.out ? String(args.out) : `${view}-${vp}-${kind}${suffix.replace(/-s/g, '-scroll-')}.png`;
const path = OUT + name;
await mkdir(dirname(path), { recursive: true });
await page.screenshot({ path, fullPage: kind === 'full' });
console.log('✓', path);
await browser.close();
