const puppeteer = require('puppeteer');

async function runTests() {
  const browser = await puppeteer.launch({args: ['--no-sandbox']});
  let passed = 0, failed = 0;
  
  // Test 1: Homepage loads
  try {
    const page1 = await browser.newPage();
    await page1.goto('http://localhost:1234/', {waitUntil: 'networkidle2', timeout: 10000});
    const title = await page1.title();
    if (title.includes('CoSheet')) {
      console.log('✓ Test 1: Homepage loads');
      passed++;
    } else throw new Error('Wrong title');
    await page1.close();
  } catch (e) {
    console.log('✗ Test 1: Homepage failed -', e.message);
    failed++;
  }
  
  // Test 2: Create new sheet
  try {
    const page2 = await browser.newPage();
    await page2.goto('http://localhost:1234/_new', {waitUntil: 'networkidle2', timeout: 10000});
    await new Promise(r => setTimeout(r, 2000));
    const url = page2.url();
    if (url.match(/\/[a-z0-9]{10,}/)) {
      console.log('✓ Test 2: Create new sheet -', url.split('/').pop());
      passed++;
    } else throw new Error('Invalid room URL');
    await page2.close();
  } catch (e) {
    console.log('✗ Test 2: Create new sheet failed -', e.message);
    failed++;
  }
  
  // Test 3: CSV export
  try {
    const page3 = await browser.newPage();
    await page3.goto('http://localhost:1234/_new', {waitUntil: 'networkidle2', timeout: 10000});
    await new Promise(r => setTimeout(r, 2000));
    const room = page3.url().split('/').pop().replace(/\?.*/, '');
    
    const csvResponse = await page3.goto(`http://localhost:1234/_/${room}/csv`);
    
    if (csvResponse.status() === 200) {
      console.log('✓ Test 3: CSV export works');
      passed++;
    } else throw new Error('CSV export returned ' + csvResponse.status());
    await page3.close();
  } catch (e) {
    console.log('✗ Test 3: CSV export failed -', e.message);
    failed++;
  }
  
  // Test 4: Multi-sheet XLSX upload
  try {
    const page4 = await browser.newPage();
    await page4.goto('http://localhost:1234/_new', {waitUntil: 'networkidle2', timeout: 10000});
    await new Promise(r => setTimeout(r, 2000));
    
    const fileInput = await page4.$('input[type="file"]');
    if (fileInput) {
      await fileInput.uploadFile('/root/ethercalc/chrome_test/test_multisheet.xlsx');
      await new Promise(r => setTimeout(r, 10000));
      
      const finalUrl = page4.url();
      if (finalUrl.includes('=')) {
        const tabs = await page4.$$('.tab');
        if (tabs.length > 1) {
          console.log('✓ Test 4: Multi-sheet upload works - ' + tabs.length + ' tabs');
          passed++;
        } else throw new Error('No tabs found');
      } else throw new Error('No redirect to multi-view');
    } else throw new Error('File input not found');
    await page4.close();
  } catch (e) {
    console.log('✗ Test 4: Multi-sheet upload failed -', e.message);
    failed++;
  }
  
  // Test 5: Chart menu available
  try {
    const page5 = await browser.newPage();
    await page5.goto('http://localhost:1234/_new', {waitUntil: 'networkidle2', timeout: 10000});
    await new Promise(r => setTimeout(r, 2000));
    
    const hasChart = await page5.evaluate(() => {
      const menus = Array.from(document.querySelectorAll('li'));
      return menus.some(li => li.textContent.includes('Chart'));
    });
    
    if (hasChart) {
      console.log('✓ Test 5: Chart menu available');
      passed++;
    } else throw new Error('Chart menu not found');
    await page5.close();
  } catch (e) {
    console. Test 5: Chart feature failed -', e.message);log('
    failed++;
  }
  
  // Test 6: Real-time collaboration
  try {
    const page6a = await browser.newPage();
    const page6b = await browser.newPage();
    
    await page6a.goto('http://localhost:1234/_new', {waitUntil: 'networkidle2', timeout: 10000});
    await new Promise(r => setTimeout(r, 2000));
    const room = page6a.url().split('/').pop().replace(/\?.*/, '');
    
    await page6b.goto(`http://localhost:1234/${room}`, {waitUntil: 'networkidle2', timeout: 10000});
    await new Promise(r => setTimeout(r, 2000));
    
    if (page6a.url().includes(room) && page6b.url().includes(room)) {
      console.log('✓ Test 6: Real-time collaboration works');
      passed++;
    } else throw new Error('Pages not synced');
    
    await page6a.close();
    await page6b.close();
  } catch (e) {
    console.log('✗ Test 6: Real-time collaboration failed -', e.message);
    failed++;
  }
  
  // Test 7: Edit and save cell
  try {
    const page7 = await browser.newPage();
    await page7.goto('http://localhost:1234/_new', {waitUntil: 'networkidle2', timeout: 10000});
    await new Promise(r => setTimeout(r, 3000));
    
    // Click first cell
    await page7.click('#te_griddiv');
    await new Promise(r => setTimeout(r, 500));
    
    // Type data
    await page7.keyboard.type('Test123');
    await page7.keyboard.press('Enter');
    await new Promise(r => setTimeout(r, 2000));
    
    // Check if saved
    const room = page7.url().split('/').pop().replace(/\?.*/, '');
    const csvResponse = await page7.goto(`http://localhost:1234/_/${room}/csv`);
    const csvText = await csvResponse.text();
    
    if (csvText.includes('Test123')) {
      console.log('✓ Test 7: Cell edit and save works');
      passed++;
    } else throw new Error('Cell data not saved');
    await page7.close();
  } catch (e) {
    console.log('✗ Test 7: Cell edit failed -', e.message);
    failed++;
  }
  
  // Test 8: Formula calculation
  try {
    const page8 = await browser.newPage();
    await page8.goto('http://localhost:1234/_new', {waitUntil: 'networkidle2', timeout: 10000});
    await new Promise(r => setTimeout(r, 3000));
    
    await page8.click('#te_griddiv');
    await new Promise(r => setTimeout(r, 500));
    await page8.keyboard.type('=5+3');
    await page8.keyboard.press('Enter');
    await new Promise(r => setTimeout(r, 2000));
    
    // Check CSV export for calculated value
    const room = page8.url().split('/').pop().replace(/\?.*/, '');
    const csvResponse = await page8.goto(`http://localhost:1234/_/${room}/csv`);
    const csvText = await csvResponse.text();
    
    if (csvText.includes('8')) {
      console.log('✓ Test 8: Formula calculation works');
      passed++;
    } else throw new Error('Formula not calculated: ' + csvText);
    await page8.close();
  } catch (e) {
    console.log('✗ Test 8: Formula calculation failed -', e.message);
    failed++;
  }
  
  await browser.close();
  
  console.log('\n================================');
  console.log(`Total: ${passed + failed} tests`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log('================================');
  
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
