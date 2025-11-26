const puppeteer = require('puppeteer');

async function debugAllElements() {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();
        await page.goto('http://127.0.0.1:1234/test_debug2', { waitUntil: 'networkidle0' });
        await page.waitForFunction(() => window.SocialCalc, { timeout: 10000 });

        const info = await page.evaluate(() => {
            const spreadsheet = SocialCalc.GetSpreadsheetControlObject();
            const idPrefix = spreadsheet ? spreadsheet.idPrefix : 'SocialCalc-';

            // Try to find formula bar by various means
            const formulabarDiv = document.getElementById(idPrefix + 'formulabarDiv');
            const allDivs = Array.from(document.querySelectorAll('div'));
            const divsWithFormula = allDivs.filter(d =>
                d.id.includes('formula') ||
                d.className.includes('formula') ||
                d.innerHTML.includes('type="text"') && d.innerHTML.includes('size="60"')
            );

            // Check for input boxes
            const inputs = Array.from(document.querySelectorAll('input[type="text"]'));

            return {
                formulabarDivExists: !!formulabarDiv,
                formulabarDivInfo: formulabarDiv ? {
                    id: formulabarDiv.id,
                    innerHTML: formulabarDiv.innerHTML.substring(0, 200),
                    display: window.getComputedStyle(formulabarDiv).display,
                    visible: formulabarDiv.offsetParent !== null
                } : null,
                divsWithFormula: divsWithFormula.map(d => ({
                    id: d.id,
                    className: d.className,
                    tagName: d.tagName,
                    hasInput: d.querySelector('input') !== null
                })),
                inputs: inputs.map(inp => ({
                    id: inp.id,
                    size: inp.size,
                    parentId: inp.parentElement?.id
                }))
            };
        });

        console.log('Formula bar div exists:', info.formulabarDivExists);
        console.log('Formula bar info:', JSON.stringify(info.formulabarDivInfo, null, 2));
        console.log('\nDivs with formula:', JSON.stringify(info.divsWithFormula, null, 2));
        console.log('\nText inputs:', JSON.stringify(info.inputs, null, 2));

    } finally {
        await browser.close();
    }
}

debugAllElements();
