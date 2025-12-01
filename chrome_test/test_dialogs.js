const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ 
        headless: true, 
        args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });
    
    const page = await browser.newPage();
    
    const errors = [];
    const logs = [];
    
    page.on('pageerror', error => {
        errors.push(error.message);
    });
    
    page.on('console', msg => {
        logs.push(`${msg.type()}: ${msg.text()}`);
    });
    
    console.log('Loading page...');
    await page.goto('http://localhost:1234/test_dialogs', { 
        waitUntil: 'networkidle0', 
        timeout: 30000 
    });
    
    console.log('✅ Page loaded');
    
    // Wait for SocialCalc to be ready
    await page.waitForFunction(() => window.SocialCalc && window.SheetLayout, { timeout: 10000 });
    console.log('✅ SocialCalc and SheetLayout ready');
    
    // Click Sheet tab
    await page.evaluate(() => {
        const sheetTab = document.querySelector('[id$="-sheettab"]');
        if (sheetTab) sheetTab.click();
    });
    
    await new Promise(r => setTimeout(r, 500));
    console.log('✅ Clicked Sheet tab');
    
    // Test Save dialog
    console.log('\n--- Testing Save Dialog ---');
    await page.evaluate(() => {
        window.SheetLayout.saveFile();
    });
    
    await new Promise(r => setTimeout(r, 1000));
    
    const saveDialogContent = await page.evaluate(() => {
        const dialog = document.querySelector('.vex-content');
        if (!dialog) return null;
        
        return {
            exists: true,
            hasCSVButton: !!document.querySelector('.save-csv-btn'),
            hasXLSXButton: !!document.querySelector('.save-xlsx-btn'),
            hasCancelButton: !!document.querySelector('.save-cancel-btn'),
            csvButtonHTML: document.querySelector('.save-csv-btn')?.innerHTML.substring(0, 200),
            dialogText: dialog.innerText,
            buttonCount: dialog.querySelectorAll('button').length
        };
    });
    
    console.log('Save Dialog:', saveDialogContent);
    
    if (saveDialogContent && saveDialogContent.exists) {
        console.log('✅ Save dialog appeared');
        console.log('  - CSV button:', saveDialogContent.hasCSVButton ? '✅' : '❌');
        console.log('  - XLSX button:', saveDialogContent.hasXLSXButton ? '✅' : '❌');
        console.log('  - Cancel button:', saveDialogContent.hasCancelButton ? '✅' : '❌');
        console.log('  - Total buttons:', saveDialogContent.buttonCount);
        
        if (saveDialogContent.csvButtonHTML) {
            const hasSVG = saveDialogContent.csvButtonHTML.includes('<svg');
            const hasImg = saveDialogContent.csvButtonHTML.includes('<img');
            console.log('  - CSV button has SVG:', hasSVG ? '✅' : '❌');
            console.log('  - CSV button has IMG:', hasImg ? '✅' : '❌');
        }
    } else {
        console.log('❌ Save dialog did NOT appear');
    }
    
    // Close dialog
    await page.evaluate(() => {
        if (window.vex) vex.closeAll();
    });
    
    await new Promise(r => setTimeout(r, 500));
    
    // Test Export dialog
    console.log('\n--- Testing Export Dialog ---');
    await page.evaluate(() => {
        window.SheetLayout.exportFile();
    });
    
    await new Promise(r => setTimeout(r, 1000));
    
    const exportDialogContent = await page.evaluate(() => {
        const dialog = document.querySelector('.vex-content');
        if (!dialog) return null;
        
        return {
            exists: true,
            hasODSButton: !!document.querySelector('.export-ods-btn'),
            hasHTMLButton: !!document.querySelector('.export-html-btn'),
            hasTSVButton: !!document.querySelector('.export-tsv-btn'),
            hasPDFButton: !!document.querySelector('.export-pdf-btn'),
            hasCancelButton: !!document.querySelector('.export-cancel-btn'),
            odsButtonHTML: document.querySelector('.export-ods-btn')?.innerHTML.substring(0, 200),
            dialogText: dialog.innerText,
            buttonCount: dialog.querySelectorAll('button').length
        };
    });
    
    console.log('Export Dialog:', exportDialogContent);
    
    if (exportDialogContent && exportDialogContent.exists) {
        console.log('✅ Export dialog appeared');
        console.log('  - ODS button:', exportDialogContent.hasODSButton ? '✅' : '❌');
        console.log('  - HTML button:', exportDialogContent.hasHTMLButton ? '✅' : '❌');
        console.log('  - TSV button:', exportDialogContent.hasTSVButton ? '✅' : '❌');
        console.log('  - PDF button:', exportDialogContent.hasPDFButton ? '✅' : '❌');
        console.log('  - Cancel button:', exportDialogContent.hasCancelButton ? '✅' : '❌');
        console.log('  - Total buttons:', exportDialogContent.buttonCount);
        
        if (exportDialogContent.odsButtonHTML) {
            const hasSVG = exportDialogContent.odsButtonHTML.includes('<svg');
            const hasImg = exportDialogContent.odsButtonHTML.includes('<img');
            console.log('  - ODS button has SVG:', hasSVG ? '✅' : '❌');
            console.log('  - ODS button has IMG:', hasImg ? '✅' : '❌');
        }
    } else {
        console.log('❌ Export dialog did NOT appear');
    }
    
    // Screenshot
    await page.screenshot({ path: '/root/ethercalc/chrome_test/dialog_test.png', fullPage: true });
    console.log('\n📸 Screenshot saved: dialog_test.png');
    
    console.log('\n--- Errors ---');
    console.log('Total errors:', errors.length);
    if (errors.length > 0) {
        errors.forEach((err, i) => console.log(`${i+1}. ${err}`));
    }
    
    await browser.close();
})();
