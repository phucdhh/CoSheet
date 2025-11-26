const puppeteer = require('puppeteer');

async function debugFormulaBar() {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();
        await page.goto('http://127.0.0.1:1234/test_debug', { waitUntil: 'networkidle0' });
        await page.waitForFunction(() => window.SocialCalc, { timeout: 10000 });

        const info = await page.evaluate(() => {
            const allDivs = Array.from(document.querySelectorAll('div[id*="formula"]'));
            const searchbar = document.getElementById('searchbar');
            const spreadsheet = SocialCalc.GetSpreadsheetControlObject();

            return {
                formulaDivs: allDivs.map(div => ({
                    id: div.id,
                    className: div.className,
                    visible: div.offsetParent !== null
                })),
                searchbar: searchbar ? {
                    exists: true,
                    id: searchbar.id,
                    visible: searchbar.offsetParent !== null
                } : null,
                spreadsheetInfo: spreadsheet ? {
                    idPrefix: spreadsheet.idPrefix,
                    formulabarDivId: spreadsheet.idPrefix + 'formulabarDiv'
                } : null
            };
        });

        console.log('Formula-related divs:', JSON.stringify(info.formulaDivs, null, 2));
        console.log('Search bar:', JSON.stringify(info.searchbar, null, 2));
        console.log('Spreadsheet info:', JSON.stringify(info.spreadsheetInfo, null, 2));

    } finally {
        await browser.close();
    }
}

debugFormulaBar();
