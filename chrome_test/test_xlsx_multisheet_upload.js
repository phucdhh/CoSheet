const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    const logs = [];
    const requests = [];
    
    page.on('console', msg => {
        const text = msg.text();
        logs.push(text);
        console.log('[CONSOLE]', text);
    });
    
    page.on('request', request => {
        const url = request.url();
        const method = request.method();
        if (method === 'POST' || method === 'PUT') {
            requests.push({ method, url });
            console.log(`[REQUEST] ${method} ${url}`);
        }
    });
    
    page.on('response', response => {
        const url = response.url();
        const status = response.status();
        if (url.includes('create-toc') || url.includes('toc-')) {
            console.log(`[RESPONSE] ${status} ${url}`);
        }
    });
    
    console.log('Loading EtherCalc...');
    await page.goto('http://localhost:1234/_new', {
        waitUntil: 'networkidle0',
        timeout: 10000
    });
    
    const currentUrl = page.url();
    console.log('\nCurrent URL:', currentUrl);
    
    // Extract room ID
    const roomMatch = currentUrl.match(/\/([^\/]+)$/);
    const roomId = roomMatch ? roomMatch[1] : null;
    console.log('Room ID:', roomId);
    
    // Wait for page to be ready
    await page.waitForSelector('body', { timeout: 5000 });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('\nUploading multi-sheet XLSX...');
    
    // Trigger file upload
    const xlsxPath = path.resolve(__dirname, 'test_multisheet.xlsx');
    
    // Try to find file input and upload
    const fileInput = await page.$('input[type="file"][accept*=".xlsx"]');
    if (!fileInput) {
        console.log('❌ File input not found, trying alternative method...');
        
        // Try to trigger upload via keyboard shortcut or menu
        await page.keyboard.down('Control');
        await page.keyboard.press('KeyO');
        await page.keyboard.up('Control');
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    const fileInputs = await page.$$('input[type="file"]');
    console.log('Found', fileInputs.length, 'file inputs');
    
    if (fileInputs.length > 0) {
        console.log('Uploading file...');
        await fileInputs[0].uploadFile(xlsxPath);
        
        console.log('\nWaiting for upload to complete...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        const finalUrl = page.url();
        console.log('\n=== UPLOAD RESULT ===');
        console.log('Final URL:', finalUrl);
        console.log('Is multi-view?', finalUrl.includes('/='));
        
        console.log('\n=== REQUESTS ===');
        const tocRequests = requests.filter(r => r.url.includes('create-toc'));
        console.log('TOC creation requests:', tocRequests.length);
        tocRequests.forEach(r => console.log('  -', r.method, r.url));
        
        console.log('\n=== CONSOLE LOGS ===');
        const tocLogs = logs.filter(l => l.includes('TOC') || l.includes('Multi-Upload'));
        tocLogs.forEach(l => console.log('  -', l));
        
        // Check if TOC file was created
        const fs = require('fs');
        if (finalUrl.includes('/=')) {
            const room = finalUrl.match(/\/=([^\/\?]+)/)[1];
            const tocPath = `/root/ethercalc/static/toc-${room}.json`;
            const exists = fs.existsSync(tocPath);
            console.log('\n=== TOC FILE ===');
            console.log('Expected path:', tocPath);
            console.log('File exists:', exists);
            if (exists) {
                const content = fs.readFileSync(tocPath, 'utf8');
                console.log('Content:', content);
            }
        }
    } else {
        console.log('❌ Could not find file input to upload');
    }
    
    await browser.close();
})();
