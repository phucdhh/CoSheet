const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ 
        headless: true, 
        args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });
    
    const page = await browser.newPage();
    
    const errors = [];
    page.on('console', msg => {
        const text = msg.text();
        if (text.includes('Cannot read properties') || text.includes('broadcast')) {
            console.log('[CONSOLE]', text);
        }
    });
    
    page.on('pageerror', error => {
        errors.push(error.message);
        console.log('[ERROR]', error.message);
    });
    
    console.log('Loading page...');
    await page.goto('http://localhost:1234/test_fix', { 
        waitUntil: 'networkidle2', 
        timeout: 15000 
    });
    
    console.log('Waiting for UI to initialize...');
    await new Promise(r => setTimeout(r, 5000));
    
    const url = page.url();
    console.log('\nFinal URL:', url);
    console.log('Total JS errors:', errors.length);
    
    if (errors.length > 0) {
        console.log('\nErrors:');
        errors.forEach((err, i) => console.log(`${i+1}. ${err}`));
    }
    
    // Check if broadcast error still exists
    const hasBroadcastError = errors.some(e => 
        e.includes('broadcast') || e.includes('Cannot read properties of undefined')
    );
    
    if (hasBroadcastError) {
        console.log('\n❌ Broadcast.js error still exists!');
    } else {
        console.log('\n✅ No broadcast.js errors detected!');
    }
    
    // Check if page loaded successfully
    const title = await page.title();
    console.log('Page title:', title);
    
    // Check if Sheet tab exists
    const hasSheetTab = await page.evaluate(() => {
        const tabs = document.querySelectorAll('.te_fullgrid_slider_div');
        return Array.from(tabs).some(t => t.textContent.includes('Sheet'));
    });
    
    console.log('Sheet tab exists:', hasSheetTab ? '✅ YES' : '❌ NO');
    
    await browser.close();
})().catch(err => {
    console.error('Fatal error:', err.message);
    process.exit(1);
});
