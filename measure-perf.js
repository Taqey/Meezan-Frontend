const { chromium } = require('playwright');

async function testSite() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  console.log('=== TEST 1: Navigate to /funds ===');
  let start = Date.now();
  await page.goto('http://localhost:4200/funds', { timeout: 30000, waitUntil: 'networkidle' });
  console.log('/funds loaded in', Date.now() - start, 'ms');

  const cardCount = await page.locator('app-entity-card').count();
  console.log('Cards rendered:', cardCount);
  const cascadeCount = await page.locator('.cascade-level select').count();
  console.log('Cascade selects:', cascadeCount);

  console.log('=== TEST 2: Navigate to /admin/funds ===');
  await page.goto('http://localhost:4200/admin/login');
  await page.evaluate(() => localStorage.setItem('meezan_admin_session', 'true'));
  
  start = Date.now();
  await page.goto('http://localhost:4200/admin/funds', { timeout: 30000, waitUntil: 'networkidle' });
  console.log('/admin/funds loaded in', Date.now() - start, 'ms');

  console.log('Testing interactions on /admin/funds...');
  // Click on 'تحتاج مراجعة'
  const reviewBtn = page.locator('button:has-text("تحتاج مراجعة")');
  if (await reviewBtn.count() > 0) {
    const tReview = Date.now();
    await reviewBtn.click();
    console.log('Clicked تحتاج مراجعة');
    await page.waitForTimeout(3000);
    console.log('Review section unclassified rows:', await page.locator('table tr').count());
  }

  // Go back to الشجرة
  const treeBtn = page.locator('button:has-text("الشجرة")');
  if (await treeBtn.count() > 0) {
    await treeBtn.click();
    await page.waitForTimeout(1000);
  }

  // Open funds inside a node
  const nodeFundsBtn = page.locator('button:has-text("الصناديق")').first();
  if (await nodeFundsBtn.count() > 0) {
    console.log('Clicking first الصناديق button...');
    await nodeFundsBtn.click();
    await page.waitForTimeout(3000);
    console.log('Table rows after opening node funds:', await page.locator('table tr').count());
  }

  // Test selecting tabs: التصنيفات, الصناديق, سجل المزامنة, سجل التغييرات
  const catTab = page.locator('button:has-text("التصنيفات")');
  if (await catTab.count() > 0) {
    await catTab.click();
    await page.waitForTimeout(2000);
    console.log('Clicked التصنيفات tab');
  }

  const fundsTab = page.locator('button:has-text("الصناديق")').first();
  if (await fundsTab.count() > 0) {
    await fundsTab.click();
    await page.waitForTimeout(2000);
    console.log('Clicked الصناديق tab');
  }

  await browser.close();
  console.log('ALL TESTS COMPLETED');
}

testSite().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
