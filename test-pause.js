const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', msg => console.log('LOG:', msg.text()));
  page.on('pageerror', err => console.log('ERROR:', err.message));

  const client = await context.newCDPSession(page);
  await client.send('Debugger.enable');

  // Set a breakpoint or just pause after page loaded
  console.log('Navigating to http://localhost:4200/#/funds ...');
  await page.goto('http://localhost:4200/#/funds');

  await new Promise(r => setTimeout(r, 2000));

  let pausedCount = 0;
  client.on('Debugger.paused', async (params) => {
    pausedCount++;
    console.log(`=== PAUSE #${pausedCount} ===`);
    console.log('Reason:', params.reason);
    for (let i = 0; i < Math.min(10, params.callFrames.length); i++) {
      const f = params.callFrames[i];
      console.log(`  at ${f.functionName || '(anonymous)'} (${f.url}:${f.lineNumber}:${f.columnNumber})`);
    }

    if (pausedCount === 1) {
      // Resume and pause again after 500ms
      await client.send('Debugger.resume');
      setTimeout(async () => {
        await client.send('Debugger.pause');
      }, 500);
    } else {
      await browser.close();
      process.exit(0);
    }
  });

  await client.send('Debugger.pause');
  await new Promise(r => setTimeout(r, 5000));
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
