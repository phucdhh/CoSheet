const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({
        headless: true, 
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    
    console.log('Loading sheet...');
    await page.goto('http://localhost:1234/debugtest');
    await new Promise(r => setTimeout(r, 3000));
    
    const result = await page.evaluate(() => {
        const ctx = window.spreadsheet?.editor?.context;
        if (!ctx) return { error: 'No context' };
        
        return {
            contextKeys: Object.keys(ctx),
            sheetobjType: typeof ctx.sheetobj,
            sheetobjKeys: ctx.sheetobj ? Object.keys(ctx.sheetobj) : null,
            hasSheet: ctx.sheetobj?.sheet !== undefined,
            // Try different paths
            altSheet1: window.Spreadsheet?.sheet,
            altSheet2: window.spreadsheet?.sheet
        };
    });
    
    console.log(JSON.stringify(result, null, 2));
    await browser.close();
})();
