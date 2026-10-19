// Round 4 视觉审查测量：真实渲染中的尺寸/顺序/重复计数（不是读 CSS 推断）
// 用法: node tools/measure-round4.mjs
import { chromium } from 'playwright';

const BASE = process.env.R4_BASE || 'http://127.0.0.1:4174/round4/index.html';
const args = Object.fromEntries(
  process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => {
    const [k, v] = a.slice(2).split('=');
    return [k, v === undefined ? true : v];
  })
);
const VPS = args.vp ? String(args.vp).split(',').map(Number) : [375, 390, 414];
const HEIGHT = { 375: 667, 390: 844, 414: 896 };

const browser = await chromium.launch({ headless: true });
for (const vp of VPS) {
  const page = await browser.newPage({ viewport: { width: vp, height: HEIGHT[vp] } });
  await page.goto(`${BASE}?view=hybrid&vp=${vp}&bare=1`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__LAB_READY__ === true, null, { timeout: 15000 });
  await page.waitForTimeout(200);

  const m = await page.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const qa = (s) => [...document.querySelectorAll(s)];
    const box = (s) => {
      const n = q(s);
      if (!n) return null;
      const r = n.getBoundingClientRect();
      return { top: Math.round(r.top), bottom: Math.round(r.bottom), h: Math.round(r.height) };
    };
    const rows = qa('.hy-row').map((r) => ({
      title: r.querySelector('.hy-row__title')?.textContent || '',
      date: (r.querySelector('.hy-row__date')?.innerText || '').replace(/\n/g, ' / '),
      status: r.querySelector('.status-word')?.textContent || '',
      h: Math.round(r.getBoundingClientRect().height),
    }));
    const dupCount = {};
    for (const a of qa('[data-activity-id]')) {
      const id = a.dataset.activityId;
      dupCount[id] = (dupCount[id] || 0) + 1;
    }
    const thumb = q('.hy-row__thumb img');
    return {
      viewportH: innerHeight,
      mast: box('.hy-mast'),
      heroMedia: box('.hy-hero__media'),
      panel: box('.hy-hero__panel'),
      cta: box('.hy-hero__cta'),
      rail: box('.hy-week'),
      railCard: box('.hy-card'),
      seam: box('.hy-seam'),
      listTop: box('.hy-compare'),
      footer: box('.foot'),
      rows,
      rowHeights: rows.map((r) => r.h),
      dupCount,
      thumbCss: thumb ? { objectFit: getComputedStyle(thumb).objectFit, objectPosition: getComputedStyle(thumb).objectPosition, natural: [thumb.naturalWidth, thumb.naturalHeight] } : null,
      colors: qa('.hy-row .status-word').map((n) => getComputedStyle(n).color),
      railTitles: qa('.hy-card__title').map((n) => n.textContent),
      railCount: qa('.hy-card').length,
      seamSticky: getComputedStyle(q('.hy-seam')).position,
    };
  });
  console.log(`\n===== vp ${vp} =====`);
  console.log(JSON.stringify(m, null, 2));
  await page.close();
}
await browser.close();
