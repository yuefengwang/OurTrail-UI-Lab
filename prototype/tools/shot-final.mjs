// Final Pass — 交付截图
// 用法: node tools/shot-final.mjs [--only=fold|full|states|all]
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const BASE = process.env.FINAL_BASE || 'http://127.0.0.1:4176/final/index.html';
const OUT = fileURLToPath(new URL('../final/screenshots/', import.meta.url));
const bind = (name) => OUT + name + '.png';
const only = (process.argv.find((a) => a.startsWith('--only=')) || '').split('=')[1] || 'all';

const jobs = [
  ...['discover', 'detail', 'collab', 'weather'].flatMap((page) =>
    [375, 390, 414].flatMap((vp) => [
      { name: `after/final-${page}-${vp}-fold`, page, vp, kind: 'fold' },
      { name: `after/final-${page}-${vp}-full`, page, vp, kind: 'full' }
    ])
  ),
  ...['discover', 'detail', 'collab', 'weather'].flatMap((page) =>
    [375, 390, 414].map((vp) => ({
      name: `after/final-${page}-${vp}-mid`, page, vp, kind: 'mid',
      params: page === 'detail' ? { state: 'new' } : page === 'collab' ? { stage: 'published', role: 'organizer' } : {}
    }))
  ),
  { name: 'after/final-discover-390-filter-ended', page: 'discover', vp: 390, params: { filter: 'ended' } },
  { name: 'after/final-discover-390-search-none', page: 'discover', vp: 390, params: { q: 'zzzz' } },
  { name: 'after/final-discover-390-search-hit', page: 'discover', vp: 390, params: { q: '牛背山' } },
  { name: 'after/final-detail-pending-390', page: 'detail', vp: 390, params: { state: 'pending' } },
  { name: 'after/final-detail-confirmed-390', page: 'detail', vp: 390, params: { state: 'confirmed' } },
  { name: 'after/final-detail-waitlist-390', page: 'detail', vp: 390, params: { state: 'waitlist' } },
  { name: 'after/final-detail-closed-390', page: 'detail', vp: 390, params: { state: 'closed' } },
  { name: 'after/final-detail-cancelled-390', page: 'detail', vp: 390, params: { state: 'cancelled' } },
  { name: 'after/final-detail-archived-390', page: 'detail', vp: 390, params: { state: 'archived' } },
  { name: 'after/final-detail-organizer-375', page: 'detail', vp: 375, params: { state: 'organizer' } },
  { name: 'after/final-detail-organizer-414', page: 'detail', vp: 414, params: { state: 'organizer' } },
  { name: 'after/final-collab-gathering-390', page: 'collab', vp: 390, params: { stage: 'gathering' } },
  { name: 'after/final-collab-active-390', page: 'collab', vp: 390, params: { stage: 'active' } },
  { name: 'after/final-collab-closing-390', page: 'collab', vp: 390, params: { stage: 'closing' } },
  { name: 'after/final-collab-archived-390', page: 'collab', vp: 390, params: { stage: 'archived' } },
  { name: 'after/final-collab-driver-390', page: 'collab', vp: 390, params: { stage: 'gathering', role: 'driver' } },
  { name: 'after/final-collab-staff-390', page: 'collab', vp: 390, params: { stage: 'gathering', role: 'staff' } },
  { name: 'after/final-collab-vehicles-390', page: 'collab', vp: 390, params: { tab: 'vehicles' } },
  { name: 'after/final-weather-24h-390', page: 'weather', vp: 390, params: { range: 24 } },
  { name: 'after/final-weather-r3-375', page: 'weather', vp: 375, params: { point: 'r3' } },
  { name: 'after/final-weather-nodata-390', page: 'weather', vp: 390, params: { wdata: 'no-data' } }
];

const heightOf = (vp) => (vp === 375 ? 667 : vp === 414 ? 896 : 844);
await mkdir(OUT + 'after', { recursive: true });
await mkdir(OUT + 'states', { recursive: true });
const browser = await chromium.launch({ headless: true });
const problems = [];

async function makeUrl(job) {
  const p = new URLSearchParams({ page: job.page, vp: String(job.vp), bare: '1' });
  for (const [k, v] of Object.entries(job.params || {})) p.set(k, String(v));
  if (job.params?.tab === 'vehicles') { p.delete('tab'); p.set('_tab', 'vehicles'); }
  return `${BASE}?${p.toString()}`;
}

