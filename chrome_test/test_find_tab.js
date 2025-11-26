const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    const page = await browser.newPage();

    page.on('console', msg => {
        const text = msg.text();
        if (text.includes('Clicking') || text.includes('GraphLayout')) {
            console.log('[CONSOLE]', text);
        }
    });

    await page.goto('http://192.168.1.223:1234/', {
        waitUntil: 'networkidle2',
        timeout: 30000
    });

    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('\n=== Finding the actual Graph tab element in DOM ===');
    const tabElement = await page.evaluate(() => {
        // Find all elements that look like tabs
        const allElements = Array.from(document.querySelectorAll('*'));
        const tabLike = allElements.filter(el => {
            const text = el.textContent?.trim();
            // Look for short text that might be a tab name
            if (text && text.length < 20 && text.includes('Graph')) {
                const style = window.getComputedStyle(el);
                // Tabs usually have some styling
                return {
                    element: el,
                    text,
                    tag: el.tagName,
                    id: el.id,
                    className: el.className,
                    parent: el.parentElement?.id || el.parentElement?.className,
                    backgroundColor: style.backgroundColor,
                    cursor: style.cursor
                };
            }
            return null;
        }).filter(Boolean);

        return tabLike;
    });
    console.log('Tab-like elements:', JSON.stringify(tabElement, null, 2));

    console.log('\n=== Clicking the Graph tab element ===');
    const clicked = await page.evaluate(() => {
        // Find and click any element with text "Graph" that looks clickable
        const allDivs = Array.from(document.querySelectorAll('div'));
        for (const div of allDivs) {
            // Get only direct text content
            const directText = Array.from(div.childNodes)
                .filter(n => n.nodeType === Node.TEXT_NODE)
                .map(n => n.textContent.trim())
                .join('');

            if (directText === 'Graph' || div.textContent.trim() === 'Graph') {
                console.log('Clicking Graph div:', div.id, div.className, 'parent:', div.parentElement?.id);
                div.click();
                return { success: true, id: div.id, className: div.className };
            }
        }
        return { success: false };
    });
    console.log('Click result:', clicked);

    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('\n=== Checking final state ===');
    const finalState = await page.evaluate(() => {
        return {
            ribbonExists: !!document.getElementById('graph-ribbon'),
            containerExists: !!document.getElementById('graph-layout-container')
        };
    });
    console.log('Final state:', finalState);

    await browser.close();
})();
