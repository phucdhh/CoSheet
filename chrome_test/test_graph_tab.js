const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    const page = await browser.newPage();

    const jsErrors = [];
    const consoleErrors = [];
    const consoleLogs = [];

    page.on('pageerror', error => {
        jsErrors.push({
            message: error.message,
            stack: error.stack
        });
        console.log('[PAGE ERROR]', error.message);
    });

    page.on('console', msg => {
        const text = msg.text();
        if (msg.type() === 'error') {
            consoleErrors.push(text);
            console.log('[CONSOLE ERROR]', text);
        } else if (msg.type() === 'log') {
            consoleLogs.push(text);
            console.log('[CONSOLE LOG]', text);
        }
    });

    console.log('Loading EtherCalc...');
    await page.goto('http://192.168.1.223:1234/', {
        waitUntil: 'networkidle2',
        timeout: 30000
    });

    console.log('Page loaded, waiting for initialization...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check initial state
    const initialDiagnostics = await page.evaluate(() => {
        return {
            hasGraphLayout: typeof window.GraphLayout !== 'undefined',
            graphLayoutKeys: window.GraphLayout ? Object.keys(window.GraphLayout) : [],
            hasGraphOnClick: typeof window.GraphOnClick !== 'undefined',
            hasDoGraph: typeof window.DoGraph !== 'undefined',
            hasSocialCalc: typeof SocialCalc !== 'undefined',
            graphTabExists: !!document.querySelector('[data-tab="graph"]') ||
                !!Array.from(document.querySelectorAll('div')).find(el => el.textContent === 'Graph'),
            allTabs: Array.from(document.querySelectorAll('div[onclick*="tab"]')).map(el => ({
                text: el.textContent.trim(),
                onclick: el.getAttribute('onclick')
            }))
        };
    });

    console.log('\n=== Initial Diagnostics ===');
    console.log(JSON.stringify(initialDiagnostics, null, 2));

    // Try to find and click Graph tab
    console.log('\n=== Looking for Graph Tab ===');
    const graphTabClicked = await page.evaluate(() => {
        // Try different ways to find the Graph tab

        // Method 1: Look for text containing "Graph"
        const tabs = Array.from(document.querySelectorAll('div'));
        const graphTab = tabs.find(el => {
            const text = el.textContent.trim();
            return text === 'Graph' || text.toLowerCase().includes('graph');
        });

        if (graphTab) {
            console.log('Found Graph tab via text search:', graphTab.textContent);
            graphTab.click();
            return { success: true, method: 'text-search', text: graphTab.textContent };
        }

        // Method 2: Check SocialCalc tabs
        if (window.spreadsheet && window.spreadsheet.tabs) {
            console.log('Available tabs:', window.spreadsheet.tabs);
        }

        return { success: false, method: 'none' };
    });

    console.log('Graph tab click result:', JSON.stringify(graphTabClicked, null, 2));

    // Wait for any potential layout changes
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check state after clicking
    const afterClickDiagnostics = await page.evaluate(() => {
        return {
            graphRibbonExists: !!document.getElementById('graph-ribbon'),
            graphLayoutContainerExists: !!document.getElementById('graph-layout-container'),
            graphLayoutCalled: window.GraphLayout && window.GraphLayout._initialized,
            bodyHTML: document.body.innerHTML.substring(0, 500),
            // Look for any divs that might be the ribbon
            possibleRibbons: Array.from(document.querySelectorAll('div[id*="graph"], div[class*="graph"]'))
                .map(el => ({ id: el.id, class: el.className, display: getComputedStyle(el).display }))
        };
    });

    console.log('\n=== After Click Diagnostics ===');
    console.log(JSON.stringify(afterClickDiagnostics, null, 2));

    // Take screenshot
    await page.screenshot({ path: '/root/ethercalc/chrome_test/graph_test_screenshot.png' });
    console.log('\nScreenshot saved to graph_test_screenshot.png');

    console.log('\n=== JavaScript Errors ===');
    console.log('Total JS errors:', jsErrors.length);
    if (jsErrors.length > 0) {
        jsErrors.forEach((err, i) => {
            console.log(`\nError ${i + 1}:`);
            console.log('Message:', err.message);
            console.log('Stack:', err.stack?.substring(0, 300));
        });
    }

    console.log('\n=== Console Errors ===');
    console.log('Total console errors:', consoleErrors.length);
    if (consoleErrors.length > 0) {
        consoleErrors.forEach((err, i) => {
            console.log(`Error ${i + 1}:`, err);
        });
    }

    await browser.close();
})();
