// Final Pass — 阶段推进与跨页一致性回归
import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const BASE = process.env.FINAL_BASE || 'http://127.0.0.1:4176/final/index.html';
const browser = await chromium.launch({ headless: true });
const results = [];
const fail = [];
function record(name, ok, detail = '') {
  results.push({ name, ok, detail });
  if (!ok) fail.push({ name, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
}
async function open(params, vp = 390) {
  const height = vp === 375 ? 667 : vp === 414 ? 896 : 844;
  const page = await browser.newPage({ viewport: { width: vp, height } });
  page.__errors = [];
  page.on('console', (m) => { if (m.type() === 'error') page.__errors.push(m.text()); });
  page.on('pageerror', (e) => page.__errors.push(String(e)));
  await page.goto(`${BASE}?${new URLSearchParams(params).toString()}&vp=${vp}&bare=1`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__FINAL_READY__ === true, null, { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(240);
  return page;
}
const txt = async (page, sel) => (await page.locator(sel).first().innerText()).replace(/\s+/g, ' ').trim();
const noOverflow = async (page) => page.evaluate(() => {
  const p = document.querySelector('.page');
  return p.scrollWidth <= p.clientWidth + 1;
});

/* 集合 → 同行：逐人签到 + 逐人分车 + 上车确认 */
{
  const page = await open({ page: 'collab', stage: 'gathering', role: 'organizer', id: 'qcs' });
  await page.getByRole('tab', { name: /现场/ }).click();
  await page.waitForTimeout(250);
  let guard = 0;
  while (await page.locator('.col-fieldrow .col-mini').filter({ hasText: '签到' }).count()) {
    await page.locator('.col-fieldrow .col-mini').filter({ hasText: '签到' }).first().click();
    await page.waitForTimeout(280);
    if (++guard > 12) break;
  }
  record('S1 集合阶段逐人签到清零', await page.locator('.col-fieldrow .col-mini').filter({ hasText: '签到' }).count() === 0, `clicks=${guard}`);

  await page.getByRole('tab', { name: /车辆/ }).click();
  await page.waitForTimeout(250);
  guard = 0;
  while (await page.locator('.col-unassigned .col-mini').count()) {
    await page.locator('.col-unassigned .col-mini').first().click();
    await page.waitForTimeout(260);
    await page.locator('.sheet__actions .btn--primary').click();
    await page.waitForTimeout(360);
    if (++guard > 8) break;
  }
  record('S2 集合阶段逐人分车清零', await page.locator('.col-unassigned .col-mini').count() === 0, `clicks=${guard}`);

  await page.getByRole('tab', { name: /现场/ }).click();
  await page.waitForTimeout(250);
  guard = 0;
  while (await page.locator('.col-fieldrow .col-mini').filter({ hasText: '签到' }).count()) {
    await page.locator('.col-fieldrow .col-mini').filter({ hasText: '签到' }).first().click();
    await page.waitForTimeout(280);
    if (++guard > 12) break;
  }
  record('S2b 分车后补签到清零', await page.locator('.col-fieldrow .col-mini').filter({ hasText: '签到' }).count() === 0, `clicks=${guard}`);

  await page.waitForTimeout(200);
  const cta = page.locator('.col-stage-cta');
  record('S3 集合阶段门槛满足', await cta.isEnabled(), await cta.innerText());
  await cta.click();
  await page.waitForTimeout(300);
  const attest = page.locator('.sheet input[type=checkbox]');
  record('S4 出发需要车长确认', await attest.count() === 1);
  await attest.check();
  await page.locator('.sheet__actions .btn--primary').click();
  await page.waitForTimeout(500);
  record('S5 已进入同行阶段', (await txt(page, '.col-stage')).includes('正在同行'), await txt(page, '.col-stage'));
  record('S6 同行页 0 console error', page.__errors.length === 0, page.__errors.join(' | '));
  await page.screenshot({ path: 'final/screenshots/states/collab-active-after-advance-390.png' });
  await page.close();
}

/* 返程 → 归档：异常处理 + 逐人到手 + 归档 */
{
  const page = await open({ page: 'collab', stage: 'closing', role: 'organizer', id: 'qcs' });
  const inc = page.locator('.col-task').filter({ hasText: '未解决异常' });
  if (await inc.count()) {
    await inc.locator('.col-task__action').click();
    await page.waitForTimeout(280);
    await page.locator('.sheet textarea').fill('已电话确认罗壹安全，迟到原因已记录');
    await page.locator('.sheet').getByRole('button', { name: '标记已协调' }).click();
    await page.waitForTimeout(420);
  }
  record('S7 归档前必须解决异常', await page.locator('.col-task').filter({ hasText: '未解决异常' }).count() === 0);
  await page.getByRole('tab', { name: /现场/ }).click();
  await page.waitForTimeout(250);
  let guard = 0;
  while (await page.locator('.col-fieldrow .col-mini').filter({ hasText: '确认到家' }).count()) {
    await page.locator('.col-fieldrow .col-mini').filter({ hasText: '确认到家' }).first().click();
    await page.waitForTimeout(240);
    await page.locator('.sheet textarea').fill(`20:${String(10 + guard).padStart(2, '0')} 电话确认本人已到家`);
    await page.locator('.sheet .check-row input').check();
    await page.locator('.sheet__actions .btn--primary').click();
    await page.waitForTimeout(360);
    if (++guard > 12) break;
  }
  record('S8 返程逐人确认到家清零', await page.locator('.col-fieldrow .col-mini').filter({ hasText: '确认到家' }).count() === 0, `clicks=${guard}`);
  const cta = page.locator('.col-stage-cta');
  record('S9 归档门槛满足', await cta.isEnabled(), await cta.innerText());
  await cta.click();
  await page.waitForTimeout(300);
  await page.locator('.sheet__actions .btn--primary').click();
  await page.waitForTimeout(500);
  record('S10 活动已归档', (await txt(page, '.col-stage')).includes('已归档'), await txt(page, '.col-stage'));
  record('S11 归档页 0 console error', page.__errors.length === 0, page.__errors.join(' | '));
  await page.screenshot({ path: 'final/screenshots/states/collab-archived-after-advance-390.png' });
  await page.close();
}

async function clearToast(page) {
  await page.evaluate(() => { document.querySelector('.toast')?.remove(); });
}

async function signupAsViewer(page, name = '沈岚') {
  await page.locator('.actionbar__main').click();
  await page.waitForTimeout(280);
  const inputs = page.locator('.sheet input[type=text]');
  const tels = page.locator('.sheet input[type=tel]');
  await inputs.nth(0).fill(name);
  await tels.nth(0).fill('13800001234');
  await inputs.nth(1).fill('沈父');
  await tels.nth(1).fill('13900001234');
  await page.locator('.sheet .check-row input').first().check();
  await page.locator('.sheet__actions .btn--primary').click();
  await page.waitForTimeout(1000);
}

/* 跨页一致性 */
/* 报名 → 名单 → 审核 → 详情 的本地事务链 */
{
  const page = await open({ page: 'detail', state: 'new', id: 'qcs' });
  await signupAsViewer(page);
  record('S12 报名写入待审核 4 / 余位 2', (await txt(page, '.state-strip')).includes('4 人待审核') && (await txt(page, '.state-strip')).includes('余位 2 / 24'));
  record('S13 会话记录为 pending', await page.evaluate(() => window.__FINAL__.store.viewerSignup?.audit === 'pending'));
  await clearToast(page);
  await page.screenshot({ path: 'final/screenshots/states/detail-session-pending-390.png' });

  await page.evaluate(() => window.__FINAL__.go('collab', { stage: 'published', role: 'organizer' }));
  await page.waitForTimeout(700);
  record('S14 同一报名出现在协作名单', await page.locator('.col-person').filter({ hasText: '沈岚' }).count() === 1);
  record('S15 协作待审核计数为 4', (await txt(page, '.col-command')).includes('4 人 待审核'), await txt(page, '.col-command').then((t) => t.slice(0, 140)));
  await clearToast(page);
  await page.screenshot({ path: 'final/screenshots/states/collab-session-pending-390.png' });
  await page.locator('.col-person').filter({ hasText: '沈岚' }).scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'final/screenshots/states/collab-session-pending-row-390.png' });
  await page.evaluate(() => document.querySelector('.page').scrollTo(0, 0));
  await page.waitForTimeout(250);
  await page.locator('.col-person').filter({ hasText: '沈岚' }).locator('button.col-mini').click();
  await page.waitForTimeout(280);
  await page.locator('.sheet').getByRole('button', { name: '通过' }).click();
  await page.waitForTimeout(700);
  record('S16 审核通过写回会话', await page.evaluate(() => window.__FINAL__.store.viewerSignup?.audit === 'confirmed'));
  record('S17 审核后待审核降为 3', (await txt(page, '.col-command')).includes('3 人 待审核'), await txt(page, '.col-command').then((t) => t.slice(0, 140)));
  await clearToast(page);
  await page.evaluate(() => document.querySelector('.page').scrollTo(0, 0));
  await page.waitForTimeout(250);
  await page.screenshot({ path: 'final/screenshots/states/collab-session-approved-390.png' });
  await page.locator('.col-person').filter({ hasText: '沈岚' }).scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'final/screenshots/states/collab-session-approved-row-390.png' });

  await page.evaluate(() => window.__FINAL__.go('detail', { activityId: 'qcs', signup: 'confirmed' }));
  await page.waitForTimeout(700);
  record('S18 审核结果同步回详情', (await txt(page, '.state-strip__title')).includes('名额已确认'), await txt(page, '.state-strip__title'));
  record('S19 详情计数包含本人（19 已确认）', (await txt(page, '.det-hero__statusline')).includes('19 人已确认'), await txt(page, '.det-hero__statusline'));
  await clearToast(page);
  await page.screenshot({ path: 'final/screenshots/states/detail-session-confirmed-390.png' });

  await page.evaluate(() => window.__FINAL__.go('discover'));
  await page.waitForTimeout(700);
  const hero = await txt(page, '.disc-hero');
  record('S19b 发现页同步会话计数', hero.includes('19 人已确认') && hero.includes('3 人待审核') && hero.includes('余位 2 / 24'), hero.slice(0, 220));
  await clearToast(page);
  await page.screenshot({ path: 'final/screenshots/states/discover-session-approved-390.png' });
  await page.close();
}

