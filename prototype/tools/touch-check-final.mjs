// Final Pass — 触控设备仿真验收
// Playwright mobile device descriptors（isMobile/hasTouch），不是微信开发者工具/物理真机。
import { chromium, devices } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const BASE = process.env.FINAL_BASE || 'http://127.0.0.1:4176/final/index.html';
const OUT = fileURLToPath(new URL('../final/screenshots/device/', import.meta.url));
await mkdir(OUT, { recursive: true });
const cases = [
  { name: 'iPhone SE', slug: 'iphone-se', vp: 375 },
  { name: 'iPhone 13', slug: 'iphone-13', vp: 390 },
  { name: 'iPhone 11 Pro Max', slug: 'iphone-11-pro-max', vp: 414 },
  { name: 'Pixel 5', slug: 'pixel-5', vp: 390 }
];
const browser = await chromium.launch({ headless: true });
const results = [];
const fail = [];
function record(name, ok, detail = '') {
  results.push({ name, ok, detail });
  if (!ok) fail.push({ name, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
}
async function open(context, pageName, vp, params = {}) {
  const page = await context.newPage();
  page.__errors = [];
  page.on('console', (m) => { if (m.type() === 'error') page.__errors.push(m.text()); });
  page.on('pageerror', (e) => page.__errors.push(String(e)));
  const q = new URLSearchParams({ page: pageName, vp: String(vp), bare: '1', ...params });
  await page.goto(`${BASE}?${q}`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__FINAL_READY__ === true, null, { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(260);
  return page;
}
async function auditTargets(page, label) {
  const data = await page.evaluate(() => {
    const all = [...document.querySelectorAll('button, a, input, select, [role=button]')];
    const visible = all.filter((n) => {
      const r = n.getBoundingClientRect();
      const s = getComputedStyle(n);
      return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none';
    }).map((n) => {
      const r = n.getBoundingClientRect();
      return {
        tag: n.tagName, cls: String(n.className).slice(0, 44),
        text: (n.getAttribute('aria-label') || n.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 22),
        w: Math.round(r.width), h: Math.round(r.height),
        role: n.getAttribute('role') || ''
      };
    });
    const hard = visible.filter((x) => x.w < 24 || x.h < 24);
    const compact = visible.filter((x) => !hard.includes(x) && (x.w < 40 || x.h < 40));
    return { count: visible.length, hard, compact };
  });
  record(`${label} 触控目标无 <24px`, data.hard.length === 0, data.hard.slice(0, 4).map((x) => `${x.tag}.${x.cls}[${x.text}] ${x.w}x${x.h}`).join(' | '));
  record(`${label} 触控审计完成`, true, `visible=${data.count} compact(<40)=${data.compact.length}`);
  if (data.compact.length) {
    console.log('   compact:', data.compact.slice(0, 8).map((x) => `${x.tag}.${x.cls}[${x.text}] ${x.w}x${x.h}`).join(' | '));
  }
}
async function keyboardFocus(page, label) {
  await page.evaluate(() => document.querySelector('.page').scrollTo(0, 0));
  await page.keyboard.press('Tab');
  const info = await page.evaluate(() => {
    const a = document.activeElement;
    if (!a) return null;
    const s = getComputedStyle(a);
    return { tag: a.tagName, cls: String(a.className).slice(0, 40), outline: s.outlineStyle, width: s.outlineWidth, text: (a.getAttribute('aria-label') || a.textContent || '').trim().slice(0, 20) };
  });
  record(`${label} 键盘焦点可见`, !!info && info.outline !== 'none' && parseFloat(info.width) >= 1, JSON.stringify(info));
}

for (const c of cases) {
  const device = devices[c.name];
  if (!device) { record(`${c.name} 设备描述存在`, false); continue; }
  const context = await browser.newContext({ ...device, viewport: { width: device.viewport.width, height: device.viewport.height } });
  const page = await open(context, 'discover', c.vp);
  record(`${c.name} 设备仿真加载`, page.__errors.length === 0, page.__errors.join(' | '));
  await page.screenshot({ path: `${OUT}${c.slug}-discover.png` });
  await auditTargets(page, `${c.name} 发现`);
  if (c.name === 'iPhone SE') await keyboardFocus(page, `${c.name} 发现`);

  // 触控主路径：发现→详情
  await page.locator('.disc-hero__cta').tap();
  await page.waitForTimeout(450);
  record(`${c.name} 触控发现→详情`, (await page.locator('.det-hero__title').count()) === 1);
  await page.screenshot({ path: `${OUT}${c.slug}-detail.png` });
  await auditTargets(page, `${c.name} 详情`);
  await page.screenshot({ path: `${OUT}${c.slug}-detail.png` });
  await page.close();

  const col = await open(context, 'collab', c.vp, { stage: 'published', role: 'organizer' });
  await col.locator('.col-task__action').first().tap();
  await col.waitForTimeout(350);
  record(`${c.name} 触控协作任务`, (await col.locator('.col-panel').count()) === 1);
  await col.screenshot({ path: `${OUT}${c.slug}-collab.png` });
  await auditTargets(col, `${c.name} 协作`);
  await col.close();

  const wx = await open(context, 'weather', c.vp);
  await wx.locator('.wx-point').filter({ hasText: '白云索道下站' }).tap();
  await wx.waitForTimeout(400);
  record(`${c.name} 触控天气切点`, (await wx.locator('.wx-selected__time').innerText()).includes('白云索道下站'));
  await wx.screenshot({ path: `${OUT}${c.slug}-weather.png` });
  await auditTargets(wx, `${c.name} 天气`);
  await wx.close();
  await context.close();
}

console.log('\n========== SUMMARY ==========');
console.log(`PASS ${results.filter((r) => r.ok).length} / ${results.length}`);
if (fail.length) {
  console.log('FAILURES:');
  for (const f of fail) console.log(' -', f.name, '—', f.detail);
}
await browser.close();
if (fail.length) process.exitCode = 1;
