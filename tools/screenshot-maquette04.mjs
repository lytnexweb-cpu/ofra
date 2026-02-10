/**
 * Screenshot generator for Maquette 04 — Résoudre une condition
 * Generates 6 screenshots: Desktop + Mobile for each of the 3 states (A/B/C)
 *
 * Usage: npx playwright test tools/screenshot-maquette04.mjs
 *   or:  node tools/screenshot-maquette04.mjs
 */

import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const MOCKUP_PATH = resolve(__dirname, '..', 'maquettes', '04-resoudre-condition.html');
const EXPORT_DIR = resolve(__dirname, '..', 'maquettes', '_exports');

const STATES = [
  { id: 'blocking', label: 'A' },
  { id: 'required', label: 'B' },
  { id: 'recommended', label: 'C' },
];

const VIEWPORTS = [
  { name: 'desktop', width: 1280, height: 1080 },
  { name: 'mobile', width: 375, height: 812 },
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
    // Set browser viewport — use wider viewport for captures, the frame itself simulates device width
    await page.setViewportSize({ width: 1400, height: viewport.height });

    for (const state of STATES) {
      // Navigate fresh each time to reset state
      await page.goto(fileUrl, { waitUntil: 'networkidle' });
      await page.waitForTimeout(500);

      // Use evaluate to call JS functions directly (avoids click interception issues)
      const vpMode = viewport.name === 'mobile' ? 'mobile' : 'desktop';
      await page.evaluate((mode) => window.setViewport(mode), vpMode);
      await page.waitForTimeout(300);

      await page.evaluate((stateId) => window.showState(stateId), state.id);
      await page.waitForTimeout(300);

      // Remove max-height constraint so modal expands to show all content for screenshot
      await page.evaluate((stateId) => {
        const modal = document.querySelector(`#state-${stateId}-section .modal-enter`);
        if (modal) {
          modal.style.maxHeight = 'none';
          modal.style.overflow = 'visible';
        }
        const body = document.querySelector(`#state-${stateId}-section .modal-body`);
        if (body) {
          body.style.overflow = 'visible';
        }
        // Also expand the viewport frame
        const frame = document.querySelector(`#state-${stateId}-section .viewport-frame`);
        if (frame) {
          frame.style.height = 'auto';
          frame.style.minHeight = '100vh';
        }
        // Expand overlay
        const overlay = document.querySelector(`#state-${stateId}-section .overlay`);
        if (overlay) {
          overlay.style.position = 'relative';
          overlay.style.height = 'auto';
          overlay.style.minHeight = 'auto';
        }
      }, state.id);
      await page.waitForTimeout(200);

      // Find the modal inside the active state section
      const modalSelector = `#state-${state.id}-section .modal-enter`;
      const modal = await page.$(modalSelector);

      if (!modal) {
        console.error(`Could not find modal for state ${state.id}`);
        continue;
      }

      // Screenshot the full modal element
      const filename = `maquette04-${viewport.name}-${state.label}.png`;
      const filepath = resolve(EXPORT_DIR, filename);

      await modal.screenshot({ path: filepath });
      console.log(`  ✓ ${filename}`);
      generated.push(filepath);
    }
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
