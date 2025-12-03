const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

(async () => {
  let browser;
  try {
    console.log('🚀 Launching Chrome...');
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    
    const page = await browser.newPage();
    
    let hasCellTypeError = false;
    let errorDetails = [];
    
    page.on('console', msg => {
      const txt = msg.text();
      if (txt.includes('Unknown cell type') || txt.includes("item 's'")) {
        hasCellTypeError = true;
        errorDetails.push(txt);
        console.log('❌ ERROR:', txt);
      } else if (txt.includes('Error loading data')) {
        console.log('⚠️  Loading error:', txt);
      } else if (txt.includes('[DragDrop]')) {
        console.log('📎', txt);
      }
    });
    
    page.on('pageerror', error => {
      if (error.message.includes('Unknown cell type') || error.message.includes("item 's'")) {
        hasCellTypeError = true;
        errorDetails.push(error.message);
        console.log('❌ PAGE ERROR:', error.message);
      }
    });
    
    console.log('📂 Loading page...');
    await page.goto('http://localhost:1234/_new', { 
      waitUntil: 'networkidle2', 
      timeout: 30000 
    });
    
    await new Promise(r => setTimeout(r, 2000));
    
    console.log('📎 Dropping file...');
    const filePath = path.resolve(__dirname, 'test_multisheet.xlsx');
    const fileBuffer = fs.readFileSync(filePath);
    
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
    
    console.log('⏳ Waiting 20 seconds for processing...');
    await new Promise(r => setTimeout(r, 20000));
    
    const url = page.url();
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST RESULTS');
    console.log('='.repeat(60));
    console.log('Final URL:', url);
    console.log('Cell Type Error:', hasCellTypeError ? '❌ YES' : '✅ NO');
    
    if (errorDetails.length > 0) {
      console.log('\n❌ Error Details:');
      errorDetails.forEach((err, i) => {
        console.log(`  ${i+1}. ${err.substring(0, 150)}`);
      });
    }
    
    if (url.includes('/=')) {
      const tabs = await page.evaluate(() => {
        const tabDivs = document.querySelectorAll('.multi-view-tab');
        return Array.from(tabDivs).map(t => t.textContent.trim());
      });
      console.log('� Tabs:', tabs);
    }
    
    console.log('='.repeat(60));
    
    await browser.close();
    process.exit(hasCellTypeError ? 1 : 0);
    
  } catch (err) {
    console.error('💥 Fatal:', err.message);
    if (browser) await browser.close();
    process.exit(1);
  }
})();