async function load(job) {
  const page = await browser.newPage({ viewport: { width: job.vp, height: heightOf(job.vp) } });
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(await makeUrl(job), { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__FINAL_READY__ === true, null, { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(260);
  if (job.params?.tab === 'vehicles') {
    const t = page.getByRole('tab', { name: /车辆/ });
    if (await t.count()) { await t.click(); await page.waitForTimeout(350); }
  }
  return { page, errors };
}

for (const job of jobs) {
  if (only !== 'all') {
    if (only === 'states' && !job.name.includes('after/final-')) continue;
    if (only === 'fold' && job.kind !== 'fold') continue;
    if (only === 'full' && job.kind !== 'full') continue;
  }
  const { page, errors } = await load(job);
  if (errors.length) problems.push({ name: job.name, errors });
  if (job.kind === 'full') {
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
    await page.waitForTimeout(160);
    await page.screenshot({ path: bind(job.name), fullPage: true });
  } else if (job.kind === 'mid') {
    await page.evaluate(() => {
      const p = document.querySelector('.page');
      p.scrollTop = Math.round(p.scrollHeight * 0.5);
    });
    await page.waitForTimeout(260);
    await page.screenshot({ path: bind(job.name) });
  } else {
    await page.screenshot({ path: bind(job.name) });
  }
  console.log('✓', job.name);
  await page.close();
}

/* ---------------- 交互状态截图 ---------------- */
if (only === 'all' || only === 'states') {
  // 报名表
  {
    const { page } = await load({ page: 'detail', vp: 390, kind: 'fold', params: { state: 'new' } });
    await page.locator('.actionbar__main').click();
    await page.waitForTimeout(350);
    await page.screenshot({ path: bind('states/detail-signup-sheet-390') });
    await page.close();
  }
  // 审核表 / 分车表 / 推进表
  {
    const { page } = await load({ page: 'collab', vp: 390, kind: 'fold', params: { stage: 'published' } });
    await page.locator('.col-person').filter({ hasText: '待审核' }).first().locator('button.col-mini').click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: bind('states/collab-audit-sheet-390') });
    await page.locator('.sheet__close').click();
    await page.waitForTimeout(300);
    await page.locator('.col-task').filter({ hasText: '安排车辆' }).locator('.col-task__action').click();
    await page.waitForTimeout(300);
    await page.locator('.col-unassigned .col-mini').first().click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: bind('states/collab-assign-sheet-390') });
    await page.locator('.sheet__close').click();
    await page.waitForTimeout(250);
    await page.locator('.col-task').filter({ hasText: '审核报名' }).locator('.col-task__action').click();
    await page.waitForTimeout(300);
    // 用现场标签的推进按钮需要先清零；这里只截“阶段检查”区域
    await page.screenshot({ path: bind('states/collab-roster-390') });
    await page.close();
  }
  // 车长发车缺口
  {
    const { page } = await load({ page: 'collab', vp: 390, kind: 'fold', params: { stage: 'gathering', role: 'driver' } });
    const btn = page.locator('.col-driver-action .btn');
    if (await btn.count()) {
      await btn.click();
      await page.waitForTimeout(320);
      await page.screenshot({ path: bind('states/collab-depart-gap-390') });
    }
    await page.close();
  }
  // 待审核：我的报名弹层
  {
    const { page } = await load({ page: 'detail', vp: 390, kind: 'fold', params: { state: 'pending' } });
    await page.locator('.actionbar__main').click();
    await page.waitForTimeout(320);
    await page.screenshot({ path: bind('states/detail-my-signup-sheet-390') });
    await page.close();
  }
  // 天气选中时段（r3 午后）
  {
    const { page } = await load({ page: 'weather', vp: 390, kind: 'fold', params: { point: 'r3', hour: '2026-10-24T13:00:00+08:00' } });
    await page.locator('.wx-selected').scrollIntoViewIfNeeded();
    await page.waitForTimeout(250);
    await page.screenshot({ path: bind('states/weather-selected-r3-390') });
    await page.close();
  }
}

if (problems.length) {
  console.log('\nCONSOLE PROBLEMS:');
  for (const p of problems) console.log(' -', p.name, p.errors.join(' | '));
  process.exitCode = 1;
}
await browser.close();
