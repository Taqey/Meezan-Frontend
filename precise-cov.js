const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const counts = {
    cardStats: 0,
    getFundIcon: 0,
    getFundAccent: 0,
    footerFor: 0,
    levels: 0,
    flatTree: 0
  };

  await page.addInitScript(() => {
    // Intercept console messages or functions
  });

  page.on('console', msg => {
    const text = msg.text();
    if (text.startsWith('[TRACE]')) {
      const parts = text.split(' ');
      const key = parts[1];
      if (counts[key] !== undefined) counts[key]++;
    }
  });

  // Let's connect CDP to profile function execution count
  const client = await context.newCDPSession(page);
  await client.send('Profiler.enable');
  await client.send('Profiler.startPreciseCoverage', { callCount: true, detailed: true });

  console.log('Navigating to http://localhost:4200/#/funds ...');
  await page.goto('http://localhost:4200/#/funds');
  await new Promise(r => setTimeout(r, 2000));

  const cov = await client.send('Profiler.takePreciseCoverage');
  await client.send('Profiler.stopPreciseCoverage');

  let highCallFunctions = [];
  for (const script of cov.result) {
    if (script.url && script.url.includes('src/app')) {
      for (const fn of script.functions) {
        const totalCalls = fn.ranges.reduce((acc, r) => acc + r.count, 0);
        if (totalCalls > 50) {
          highCallFunctions.push({
            name: fn.functionName,
            url: script.url.split('/').pop(),
            calls: totalCalls
          });
        }
      }
    }
  }

  highCallFunctions.sort((a, b) => b.calls - a.calls);
  console.log('Functions called > 50 times in app:');
  console.table(highCallFunctions.slice(0, 25));

  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
