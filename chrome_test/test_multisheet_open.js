const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  page.on('console', msg => {
    const text = msg.text();
    if (!text.includes('Manifest')) {
      console.log('[Browser]', msg.type(), text);
    }
  });
  
  page.on('pageerror', error => {
    console.error('[Page Error]', error.message);
  });
  
  console.log('1. Loading CoSheet...');
  await page.goto('http://localhost:1234/', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));
  
  console.log('2. Triggering file input (simulating Sheet tab click)...');
  await page.evaluate(() => {
    // Ensure handlers are attached
    if (typeof SheetLayout !== 'undefined' && typeof SheetLayout.attachHandlers === 'function') {
      SheetLayout.attachHandlers();
    }
  });
  await new Promise(r => setTimeout(r, 500));
  
  const fileInput = await page.$('#sheet-file-input');
  if (!fileInput) {
    console.error('❌ File input not found');
    await browser.close();
    return;
  }
  
  console.log('3. Uploading multisheet XLSX...');
  await fileInput.uploadFile(path.join(__dirname, 'test_multisheet.xlsx'));
  
  console.log('4. Waiting for processing (15 seconds)...');
  await new Promise(r => setTimeout(r, 15000));
  
  const finalUrl = page.url();
  console.log('\n5. Final URL:', finalUrl);
  
  if (finalUrl.includes('/=')) {
    console.log('✅ SUCCESS: Redirected to multi-view');
    
    // Check page content
    const pageContent = await page.evaluate(() => {
      return {
        title: document.title,
        hasIframes: document.querySelectorAll('iframe').length,
        bodyText: document.body.innerText.substring(0, 200)
      };
    });
    console.log('\nPage info:', JSON.stringify(pageContent, null, 2));
  } else {
    console.log('❌ FAILED: URL did not change to multi-view');
    console.log('   Expected: /=<room_id>');
    console.log('   Got:', finalUrl);
  }
  
  await browser.close();
})();
