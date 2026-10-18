const { chromium } = require('playwright');
const https = require('https');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

function measureHttp(url) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          url,
          status: res.statusCode,
          duration: Date.now() - start,
          bytes: Buffer.byteLength(data, 'utf8')
        });
      });
    }).on('error', reject);
  });
}

(async () => {
  console.log('=== MEASURING BACKEND DIRECT CALLS ===');
  const coldSectors = await measureHttp('https://localhost:7278/api/sectors');
  console.log('Cold /api/sectors:', coldSectors);
  const warmSectors = await measureHttp('https://localhost:7278/api/sectors');
  console.log('Warm /api/sectors:', warmSectors);

  const coldStocks = await measureHttp('https://localhost:7278/api/stocks?sectorId=1&page=1&pageSize=100');
  console.log('Cold /api/stocks?sectorId=1:', coldStocks);
  const warmStocks = await measureHttp('https://localhost:7278/api/stocks?sectorId=1&page=1&pageSize=100');
  console.log('Warm /api/stocks?sectorId=1:', warmStocks);

  console.log('\n=== MEASURING PLAYWRIGHT FRONTEND /sectors LOAD ===');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await context.newPage();

  const requests = [];
  page.on('request', req => {
    if (req.url().includes('/api/')) {
      requests.push({ url: req.url(), start: Date.now() });
    }
  });
  page.on('response', res => {
    const match = requests.find(r => r.url === res.url());
    if (match) {
      match.duration = Date.now() - match.start;
      match.status = res.status();
    }
  });

  const t0 = Date.now();
  await page.goto('http://localhost:4200/#/sectors', { waitUntil: 'networkidle', timeout: 60000 });
  const pageLoadTime = Date.now() - t0;
  console.log('Frontend /sectors total page load time:', pageLoadTime, 'ms');
  console.log('API requests during /sectors:');
  for (const r of requests) {
    console.log(` - [${r.status}] ${r.duration}ms: ${r.url}`);
  }

  const cards = await page.$$('.entity-card');
  console.log('Total sector cards rendered:', cards.length);
  if (cards.length > 0) {
    const statsTexts = await cards[0].$$eval('.entity-stat', els => els.map(e => ({
      text: e.innerText.replace(/\n/g, ' '),
      html: e.innerHTML
    })));
    console.log('First card .entity-stat count:', statsTexts.length, 'entries:', statsTexts);
  }

  console.log('\n=== MEASURING PLAYWRIGHT FRONTEND /indices SECTORAL CARD ===');
  await page.goto('http://localhost:4200/#/indices', { waitUntil: 'networkidle' });
  const indexCards = await page.$$('.entity-card');
  console.log('Total index cards rendered:', indexCards.length);
  for (const c of indexCards) {
    const title = await c.$eval('h2', el => el.innerText).catch(() => '');
    if (title.includes('قطاع') || title.includes('القطاعية')) {
      const stats = await c.$$eval('.entity-stat', els => els.map(e => e.innerText.replace(/\n/g, ' ')));
      const box = await c.boundingBox();
      console.log('Sectoral card title:', title, 'box:', box, 'stats count:', stats.length, 'stats:', stats);
    }
  }

  await browser.close();
})();
