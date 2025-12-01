const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ 
        headless: true, 
        args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });
    
    const page = await browser.newPage();
    
    const errors = [];
    page.on('pageerror', error => {
        errors.push(error.message);
    });
    
    console.log('Loading page with longer timeout...');
    try {
        await page.goto('http://localhost:1234/test_final', { 
            waitUntil: 'domcontentloaded', 
            timeout: 30000 
        });
        
        console.log('✅ Page loaded successfully!');
        console.log('URL:', page.url());
        
        await new Promise(r => setTimeout(r, 5000));
        
        const title = await page.title();
        console.log('Title:', title);
        
        const hasSheetTab = await page.evaluate(() => {
            const tabs = document.querySelectorAll('.te_fullgrid_slider_div');
            return Array.from(tabs).some(t => t.textContent.includes('Sheet'));
        });
        
        console.log('Sheet tab exists:', hasSheetTab ? '✅ YES' : '❌ NO');
        console.log('Total errors:', errors.length);
        
        if (errors.length > 0) {
            console.log('\nFirst 5 errors:');
            errors.slice(0, 5).forEach((err, i) => console.log(`${i+1}. ${err.substring(0, 100)}`));
        }
        
    } catch (error) {
        console.log('❌ Failed to load:', error.message);
    }
    
    await browser.close();
})();
