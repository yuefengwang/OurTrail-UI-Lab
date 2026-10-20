// Final Pass — 三视口尺寸与首屏测量
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const BASE = process.env.FINAL_BASE || 'http://127.0.0.1:4176/final/index.html';
const OUT = fileURLToPath(new URL('../final/evidence/', import.meta.url));
const heightOf = (vp) => (vp === 375 ? 667 : vp === 414 ? 896 : 844);
const pages = [
  { page: 'discover', params: {} },
  { page: 'detail', params: { state: 'new' } },
  { page: 'collab', params: { stage: 'published', role: 'organizer' } },
  { page: 'weather', params: { point: 'r2', range: 48 } }
];
const browser = await chromium.launch({ headless: true });
const out = { capturedAt: new Date().toISOString(), pages: [] };
for (const def of pages) {
  for (const vp of [375, 390, 414]) {
    const page = await browser.newPage({ viewport: { width: vp, height: heightOf(vp) } });
    const errors = [];
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', (e) => errors.push(String(e)));
    const p = new URLSearchParams({ ...def.params, page: def.page, vp: String(vp), bare: '1' });
    await page.goto(`${BASE}?${p.toString()}`, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => window.__FINAL_READY__ === true, null, { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(220);
    const data = await page.evaluate(() => {
      const pageEl = document.querySelector('.page');
      const pr = pageEl.getBoundingClientRect();
      const top = (sel) => {
        const n = document.querySelector(sel);
        if (!n) return null;
        const r = n.getBoundingClientRect();
        return { top: Math.round(r.top - pr.top + pageEl.scrollTop), bottom: Math.round(r.bottom - pr.top + pageEl.scrollTop), h: Math.round(r.height) };
      };
      const widthOverflow = pageEl.scrollWidth > pageEl.clientWidth + 1;
      return {
        title: document.title,
        clientHeight: pageEl.clientHeight,
        scrollHeight: pageEl.scrollHeight,
        clientWidth: pageEl.clientWidth,
        scrollWidth: pageEl.scrollWidth,
        widthOverflow,
        topbar: top('.appbar'),
        hero: top('.disc-hero, .det-hero, .col-command, .wx-hero'),
        cta: top('.disc-hero__cta, .actionbar, .col-task, .wx-chart'),
        primary: top('.actionbar__main, .disc-hero__cta, .col-task__action, .wx-summary'),
        firstRow: top('.disc-row, .det-brief, .col-person, .wx-points'),
        panel: top('.col-panel, .det-sec, .wx-chart'),
        buttons: [...pageEl.querySelectorAll('button')].length,
        text: pageEl.innerText.slice(0, 260)
      };
    });
    out.pages.push({ page: def.page, vp, errors, ...data });
    console.log(`${def.page}-${vp}: client=${data.clientHeight} scroll=${data.scrollHeight} overflowX=${data.widthOverflow} cta=${JSON.stringify(data.cta)} first=${JSON.stringify(data.firstRow)} errors=${errors.length}`);
    await page.close();
  }
}
await mkdir(OUT, { recursive: true });
await writeFile(OUT + 'final-measure.json', JSON.stringify(out, null, 2), 'utf8');
console.log('✓', OUT + 'final-measure.json');
await browser.close();
