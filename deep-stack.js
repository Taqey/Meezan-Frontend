const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const client = await context.newCDPSession(page);
  await client.send('Debugger.enable');

  await page.goto('http://localhost:4200/#/funds');
  await new Promise(r => setTimeout(r, 2000));

  client.on('Debugger.paused', async (params) => {
    console.log('PAUSED at reason:', params.reason);
    console.log('Call stack length:', params.callFrames.length);
    for (let i = 0; i < Math.min(25, params.callFrames.length); i++) {
      const f = params.callFrames[i];
      let scriptUrl = f.url;
      console.log(`[${i}] ${f.functionName || '(anonymous)'} (${scriptUrl}:${f.lineNumber}:${f.columnNumber})`);
      if (scriptUrl && scriptUrl.includes('src/app')) {
        console.log(`    FOUND APP CODE: ${scriptUrl}:${f.lineNumber}`);
      }
    }
    await browser.close();
    process.exit(0);
  });

  await client.send('Debugger.pause');
  await new Promise(r => setTimeout(r, 5000));
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
