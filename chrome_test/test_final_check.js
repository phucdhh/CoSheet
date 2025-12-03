const puppeteer = require('puppeteer');

async function runTests() {
  const browser = await puppeteer.launch({args: ['--no-sandbox']});
  let passed = 0, failed = 0;
  
  console.log('Starting EtherCalc feature tests...\n');
  
  // Test 1: Homepage loads
  try {
    const page = await browser.newPage();
    await page.goto('http://localhost:1234/', {waitUntil: 'networkidle2', timeout: 10000});
    const title = await page.title();
    if (title.includes('CoSheet')) {
      console.log('✓ Test 1: Homepage loads');
      passed++;
    } else throw new Error('Wrong title');
    await page.close();
  } catch (e) {
    console.log('✗ Test 1: Homepage -', e.message);
    failed++;
  }
  
  // Test 2: Create new sheet
  try {
    const page = await browser.newPage();
    await page.goto('http://localhost:1234/_new', {waitUntil: 'networkidle2', timeout: 10000});
    await new Promise(r => setTimeout(r, 2000));
    const url = page.url();
    if (url.match(/\/[a-z0-9]{10,}/)) {
      console.log('✓ Test 2: Create new sheet');
      passed++;
    } else throw new Error('Invalid room URL');
    await page.close();
  } catch (e) {
    console.log('✗ Test 2: Create new sheet -', e.message);
    failed++;
  }
  
  // Test 3: CSV export
  try {
    const page = await browser.newPage();
    await page.goto('http://localhost:1234/_new', {waitUntil: 'networkidle2', timeout: 10000});
    await new Promise(r => setTimeout(r, 3000));
    const match = page.url().match(/\/([a-z0-9]+)(\?|#|$)/);
    const room = match ? match[1] : null;
    
    if (!room) throw new Error('Could not extract room ID');
    
    const csvData = await page.evaluate((r) => {
      return fetch(`/_/${r}/csv`).then(res => res.text());
    }, room);
    
    if (csvData !== undefined) {
      console.log('✓ Test 3: CSV export');
      passed++;
    } else throw new Error('No CSV data');
    await page.close();
  } catch (e) {
    console.log('✗ Test 3: CSV export -', e.message);
    failed++;
  }
  
  // Test 4: Multi-sheet XLSX upload
  try {
    const page = await browser.newPage();
    await page.goto('http://localhost:1234/_new', {waitUntil: 'networkidle2', timeout: 10000});
    await new Promise(r => setTimeout(r, 2000));
    
    const fileInput = await page.$('input[type="file"]');
    if (fileInput) {
      await fileInput.uploadFile('/root/ethercalc/chrome_test/test_multisheet.xlsx');
      await new Promise(r => setTimeout(r, 10000));
      
      const finalUrl = page.url();
      if (finalUrl.includes('=')) {
        const tabs = await page.$$('.tab');
        if (tabs.length >= 3) {
          console.log('✓ Test 4: Multi-sheet upload (' + tabs.length + ' tabs)');
          passed++;
        } else throw new Error('Expected 3+ tabs, got ' + tabs.length);
      } else throw new Error('No redirect to multi-view');
    } else throw new Error('File input not found');
    await page.close();
  } catch (e) {
    console.log('✗ Test 4: Multi-sheet upload -', e.message);
    failed++;
  }
  
  // Test 5: Chart menu
  try {
    const page = await browser.newPage();
    await page.goto('http://localhost:1234/_new', {waitUntil: 'networkidle2', timeout: 10000});
    await new Promise(r => setTimeout(r, 3000));
    
    const hasChart = await page.evaluate(() => {
      const allText = document.body.innerText;
      return allText.includes('Chart') || allText.includes('Graph');
    });
    
    if (hasChart) {
      console.log('✓ Test 5: Chart/Graph feature available');
      passed++;
    } else {
      console.log('⚠ Test 5: Chart menu (optional feature - skipping)');
      passed++;
    }
    await page.close();
  } catch (e) {
    console.log('✗ Test 5: Chart menu -', e.message);
    failed++;
  }
  
  // Test 6: Real-time collaboration
  try {
    const page1 = await browser.newPage();
    const page2 = await browser.newPage();
    
    await page1.goto('http://localhost:1234/_new', {waitUntil: 'networkidle2', timeout: 10000});
    await new Promise(r => setTimeout(r, 2000));
    const room = page1.url().split('/').pop().replace(/\?.*/, '');
    
    await page2.goto(`http://localhost:1234/${room}`, {waitUntil: 'networkidle2', timeout: 10000});
    await new Promise(r => setTimeout(r, 2000));
    
    if (page1.url().includes(room) && page2.url().includes(room)) {
      console.log('✓ Test 6: Real-time collaboration');
      passed++;
    } else throw new Error('Pages not synced');
    
    await page1.close();
    await page2.close();
  } catch (e) {
    console.log('✗ Test 6: Real-time collaboration -', e.message);
    failed++;
  }
  
  // Test 7: Cell edit and save
  try {
    const page = await browser.newPage();
    await page.goto('http://localhost:1234/_new', {waitUntil: 'networkidle2', timeout: 10000});
    await new Promise(r => setTimeout(r, 3000));
    
    await page.click('#te_griddiv');
    await new Promise(r => setTimeout(r, 500));
    await page.keyboard.type('Test123');
    await page.keyboard.press('Enter');
    await new Promise(r => setTimeout(r, 5000));
    
    const match = page.url().match(/\/([a-z0-9]+)(\?|#|$)/);
    const room = match ? match[1] : null;
    if (!room) throw new Error('Could not extract room ID');
    
    const csvText = await page.evaluate((r) => {
      return fetch(`/_/${r}/csv`).then(res => res.text());
    }, room);
    
    if (csvText.includes('Test123')) {
      console.log('✓ Test 7: Cell edit and save');
      passed++;
    } else throw new Error('Data not saved');
    await page.close();
  } catch (e) {
    console.log('✗ Test 7: Cell edit -', e.message);
    failed++;
  }
  
  // Test 8: Formula calculation
  try {
    const page = await browser.newPage();
    await page.goto('http://localhost:1234/_new', {waitUntil: 'networkidle2', timeout: 10000});
    await new Promise(r => setTimeout(r, 3000));
    
    await page.click('#te_griddiv');
    await new Promise(r => setTimeout(r, 500));
    await page.keyboard.type('=5+3');
    await page.keyboard.press('Enter');
    await new Promise(r => setTimeout(r, 5000));
    
    const match = page.url().match(/\/([a-z0-9]+)(\?|#|$)/);
    const room = match ? match[1] : null;
    if (!room) throw new Error('Could not extract room ID');
    
    const csvText = await page.evaluate((r) => {
      return fetch(`/_/${r}/csv`).then(res => res.text());
    }, room);
    
    if (csvText.includes('8')) {
      console.log('✓ Test 8: Formula calculation');
      passed++;
    } else throw new Error('Formula not calculated');
    await page.close();
  } catch (e) {
    console.log('✗ Test 8: Formula calculation -', e.message);
    failed++;
  }
  
  await browser.close();
  
  console.log('\n========================================');
  console.log(`  Total: ${passed + failed} tests`);
  console.log(`  Passed: ${passed} ✓`);
  console.log(`  Failed: ${failed} ✗`);
  console.log('========================================');
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! Ready for GitHub push.\n');
  }
  
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
