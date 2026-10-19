// OurTrail Visual Direction Lab — 运行时 DOM 全矩阵自检
// 用法:
//   node tools/dom-check.mjs                        # 默认全矩阵 (F × 4 页 × 3 视口 + 三态)
//   node tools/dom-check.mjs --style=A,C --vp=390
//   node tools/dom-check.mjs --audit                # 逐元素排版审计 (溢出 / 越界 / 小于 11px 的正文 / 分区纸色)
//   $env:LAB_BASE='http://127.0.0.1:4173/index.html'; node tools/dom-check.mjs
//
// 每格检查 5 项:
//   1) window.__LAB_READY__ === true            (渲染完成握手)
//   2) 页面可见文本含活动身份「赵公山」          (collaborate/详情/协作 三页必须有活动名)
//   3) 无横向溢出 (scrollWidth <= clientWidth + 1)
//   4) 零控制台错误 / 页面异常
//   5) 非空渲染 (页面容器高度 > 200px)
//
// --audit 额外检查 (在 390 主评审视口上逐元素测量):
//   a) 每个子元素无自身横向溢出、没有任何元素越过 .page 右边界
//   b) 没有任何可见文本小于 11px (A 的字阶下限, 红线)
//   c) 列出工位分区的编号与纸色, 便于核对「分区只用纸色、不用深色块」
import { chromium } from 'playwright';

const BASE = process.env.LAB_BASE || 'http://127.0.0.1:4173/index.html';

const args = Object.fromEntries(
  process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => {
    const [k, v] = a.slice(2).split('=');
    return [k, v === undefined ? true : v];
  }),
);

const STYLES = args.style ? String(args.style).split(',') : ['F'];
const PAGES = args.pages ? String(args.pages).split(',') : ['discover', 'detail', 'collab', 'weather'];
const VIEWPORTS = args.vp ? String(args.vp).split(',').map(Number) : [375, 390, 414];
// 身份检查口径与 A–E 保持一致:
//   · 正常态 / 禁用态 —— 详情、协作、天气三页必须出现活动名;
//   · 空态 / 错误态 —— 详情页空态刻意退化为「已取消活动」(小鱼洞)，天气空态没有站点，
//     因此这两态不要求出现「赵公山」（A 同款实现，同口径）。
const IDENTITY_PAGES = ['detail', 'collab', 'weather'];
const IDENTITY_STATES = ['', 'disabled'];
const IDENTITY = '赵公山';

const rect = (vp) => ({ width: vp, height: vp === 375 ? 667 : vp === 414 ? 896 : 844 });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
let pass = 0;
let fail = 0;
const failures = [];

for (const style of STYLES) {
  for (const state of ['', 'empty', 'error', 'disabled']) {
    const pages = state ? ['collab', 'detail', 'weather', 'discover'] : PAGES;
    for (const pageName of pages) {
      for (const vp of VIEWPORTS) {
        if (state && vp !== 390) continue;
        const errors = [];
        const onConsole = (m) => { if (m.type() === 'error') errors.push(m.text()); };
        const onError = (e) => errors.push('pageerror: ' + e.message);
        page.on('console', onConsole);
        page.on('pageerror', onError);

        const url = `${BASE}?style=${style}&page=${pageName}&vp=${vp}&bare=1${state ? `&state=${state}` : ''}`;
        let ready = false;
        try {
          await page.setViewportSize(rect(vp));
          await page.goto(url, { waitUntil: 'networkidle' });
          await page.waitForFunction(() => window.__LAB_READY__ === true, null, { timeout: 15000 });
          ready = true;
        } catch (err) {
          errors.push('ready-timeout: ' + err.message.split('\n')[0]);
        }

        const probe = await page.evaluate((cfg) => {
          const el = document.querySelector('.page');
          const text = (el ? el.innerText : '').replace(/\s+/g, '');
          const needId = cfg.idPages.includes(cfg.page) && cfg.idStates.includes(cfg.state);
          return {
            hasPage: !!el,
            textLen: text.length,
            hasIdentity: needId ? text.includes(cfg.identity) : true,
            overflow: el ? el.scrollWidth - el.clientWidth : -1,
            docOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
            height: el ? el.scrollHeight : 0,
          };
        }, { idPages: IDENTITY_PAGES, idStates: IDENTITY_STATES, identity: IDENTITY, page: pageName, state });

        page.off('console', onConsole);
        page.off('pageerror', onError);

        const problems = [];
        if (!ready) problems.push('READY=false');
        if (!probe.hasPage) problems.push('no .page');
        if (probe.textLen < 40) problems.push('text too short: ' + probe.textLen);
        if (!probe.hasIdentity) problems.push('identity 「' + IDENTITY + '」 missing');
        if (probe.overflow > 1) problems.push('h-overflow .page: +' + probe.overflow + 'px');
        if (probe.docOverflow > 1) problems.push('h-overflow doc: +' + probe.docOverflow + 'px');
        if (probe.height < 200) problems.push('too short: ' + probe.height + 'px');
        if (errors.length) problems.push('console: ' + errors.slice(0, 2).join(' | '));

        const tag = `${style}/${pageName}/${vp}${state ? '/' + state : ''}`;
        if (problems.length) {
          fail++;
          failures.push(`${tag} → ${problems.join('; ')}`);
          console.log('  ✗', tag, '→', problems.join('; '));
        } else {
          pass++;
          console.log('  ✓', tag, `(${probe.height}px, ${probe.textLen} chars)`);
        }
      }
    }
  }
}

