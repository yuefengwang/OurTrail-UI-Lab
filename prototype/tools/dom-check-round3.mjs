// OurTrail Round 3 — 数据完整性 / 交互检查
// 用法 (在 prototype/ 下运行): node tools/dom-check-round3.mjs [--view=editorial,curated,hybrid]
// 退出码: 0 全部通过; 1 有失败项。
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';

// 说明: package.json 为 commonjs 模式，Node 侧无法直接 import 浏览器 ESM 的 data.js；
// 通过 data: URL 动态导入同一份纯数据模块（保持与页面数据源一致）。
const { DEMO } = await import(
  'data:text/javascript;base64,' +
  Buffer.from(readFileSync(new URL('../js/data.js', import.meta.url), 'utf8')).toString('base64')
);

const BASE = process.env.R3_BASE || 'http://127.0.0.1:4173/round3/index.html';
const args = Object.fromEntries(
  process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => {
    const [k, v] = a.slice(2).split('=');
    return [k, v === undefined ? true : v];
  })
);
const VIEWS = args.view ? String(args.view).split(',') : ['editorial', 'curated', 'hybrid'];

const results = [];
function check(view, name, ok, detail = '') {
  results.push({ view, name, ok });
  console.log(`${ok ? 'PASS' : 'FAIL'} [${view}] ${name}${detail ? ' — ' + detail : ''}`);
}
function skip(view, name, why) {
  results.push({ view, name, ok: true, skipped: true });
  console.log(`SKIP [${view}] ${name} — ${why}`);
}
const sameSet = (a, b) => a.length === b.length && [...a].sort().join(',') === [...b].sort().join(',');

const heightFor = (vp) => (vp === 375 ? 667 : vp === 414 ? 896 : 844);
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: heightFor(390) } });
const pageErrors = [];
page.on('pageerror', (e) => pageErrors.push(String(e)));

async function open(view, state = '') {
  const url = `${BASE}?view=${view}&vp=390&bare=1${state ? `&state=${state}` : ''}`;
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__LAB_READY__ === true, null, { timeout: 15000 });
  await page.waitForTimeout(180);
}

async function listIds(scope) {
  return page.evaluate((sel) => {
    const root = document.querySelector(sel);
    if (!root) return [];
    return [...new Set([...root.querySelectorAll('[data-activity-id]')].map((el) => el.dataset.activityId))];
  }, scope);
}

for (const view of VIEWS) {
  pageErrors.length = 0;
  await open(view);

  const bodyText = await page.locator('body').innerText();
  const ids = await page.evaluate(() =>
    [...new Set([...document.querySelectorAll('[data-activity-id]')].map((el) => el.dataset.activityId))]);

  // 1) 9 场活动的条目与标题
  for (const a of DEMO.activities) {
    check(view, `条目 ${a.id} ${a.title}`, ids.includes(a.id));
    check(view, `标题「${a.title}」可见`, bodyText.includes(a.title));
  }

  // 2) 状态词表（数据中出现的每一种）
  for (const word of ['报名中', '名额紧张', '已成行', '已结束', '已取消']) {
    check(view, `状态词「${word}」`, bodyText.includes(word));
  }

  // 3) 关键事实
  check(view, 'a1 距离 18.6', bodyText.includes('18.6'));
  check(view, 'a1 爬升 1,180', bodyText.includes('1,180') || bodyText.includes('1180'));
  check(view, 'a1 名额剩余「剩 7 位」', /剩\s*7\s*位/.test(bodyText));

  // 4) 清单容器
  const hasList = (await page.locator('[data-testid="r3-list"]').count()) > 0;
  check(view, '存在清单容器 r3-list', hasList);
  const scope = hasList ? '[data-testid="r3-list"]' : '.page';

  // 5) 过滤：已成行 / 可报名
  const tab = (label) => page.locator('.seg__item, [role="tab"]').filter({ hasText: label }).first();

  if (await tab('已成行').count()) {
    await tab('已成行').click();
    await page.waitForTimeout(300);
    const got = await listIds(scope);
    check(view, '筛选「已成行」仅 a5,a6', sameSet(got, ['a5', 'a6']), got.join(','));
    await tab('全部').click();
    await page.waitForTimeout(250);
  } else {
    skip(view, '筛选「已成行」', '未找到页签');
  }

  if (await tab('可报名').count()) {
    await tab('可报名').click();
    await page.waitForTimeout(300);
    const got = await listIds(scope);
    if (view === 'hybrid') {
      // 混合方案的横向轨道/主卡不参与列表过滤，但清单必须是 a1,a2,a3,a4,a7
      check(view, '筛选「可报名」清单 a1,a2,a3,a4,a7', sameSet(got, ['a1', 'a2', 'a3', 'a4', 'a7']), got.join(','));
    } else {
      check(view, '筛选「可报名」a1,a2,a3,a4,a7', sameSet(got, ['a1', 'a2', 'a3', 'a4', 'a7']), got.join(','));
    }
    await tab('全部').click();
    await page.waitForTimeout(250);
  } else {
    skip(view, '筛选「可报名」', '未找到页签');
  }

  // 6) 搜索：命中与空态
  const input = page.locator('input[type="search"], [data-testid="r3-search"] input, input[data-testid="r3-search"]').first();
  if (await input.count()) {
    await input.click();
    await input.fill('牛背山');
    await page.waitForTimeout(350);
    const got = await listIds(scope);
    check(view, '搜索「牛背山」仅 a7', sameSet(got, ['a7']), got.join(','));

    await input.fill('zzzz');
    await page.waitForTimeout(350);
    const stateCount = await page.locator('[data-testid="r3-state"], .state-block').count();
    check(view, '搜索无结果显示状态块', stateCount > 0);
  } else {
    skip(view, '搜索交互', '未找到搜索输入');
  }

  // 7) 加载 / 错误状态
  await open(view, 'loading');
  const skel = await page.locator('.skeleton, .sk-row').count();
  check(view, '加载态骨架存在', skel > 0);

  await open(view, 'error');
  const errBlock = await page.locator('.state-block').count();
  check(view, '错误态状态块存在', errBlock > 0);

  check(view, '无未捕获 JS 异常', pageErrors.length === 0, pageErrors.join(' | '));
}

await browser.close();

const fails = results.filter((r) => !r.ok && !r.skipped);
const passes = results.filter((r) => r.ok && !r.skipped);
console.log(`\n[dom-check-round3] PASS ${passes.length} · FAIL ${fails.length}`);
if (fails.length) {
  console.log('失败项:');
  for (const f of fails) console.log(`  ✗ [${f.view}] ${f.name}`);
  process.exitCode = 1;
}
