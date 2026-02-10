/**
 * Screenshot generator for Maquette 01 — Transaction Detail
 * Generates 2 screenshots: Desktop (1280x900) + Mobile (375x900)
 * Safe dimensions: <= 2000px, fullPage: false
 */

import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const MOCKUP_PATH = resolve(__dirname, '..', 'maquettes', '01-transaction-detail.html');
const EXPORT_DIR = resolve(__dirname, '..', 'maquettes', '_exports');

const VIEWPORTS = [
  { name: 'desktop', width: 1280, height: 900, vpMode: 'desktop' },
  { name: 'mobile', width: 375, height: 900, vpMode: 'mobile' },
];

async function run() {
  mkdirSync(EXPORT_DIR, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  const fileUrl = `file:///${MOCKUP_PATH.replace(/\\/g, '/')}`;
  console.log(`Opening: ${fileUrl}`);

  const generated = [];

  for (const viewport of VIEWPORTS) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto(fileUrl, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    // Switch viewport mode via JS
    await page.evaluate((mode) => window.setViewport(mode), viewport.vpMode);
    await page.waitForTimeout(400);

    const filename = `maquette01-${viewport.name}.png`;
    const filepath = resolve(EXPORT_DIR, filename);

    // Page screenshot with fullPage:false — captures visible viewport only (safe size)
    await page.screenshot({ path: filepath, fullPage: false });
    console.log(`  ✓ ${filename} (${viewport.width}x${viewport.height})`);
    generated.push(filepath);
  }

  await browser.close();

  console.log(`\nDone! ${generated.length} screenshots generated in:`);
  console.log(`  ${EXPORT_DIR}`);
  generated.forEach(f => console.log(`  - ${f.split(/[/\\]/).pop()}`));
}

run().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
