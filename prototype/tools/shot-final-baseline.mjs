// Final Pass — Round 4 四页基线截图（375/390/414 × fold/full）
// 输出: prototype/final/screenshots/before/
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const OUT = fileURLToPath(new URL('../final/screenshots/before/', import.meta.url));
const BASE = process.env.R4_BASE || 'http://127.0.0.1:4174/round4/index.html';
const pages = ['hybrid', 'detail', 'collab', 'weather'];
const vps = [375, 390, 414];
const heightOf = (vp) => (vp === 375 ? 667 : vp === 414 ? 896 : 844);

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch({ headless: true });

for (const view of pages) {
  for (const vp of vps) {
    for (const kind of ['fold', 'full']) {
      const page = await browser.newPage({ viewport: { width: vp, height: heightOf(vp) } });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(`${BASE}?view=${view}&vp=${vp}&bare=1`, { waitUntil: 'networkidle' });
      await page.waitForFunction(() => window.__LAB_READY__ === true, null, { timeout: 15000 });
      if (kind === 'full') {
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
        await page.waitForTimeout(180);
      }
      const path = `${OUT}r4-${view}-${vp}-${kind}.png`;
      await page.screenshot({ path, fullPage: kind === 'full' });
      console.log('✓', path);
      await page.close();
    }
  }
}
await browser.close();