/* 取消报名释放名额 */
{
  const page = await open({ page: 'detail', state: 'new', id: 'qcs' });
  await signupAsViewer(page);
  await page.locator('.actionbar__main').click();
  await page.waitForTimeout(300);
  await page.locator('.sheet').getByRole('button', { name: '取消报名' }).click();
  await page.waitForTimeout(300);
  await page.locator('.sheet').getByRole('button', { name: '确认取消' }).click();
  await page.waitForTimeout(700);
  record('S20 取消报名后详情只读', (await txt(page, '.state-strip__title')).includes('你已取消本次报名'), await txt(page, '.state-strip__title'));
  record('S21 取消写回会话', await page.evaluate(() => window.__FINAL__.store.viewerSignup?.audit === 'cancelled'));
  await page.evaluate(() => window.__FINAL__.go('collab', { stage: 'published', role: 'organizer' }));
  await page.waitForTimeout(700);
  record('S22 取消后名单不再含本人', await page.locator('.col-person').filter({ hasText: '沈岚' }).count() === 0);
  record('S23 取消后待审核回到 3', (await txt(page, '.col-command')).includes('3 人 待审核'), await txt(page, '.col-command').then((t) => t.slice(0, 140)));
  await page.evaluate(() => window.__FINAL__.go('discover'));
  await page.waitForTimeout(700);
  const hero = await txt(page, '.disc-hero');
  record('S24 取消后发现页回到基准计数', hero.includes('18 人已确认') && hero.includes('3 人待审核') && hero.includes('余位 3 / 24'), hero.slice(0, 220));
  await page.close();
}


