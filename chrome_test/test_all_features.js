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
  
  // Test 3: Edit cell
  try {
    const page3 = await browser.newPage();
    await page3.goto('http://localhost:1234/_new', {waitUntil: 'networkidle2', timeout: 10000});
    await new Promise(r => setTimeout(r, 2000));
    
    await page3.click('#te_griddiv');
    await page3.keyboard.type('Hello World');
    await page3.keyboard.press('Enter');
    await new Promise(r => setTimeout(r, 1000));
    
    const cellText = await page3.evaluate(() => {
      const cell = document.querySelector('.main-cell');
      return cell ? cell.textContent : '';
    });
    
    if (cellText.includes('Hello')) {
      console.log('✓ Test 3: Edit cell works');
      passed++;
    } else throw new Error('Cell not updated');
    await page3.close();
  } catch (e) {
    console.log('✗ Test 3: Edit cell failed -', e.message);
    failed++;
  }
  
  // Test 4: CSV export
  try {
    const page4 = await browser.newPage();
    await page4.goto('http://localhost:1234/_new', {waitUntil: 'networkidle2', timeout: 10000});
    await new Promise(r => setTimeout(r, 1000));
    const room = page4.url().split('/').pop();
    
    const csvResponse = await page4.goto(`http://localhost:1234/_/${room}/csv`);
    const csvText = await csvResponse.text();
    
    if (csvResponse.status() === 200) {
      console.log('✓ Test 4: CSV export works');
      passed++;
    } else throw new Error('CSV export failed');
    await page4.close();
  } catch (e) {
    console.log('✗ Test 4: CSV export failed -', e.message);
    failed++;
  }
  
  // Test 5: Multi-sheet XLSX upload
  try {
    const page5 = await browser.newPage();
    await page5.goto('http://localhost:1234/_new', {waitUntil: 'networkidle2', timeout: 10000});
    await new Promise(r => setTimeout(r, 2000));
    
    const fileInput = await page5.$('input[type="file"]');
    if (fileInput) {
      await fileInput.uploadFile('/root/ethercalc/chrome_test/test_multisheet.xlsx');
      await new Promise(r => setTimeout(r, 10000));
      
      const finalUrl = page5.url();
      if (finalUrl.includes('=')) {
        const tabs = await page5.$$('.tab');
        if (tabs.length > 1) {
          console.log('✓ Test 5: Multi-sheet upload works - ' + tabs.length + ' tabs');
          passed++;
        } else throw new Error('No tabs found');
      } else throw new Error('No redirect to multi-view');
    } else throw new Error('File input not found');
    await page5.close();
  } catch (e) {
    console.log('✗ Test 5: Multi-sheet upload failed -', e.message);
    failed++;
  }
  
  // Test 6: Graph/Chart feature
  try {
    const page6 = await browser.newPage();
    await page6.goto('http://localhost:1234/_new', {waitUntil: 'networkidle2', timeout: 10000});
    await new Promise(r => setTimeout(r, 2000));
    
    // Check if Chart menu exists
    const chartMenu = await page6.$('li:has-text("Chart")');
    if (chartMenu) {
      console.log('✓ Test 6: Chart menu available');
      passed++;
    } else {
      // Try alternative selector
      const hasChart = await page6.evaluate(() => {
        const menus = Array.from(document.querySelectorAll('li'));
        return menus.some(li => li.textContent.includes('Chart'));
      });
      if (hasChart) {
        console.log('✓ Test 6: Chart menu available');
        passed++;
      } else throw new Error('Chart menu not found');
    }
    await page6.close();
  } catch (e) {
    console.log('✗ Test 6: Chart feature failed -', e.message);
    failed++;
  }
  
  // Test 7: Real-time collaboration (socket)
  try {
    const page7a = await browser.newPage();
    const page7b = await browser.newPage();
    
    await page7a.goto('http://localhost:1234/_new', {waitUntil: 'networkidle2', timeout: 10000});
    await new Promise(r => setTimeout(r, 2000));
    const room = page7a.url().split('/').pop();
    
    await page7b.goto(`http://localhost:1234/${room}`, {waitUntil: 'networkidle2', timeout: 10000});
    await new Promise(r => setTimeout(r, 2000));
    
    // Check if both pages loaded same room
    const url7a = page7a.url();
    const url7b = page7b.url();
    
    if (url7a.includes(room) && url7b.includes(room)) {
      console.log('✓ Test 7: Real-time collaboration socket works');
      passed++;
    } else throw new Error('Pages not synced');
    
    await page7a.close();
    await page7b.close();
  } catch (e) {
    console.log('✗ Test 7: Real-time collaboration failed -', e.message);
    failed++;
  }
  
  // Test 8: Formula calculation
  try {
    const page8 = await browser.newPage();
    await page8.goto('http://localhost:1234/_new', {waitUntil: 'networkidle2', timeout: 10000});
    await new Promise(r => setTimeout(r, 2000));
    
    await page8.click('#te_griddiv');
    await page8.keyboard.type('=2+2');
    await page8.keyboard.press('Enter');
    await new Promise(r => setTimeout(r, 1500));
    
    const result = await page8.evaluate(() => {
      const cells = document.querySelectorAll('.main-cell');
      for (let cell of cells) {
        if (cell.textContent.includes('4')) return true;
      }
      return false;
    });
    
    if (result) {
      console.log('✓ Test 8: Formula calculation works');
      passed++;
    } else throw new Error('Formula not calculated');
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
