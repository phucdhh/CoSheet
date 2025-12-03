const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

(async () => {
  console.log('🔗 Connecting to Chrome...');
  const browser = await puppeteer.connect({
    browserURL: 'http://127.0.0.1:9222'
  });
  
  const page = await browser.newPage();
  
  // Capture console for errors
  let errorMessages = [];
  
  page.on('console', msg => {
    const txt = msg.text();
    console.log('[Console]', txt.substring(0, 120));
    
    if (txt.includes("Unknown cell type item 's'") || 
        txt.includes('Error loading data')) {
      errorMessages.push(txt);
      console.log('❌ CELL TYPE ERROR:', txt);
    }
  });
  
  page.on('pageerror', error => {
    console.log('❌ PAGE ERROR:', error.message);
    errorMessages.push(error.message);
  });
  
  console.log('📂 Loading new sheet...');
  await page.goto('http://localhost:1234/_new', { waitUntil: 'networkidle0', timeout: 30000 });
  
  console.log('📎 Simulating drag-drop of test_multisheet.xlsx...');
  const filePath = path.resolve(__dirname, 'test_multisheet.xlsx');
  
  if (!fs.existsSync(filePath)) {
    console.log('❌ Test file not found:', filePath);
    process.exit(1);
  }
  
  const fileBuffer = fs.readFileSync(filePath);
  console.log('📊 File size:', fileBuffer.length, 'bytes');
  
  // Inject file via drag-drop
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
    
    console.log('[TEST] Dispatching drop event for:', fileName);
    document.dispatchEvent(dropEvent);
  }, 'test_multisheet.xlsx', Array.from(fileBuffer));
  
  console.log('⏳ Waiting 15 seconds for processing...');
  await new Promise(resolve => setTimeout(resolve, 15000));
  
  const currentUrl = await page.url();
  console.log('\n📊 RESULTS:');
  console.log('Current URL:', currentUrl);
  console.log('Errors detected:', errorMessages.length);
  
  if (errorMessages.length > 0) {
    console.log('\n❌ ERROR MESSAGES:');
    errorMessages.forEach((msg, i) => {
      console.log(`  ${i+1}. ${msg.substring(0, 200)}`);
    });
  } else {
    console.log('✅ No "Unknown cell type" errors detected!');
  }
  
  // Check if we're on multi-view page
  if (currentUrl.includes('/=')) {
    console.log('✅ Redirect to multi-view successful');
    
    const tabs = await page.evaluate(() => {
      const tabDivs = document.querySelectorAll('.multi-view-tab');
      return Array.from(tabDivs).map(t => t.textContent.trim());
    });
    
    console.log('📑 Tabs found:', tabs.length, '→', tabs);
  } else {
    console.log('⚠️ Still on:', currentUrl);
  }
  
  await browser.disconnect();
  process.exit(errorMessages.length > 0 ? 1 : 0);
  
})().catch(err => {
  console.error('💥 Fatal error:', err.message);
  process.exit(1);
});
