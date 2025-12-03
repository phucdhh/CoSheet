const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    const page = await browser.newPage();

    const consoleMessages = [];
    const errors = [];
    const requests = [];

    page.on('console', msg => {
        const text = msg.text();
        consoleMessages.push(text);
        console.log('[CONSOLE]', text);
    });

    page.on('pageerror', error => {
        errors.push(error.message);
        console.log('[PAGE ERROR]', error.message);
    });

    const requestCounts = {};
    page.on('request', request => {
        const url = request.url();
        requests.push(url);
        
        // Count duplicate requests
        requestCounts[url] = (requestCounts[url] || 0) + 1;
        
        if (requestCounts[url] > 3) {
            console.log(`[LOOP DETECTED] URL requested ${requestCounts[url]} times: ${url}`);
        }
        
        if (requests.length > 100) {
            console.log('[WARNING] More than 100 requests detected - possible loop!');
        }
    });

    page.on('response', response => {
        const url = response.url();
        const status = response.status();
        if (status >= 400) {
            console.log(`[HTTP ERROR] ${status} ${url}`);
        }
    });

    console.log('Testing multi-view page: /=pvbnmxdsqn6g');
    
    // Monitor performance
    const startTime = Date.now();
    
    try {
        await page.goto('http://localhost:1234/=pvbnmxdsqn6g', {
            waitUntil: 'networkidle2',
            timeout: 10000
        });
        
        // Wait a bit more to see if there's ongoing activity
        console.log('\nWaiting 5 seconds to monitor activity...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Check CPU usage
        const metrics = await page.metrics();
        console.log('\n=== PERFORMANCE METRICS ===');
        console.log('JS Execution Time:', metrics.ScriptDuration.toFixed(2), 'seconds');
        console.log('Layout Time:', metrics.LayoutDuration.toFixed(2), 'seconds');
        console.log('Recalc Style Time:', metrics.RecalcStyleDuration.toFixed(2), 'seconds');
        
        const loadTime = Date.now() - startTime;
        console.log('Total Load Time:', loadTime, 'ms');
        
        console.log('\n=== PAGE LOADED SUCCESSFULLY ===');
        console.log('Final URL:', page.url());
        console.log('Total requests:', requests.length);
        console.log('Console messages:', consoleMessages.length);
        console.log('Errors:', errors.length);
        
    } catch (err) {
        console.log('\n=== PAGE FAILED TO LOAD ===');
        console.log('Error:', err.message);
        console.log('Total requests before timeout:', requests.length);
        console.log('Last 20 requests:');
        requests.slice(-20).forEach((url, i) => {
            console.log(`  ${i + 1}. ${url}`);
        });
    }

    await browser.close();
})();
