const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    const page = await browser.newPage();

    page.on('pageerror', error => {
        console.log('[PAGE ERROR]', error.message);
    });

    page.on('console', msg => {
        console.log('[CONSOLE]', msg.type(), msg.text());
    });

    console.log('Loading EtherCalc...');
    await page.goto('http://192.168.1.223:1234/', {
        waitUntil: 'networkidle2',
        timeout: 30000
    });

    await new Promise(resolve => setTimeout(resolve, 3000));

    // Detailed diagnostics
    const diagnostics = await page.evaluate(() => {
        // Check if scripts are loaded
        const scripts = Array.from(document.getElementsByTagName('script')).map(s => s.src);
        const graphLayoutScript = scripts.find(s => s.includes('graph-layout'));

        // Check CSS
        const styles = Array.from(document.getElementsByTagName('link')).map(l => l.href);
        const graphLayoutCSS = styles.find(s => s.includes('graph-layout'));

        // Check window object
        const hasGraphLayout = typeof window.GraphLayout !== 'undefined';
        const graphLayoutType = typeof window.GraphLayout;

        // If GraphLayout exists, check its structure
        let graphLayoutKeys = null;
        let initOnTabClickExists = false;
        if (hasGraphLayout) {
            graphLayoutKeys = Object.keys(window.GraphLayout);
            initOnTabClickExists = typeof window.GraphLayout.initOnTabClick === 'function';
        }

        return {
            scriptsLoaded: scripts.length,
            graphLayoutScriptFound: !!graphLayoutScript,
            graphLayoutScriptSrc: graphLayoutScript || null,
            stylesLoaded: styles.length,
            graphLayoutCSSFound: !!graphLayoutCSS,
            graphLayoutCSSSrc: graphLayoutCSS || null,
            hasGraphLayout,
            graphLayoutType,
            graphLayoutKeys,
            initOnTabClickExists,
            hasGraphOnClick: typeof window.GraphOnClick !== 'undefined',
            hasSocialCalc: typeof SocialCalc !== 'undefined'
        };
    });

    console.log('\n=== Detailed Diagnostics ===');
    console.log(JSON.stringify(diagnostics, null, 2));

    await browser.close();
})();
