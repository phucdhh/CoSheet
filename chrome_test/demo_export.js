const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ 
        headless: false,  // Show browser
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--start-maximized'],
        defaultViewport: null
    });
    
    const page = await browser.newPage();
    
    console.log('Opening CoSheet...');
    await page.goto('http://localhost:1234/export_demo', { 
        waitUntil: 'networkidle0', 
        timeout: 30000 
    });
    
    await page.waitForFunction(() => window.SocialCalc && window.CoSheetExport, { timeout: 10000 });
    console.log('✅ Page loaded\n');
    
    // Insert demo data
    console.log('Inserting demo data...');
    await page.evaluate(() => {
        const spreadsheet = SocialCalc.GetSpreadsheetControlObject();
        const editor = spreadsheet.editor;
        
        // Create a nice demo table
        editor.EditorScheduleSheetCommands('set A1 text t Product\nset B1 text t Q1\nset C1 text t Q2\nset D1 text t Q3\nset E1 text t Q4\nset F1 text t Total', true, false);
        
        editor.EditorScheduleSheetCommands('set A2 text t Laptops\nset B2 value n 120\nset C2 value n 150\nset D2 value n 180\nset E2 value n 200', true, false);
        editor.EditorScheduleSheetCommands('set A3 text t Phones\nset B3 value n 300\nset C3 value n 350\nset D3 value n 400\nset E3 value n 450', true, false);
        editor.EditorScheduleSheetCommands('set A4 text t Tablets\nset B4 value n 80\nset C4 value n 90\nset D4 value n 100\nset E4 value n 110', true, false);
        editor.EditorScheduleSheetCommands('set A5 text t Accessories\nset B5 value n 500\nset C5 value n 550\nset D5 value n 600\nset E5 value n 650', true, false);
        
        // Add row totals (formulas)
        editor.EditorScheduleSheetCommands('set F2 value n 650\nset F3 value n 1500\nset F4 value n 380\nset F5 value n 2300', true, false);
        
        // Add column totals
        editor.EditorScheduleSheetCommands('set A7 text t TOTAL:\nset B7 value n 1000\nset C7 value n 1140\nset D7 value n 1280\nset E7 value n 1410\nset F7 value n 4830', true, false);
        
        // Bold header row
        editor.EditorScheduleSheetCommands('set A1 font bold\nset B1 font bold\nset C1 font bold\nset D1 font bold\nset E1 font bold\nset F1 font bold', true, false);
    });
    
    await new Promise(r => setTimeout(r, 1500));
    console.log('✅ Demo data inserted\n');
    
    // Click Sheet tab
    console.log('Clicking Sheet tab...');
    await page.evaluate(() => {
        const sheetTab = document.querySelector('[id$="-sheettab"]');
        if (sheetTab) sheetTab.click();
    });
    
    await new Promise(r => setTimeout(r, 500));
    console.log('✅ Sheet tab active\n');
    
    console.log('========================================');
    console.log('Browser window is now open!');
    console.log('========================================');
    console.log('');
    console.log('Try the following:');
    console.log('  1. Click Save button → Choose CSV or XLSX');
    console.log('  2. Click Export button → Try each format:');
    console.log('     - ODS (shows message - under development)');
    console.log('     - HTML (downloads styled HTML table)');
    console.log('     - TSV (downloads tab-separated file)');
    console.log('     - PDF (generates PDF with table)');
    console.log('');
    console.log('Press Ctrl+C to close the browser');
    console.log('========================================\n');
    
    // Keep browser open
    await new Promise(() => {});
    
})();
