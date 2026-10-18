import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  console.log('Navigating to /sectors...');
  await page.goto('http://localhost:4200/#/sectors', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForSelector('app-entity-card', { timeout: 60000 });
  
  const cards = await page.$$('app-entity-card');
  console.log('Found cards on /sectors:', cards.length);

  for (let i = 0; i < Math.min(cards.length, 3); i++) {
    const card = cards[i];
    const title = await card.$eval('h2', el => el.textContent?.trim());
    const stats = await card.$$eval('.entity-stat', els => els.map(e => ({
      label: e.querySelector('span')?.textContent?.trim(),
      val: e.querySelector('strong')?.textContent?.trim()
    })));
    const box = await card.boundingBox();
    console.log(`Card ${i + 1}: "${title}" | Box: ${JSON.stringify(box)} | Stats count: ${stats.length}`);
    console.log('  Stats:', JSON.stringify(stats));
  }

  await browser.close();
})();
