const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

(async () => {
  console.log('🔗 Connecting to Chrome...');
  const browser = await puppeteer.connect({
    browserURL: 'http://127.0.0.1:9222'
  });
  
  const page = await browser.newPage();
  
  // Capture ALL console messages
  let hasReferenceError = false;
  let consoleMessages = [];
  
  page.on('console', msg => {
    const txt = msg.text();
    consoleMessages.push(txt);
    
    if (txt.includes('ReferenceError') || txt.includes('loadingDialog is not defined')) {
      hasReferenceError = true;
      console.log('❌ REFERENCE ERROR DETECTED:', txt);
    } else {
      console.log('[Console]', txt.substring(0, 100));
    }
  });
  
  page.on('pageerror', error => {
    console.log('❌ PAGE ERROR:', error.message);
    if (error.message.includes('loadingDialog')) {
      hasReferenceError = true;
    }
  });
  
  console.log('📂 Loading new sheet...');
  await page.goto('http://localhost:1234/_new', { waitUntil: 'networkidle0', timeout: 30000 });
  
  console.log('📎 Simulating drag-drop of multi-sheet XLSX...');
  const filePath = path.resolve(__dirname, 'test_multisheet.xlsx');
  const fileBuffer = fs.readFileSync(filePath);
  
  // Inject file via drag-drop simulation
  await page.evaluate((fileName, fileData) => {
    const blob = new Blob([new Uint8Array(fileData)], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    const file = new File([blob], fileName, { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    
    const dropEvent = new DragEvent('drop', {
      bubbles: true,
      cancelable: true,
      dataTransfer: dataTransfer
    });
    
    document.dispatchEvent(dropEvent);
  }, 'test_multisheet.xlsx', Array.from(fileBuffer));
  
  console.log('⏳ Waiting for redirect after drag-drop...');
  
  try {
    await page.waitForFunction(() => window.location.pathname.startsWith('/='), { timeout: 20000 });
    
    // Wait for page to settle
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const url = await page.url();
    const tabs = await page.evaluate(() => {
      const tabDivs = document.querySelectorAll('.multi-view-tab');
      return Array.from(tabDivs).map(t => t.textContent.trim());
    });
    
    console.log('\n✅ SUCCESS - Multi-sheet upload completed');
    console.log('📊 URL:', url);
    console.log('📑 Tabs:', tabs.length, '→', tabs);
    console.log('🐛 ReferenceError detected:', hasReferenceError ? '❌ YES' : '✅ NO');
    
  } catch (err) {
    console.log('\n⚠️ Redirect timeout or error:', err.message);
    console.log('🐛 ReferenceError detected:', hasReferenceError ? '❌ YES' : '✅ NO');
  }
  
  await browser.disconnect();
  process.exit(hasReferenceError ? 1 : 0);
  
})().catch(err => {
  console.error('💥 Fatal error:', err.message);
  process.exit(1);
});