{
  const d = await open({ page: 'discover' });
  const dh = await txt(d, '.disc-hero');
  const c1 = ['青城后山', '12.8', '680', '¥168', '18 人已确认', '3 人待审核'].every((s) => dh.includes(s));
  record('X1 发现页主活动事实完整', c1, dh.slice(0, 200));
  record('X2 发现页无横向溢出', await noOverflow(d));
  await d.close();

  const det = await open({ page: 'detail', state: 'new', id: 'qcs' });
  const dt = await txt(det, '.det-page');
  const c2 = ['青城后山 · 飞泉沟轻徒步', '12.8', '680', '¥168', '18 人已确认', '3 人待审核', '泰安古镇', '飞泉沟', '白云索道下站'].every((s) => dt.includes(s));
  record('X3 详情页事实与路线点完整', c2);
  record('X4 详情页无横向溢出', await noOverflow(det));
  record('X5 参与者详情不出现全量名单按钮', await det.locator('.det-page').getByText('查看名单与分车').count() === 0);
  await det.close();

  const col = await open({ page: 'collab', stage: 'published', role: 'organizer', id: 'qcs' });
  const ct = await txt(col, '.col-command');
  const c3 = ['青城后山', '18', '24', '3', '1'].every((s) => ct.includes(s));
  record('X6 协作页计数与详情同源', c3, ct.slice(0, 160));
  record('X7 协作页无横向溢出', await noOverflow(col));
  await col.close();

  const wx = await open({ page: 'weather', id: 'qcs' });
  const wt = await txt(wx, '.wx-page');
  const c4 = ['青城后山 · 飞泉沟轻徒步', '12.8 km / 680 m', '泰安古镇', '飞泉沟', '白云索道下站', '模拟预报'].every((s) => wt.includes(s));
  record('X8 天气页活动与路线点同源', c4);
  record('X9 天气页无横向溢出', await noOverflow(wx));
  record('X10 天气页四页回归 0 console error', wx.__errors.length === 0, wx.__errors.join(' | '));
  await wx.close();
}

/* 返回路径 */
{
  const page = await open({ page: 'detail', state: 'new', id: 'qcs' });
  await page.locator('.appbar__back').click();
  await page.waitForTimeout(350);
  record('N1 详情返回发现', page.url().includes('page=discover') || (await page.locator('.disc-top__title').count()) > 0);
  const wx = await open({ page: 'weather', id: 'qcs' });
  await wx.locator('.appbar__back').click();
  await wx.waitForTimeout(350);
  record('N2 天气返回详情', wx.url().includes('page=detail') || (await wx.locator('.det-hero__title').count()) > 0);
  const col = await open({ page: 'collab', stage: 'published', role: 'organizer', id: 'qcs' });
  await col.locator('.appbar__back').click();
  await col.waitForTimeout(350);
  record('N3 协作返回活动', col.url().includes('page=detail') || (await col.locator('.det-hero__title').count()) > 0);
  await page.close(); await wx.close(); await col.close();
}

console.log('\n========== SUMMARY ==========');
console.log(`PASS ${results.filter((r) => r.ok).length} / ${results.length}`);
if (fail.length) {
  console.log('FAILURES:');
  for (const f of fail) console.log(' -', f.name, '—', f.detail);
}
await browser.close();
if (fail.length) process.exitCode = 1;