if (args.audit) {
  const b2 = await chromium.launch({ headless: true });
  const p2 = await b2.newPage();
  for (const style of STYLES) {
    for (const pageName of PAGES) {
      const errs = [];
      p2.on('pageerror', (e) => errs.push(e.message));
      await p2.setViewportSize({ width: 390, height: 844 });
      await p2.goto(`${BASE}?style=${style}&page=${pageName}&vp=390&bare=1`, { waitUntil: 'networkidle' });
      await p2.waitForFunction(() => window.__LAB_READY__ === true, null, { timeout: 15000 });
      const r = await p2.evaluate(() => {
        const root = document.querySelector('.page');
        const rb = root.getBoundingClientRect();
        const over = [];
        const small = [];
        const zones = [];
        for (const el of root.querySelectorAll('*')) {
          const box = el.getBoundingClientRect();
          if (!box.width && !box.height) continue;
          const cs = getComputedStyle(el);
          if (cs.display === 'none' || cs.visibility === 'hidden') continue;
          const name = (el.className && el.className.baseVal !== undefined)
            ? el.tagName : (el.className || el.tagName);
          if (cs.overflow !== 'visible' && el.scrollWidth - el.clientWidth > 1) {
            over.push(name + ' +' + (el.scrollWidth - el.clientWidth));
          }
          if (box.right > rb.right + 1.5) over.push('PAST-EDGE ' + name + ' +' + Math.round(box.right - rb.right));
          const fs = parseFloat(cs.fontSize);
          const hasText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
          if (hasText && fs && fs < 11) small.push(name + ' ' + fs + 'px');
        }
        root.querySelectorAll('.f-zone, .a-sect, .e-zone').forEach((z) => {
          zones.push({
            no: (z.querySelector('.f-zone__no') || {}).textContent || '-',
            name: (z.querySelector('.f-zone__name') || {}).textContent || '-',
            tone: getComputedStyle(z).backgroundColor,
          });
        });
        return { over: [...new Set(over)], small: [...new Set(small)], zones, h: root.scrollHeight };
      });
      console.log(`\n=== ${style}/${pageName} (${r.h}px) 分区 ${r.zones.length} 个 · pageerror ${errs.length}`);
      r.zones.forEach((z) => console.log('   ' + z.no + ' ' + z.name + '  →  ' + z.tone));
      console.log('   溢出:', r.over.length ? r.over.join(' ; ') : 'NONE');
      console.log('   <11px 文本:', r.small.length ? r.small.join(' ; ') : 'NONE');
      p2.removeAllListeners('pageerror');
    }
  }
  await b2.close();
}

await browser.close();
console.log(`\n[dom-check] ${pass} pass / ${fail} fail`);
if (fail) {
  console.log('[dom-check] failures:');
  failures.forEach((f) => console.log('  -', f));
  process.exit(1);
}
console.log('[dom-check] ALL-PASS');