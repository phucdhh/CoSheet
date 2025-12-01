const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ 
        headless: true, 
        args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });
    
    const page = await browser.newPage();
    
    await page.goto('http://localhost:1234/check', { waitUntil: 'networkidle0', timeout: 20000 });
    
    const check = await page.evaluate(() => {
        return {
            CoSheetExport: typeof CoSheetExport !== 'undefined',
            methods: typeof CoSheetExport !== 'undefined' ? Object.keys(CoSheetExport) : [],
            SocialCalc: typeof SocialCalc !== 'undefined'
        };
    });
    
    console.log('CoSheet Export System Check:');
    console.log('  CoSheetExport loaded:', check.CoSheetExport ? '✅' : '❌');
    console.log('  SocialCalc loaded:', check.SocialCalc ? '✅' : '❌');
    console.log('  Available methods:', check.methods.join(', '));
    console.log('\nStatus:', check.CoSheetExport && check.SocialCalc ? '✅ READY' : '❌ NOT READY');
    
    await browser.close();
})();
