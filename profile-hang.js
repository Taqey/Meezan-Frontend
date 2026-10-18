const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', msg => console.log('BROWSER LOG:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));
  page.on('request', req => console.log('REQ:', req.method(), req.url()));
  page.on('response', res => console.log('RES:', res.status(), res.url()));

  console.log('Starting navigation to http://localhost:4200/#/funds ...');
  const t0 = Date.now();

  // Attach a CDP session to inspect CPU profiler or paused execution
  const client = await context.newCDPSession(page);
  await client.send('Profiler.enable');
  await client.send('Profiler.start');

  try {
    // Navigate with a short timeout to see if it even finishes initial html
    await page.goto('http://localhost:4200/#/funds', { timeout: 15000, waitUntil: 'commit' });
    console.log('Navigation committed after', Date.now() - t0, 'ms');
  } catch (err) {
    console.log('goto error:', err.message);
  }

  // Wait 5 seconds
  await new Promise(r => setTimeout(r, 5000));
  console.log('Elapsed after 5s:', Date.now() - t0, 'ms');

  try {
    const profile = await client.send('Profiler.stop');
    console.log('Profiler captured', profile.profile.nodes.length, 'nodes');
    // Find top functions by hitCount
    const topNodes = profile.profile.nodes
      .filter(n => n.hitCount > 0)
      .sort((a, b) => b.hitCount - a.hitCount)
      .slice(0, 15);
    console.log('Top nodes by hitCount:');
    topNodes.forEach(n => {
      console.log(`- ${n.callFrame.functionName || '(anonymous)'} @ ${n.callFrame.url}:${n.callFrame.lineNumber} (hits: ${n.hitCount})`);
    });
  } catch (err) {
    console.log('Profiler stop error:', err.message);
  }

  await browser.close();
  console.log('Done test');
})().catch(err => {
  console.error('Script error:', err);
  process.exit(1);
});
