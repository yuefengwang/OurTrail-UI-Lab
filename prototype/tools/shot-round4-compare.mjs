// 将 round-4-compare.html 的四个实验区块分别截成 PNG，供文档/终报引用
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const htmlUrl = new URL('../../docs/ui-design/round-4/round-4-compare.html', import.meta.url);
const outDir = new URL('../../docs/ui-design/round-4/', import.meta.url);
await mkdir(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1120, height: 1000 } });
await page.goto(htmlUrl.href, { waitUntil: 'load' });
await page.evaluate(async () => {
  await Promise.all([...document.images].map((img) => (img.decode ? img.decode().catch(() => {}) : 0)));
});
await page.waitForTimeout(250);

for (const id of ['e1', 'e2', 'e3', 'final']) {
  const path = fileURLToPath(new URL(`round-4-compare-${id}.png`, outDir));
  await page.locator(`#${id}`).screenshot({ path });
  console.log('✓', path);
}

await browser.close();
