const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    const messages = [];
    const errors = [];
    
    page.on('console', msg => {
        const text = msg.text();
        messages.push({ time: Date.now(), text });
        console.log(`[${messages.length}] ${text}`);
    });
    
    page.on('pageerror', err => {
        errors.push({ time: Date.now(), message: err.message, stack: err.stack });
        console.log('[ERROR]', err.message);
    });
    
    // Get URL from command line or use default
    const url = process.argv[2] || 'http://localhost:1234/_new';
    
    console.log('Loading:', url);
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 10000 }).catch(() => {});
    
    console.log('\n=== Monitoring for 5 seconds ===');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('\n=== SUMMARY ===');
    console.log('Total console messages:', messages.length);
    console.log('Total errors:', errors.length);
    
    if (messages.length > 20) {
        console.log('\n⚠️  LOOP DETECTED - More than 20 messages!');
        console.log('\nLast 10 messages:');
        messages.slice(-10).forEach((m, i) => {
            console.log(`  ${i + 1}. ${m.text}`);
        });
    }
    
    if (errors.length > 0) {
        console.log('\n❌ ERRORS:');
        errors.forEach((e, i) => {
            console.log(`\n${i + 1}. ${e.message}`);
            if (e.stack) console.log(e.stack.split('\n')[0]);
        });
    }
    
    await browser.close();
})();
