const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ 
        headless: true, 
        args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });
    
    const page = await browser.newPage();
    
    console.log('Loading page...');
    await page.goto('http://localhost:1234/test', { 
        waitUntil: 'networkidle2', 
        timeout: 15000 
    });
    
    await new Promise(r => setTimeout(r, 4000));
    
    // Check what tabs exist
    const tabs = await page.evaluate(() => {
        const tabs = document.querySelectorAll('.te_fullgrid_slider_div');
        return Array.from(tabs).map(t => t.textContent.trim());
    });
    console.log('Available tabs:', tabs);
    
    // Check if sheettools div exists
    const sheettools = await page.$('#sheettools, [id$="sheettools"]');
    console.log('Sheettools div:', sheettools ? 'EXISTS' : 'NOT FOUND');
    
    // Try clicking Sheet tab
    const sheetTab = await page.evaluate(() => {
        const tabs = document.querySelectorAll('.te_fullgrid_slider_div');
        for (let tab of tabs) {
            if (tab.textContent.includes('Sheet')) {
                tab.click();
                return 'CLICKED';
            }
        }
        return 'NOT FOUND';
    });
    console.log('Sheet tab:', sheetTab);
    
    await new Promise(r => setTimeout(r, 2000));
    
    // Now check for buttons again
    const saveBtn = await page.$('#sheet-save');
    console.log('\nAfter clicking Sheet tab:');
    console.log('Save button:', saveBtn ? '✅ FOUND' : '❌ NOT FOUND');
    
    // Get the full HTML of sheettools
    const html = await page.evaluate(() => {
        const div = document.querySelector('[id$="sheettools"]');
        return div ? div.innerHTML : 'NOT FOUND';
    });
    console.log('\nSheettools HTML length:', html.length, 'chars');
    if (html !== 'NOT FOUND') {
        console.log('Preview:', html.substring(0, 200));
    }
    
    await browser.close();
})().catch(err => {
    console.error('Error:', err.message);
});
