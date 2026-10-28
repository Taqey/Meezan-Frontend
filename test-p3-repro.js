const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  page.on('response', res => {
    if (res.url().includes('/api/')) {
      console.log('API RESPONSE:', res.url(), res.status());
    }
  });

  console.log('Navigating to admin...');
  await page.goto('http://localhost:4200/#/admin');
  await page.waitForTimeout(2000);

  const pwInput = await page.$('input[type="password"]');
  if (pwInput) {
    console.log('Entering admin key...');
    await pwInput.fill('admin123');
    const btns = await page.$$('button');
    for (const b of btns) {
      const txt = await b.innerText();
      if (txt.toLowerCase().includes('login') || txt.includes('دخول')) {
        await b.click();
        break;
      }
    }
    await page.waitForTimeout(3000);
  }

  const btns = await page.$$('button');
  console.log('Total buttons found:', btns.length);
  let rebuildBtn = null;
  for (const b of btns) {
    const t = await b.innerText();
    console.log('Button:', t);
    if (t.includes('إعادة بناء')) rebuildBtn = b;
  }

  if (rebuildBtn) {
    console.log('Found rebuild button. Initial text:', await rebuildBtn.innerText());
    await rebuildBtn.click();
    await page.waitForTimeout(1000);
    console.log('After 1s text:', await rebuildBtn.innerText(), 'disabled:', await rebuildBtn.isDisabled());
    await page.waitForTimeout(10000);
    console.log('After 11s text:', await rebuildBtn.innerText(), 'disabled:', await rebuildBtn.isDisabled());
    await page.waitForTimeout(10000);
    console.log('After 21s text:', await rebuildBtn.innerText(), 'disabled:', await rebuildBtn.isDisabled());
  }

  await browser.close();
})();
