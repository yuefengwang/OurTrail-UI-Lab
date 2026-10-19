// OurTrail Round 3 — 截图矩阵与交互证据
// 用法 (在 prototype/ 下运行):
//   node tools/capture-round3.mjs                         # 三方案 × 375/390/414 × fold/full
//   node tools/capture-round3.mjs --view=editorial --vp=390 --kind=fold
//   node tools/capture-round3.mjs --states                # 追加 空/错/加载/禁用（390 fold）
//   node tools/capture-round3.mjs --interactions          # 追加 过滤/搜索/空态/横滑/吸顶证据
//   node tools/capture-round3.mjs --compare               # 生成三方案对照表
//   node tools/capture-round3.mjs --only=compare          # 只跑指定阶段: matrix|states|interactions|compare
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

const VIEWS = args.view ? String(args.view).split(',') : ['editorial', 'curated', 'hybrid'];
const VIEWPORTS = args.vp ? String(args.vp).split(',').map(Number) : [375, 390, 414];
const KINDS = args.kind ? String(args.kind).split(',') : ['fold', 'full'];
const ONLY = args.only ? String(args.only) : '';
const runMatrix = !ONLY || ONLY === 'matrix';

const heightFor = (vp) => (vp === 375 ? 667 : vp === 414 ? 896 : 844);
const consoleErrors = [];

async function open(page, view, vp = 390, state = '') {
  const height = heightFor(vp);
  await page.setViewportSize({ width: vp, height });
  const url = `${BASE}?view=${view}&vp=${vp}&bare=1${state ? `&state=${state}` : ''}`;
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__LAB_READY__ === true, null, { timeout: 15000 });
  await page.waitForTimeout(180);
}

async function expandForFull(page) {
  await page.evaluate(async () => {
    for (const el of document.querySelectorAll('html, body, .lab, .lab__stage, .device, .device__screen, #app, .page')) {
      el.style.height = 'auto';
      el.style.minHeight = '0';
      el.style.maxHeight = 'none';
      el.style.overflow = 'visible';
      el.style.flex = 'none';
    }
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

async function shoot(page, view, vp, kind, state = '') {
  await open(page, view, vp, state);
  if (kind === 'full') await expandForFull(page);
  const suffix = state ? `-${state}` : '';
  const name = `${view}-${vp}-${kind}${suffix}.png`;
  await page.screenshot({ path: OUT + name, fullPage: kind === 'full' });
  console.log('  ✓', name);
}

async function shotNow(page, name) {
  await page.waitForTimeout(220);
  await page.screenshot({ path: OUT + name });
  console.log('  ✓', name);
}

async function clickTab(page, label) {
  const tab = page.locator('.seg__item, [role="tab"]').filter({ hasText: label }).first();
  if (!(await tab.count())) return false;
  await tab.click();
  await page.waitForTimeout(280);
  return true;
}

async function fillSearch(page, text) {
  const input = page.locator('input[type="search"], [data-testid="r3-search"] input, input[data-testid="r3-search"]').first();
  if (!(await input.count())) return false;
  await input.click();
  await input.fill(text);
  await page.waitForTimeout(320);
  return true;
}

async function interactions(page, view) {
  await open(page, view);
  const created = [];

  if (await clickTab(page, '已成行')) {
    const name = `${view}-filter-formed-390-fold.png`;
    await shotNow(page, name); created.push(name);
  }
  await open(page, view);
  if (await fillSearch(page, '牛背山')) {
    const name = `${view}-search-a7-390-fold.png`;
    await shotNow(page, name); created.push(name);
  }
  await open(page, view);
  if (await fillSearch(page, 'zzzz')) {
    const name = `${view}-search-empty-390-fold.png`;
    await shotNow(page, name); created.push(name);
  }

  if (view === 'hybrid') {
    await open(page, view);
    // 1) 横滑轨：滚动到轨道位置并左移
    const railMoved = await page.evaluate(() => {
      const root = document.querySelector('[data-testid="r3-rail"]');
      const pageEl = document.querySelector('.page');
      if (!root || !pageEl) return false;
      pageEl.scrollTop = Math.max(0, root.getBoundingClientRect().top + pageEl.scrollTop - 120);
      const all = [root, ...root.querySelectorAll('*')];
      const scroller = all.find((el) => el.scrollWidth > el.clientWidth + 4);
      if (!scroller) return false;
      scroller.scrollLeft = 260;
      return true;
    });
    if (railMoved) {
      const name = 'hybrid-rail-scrolled-390-fold.png';
      await shotNow(page, name); created.push(name);
    } else {
      console.log('  ! hybrid: 未找到可滚动轨道（r3-rail / overflow）');
    }
    // 2) 接缝带 sticky：向下滚过接缝
    const seamScrolled = await page.evaluate(() => {
      const seam = document.querySelector('[data-testid="r3-seam"]');
      const pageEl = document.querySelector('.page');
      if (!seam || !pageEl) return false;
      pageEl.scrollTop = seam.getBoundingClientRect().top + pageEl.scrollTop + 360;
      return true;
    });
    if (seamScrolled) {
      const name = 'hybrid-seam-sticky-390-fold.png';
      await shotNow(page, name); created.push(name);
    } else {
      console.log('  ! hybrid: 未找到接缝带（r3-seam）');
    }
  }

  return created;
}

async function shootCompare(page, vp = 390, scale = 0.62) {
  const cellW = Math.round(vp * scale);
  const gridW = VIEWS.length * cellW + (VIEWS.length - 1) * 22 + 64 + 20;
  const compareUrl = `${BASE.replace('index.html', 'compare.html')}?views=${VIEWS.join(',')}&vp=${vp}&scale=${scale}`;
  await page.setViewportSize({ width: gridW, height: 1000 });
  await page.goto(compareUrl, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  const name = `compare-round3-layouts-${vp}.png`;
  await page.screenshot({ path: OUT + name, fullPage: true });
  console.log('  ✓', name);
}

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
page.on('pageerror', (err) => consoleErrors.push(String(err)));
page.on('console', (msg) => {
  if (msg.type() !== 'error') return;
  const t = msg.text();
  if (/favicon/i.test(t)) return;
  consoleErrors.push(t);
});

if (runMatrix) {
  for (const view of VIEWS) {
    for (const vp of VIEWPORTS) {
      for (const kind of KINDS) {
        await shoot(page, view, vp, kind);
      }
    }
  }
}

if (args.states || ONLY === 'states') {
  for (const view of VIEWS) {
    for (const state of ['empty', 'error', 'loading', 'disabled']) {
      await shoot(page, view, 390, 'fold', state);
    }
  }
}

if (args.interactions || ONLY === 'interactions') {
  for (const view of VIEWS) {
    console.log(`[interactions] ${view}`);
    await interactions(page, view);
  }
}

if (args.compare || ONLY === 'compare') {
  await shootCompare(page);
}

await browser.close();

if (consoleErrors.length) {
  console.log('\n[console errors]');
  for (const e of consoleErrors) console.log('  ✗', e);
  process.exitCode = 1;
} else {
  console.log('\n[console] 0 errors');
}
console.log('[capture-round3] done →', OUT);
