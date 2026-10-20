// 生成 Round 4 → Final Pass 的 390 首屏对照图
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const BASE = 'http://127.0.0.1:4176';
const OUT = fileURLToPath(new URL('../final/screenshots/compare/', import.meta.url));
await mkdir(OUT, { recursive: true });
const pages = [
  ['discover', 'r4-hybrid-390-fold.png', 'final-discover-390-fold.png'],
  ['detail', 'r4-detail-390-fold.png', 'final-detail-390-fold.png'],
  ['collab', 'r4-collab-390-fold.png', 'final-collab-390-fold.png'],
  ['weather', 'r4-weather-390-fold.png', 'final-weather-390-fold.png']
];
const browser = await chromium.launch({ headless: true });
for (const [name, before, after] of pages) {
  const page = await browser.newPage({ viewport: { width: 880, height: 930 } });
  await page.setContent(`<!doctype html><html><body style="margin:0;background:#202822;font-family:-apple-system,'PingFang SC','Microsoft YaHei',sans-serif;color:#F2F0E6">
    <div style="display:flex;gap:18px;padding:22px 22px 16px;align-items:flex-start">
      <div style="width:390px">
        <div style="font-size:11px;letter-spacing:1.2px;color:#8D9486;font-weight:700;margin-bottom:8px">ROUND 4 · 修改前</div>
        <img src="${BASE}/final/screenshots/before/${before}" style="width:390px;height:844px;display:block;border-radius:18px;box-shadow:0 14px 34px rgba(0,0,0,.35)">
      </div>
      <div style="width:390px">
        <div style="font-size:11px;letter-spacing:1.2px;color:#D6E3A4;font-weight:700;margin-bottom:8px">FINAL PASS · 修改后</div>
        <img src="${BASE}/final/screenshots/after/${after}" style="width:390px;height:844px;display:block;border-radius:18px;box-shadow:0 14px 34px rgba(0,0,0,.35)">
      </div>
    </div>
    <div style="padding:0 24px 20px;font-size:10.5px;color:#8D9486">OurTrail UI Lab · ${name} · 390×844 · 同一页面可用高度 780px（状态栏/胶囊 64px 已扣除）</div>
  </body></html>`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(200);
  await page.screenshot({ path: `${OUT}compare-${name}-390.png`, fullPage: true });
  console.log('✓', name);
  await page.close();
}
await browser.close();
