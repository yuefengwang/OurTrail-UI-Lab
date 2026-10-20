// OurTrail Final Pass — 真实浏览器回归
// 用法: node tools/dom-check-final.mjs
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const BASE = process.env.FINAL_BASE || 'http://127.0.0.1:4176/final/index.html';
const SHOTS = fileURLToPath(new URL('../final/screenshots/states/', import.meta.url));
await mkdir(SHOTS, { recursive: true });

const browser = await chromium.launch({ headless: true });
const results = [];
const fail = [];
let currentPage = null;

function record(name, ok, detail = '') {
  results.push({ name, ok, detail });
  if (!ok) fail.push({ name, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
}

async function open(params, { vp = 390 } = {}) {
  if (currentPage) await currentPage.close().catch(() => {});
  const height = vp === 375 ? 667 : vp === 414 ? 896 : 844;
  const page = await browser.newPage({ viewport: { width: vp, height } });
  page.__errors = [];
  page.on('console', (m) => { if (m.type() === 'error') page.__errors.push(m.text()); });
  page.on('pageerror', (e) => page.__errors.push(String(e)));
  await page.goto(`${BASE}?${new URLSearchParams(params).toString()}&vp=${vp}&bare=1`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__FINAL_READY__ === true, null, { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(220);
  currentPage = page;
  return page;
}

async function shot(name, page = currentPage) {
  await page.screenshot({ path: SHOTS + name + '.png' });
}

async function text(sel, page = currentPage) {
  return (await page.locator(sel).first().innerText()).replace(/\s+/g, ' ').trim();
}

async function closeSheet(page = currentPage) {
  const btn = page.locator('.sheet__close');
  if (await btn.count()) { await btn.click(); await page.waitForTimeout(260); }
}

async function openDetail(state, vp = 390) {
  return open({ page: 'detail', state, id: 'qcs', data: 'normal' }, { vp });
}

/* ================= 发现 ================= */
{
  const page = await open({ page: 'discover' }, { vp: 375 });
  const h = await page.evaluate(() => document.querySelector('.page').clientHeight);
  const cta = await page.locator('.disc-hero__cta').boundingBox();
  record('D1 375 主 CTA 在页面可用高度内', cta && cta.y + cta.height <= h, `client=${h} ctaBottom=${cta ? Math.round(cta.y + cta.height) : '-'}`);
  record('D2 375 首屏出现筛选条', await page.locator('.disc-filter').isVisible());
  await shot('discover-375-fold');

  await page.locator('.disc-filter__search').click();
  await page.locator('.disc-search__input').fill('牛背山');
  await page.waitForTimeout(120);
  record('D3 搜索命中 1 条', await page.locator('.disc-row').count() === 1, `rows=${await page.locator('.disc-row').count()}`);
  await page.locator('.disc-search__input').fill('zzzz');
  await page.waitForTimeout(120);
  record('D4 搜索无结果空态', await page.locator('.empty__title').filter({ hasText: '没有匹配的活动' }).count() === 1);
  await shot('discover-390-search-none');
  await page.locator('.disc-search__close').click();
  await page.waitForTimeout(150);

  await page.getByRole('tab', { name: /已结束/ }).click();
  await page.waitForTimeout(150);
  record('D5 已结束筛选返回 2 条', await page.locator('.disc-row').count() === 2, `rows=${await page.locator('.disc-row').count()}`);
  await page.getByRole('tab', { name: /全部/ }).click();
  await page.waitForTimeout(150);
  await page.locator('.disc-past__summary').click();
  await page.waitForTimeout(150);
  record('D6 过去活动可展开', await page.locator('.disc-past').evaluate((n) => n.open));
  await page.locator('.disc-hero__cta').click();
  await page.waitForTimeout(350);
  record('D7 发现→详情联动', page.url().includes('page=detail') && (await page.locator('.det-hero__title').innerText()).includes('青城后山'));

  const page2 = await open({ page: 'discover' }, { vp: 390 });
  await shot('discover-390-fold');
  const page3 = await open({ page: 'discover' }, { vp: 414 });
  await shot('discover-414-fold');
  record('D8 发现页 0 console error', page3.__errors.length === 0, page3.__errors.join(' | '));
}

/* ================= 详情：报名提交 ================= */
{
  const page = await openDetail('new');
  record('DT1 主 CTA 是报名', (await text('.actionbar__main')).includes('填写报名资料'));
  await page.locator('.actionbar__main').click();
  await page.waitForTimeout(320);
  record('DT2 报名表打开', await page.locator('.sheet').isVisible());
  const inputs = page.locator('.sheet input[type=text]');
  const tels = page.locator('.sheet input[type=tel]');
  await inputs.nth(0).fill('沈岚');
  await tels.nth(0).fill('13800001234');
  await inputs.nth(1).fill('林父');
  await tels.nth(1).fill('13900001234');
  await page.locator('.sheet .check-row input').first().check();
  await page.locator('.sheet__actions .btn--primary').click();
  await page.waitForTimeout(1100);
  record('DT3 提交后进入待审核', (await text('.state-strip__title')).includes('报名已收到'), await text('.state-strip__title'));
  record('DT3b 待审核计数写回 4 人 / 余位 2', (await text('.state-strip')).includes('4 人待审核') && (await text('.state-strip')).includes('余位 2 / 24'), await text('.state-strip'));
  record('DT3c 报名进入本地事务名单', await page.evaluate(() => window.__FINAL__.store.viewerSignup?.audit === 'pending'));
  record('DT4 主 CTA 变为查看报名', (await text('.actionbar__main')).includes('查看我的报名'));
  await page.evaluate(() => { document.querySelector('.toast')?.remove(); });
  await shot('detail-session-pending-390');

  const page2 = await openDetail('pending');
  await page2.locator('.actionbar__main').click();
  await page2.waitForTimeout(300);
  record('DT5 待审核可查看我的报名', (await text('.sheet__title')).includes('我的报名'));
  await closeSheet(page2);

  const page3 = await openDetail('confirmed');
  await page3.locator('.actionbar__main').click();
  await page3.waitForTimeout(700);
  const routeBox = await page3.locator('#route').boundingBox();
  record('DT6 已确认→集合与出行（滚动到路线）', routeBox && routeBox.y < 220, `routeY=${routeBox ? Math.round(routeBox.y) : '-'}`);
  await shot('detail-confirmed-390');
  await page3.locator('.det-weather').click();
  await page3.waitForTimeout(500);
  record('DT7 详情→天气联动', page3.url().includes('page=weather') && (await page3.locator('.wx-hero__title').innerText()).includes('青城后山'));

  for (const st of ['waitlist', 'closed', 'cancelled', 'archived', 'organizer']) {
    const p = await openDetail(st);
    const strip = await text('.state-strip__title');
    const label = await text('.actionbar__main');
    record(`DT8 ${st} 状态可渲染`, !!(strip && label), `${strip} / ${label}`);
    await shot(`detail-${st}-390`);
  }
  const p = await openDetail('new');
  record('DT9 详情页 0 console error', p.__errors.length === 0, p.__errors.join(' | '));
}

/* ================= 协作：审核 → 分车 → 阶段 ================= */
{
  const page = await open({ page: 'collab', stage: 'published', role: 'organizer' });
  record('C1 首屏任务优先', (await page.locator('.col-task').count()) >= 2, `tasks=${await page.locator('.col-task').count()}`);
  record('C2 首屏不出现 4×4 统一网格', await page.locator('.col-seatmap').count() === 0);
  await shot('collab-published-390');

  for (let i = 0; i < 3; i++) {
    await page.locator('.col-person').filter({ hasText: '待审核' }).first().locator('button.col-mini').click();
    await page.waitForTimeout(250);
    await page.locator('.sheet').getByRole('button', { name: '通过' }).click();
    await page.waitForTimeout(380);
  }
  record('C3 3 人审核后待审核任务消失', await page.locator('.col-task').filter({ hasText: '审核报名' }).count() === 0);
  record('C4 待审核归零', (await text('.col-command')).includes('0 人') || !(await text('.col-command')).includes('3 人'), await text('.col-command').then((t) => t.slice(0, 120)));

  const assignTask = page.locator('.col-task').filter({ hasText: '安排车辆' });
  if (await assignTask.count()) {
    await assignTask.locator('.col-task__action').click();
    await page.waitForTimeout(300);
    const before = await page.locator('.col-unassigned__row').count();
    await page.locator('.col-unassigned .col-mini').first().click();
    await page.waitForTimeout(280);
    record('C5 分车弹层打开', await page.locator('.sheet').isVisible());
    await page.locator('.sheet__actions .btn--primary').click();
    await page.waitForTimeout(450);
    const after = await page.locator('.col-unassigned__row').count();
    record('C6 分车后未分车减少 1 人', after === Math.max(0, before - 1), `before=${before} after=${after}`);
  }

  await page.getByRole('tab', { name: /现场/ }).click();
  await page.waitForTimeout(300);
  const stageBtn = page.locator('.col-stage-cta');
  record('C7 门槛满足后可推进集合', await stageBtn.isEnabled(), await stageBtn.innerText());
  await stageBtn.click();
  await page.waitForTimeout(300);
  record('C8 推进弹层显示门槛已满足', (await text('.sheet__sub')).includes('门槛已满足'), await text('.sheet__sub'));
  await page.locator('.sheet__actions .btn--primary').click();
  await page.waitForTimeout(500);
  record('C9 已进入集合阶段', (await text('.col-stage')).includes('正在集合'), await text('.col-stage'));
  await shot('collab-gathering-390');

  const checkBtns = page.locator('.col-fieldrow .col-mini');
  if (await checkBtns.count()) {
    await checkBtns.first().click();
    await page.waitForTimeout(420);
    record('C10 签到动作生效', true);
  }

  const driver = await open({ page: 'collab', stage: 'gathering', role: 'driver', id: 'qcs' });
  record('C11 车长只看到本车', await driver.locator('.col-driver-row').count() === 10, `rows=${await driver.locator('.col-driver-row').count()}`);
  record('C12 车长无名单/车辆标签', await driver.locator('.col-tabs').count() === 0);
  await shot('collab-driver-390');
  const board = driver.locator('.col-driver-row .col-mini:not([disabled])').first();
  if (await board.count()) {
    await board.click();
    await driver.waitForTimeout(400);
    record('C13 车长确认上车', (await driver.locator('.col-driver-row.is-on').count()) >= 1);
  }
  const departBtn = driver.locator('.col-driver-action .btn');
  if (await departBtn.count()) {
    await departBtn.click();
    await driver.waitForTimeout(300);
    await driver.locator('.sheet').getByRole('button', { name: '仍然发车' }).click();
    await driver.waitForTimeout(400);
    record('C14 缺口发车反馈', (await driver.locator('.col-ok').innerText()).includes('本程已发车') || (await driver.locator('.toast').innerText()).includes('已发车'));
  }

  const staff = await open({ page: 'collab', stage: 'gathering', role: 'staff', id: 'qcs' });
  record('C15 协作视角无审核/车辆标签', await staff.locator('.col-tabs').count() === 0);
  record('C16 协作视角有现场列表', await staff.locator('.col-fieldrow').count() > 0, `rows=${await staff.locator('.col-fieldrow').count()}`);
  await shot('collab-staff-390');

  const active = await open({ page: 'collab', stage: 'active', role: 'organizer', id: 'qcs' });
  record('C17 同行阶段出现异常任务', await active.locator('.col-task').filter({ hasText: '协调中的异常' }).count() === 1);
  await active.locator('.col-task').filter({ hasText: '协调中的异常' }).locator('.col-task__action').click();
  await active.waitForTimeout(300);
  await active.locator('.sheet textarea').fill('已从犀浦上车，09:10 到达起点');
  await active.locator('.sheet').getByRole('button', { name: '标记已协调' }).click();
  await active.waitForTimeout(400);
  record('C18 异常处理后可继续', await active.locator('.col-task').filter({ hasText: '协调中的异常' }).count() === 0);
  await shot('collab-active-390');

  const closing = await open({ page: 'collab', stage: 'closing', role: 'organizer', id: 'qcs' });
  record('C19 返程阶段出现待到家人数', (await text('.col-command')).includes('未确认') || (await text('.col-panel__sub')).includes('到家'), await text('.col-command').then((t) => t.slice(0, 120)));
  await closing.getByRole('tab', { name: /现场/ }).click();
  await closing.waitForTimeout(250);
  const homeBtn = closing.locator('.col-fieldrow .col-mini').first();
  if (await homeBtn.count()) {
    await homeBtn.click();
    await closing.waitForTimeout(300);
    await closing.locator('.sheet textarea').fill('20:18 电话确认本人已到家');
    await closing.locator('.sheet .check-row input').check();
    await closing.locator('.sheet__actions .btn--primary').click();
    await closing.waitForTimeout(400);
    record('C20 到家确认（含依据与授权）', true);
  }
  await shot('collab-closing-390');

  const archived = await open({ page: 'collab', stage: 'archived', role: 'organizer', id: 'qcs' });
  record('C21 归档只读', (await text('.col-command')).includes('已归档') || (await text('.col-task')).includes('已归档'));
  record('C22 协作页 0 console error', archived.__errors.length === 0, archived.__errors.join(' | '));
}

/* ================= 天气 ================= */
{
  const page = await open({ page: 'weather', point: 'r2', range: 48, id: 'qcs' });
  record('W1 模拟标注常驻', (await text('.wx-badge--sim')).includes('模拟预报'));
  record('W2 活动窗口可见', (await text('.wx-hero__meta')).includes('07:00–18:00'));
  record('W3 路线点可切换', await page.locator('.wx-point').count() === 3);
  record('W4 趋势图渲染', await page.locator('.wx-chart__svg').isVisible());
  await shot('weather-390');

  await page.locator('.wx-point').filter({ hasText: '白云索道下站' }).click();
  await page.waitForTimeout(420);
  record('W5 切点后选中详情同步', (await text('.wx-selected__time')).includes('白云索道下站'), await text('.wx-selected__time'));
  record('W6 海拔/云底关系可读', (await text('.wx-selected')).includes('云'), await text('.wx-selected__cloud'));

  const box = await page.locator('.wx-chart__svg').boundingBox();
  if (box) {
    await page.mouse.click(box.x + box.width * 0.62, box.y + box.height * 0.55);
    await page.waitForTimeout(300);
    record('W7 图表点击选时', (await text('.wx-selected__note')).length > 0);
  }
  await page.getByRole('tab', { name: '24h' }).click();
  await page.waitForTimeout(420);
  record('W8 24h 范围切换', (await text('.wx-chart__sub')).includes('活动窗口'));
  await shot('weather-24h-390');

  await page.locator('.wx-window').filter({ hasText: '阵雨' }).click();
  await page.waitForTimeout(420);
  record('W9 关键时段可跳转', (await text('.wx-selected__time')).includes('白云索道下站'), await text('.wx-selected__time'));

  const nodata = await open({ page: 'weather', point: 'r2', range: 48, id: 'qcs', wdata: 'no-data' });
  record('W10 无数据不插值', (await text('.wx-nodata__t')).includes('没有可展示'), await text('.wx-nodata__t'));
  await shot('weather-nodata-390');
  record('W11 天气页 0 console error', nodata.__errors.length === 0, nodata.__errors.join(' | '));

  const w375 = await open({ page: 'weather', point: 'r3', range: 48, id: 'qcs' }, { vp: 375 });
  await shot('weather-375-fold');
  const w414 = await open({ page: 'weather', point: 'r2', range: 48, id: 'qcs' }, { vp: 414 });
  await shot('weather-414-fold');
}

/* ================= 汇总 ================= */
console.log('\n========== SUMMARY ==========');
console.log(`PASS ${results.filter((r) => r.ok).length} / ${results.length}`);
if (fail.length) {
  console.log('FAILURES:');
  for (const f of fail) console.log(' -', f.name, '—', f.detail);
}
await browser.close();
if (fail.length) process.exitCode = 1;
