const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    let navigations = 0;
    
    page.on('framenavigated', frame => {
        if (frame === page.mainFrame()) {
            navigations++;
            console.log(`[NAVIGATION ${navigations}] ${frame.url()}`);
        }
    });
    
    const url = process.argv[2] || 'http://localhost:1234/test';
    
    console.log('Loading:', url);
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 8000 }).catch(() => {});
    
    console.log('\nWaiting 3 seconds...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('\n=== RESULT ===');
    console.log('Total navigations:', navigations);
    
    if (navigations > 1) {
        console.log('⚠️  PAGE RELOAD LOOP DETECTED!');
    }
    
    await browser.close();
})();
