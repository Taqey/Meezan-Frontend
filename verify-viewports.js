const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const viewports = [375, 768, 1024, 1440];

  for (const w of viewports) {
    const page = await browser.newPage({ viewport: { width: w, height: 900 } });

    // 1. /sectors
    await page.goto('http://localhost:4200/#/sectors', { waitUntil: 'networkidle' });
    await page.waitForSelector('app-entity-card', { timeout: 15000 });
    const sectorStatsCounts = await page.$$eval('app-entity-card', cards =>
      cards.map(c => c.querySelectorAll('.entity-stat').length)
    );
    const hasDashOnlyRow = await page.$$eval('app-entity-card .entity-stat', rows =>
      rows.some(r => {
        const label = r.querySelector('span')?.textContent?.trim() || '';
        const value = r.querySelector('strong')?.textContent?.trim() || '';
        return label === '' && value === '—';
      })
    );
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    const sectorHasHScroll = scrollWidth > clientWidth;

    // 2. /indices
    await page.goto('http://localhost:4200/#/indices', { waitUntil: 'networkidle' });
    await page.waitForSelector('app-entity-card', { timeout: 15000 });
    const sectoralStatsCount = await page.$$eval('app-entity-card', cards => {
      const sectoral = cards.find(c => c.textContent.includes('المؤشرات القطاعية'));
      if (!sectoral) return -1;
      return sectoral.querySelectorAll('.entity-stat').length;
    });

    // 3. /stocks (app-stock-card) and /funds (app-entity-card)
    await page.goto('http://localhost:4200/#/stocks', { waitUntil: 'networkidle' });
    await page.waitForSelector('app-stock-card', { timeout: 15000 });
    const stockCardCount = await page.$$eval('app-stock-card', cards => cards.length);

    await page.goto('http://localhost:4200/#/funds', { waitUntil: 'networkidle' });
    await page.waitForSelector('app-entity-card', { timeout: 15000 });
    const fundCardCount = await page.$$eval('app-entity-card', cards => cards.length);
    const fundStatsCount = await page.$$eval('app-entity-card', cards =>
      cards[0] ? cards[0].querySelectorAll('.entity-stat').length : 0
    );

    console.log('Viewport ' + w + 'px:');
    console.log('  /sectors: cards=' + sectorStatsCounts.length + ', statsPerCard=' + sectorStatsCounts[0] + ', hasDashOnly=' + hasDashOnlyRow + ', hScroll=' + sectorHasHScroll);
    console.log('  /indices: sectoralStatsCount=' + sectoralStatsCount);
    console.log('  /stocks: cardCount=' + stockCardCount + ', /funds: cardCount=' + fundCardCount + ' (statsCount=' + fundStatsCount + ')');

    await page.close();
  }

  await browser.close();
})();
