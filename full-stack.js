const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Add init script to monitor setters, getters, or requestAnimationFrame/timers
  await page.addInitScript(() => {
    let callCount = 0;
    const origRAF = window.requestAnimationFrame;
    window.requestAnimationFrame = function(cb) {
      callCount++;
      if (callCount % 1000 === 0) {
        console.log('[RAF count]', callCount);
      }
      return origRAF(cb);
    };
  });

  page.on('console', msg => console.log('LOG:', msg.text()));

  const client = await context.newCDPSession(page);
  await client.send('Debugger.enable');

  await page.goto('http://localhost:4200/#/funds');
  await new Promise(r => setTimeout(r, 1000));

  client.on('Debugger.paused', async (params) => {
    console.log('=== DEBUGGER PAUSED ===');
    console.log('Reason:', params.reason);
    for (let i = 0; i < params.callFrames.length; i++) {
      const f = params.callFrames[i];
      console.log(`[${i}] ${f.functionName || '(anonymous)'} (${f.url}:${f.lineNumber}:${f.columnNumber})`);
    }
    await browser.close();
    process.exit(0);
  });

  console.log('Pausing debugger...');
  await client.send('Debugger.pause');
  await new Promise(r => setTimeout(r, 4000));
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
