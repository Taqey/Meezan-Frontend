const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true });
  const p = await ctx.newPage();
  console.log('Navigating to /indices...');
  await p.goto('http://localhost:4200/#/indices', { timeout: 30000 });
  await p.waitForSelector('.entity-card', { timeout: 25000 });
  const cards = await p.$$('.entity-card');
  console.log('Found cards on /indices:', cards.length);

  for (const c of cards) {
    const h2 = await c.$eval('h2', el => el.innerText).catch(() => '');
    const box = await c.boundingBox();
    const stats = await c.$$eval('.entity-stat', els => els.map(e => ({
      text: e.innerText.replace(/\n/g, ' '),
      html: e.innerHTML
    })));
    console.log(`CARD: "${h2}" | Height: ${box ? box.height : null} | Width: ${box ? box.width : null} | Stat count: ${stats.length}`);
    if (h2.includes('قطاع') || h2.includes('القطاعية') || h2.includes('Sectoral')) {
      console.log('  -> SECTORAL CARD STAT DETAILS:', JSON.stringify(stats, null, 2));
    }
  }

  await browser.close();
})();
