// Round 4 — 其他版式轻量一致性检查（仅确认 shell/global 更新未破坏既有页面）
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const OUT = fileURLToPath(new URL('../round4/screenshots/final/', import.meta.url));
const BASE = process.env.R4_BASE || 'http://127.0.0.1:4174/round4/index.html';
await mkdir(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.emulateMedia({ reducedMotion: 'reduce' });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));

const views = ['editorial', 'curated', 'detail', 'collab', 'weather'];
for (const view of views) {
  await page.goto(`${BASE}?view=${view}&vp=390&bare=1`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__LAB_READY__ === true, null, { timeout: 15000 });
  await page.waitForTimeout(240);
  const info = await page.evaluate(() => {
    const pageEl = document.querySelector('.page');
    const text = document.body.innerText;
    return {
      viewOK: window.__R3__?.state?.view === new URLSearchParams(location.search).get('view'),
      overflow: pageEl ? pageEl.scrollWidth - pageEl.clientWidth : -1,
      height: pageEl ? pageEl.scrollHeight : 0,
      textLength: text.length,
    };
  });
  await page.screenshot({ path: OUT + `other-${view}-390.png` });
  console.log(`${view}: viewOK=${info.viewOK} overflow=${info.overflow} height=${info.height} text=${info.textLength} errors=${errors.length}`);
}
/* 非 bare 下确认外壳标识已切到 Round 4 */
await page.goto(`${BASE}?view=editorial&vp=390`, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__LAB_READY__ === true, null, { timeout: 15000 });
await page.waitForTimeout(200);
const shellTitle = (await page.locator('.lab__title').innerText()).trim();
console.log(`shell title: ${shellTitle}`);
await page.screenshot({ path: OUT + 'other-shell-390.png' });
console.log(`pageerrors: ${errors.length}`);
await browser.close();
