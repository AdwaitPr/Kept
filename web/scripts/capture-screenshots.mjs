import puppeteer from 'puppeteer-core';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const screenshotsDir = path.resolve(__dirname, '../../docs/screenshots');

async function run() {
  console.log('Launching Chrome to capture screenshots...');
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
    defaultViewport: { width: 1280, height: 900, deviceScaleFactor: 2 }
  });

  const page = await browser.newPage();

  // 1. Main Ledger
  console.log('Capturing Main Ledger...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: path.join(screenshotsDir, 'web-ledger.png'), fullPage: false });

  // 2. Quick Capture Modal
  console.log('Opening Quick Capture Modal...');
  const newCommitmentBtn = await page.waitForSelector('button:has-text("+ New Commitment")', { timeout: 5000 })
    .catch(async () => {
      // fallback search by text
      const buttons = await page.$$('button');
      for (const btn of buttons) {
        const text = await page.evaluate(el => el.textContent, btn);
        if (text && text.includes('New Commitment')) return btn;
      }
      return null;
    });

  if (newCommitmentBtn) {
    await newCommitmentBtn.click();
    await page.waitForSelector('[role="dialog"]', { timeout: 3000 });
    // Fill in a sample recipient to demonstrate autocomplete
    const recipientInput = await page.$('input[placeholder*="Alex"]');
    if (recipientInput) {
      await recipientInput.type('Sarah');
    }
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(screenshotsDir, 'web-quick-capture.png') });

    // Close modal via Escape key
    await page.keyboard.press('Escape');
    await new Promise(r => setTimeout(r, 400));
  }

  // 3. Renegotiate Modal
  console.log('Opening Renegotiate Modal...');
  const renegotiateBtn = await page.evaluateHandle(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    return buttons.find(b => b.textContent && b.textContent.includes('Renegotiate'));
  });

  const renegotiateElement = renegotiateBtn.asElement();
  if (renegotiateElement) {
    await renegotiateElement.click();
    await page.waitForSelector('[role="dialog"]', { timeout: 3000 });
    // Type a reason to make screenshot realistic
    const reasonInput = await page.$('input[placeholder*="pushed back"]');
    if (reasonInput) {
      await reasonInput.type('Client requested draft first');
    }
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(screenshotsDir, 'web-renegotiate.png') });
  }

  // 4. End-of-Day Review
  console.log('Capturing End-of-Day Review...');
  await page.goto('http://localhost:3000/review', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(screenshotsDir, 'web-eod-review.png') });

  // 5. History
  console.log('Capturing History...');
  await page.goto('http://localhost:3000/history', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(screenshotsDir, 'web-history.png') });

  await browser.close();
  console.log('All screenshots captured successfully!');
}

run().catch(err => {
  console.error('Error capturing screenshots:', err);
  process.exit(1);
});
