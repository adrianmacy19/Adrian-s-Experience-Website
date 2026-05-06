import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, 'temporary screenshots');

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

const url   = process.argv[2] || 'http://localhost:3000';
const label = process.argv[3] || '';

// Find next available index
const existing = fs.readdirSync(outDir).filter(f => f.endsWith('.png'));
const indices  = existing.map(f => parseInt(f.match(/^screenshot-(\d+)/)?.[1] ?? 0)).filter(Boolean);
const next     = indices.length ? Math.max(...indices) + 1 : 1;

const filename = label
  ? `screenshot-${next}-${label}.png`
  : `screenshot-${next}.png`;

const outPath = path.join(outDir, filename);

const browser = await puppeteer.launch({ headless: true });
const page    = await browser.newPage();

await page.setViewport({ width: 1440, height: 900 });
await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

// Force all animated elements visible instantly (bypasses intersection observer timing)
await page.evaluate(() => {
  document.querySelectorAll('.fade-up, .tl-item, .reveal, .reveal-x').forEach(el => {
    el.style.transition = 'none';
    el.classList.add('vis');
  });
  // Also fire counters by setting final values
  document.querySelectorAll('.ctr').forEach(el => {
    el.textContent = el.dataset.t;
  });
});

// Let the page settle after forced visibility
await new Promise(r => setTimeout(r, 800));

await page.screenshot({ path: outPath, fullPage: true });
await browser.close();

console.log(`Screenshot saved: temporary screenshots/${filename}`);
