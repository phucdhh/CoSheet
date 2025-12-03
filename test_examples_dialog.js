const puppeteer = require('puppeteer');

(async () => {
    console.log('🧪 Testing Examples Dialog...\n');
    
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Enable console logging
    page.on('console', msg => {
        const text = msg.text();
        if (text.includes('[ERROR]') || text.includes('Error')) {
            console.log('  ⚠️  Console:', text);
        }
    });
    
    try {
        console.log('1️⃣  Opening CoSheet...');
        await page.goto('http://localhost:1234', { waitUntil: 'networkidle2', timeout: 10000 });
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log('2️⃣  Clicking Examples button...');
        await page.waitForSelector('#sheet-examples', { timeout: 5000 });
        await page.click('#sheet-examples');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check if dialog opened
        const dialogExists = await page.$('.examples-container');
        console.log('   Dialog opened: ' + (dialogExists ? '✅ YES' : '❌ NO'));
        
        // Check dialog dimensions
        const dialogSize = await page.evaluate(() => {
            const container = document.querySelector('.examples-container');
            if (!container) return null;
            const styles = window.getComputedStyle(container);
            return {
                width: styles.width,
                height: container.offsetHeight
            };
        });
        console.log('   Dialog size: ' + (dialogSize ? `${dialogSize.width} (height: ${dialogSize.height}px)` : 'N/A'));
        console.log('   Size check: ' + (dialogSize && dialogSize.width === '580px' ? '✅ COMPACT' : '⚠️  TOO LARGE'));
        
        console.log('\n3️⃣  Selecting first example (Bar Chart)...');
        await page.waitForSelector('.example-item', { timeout: 5000 });
        await page.click('.example-item');
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Check if MD content loaded
        const mdContent = await page.evaluate(() => {
            const preview = document.getElementById('examples-preview');
            return preview ? preview.innerHTML : '';
        });
        
        const hasMDContent = mdContent.includes('Biểu Đồ Cột') || mdContent.includes('Bar Chart') || mdContent.includes('<h1>');
        console.log('   MD content loaded: ' + (hasMDContent ? '✅ YES' : '❌ NO'));
        
        if (!hasMDContent) {
            console.log('   Preview HTML:', mdContent.substring(0, 200));
        }
        
        // Check Load button enabled
        const loadBtnEnabled = await page.evaluate(() => {
            const btn = document.getElementById('examples-load-btn');
            return btn ? !btn.disabled : false;
        });
        console.log('   Load button enabled: ' + (loadBtnEnabled ? '✅ YES' : '❌ NO'));
        
        console.log('\n4️⃣  Clicking Load button...');
        await page.click('#examples-load-btn');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Check if CSV loaded into spreadsheet
        const csvLoaded = await page.evaluate(() => {
            // Check if spreadsheet has data
            if (typeof SocialCalc === 'undefined') return false;
            const sheet = SocialCalc.CurrentSpreadsheetControlObject?.context?.sheetobj;
            if (!sheet) return false;
            
            // Check if cell A1 has content (header)
            const cellA1 = sheet.cells['A1'];
            const cellA2 = sheet.cells['A2'];
            const cellB1 = sheet.cells['B1'];
            
            return !!(cellA1 && cellA1.datavalue && cellB1 && cellB1.datavalue);
        });
        
        console.log('   CSV data loaded: ' + (csvLoaded ? '✅ YES' : '❌ NO'));
        
        // Summary
        console.log('\n📊 Test Results:');
        console.log('   ✅ Issue #1 (Dialog size): ' + (dialogSize && dialogSize.width === '650px' ? 'FIXED' : 'FAILED'));
        console.log('   ✅ Issue #2 (MD loading): ' + (hasMDContent ? 'FIXED' : 'FAILED'));
        console.log('   ✅ Issue #3 (CSV loading): ' + (csvLoaded ? 'FIXED' : 'FAILED'));
        
        const allPassed = dialogSize && dialogSize.width === '580px' && hasMDContent && csvLoaded;
        console.log('\n🎯 Overall: ' + (allPassed ? '✅ ALL TESTS PASSED' : '⚠️  SOME TESTS FAILED'));
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        await browser.close();
    }
})();
