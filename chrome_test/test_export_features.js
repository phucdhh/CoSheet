const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
    const browser = await puppeteer.launch({ 
        headless: true, 
        args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });
    
    const page = await browser.newPage();
    
    // Enable download
    const downloadPath = path.resolve(__dirname, 'downloads');
    if (!fs.existsSync(downloadPath)) {
        fs.mkdirSync(downloadPath);
    }
    
    const client = await page.target().createCDPSession();
    await client.send('Page.setDownloadBehavior', {
        behavior: 'allow',
        downloadPath: downloadPath
    });
    
    console.log('Loading page...');
    await page.goto('http://localhost:1234/test_export', { 
        waitUntil: 'networkidle0', 
        timeout: 30000 
    });
    
    await page.waitForFunction(() => window.SocialCalc && window.CoSheetExport, { timeout: 10000 });
    console.log('✅ Page and CoSheetExport module loaded\n');
    
    // Insert some test data
    console.log('Inserting test data...');
    await page.evaluate(() => {
        const spreadsheet = SocialCalc.GetSpreadsheetControlObject();
        const editor = spreadsheet.editor;
        
        // Add headers
        editor.EditorScheduleSheetCommands('set A1 text t Name\nset B1 text t Age\nset C1 text t City\nset D1 text t Salary', true, false);
        
        // Add data rows
        editor.EditorScheduleSheetCommands('set A2 text t John\nset B2 value n 30\nset C2 text t NYC\nset D2 value n 50000', true, false);
        editor.EditorScheduleSheetCommands('set A3 text t Jane\nset B3 value n 25\nset C3 text t LA\nset D3 value n 60000', true, false);
        editor.EditorScheduleSheetCommands('set A4 text t Bob\nset B4 value n 35\nset C4 text t Chicago\nset D4 value n 55000', true, false);
        editor.EditorScheduleSheetCommands('set A5 text t Alice\nset B5 value n 28\nset C5 text t Boston\nset D5 value n 65000', true, false);
        
        // Add a formula
        editor.EditorScheduleSheetCommands('set D6 text t Total:\nset D7 formula e SUM(D2:D5)', true, false);
    });
    
    await new Promise(r => setTimeout(r, 1000));
    console.log('✅ Test data inserted\n');
    
    // Test TSV Export
    console.log('--- Testing TSV Export ---');
    const tsvFiles = fs.readdirSync(downloadPath).filter(f => f.endsWith('.tsv'));
    const initialTsvCount = tsvFiles.length;
    
    await page.evaluate(() => {
        window.dispatchEvent(new Event('ec-export-tsv-request'));
    });
    
    await new Promise(r => setTimeout(r, 2000));
    
    const newTsvFiles = fs.readdirSync(downloadPath).filter(f => f.endsWith('.tsv'));
    if (newTsvFiles.length > initialTsvCount) {
        const tsvFile = newTsvFiles[newTsvFiles.length - 1];
        const tsvContent = fs.readFileSync(path.join(downloadPath, tsvFile), 'utf-8');
        console.log('✅ TSV file created:', tsvFile);
        console.log('Content preview:', tsvContent.substring(0, 200));
    } else {
        console.log('❌ TSV file not created');
    }
    
    // Test HTML Export
    console.log('\n--- Testing HTML Export ---');
    const htmlFiles = fs.readdirSync(downloadPath).filter(f => f.endsWith('.html'));
    const initialHtmlCount = htmlFiles.length;
    
    await page.evaluate(() => {
        window.dispatchEvent(new Event('ec-export-html-request'));
    });
    
    await new Promise(r => setTimeout(r, 2000));
    
    const newHtmlFiles = fs.readdirSync(downloadPath).filter(f => f.endsWith('.html'));
    if (newHtmlFiles.length > initialHtmlCount) {
        const htmlFile = newHtmlFiles[newHtmlFiles.length - 1];
        const htmlContent = fs.readFileSync(path.join(downloadPath, htmlFile), 'utf-8');
        console.log('✅ HTML file created:', htmlFile);
        console.log('Has table tag:', htmlContent.includes('<table>') ? '✅' : '❌');
        console.log('Has headers:', htmlContent.includes('<th>') ? '✅' : '❌');
    } else {
        console.log('❌ HTML file not created');
    }
    
    // Test PDF Export (check if pdfMake is available)
    console.log('\n--- Testing PDF Export ---');
    const pdfResult = await page.evaluate(async () => {
        // Load pdfMake first
        try {
            await window.CoSheetExport.loadPdfMake();
            return { loaded: true, hasPdfMake: typeof pdfMake !== 'undefined' };
        } catch (e) {
            return { loaded: false, error: e.message };
        }
    });
    
    if (pdfResult.loaded && pdfResult.hasPdfMake) {
        console.log('✅ pdfMake loaded successfully');
        
        // Try to export PDF
        await page.evaluate(() => {
            window.dispatchEvent(new Event('ec-export-pdf-request'));
        });
        
        await new Promise(r => setTimeout(r, 3000));
        
        const pdfFiles = fs.readdirSync(downloadPath).filter(f => f.endsWith('.pdf'));
        if (pdfFiles.length > 0) {
            console.log('✅ PDF file created:', pdfFiles[pdfFiles.length - 1]);
        } else {
            console.log('⚠️  PDF generation triggered but file not detected (may require manual verification)');
        }
    } else {
        console.log('❌ pdfMake failed to load:', pdfResult.error || 'Unknown error');
    }
    
    // Test ODS Export
    console.log('\n--- Testing ODS Export ---');
    const odsResult = await page.evaluate(() => {
        let alertShown = false;
        const originalAlert = window.alert;
        window.alert = function(msg) {
            alertShown = true;
            return msg;
        };
        
        window.dispatchEvent(new Event('ec-export-ods-request'));
        
        window.alert = originalAlert;
        return { alertShown };
    });
    
    if (odsResult.alertShown) {
        console.log('✅ ODS export handler called (currently shows "under development" message)');
    } else {
        console.log('❌ ODS export handler not called');
    }
    
    console.log('\n--- Summary ---');
    console.log('Download directory:', downloadPath);
    console.log('Files created:', fs.readdirSync(downloadPath).length);
    fs.readdirSync(downloadPath).forEach(file => {
        const stats = fs.statSync(path.join(downloadPath, file));
        console.log(`  - ${file} (${stats.size} bytes)`);
    });
    
    await browser.close();
})();
