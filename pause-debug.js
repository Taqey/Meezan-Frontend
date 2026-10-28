const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', msg => console.log('LOG:', msg.text()));
  page.on('pageerror', err => console.log('ERROR:', err.message));

  console.log('Navigating to http://localhost:4200/#/funds ...');
  // Don't wait for networkidle or load, just goto
  await page.goto('http://localhost:4200/#/funds');
  
  // Connect CDP debugger to pause JavaScript
  const client = await context.newCDPSession(page);
  await client.send('Debugger.enable');

  console.log('Sleeping 3 seconds while JS executes...');
  await new Promise(r => setTimeout(r, 3000));

  console.log('Pausing debugger...');
  client.on('Debugger.paused', async (params) => {
    console.log('PAUSED at reason:', params.reason);
    console.log('Call stack:');
    for (const frame of params.callFrames.slice(0, 10)) {
      console.log(`  at ${frame.functionName || '(anonymous)'} (${frame.url}:${frame.lineNumber}:${frame.columnNumber})`);
    }
    await browser.close();
    process.exit(0);
  });

  await client.send('Debugger.pause');

  // Wait another 3 seconds in case pause takes a moment
  await new Promise(r => setTimeout(r, 3000));
  console.log('Did not pause within 3s');
  await browser.close();
  process.exit(0);
})().catch(err => {
  console.error(err);
  process.exit(1);
});
