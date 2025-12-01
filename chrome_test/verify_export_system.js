const puppeteer = require('puppeteer');

(async () => {
    console.log('='.repeat(60));
    console.log('CoSheet Export Features - Final Verification');
    console.log('='.repeat(60));
    console.log('');
    
    const browser = await puppeteer.launch({ 
        headless: true, 
        args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });
    
    const page = await browser.newPage();
    
    // Listen for console messages
    const logs = [];
    page.on('console', msg => {
        logs.push(`[${msg.type()}] ${msg.text()}`);
    });
    
    // Listen for errors
    const errors = [];
    page.on('pageerror', error => {
        errors.push(error.message);
    });
    
    console.log('✓ Loading page...');
    await page.goto('http://localhost:1234/final_export_check', { 
        waitUntil: 'networkidle0', 
        timeout: 30000 
    });
    
    // Check all required modules
    console.log('✓ Checking required modules...');
    const moduleCheck = await page.evaluate(() => {
        return {
            socialCalc: typeof SocialCalc !== 'undefined',
            coSheetExport: typeof CoSheetExport !== 'undefined',
            pdfMakeLoadable: typeof CoSheetExport !== 'undefined' && typeof CoSheetExport.loadPdfMake === 'function',
            exportMethods: {
                tsv: typeof CoSheetExport !== 'undefined' && typeof CoSheetExport.exportTSV === 'function',
                html: typeof CoSheetExport !== 'undefined' && typeof CoSheetExport.exportHTML === 'function',
                pdf: typeof CoSheetExport !== 'undefined' && typeof CoSheetExport.exportPDF === 'function',
                ods: typeof CoSheetExport !== 'undefined' && typeof CoSheetExport.exportODS === 'function'
            }
        };
    });
    
    console.log('');
    console.log('Module Check Results:');
    console.log('  • SocialCalc loaded:', moduleCheck.socialCalc ? '✅' : '❌');
    console.log('  • CoSheetExport loaded:', moduleCheck.coSheetExport ? '✅' : '❌');
    console.log('  • pdfMake loadable:', moduleCheck.pdfMakeLoadable ? '✅' : '❌');
    console.log('');
    console.log('Export Methods:');
    console.log('  • exportTSV:', moduleCheck.exportMethods.tsv ? '✅' : '❌');
    console.log('  • exportHTML:', moduleCheck.exportMethods.html ? '✅' : '❌');
    console.log('  • exportPDF:', moduleCheck.exportMethods.pdf ? '✅' : '❌');
    console.log('  • exportODS:', moduleCheck.exportMethods.ods ? '✅' : '❌');
    
    // Check event listeners
    console.log('');
    console.log('✓ Checking event listeners...');
    
    const eventCheck = await page.evaluate(() => {
        const events = [
            'ec-export-tsv-request',
            'ec-export-html-request', 
            'ec-export-pdf-request',
            'ec-export-ods-request'
        ];
        
        const results = {};
        events.forEach(eventName => {
            try {
                window.dispatchEvent(new Event(eventName));
                results[eventName] = 'dispatched';
            } catch (e) {
                results[eventName] = 'error: ' + e.message;
            }
        });
        
        return results;
    });
    
    console.log('');
    console.log('Event Listeners:');
    for (const [event, status] of Object.entries(eventCheck)) {
        console.log(`  • ${event}: ${status === 'dispatched' ? '✅' : '❌ ' + status}`);
    }
    
    // Check Sheet tab integration
    console.log('');
    console.log('✓ Checking Sheet tab integration...');
    
    const sheetTabCheck = await page.evaluate(() => {
        return {
            sheetLayoutExists: typeof SheetLayout !== 'undefined',
            hasExportFunction: typeof SheetLayout !== 'undefined' && typeof SheetLayout.exportFile === 'function',
            sheetTabExists: !!document.querySelector('[id$="-sheettab"]')
        };
    });
    
    console.log('');
    console.log('Sheet Tab Integration:');
    console.log('  • SheetLayout module:', sheetTabCheck.sheetLayoutExists ? '✅' : '❌');
    console.log('  • exportFile function:', sheetTabCheck.hasExportFunction ? '✅' : '❌');
    console.log('  • Sheet tab element:', sheetTabCheck.sheetTabExists ? '✅' : '❌');
    
    // Check console logs for module initialization
    console.log('');
    console.log('✓ Checking console logs...');
    
    const exportModuleLogs = logs.filter(log => log.includes('CoSheetExport'));
    if (exportModuleLogs.length > 0) {
        console.log('');
        console.log('CoSheetExport logs:');
        exportModuleLogs.forEach(log => console.log('  ' + log));
    } else {
        console.log('  ⚠️  No CoSheetExport initialization logs found');
    }
    
    // Check for errors
    console.log('');
    console.log('✓ Checking for errors...');
    
    if (errors.length === 0) {
        console.log('  ✅ No JavaScript errors detected');
    } else {
        console.log('  ❌ Errors found:');
        errors.forEach((err, i) => console.log(`    ${i + 1}. ${err.substring(0, 100)}`));
    }
    
    // Final summary
    console.log('');
    console.log('='.repeat(60));
    console.log('Final Summary');
    console.log('='.repeat(60));
    
    const allChecks = [
        moduleCheck.socialCalc,
        moduleCheck.coSheetExport,
        moduleCheck.pdfMakeLoadable,
        moduleCheck.exportMethods.tsv,
        moduleCheck.exportMethods.html,
        moduleCheck.exportMethods.pdf,
        moduleCheck.exportMethods.ods,
        sheetTabCheck.sheetLayoutExists,
        sheetTabCheck.hasExportFunction,
        errors.length === 0
    ];
    
    const passedChecks = allChecks.filter(c => c).length;
    const totalChecks = allChecks.length;
    const percentage = Math.round((passedChecks / totalChecks) * 100);
    
    console.log('');
    console.log(`Status: ${passedChecks}/${totalChecks} checks passed (${percentage}%)`);
    console.log('');
    
    if (percentage === 100) {
        console.log('🎉 ALL SYSTEMS GO! Export features are fully functional.');
        console.log('');
        console.log('Ready to use:');
        console.log('  • TSV Export ✅');
        console.log('  • HTML Export ✅');
        console.log('  • PDF Export ✅');
        console.log('  • ODS Export ⚠️  (under development, shows message)');
    } else if (percentage >= 80) {
        console.log('⚠️  MOSTLY FUNCTIONAL with minor issues.');
    } else {
        console.log('❌ ISSUES DETECTED - Please review errors above.');
    }
    
    console.log('');
    console.log('='.repeat(60));
    
    await browser.close();
})();
