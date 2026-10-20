// Final Pass — Round 4 四页基线测量（只读）
// 输出: prototype/final/evidence/baseline-measure.json
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const OUT = fileURLToPath(new URL('../final/evidence/', import.meta.url));
const BASE = process.env.R4_BASE || 'http://127.0.0.1:4174/round4/index.html';
const pages = ['hybrid', 'detail', 'collab', 'weather'];
const vps = [375, 390, 414];
const heightOf = (vp) => (vp === 375 ? 667 : vp === 414 ? 896 : 844);

const browser = await chromium.launch({ headless: true });
const result = { base: BASE, capturedAt: new Date().toISOString(), pages: [] };

for (const view of pages) {
  for (const vp of vps) {
    const page = await browser.newPage({ viewport: { width: vp, height: heightOf(vp) } });
    const errors = [];
    page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
    page.on('pageerror', (err) => errors.push(String(err)));
    await page.goto(`${BASE}?view=${view}&vp=${vp}&bare=1`, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => window.__LAB_READY__ === true, null, { timeout: 15000 });
    const data = await page.evaluate(() => {
      const pageEl = document.querySelector('.page');
      const pr = pageEl.getBoundingClientRect();
      const top = (node) => (node ? Math.round(node.getBoundingClientRect().top - pr.top + pageEl.scrollTop) : null);
      const rect = (node) => node ? {
        top: Math.round(node.getBoundingClientRect().top - pr.top + pageEl.scrollTop),
        bottom: Math.round(node.getBoundingClientRect().bottom - pr.top + pageEl.scrollTop),
        height: Math.round(node.getBoundingClientRect().height),
      } : null;
      const all = [...pageEl.querySelectorAll('*')];
      const overflowX = all.filter((n) => n.scrollWidth > n.clientWidth + 1).length;
      const headings = [...pageEl.querySelectorAll('h1,h2')].map((h) => ({
        tag: h.tagName, text: h.textContent.trim().replace(/\s+/g, ' ').slice(0, 60), top: top(h),
      }));
      const buttons = [...pageEl.querySelectorAll('button')].map((b) => ({
        text: b.textContent.trim().replace(/\s+/g, ' ').slice(0, 40),
        top: top(b), bottom: Math.round(b.getBoundingClientRect().bottom - pr.top + pageEl.scrollTop),
        disabled: b.disabled || b.getAttribute('aria-disabled') === 'true',
        cls: b.className,
      }));
      const imgs = [...pageEl.querySelectorAll('img')].map((img) => ({
        src: img.getAttribute('src'), w: img.naturalWidth, h: img.naturalHeight,
        top: top(img), height: Math.round(img.getBoundingClientRect().height),
      }));
      return {
        title: document.title,
        scrollHeight: pageEl.scrollHeight,
        clientHeight: pageEl.clientHeight,
        fold: pageEl.clientHeight,
        pageWidth: Math.round(pr.width),
        overflowX,
        headings,
        buttons,
        imgs,
        text: pageEl.innerText.slice(0, 3000),
        sections: [...pageEl.querySelectorAll('section, article, header, footer')].map((n) => ({
          tag: n.tagName, cls: String(n.className).slice(0, 70),
          top: top(n), height: Math.round(n.getBoundingClientRect().height),
        })),
      };
    });
    result.pages.push({ view, vp, height: heightOf(vp), errors, ...data });
    await page.close();
  }
}

await mkdir(OUT, { recursive: true });
const path = OUT + 'baseline-measure.json';
await writeFile(path, JSON.stringify(result, null, 2), 'utf8');
console.log('✓', path);
for (const p of result.pages) {
  const h1 = p.headings.find((h) => h.tag === 'H1');
  const cta = p.buttons.find((b) => /报名|安排|天气|发起|下一步|确认/.test(b.text));
  console.log(`${p.view}-${p.vp}: scrollH=${p.scrollHeight} fold=${p.fold} overflowX=${p.overflowX} h1="${h1 ? h1.text : '-'}" cta="${cta ? cta.text : '-'}"@${cta ? cta.top + '-' + cta.bottom : '-'} errors=${p.errors.length}`);
}
await browser.close();
