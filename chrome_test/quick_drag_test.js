const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  console.log('🔗 Connecting to Chrome...');
  const browser = await puppeteer.connect({
    browserURL: 'http://127.0.0.1:9222'
  });
  
  const page = await browser.newPage();
  
  // Capture console errors
  let hasError = false;
  page.on('console', msg => {
    const txt = msg.text();
    console.log('[Console]', txt);
    if (txt.includes('ReferenceError') || txt.includes('loadingDialog')) {
      hasError = true;
      console.log('❌ ERROR DETECTED:', txt);
    }
  });
  
  page.on('pageerror', error => {
    hasError = true;
    console.log('❌ PAGE ERROR:', error.message);
  });
  
  console.log('📂 Loading new sheet...');
  await page.goto('http://localhost:1234/_new', { waitUntil: 'networkidle0', timeout: 30000 });
  
  console.log('📎 Uploading multi-sheet XLSX...');
  const filePath = path.resolve(__dirname, 'test_multisheet.xlsx');
  const [fileChooser] = await Promise.all([
    page.waitForFileChooser(),
    page.evaluate(() => {
      const input = document.createElement('input');
      input.type = 'file';
      input.click();
    })
  ]);
  
  await fileChooser.accept([filePath]);
  
  console.log('⏳ Waiting for redirect...');
  await page.waitForFunction(() => window.location.pathname.startsWith('/='), { timeout: 30000 });
  
  await page.waitForTimeout(3000);
  
  const url = await page.url();
  const tabs = await page.evaluate(() => {
    const tabDivs = document.querySelectorAll('.multi-view-tab');
    return Array.from(tabDivs).map(t => t.textContent.trim());
  });
  
  console.log('\n📊 RESULT:');
  console.log('URL:', url);
  console.log('Tabs:', tabs.length, '→', tabs);
  console.log('Has Errors:', hasError ? '❌ YES' : '✅ NO');
  
  await browser.disconnect();
  process.exit(hasError ? 1 : 0);
})().catch(err => {
  console.error('💥 Fatal error:', err.message);
  process.exit(1);
});
