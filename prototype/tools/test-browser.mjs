// 快速自检：Playwright 是否可用（使用本机已缓存的 chromium headless shell）
import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.setContent('<html><body style="margin:0;background:#F6F3EC"><div style="font:700 24px sans-serif;padding:24px">OK · 390×844</div></body></html>');
await page.screenshot({ path: new URL('../screenshots/_browser-check.png', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1') });
await browser.close();
console.log('playwright-ok');
