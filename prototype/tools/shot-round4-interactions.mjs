// Round 4 — 交互态截图（筛选 / 搜索）
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

await page.goto(`${BASE}?view=hybrid&vp=390&bare=1`, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__LAB_READY__ === true, null, { timeout: 15000 });
await page.waitForTimeout(300);

const tab = (label) => page.locator('.seg__item, [role="tab"]').filter({ hasText: label }).first();
async function shot(name) {
  const path = OUT + name;
  await page.screenshot({ path });
  console.log('✓', path);
}
async function pick(label, name) {
  await tab(label).click();
  await page.waitForTimeout(320);
  await shot(name);
}

await pick('可报名', 'hybrid-390-filter-open.png');
await pick('已成行', 'hybrid-390-filter-formed.png');
await pick('已结束', 'hybrid-390-filter-ended.png');
await pick('全部', 'hybrid-390-filter-all.png');

const input = page.locator('[data-testid="r3-search"] input, input[type="search"]').first();
await input.fill('牛背山');
await page.waitForTimeout(320);
await shot('hybrid-390-search-niubei.png');
await input.fill('zzzz');
await page.waitForTimeout(320);
await shot('hybrid-390-search-none.png');
await input.fill('');
await page.waitForTimeout(300);

console.log(`pageerrors: ${errors.length}`);
await browser.close();
