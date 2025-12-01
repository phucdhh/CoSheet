const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    const page = await browser.newPage();

    const consoleMessages = [];

    page.on('console', msg => {
        const text = msg.text();
        consoleMessages.push(text);
        console.log('[CONSOLE]', text);
    });

    page.on('pageerror', error => {
        console.log('[PAGE ERROR]', error.message);
    });

    console.log('Loading EtherCalc new page...');
    await page.goto('http://localhost:1234/_new', {
        waitUntil: 'networkidle2',
        timeout: 30000
    });

    console.log('Waiting for page to stabilize...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log('Clicking Edit tab...');
    await page.click('#SocialCalc-edittab');

    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('\n=== Console Messages ===');
    consoleMessages.forEach(msg => {
        if (msg.includes('missing') || msg.includes('Button') || msg.includes('not found')) {
            console.log('⚠️', msg);
        }
    });

    await browser.close();
})();
