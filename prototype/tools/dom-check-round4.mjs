// OurTrail Round 4 — 发现页交互 / 回归检查
// 用法 (在 prototype/ 下运行): node tools/dom-check-round4.mjs
// 退出码: 0 全部通过; 1 有失败项。
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';

const { DEMO } = await import(
  'data:text/javascript;base64,' +
  Buffer.from(readFileSync(new URL('../js/data.js', import.meta.url), 'utf8')).toString('base64')
);

const BASE = process.env.R4_BASE || 'http://127.0.0.1:4174/round4/index.html';
const results = [];
function check(name, ok, detail = '') {
  results.push({ name, ok });
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`);
}

const heightFor = (vp) => (vp === 375 ? 667 : vp === 414 ? 896 : 844);
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const pageErrors = [];
page.on('pageerror', (e) => pageErrors.push(String(e)));

async function open(vp = 390, state = '') {
  await page.setViewportSize({ width: vp, height: heightFor(vp) });
  await page.goto(`${BASE}?view=hybrid&vp=${vp}&bare=1${state ? `&state=${state}` : ''}`, {
    waitUntil: 'networkidle',
  });
  await page.waitForFunction(() => window.__LAB_READY__ === true, null, { timeout: 15000 });
  await page.waitForTimeout(220);
}

async function listIds(scope = '[data-testid="r3-list"]') {
  return page.evaluate((sel) => {
    const root = document.querySelector(sel);
    if (!root) return [];
    return [...new Set([...root.querySelectorAll('[data-activity-id]')].map((el) => el.dataset.activityId))];
  }, scope);
}

const sameOrder = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);

/* 1) 正常态：结构、内容、默认排序 */
await open(390);
const bodyText = await page.locator('body').innerText();
for (const a of DEMO.activities) {
  check(`标题「${a.title}」可见`, bodyText.includes(a.title));
}
const defaultIds = await listIds();
check('默认列表去重置顶项 (8 条，无 a1)', sameOrder(defaultIds, ['a2', 'a3', 'a4', 'a5', 'a6', 'a7', 'a9', 'a8']), defaultIds.join(','));
const countText = (await page.locator('.hy-seam__n').innerText()).trim();
check('默认计数说明置顶去重', countText === '8 场 · 置顶已在上方', countText);
check('默认接缝标题为「全部活动」', (await page.locator('[data-testid="r3-seam-title"]').innerText()).trim() === '全部活动');
check('横滑轨已移除', (await page.locator('[data-testid="r3-rail"], .hy-card').count()) === 0);
check('默认列表无过去活动开头', defaultIds[0] === 'a2' && defaultIds[1] === 'a3');

/* 2) 筛选：清单完整性不因默认去重而丢失 */
const tab = (label) => page.locator('.seg__item, [role="tab"]').filter({ hasText: label }).first();
async function pick(label) {
  await tab(label).click();
  await page.waitForTimeout(280);
}
await pick('已成行');
let got = await listIds();
check('筛选「已成行」= a5,a6', sameOrder(got, ['a5', 'a6']), got.join(','));
await pick('可报名');
got = await listIds();
check('筛选「可报名」= a1,a2,a3,a4,a7', sameOrder(got, ['a1', 'a2', 'a3', 'a4', 'a7']), got.join(','));
check('筛选「可报名」接缝标题同步', (await page.locator('[data-testid="r3-seam-title"]').innerText()).trim() === '可报名');
await pick('已结束');
got = await listIds();
check('筛选「已结束」= a8,a9', sameOrder(got, ['a8', 'a9']), got.join(','));
check('筛选「已结束」接缝标题同步', (await page.locator('[data-testid="r3-seam-title"]').innerText()).trim() === '已结束');
await pick('全部');
got = await listIds();
check('返回「全部」恢复去重列表', sameOrder(got, ['a2', 'a3', 'a4', 'a5', 'a6', 'a7', 'a9', 'a8']), got.join(','));

/* 3) 搜索 */
const input = page.locator('[data-testid="r3-search"] input, input[type="search"]').first();
await input.fill('牛背山');
await page.waitForTimeout(300);
got = await listIds();
check('搜索「牛背山」= a7', sameOrder(got, ['a7']), got.join(','));
check('搜索态接缝标题为「搜索结果」', (await page.locator('[data-testid="r3-seam-title"]').innerText()).trim() === '搜索结果');
await input.fill('zzzz');
await page.waitForTimeout(300);
check('搜索无结果显示状态块', (await page.locator('[data-testid="r3-state"], .state-block').count()) > 0);
await input.fill('');
await page.waitForTimeout(300);

/* 4) 状态态 */
await open(390, 'loading');
check('加载态骨架存在', (await page.locator('.skeleton, .sk-row').count()) > 0);
await open(390, 'error');
check('错误态状态块存在', (await page.locator('.state-block').count()) > 0);
await open(390, 'disabled');
check('禁用态状态块存在', (await page.locator('.state-block').count()) > 0);
await open(390, 'empty');
check('空态状态块存在', (await page.locator('.state-block').count()) > 0);

/* 5) 三个视口：CTA 完整可见 + 无横向溢出 */
for (const vp of [375, 390, 414]) {
  await open(vp);
  const m = await page.evaluate(() => {
    const box = (s) => {
      const n = document.querySelector(s);
      if (!n) return null;
      const r = n.getBoundingClientRect();
      return { top: Math.round(r.top), bottom: Math.round(r.bottom) };
    };
    const pageEl = document.querySelector('.page');
    return {
      cta: box('.hy-hero__cta'),
      vh: innerHeight,
      overflow: pageEl ? pageEl.scrollWidth - pageEl.clientWidth : 0,
      heroImg: (() => {
        const img = document.querySelector('.hy-hero__media img');
        return img ? [img.naturalWidth, img.naturalHeight] : null;
      })(),
    };
  });
  check(`${vp}: 首屏主 CTA 完整可见`, !!m.cta && m.cta.bottom <= m.vh, m.cta ? `${m.cta.top}–${m.cta.bottom} / ${m.vh}` : 'missing');
  check(`${vp}: 无横向溢出`, m.overflow <= 1, String(m.overflow));
  check(`${vp}: 主图已加载`, !!m.heroImg && m.heroImg[0] > 0, JSON.stringify(m.heroImg));
}

/* 6) 吸顶接缝带 */
await open(390);
await page.evaluate(async () => {
  const pageEl = document.querySelector('.page');
  const seam = document.querySelector('[data-testid="r3-seam"]');
  const top = seam.getBoundingClientRect().top - pageEl.getBoundingClientRect().top + pageEl.scrollTop;
  pageEl.scrollTop = top + 80;
  await new Promise((r) => setTimeout(r, 300));
});
const pinned = await page.evaluate(() => {
  const pageEl = document.querySelector('.page');
  const seam = document.querySelector('[data-testid="r3-seam"]');
  return {
    top: Math.round(seam.getBoundingClientRect().top - pageEl.getBoundingClientRect().top),
    cls: seam.classList.contains('is-pinned'),
    position: getComputedStyle(seam).position,
  };
});
check('接缝带 sticky 吸顶并进入 pinned 状态', pinned.position === 'sticky' && pinned.top <= 1 && pinned.cls, JSON.stringify(pinned));

check('无未捕获 JS 异常', pageErrors.length === 0, pageErrors.join(' | '));

await browser.close();
const fails = results.filter((r) => !r.ok);
console.log(`\n[dom-check-round4] PASS ${results.length - fails.length} · FAIL ${fails.length}`);
if (fails.length) {
  console.log('失败项:');
  for (const f of fails) console.log(`  ✗ ${f.name}`);
  process.exitCode = 1;
}
