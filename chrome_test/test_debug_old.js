const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    const page = await browser.newPage();

    page.on('console', msg => {
        console.log('[BROWSER]', msg.text());
    });

    await page.goto('http://192.168.1.223:1234/', {
        waitUntil: 'networkidle2',
        timeout: 30000
    });

    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('\n=== Injecting test code to find and click Graph tab ===');
    await page.evaluate(() => {
        console.log('Starting search for Graph tab...');

        // Method 1: Find by exact text match
        const allDivs = Array.from(document.querySelectorAll('div'));
        console.log(`Total divs: ${allDivs.length}`);

        let found = false;
        for (const div of allDivs) {
            if (div.textContent.trim() === 'Graph' && div.children.length === 0) {
                console.log(`Found Graph tab! ID: ${div.id}, Class: ${div.className}`);
                console.log(`Clicking...`);
                div.click();
                found = true;
                break;
            }
        }

        if (!found) {
            console.log('Graph tab not found with exact match. Trying contains...');
            for (const div of allDivs) {
                const text = div.textContent.trim();
                if (text === 'Graph' || (text.startsWith('Graph') && text.length < 10)) {
                    console.log(`Found possible match: "${text}", ID: ${div.id}, Class: ${div.className}`);
                    div.click();
                    found = true;
                    break;
                }
            }
        }

        if (!found) {
            console.log('Still not found. Let me check all tab-like divs...');
            // Look in the tabs area specifically
            const tabsArea = document.querySelector('[id*="tab"]') || document.body;
            const tabDivs = Array.from(tabsArea.querySelectorAll('div')).filter(d => {
                const text = d.textContent.trim();
                return text.length > 0 && text.length < 15;
            });
            console.log('Possible tabs:', tabDivs.slice(0, 10).map(d => d.textContent.trim()).join(', '));
        }
    });

    await new Promise(resolve => setTimeout(resolve, 1500));

    console.log('\n=== Checking for ribbon ===');
    const state = await page.evaluate(() => {
        const ribbon = document.getElementById('graph-ribbon');
        console.log('Ribbon element:', ribbon ? 'EXISTS' : 'NOT FOUND');
        if (window.GraphLayout) {
            console.log('GraphLayout.currentMode:', window.GraphLayout.currentMode);
        }
        return { ribbonExists: !!ribbon };
    });
    console.log('State:', state);

    await page.screenshot({ path: '/root/ethercalc/chrome_test/debug_graph.png', fullPage: true });
    console.log('\nScreenshot saved to debug_graph.png');

    await browser.close();
})();
