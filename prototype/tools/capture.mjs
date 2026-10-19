// OurTrail Visual Direction Lab — 截图驱动（Playwright, headless chromium）
// 用法:
//   node tools/capture.mjs                     # 全矩阵: 7 风格 × 4 页面 × 3 视口 (fold + full)
//   node tools/capture.mjs --style=A,C        # 只截图指定风格
//   node tools/capture.mjs --page=discover    # 只截图指定页面
//   node tools/capture.mjs --vp=390           # 只截图指定视口
//   node tools/capture.mjs --kind=full         # 只截图指定类型: fold(首屏) / full(整页)
//   node tools/capture.mjs --states           # 追加交互状态组图 (collab 的空/错误/禁用; 按钮反馈后)
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const OUT = fileURLToPath(new URL('../screenshots/', import.meta.url));
const BASE = process.env.LAB_BASE || 'http://127.0.0.1:4173/index.html';

const args = Object.fromEntries(
  process.argv.slice(2).filter(a => a.startsWith('--')).map(a => {
    const [k, v] = a.slice(2).split('=');
    return [k, v === undefined ? true : v];
  })
);

const STYLES = (args.style ? String(args.style).split(',') : ['A', 'B', 'C', 'D', 'E', 'F', 'G']);
const PAGES = (args.page ? String(args.page).split(',') : ['discover', 'detail', 'collab', 'weather']);
const VIEWPORTS = (args.vp ? String(args.vp).split(',').map(Number) : [375, 390, 414]);
const KINDS = (args.kind ? String(args.kind).split(',') : ['fold', 'full']);
const ONLY_STATES = args.only === 'states'; // --only=states: 跳过全矩阵, 只重跑交互状态组图

const rect = { width: 0, height: 0 };

function rectFor(vp) {
  // 沉浸式：仅渲染设备视口，隐藏 lab 外框
  return { width: vp, height: vp === 375 ? 667 : vp === 390 ? 844 : 896 };
}

async function shoot(page, style, pageName, vp, kind, state) {
  const { height } = rectFor(vp);
  const url = `${BASE}?style=${style}&page=${pageName}&vp=${vp}&bare=1${state ? `&state=${state}` : ''}`;
  await page.setViewportSize({ width: vp, height });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__LAB_READY__ === true, null, { timeout: 15000 });
  await page.waitForTimeout(120);
  if (kind === 'full') {
    // 页面的滚动发生在 .page 内层容器; 不展开滚动链, fullPage 只会截到一屏。
    // 展开 html→.lab→.device→#app→.page 的高度/溢出, 让内容撑开文档后整页截图。
    await page.evaluate(async () => {
      for (const el of document.querySelectorAll('html, body, .lab, .lab__stage, .device, .device__screen, #app, .page')) {
        el.style.height = 'auto';
        el.style.minHeight = '0';
        el.style.maxHeight = 'none';
        el.style.overflow = 'visible';
        el.style.flex = 'none';
      }
      // 底部 sticky/fixed 操作条在 fullPage 捕获中会钉在初始视口位置并遮住正文 → 捕获时改为流内静态
      for (const el of document.querySelectorAll('*')) {
        const pos = getComputedStyle(el).position;
        if (pos === 'fixed' || pos === 'sticky') el.style.setProperty('position', 'static', 'important');
      }
      const imgs = [...document.querySelectorAll('img')];
      imgs.forEach((img) => { img.loading = 'eager'; });
      await Promise.all(imgs.map((img) => (img.decode ? img.decode().catch(() => {}) : 0)));
    });
    await page.waitForTimeout(80);
  }
  const suffix = state ? `-${state}` : '';
  const name = `${style}-${pageName}${suffix}-${vp}-${kind}.png`;
  await page.screenshot({ path: OUT + name, fullPage: kind === 'full' });
  console.log('  ✓', name);
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await mkdir(OUT, { recursive: true });

if (!ONLY_STATES && !args.compare) {
  for (const style of STYLES) {
    for (const pageName of PAGES) {
      for (const vp of VIEWPORTS) {
        for (const kind of KINDS) {
          await shoot(page, style, pageName, vp, kind);
        }
      }
    }
  }
}

if (args.states || ONLY_STATES) {
  // 交互状态证据：collab 页的空态/错误态/禁用态 + 报名按钮反馈
  for (const style of STYLES) {
    for (const state of ['empty', 'error', 'disabled']) {
      await shoot(page, style, 'collab', 390, 'fold', state);
    }
  }
  // 按钮反馈: 详情页点击报名后截图
  for (const style of STYLES) {
    const { height } = rectFor(390);
    const url = `${BASE}?style=${style}&page=detail&vp=390&bare=1`;
    await page.setViewportSize({ width: 390, height });
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => window.__LAB_READY__ === true, null, { timeout: 15000 });
    const btn = page.locator('[data-testid="primary-cta"]').first();
    if (await btn.count()) {
      await btn.click();
      await page.waitForTimeout(900); // 900ms: 捕获「已报名·待审核」终态 + toast（700ms 切换终态）
      await page.screenshot({ path: `${OUT}${style}-detail-after-cta-390-fold.png` });
      console.log('  ✓', `${style}-detail-after-cta-390-fold.png`);
    }
  }
}

if (args.compare) {
  // 风格对照表 (contact sheet): 全表 + 每页单行对照, 均为整页截图
  const vp = 390;
  const scale = Number(args.scale || 0.62);
  const cellW = Math.round(vp * scale);
  const cols = STYLES.join(',');
  // 列数随 STYLES 走 (新增风格时对照表自动加宽), 样式列表显式传给 compare.html 以免两边不一致
  const gridW = STYLES.length * cellW + (STYLES.length - 1) * 22 + 64 + 20;
  const compareUrl = BASE.includes('index.html') ? BASE.replace('index.html', 'compare.html') : `${BASE}/compare.html`;
  await page.setViewportSize({ width: gridW, height: 900 });
  const sheets = [
    ['all', 'discover,detail,collab,weather', 1500],
    ['discover', 'discover', 800],
    ['detail', 'detail', 800],
    ['collab', 'collab', 800],
    ['weather', 'weather', 800],
  ];
  for (const [name, pages, wait] of sheets) {
    await page.goto(`${compareUrl}?vp=${vp}&scale=${scale}&styles=${cols}&pages=${pages}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(wait); // 等 iframe 内页面渲染完成
    await page.screenshot({ path: `${OUT}compare-${name}-390.png`, fullPage: true });
    console.log('  ✓', `compare-${name}-390.png`);
  }
}

await browser.close();
console.log('[capture] done →', OUT);
