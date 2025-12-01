const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    const page = await browser.newPage();

    console.log('\n=== Testing SocialCalc.DoCmd Implementation ===\n');

    // Capture console logs
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));

    await page.goto('http://localhost:1234/_new', {
        waitUntil: 'networkidle2',
        timeout: 30000
    });
    await new Promise(resolve => setTimeout(resolve, 4000));

    // Initialize cell A1 properly using ExecuteCommand
    console.log('1. Setting A1 = "HELLO"...');
    await page.evaluate(() => {
        if (window.spreadsheet) {
            console.log('Spreadsheet object keys:', Object.keys(window.spreadsheet));
            // Use ExecuteCommand which we know exists
            window.spreadsheet.ExecuteCommand("set A1 text t HELLO", "");
        } else {
            console.error('window.spreadsheet is undefined');
        }
    });
    await new Promise(resolve => setTimeout(resolve, 1000));

    const a1 = await page.evaluate(() => {
        return window.spreadsheet?.sheet?.cells?.['A1']?.datavalue;
    });
    console.log('   A1 =', a1);

    // Activate Edit tab
    console.log('\n2. Activating Edit tab...');
    await page.evaluate(() => {
        const editTab = document.querySelector('[id$="edittab"]');
        if (editTab) editTab.click();
    });
    await new Promise(resolve => setTimeout(resolve, 1200));

    // Click Copy
    console.log('\n3. Clicking Copy button...');
    await page.evaluate(() => {
        const btn = document.getElementById('edit-copy');
        if (btn) btn.click();
    });
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check clipboard
    const clipboard = await page.evaluate(() => {
        return (typeof SocialCalc !== 'undefined' && SocialCalc.Clipboard) ?
            SocialCalc.Clipboard.clipboard : 'N/A';
    });
    console.log('   Clipboard content:', clipboard);

    // Move to B1 using ExecuteCommand to be safer
    console.log('\n4. Moving to B1...');
    await page.evaluate(() => {
        if (window.spreadsheet && window.spreadsheet.editor) {
            // Use MoveECell but catch errors
            try {
                window.spreadsheet.editor.MoveECell('B1');
            } catch (e) {
                console.error('MoveECell failed:', e);
            }
        }
    });
    await new Promise(resolve => setTimeout(resolve, 500));

    // Click Paste
    console.log('\n5. Clicking Paste...');
    await page.evaluate(() => {
        const btn = document.getElementById('edit-paste');
        if (btn) btn.click();
    });
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check B1
    const b1 = await page.evaluate(() => {
        return window.spreadsheet?.sheet?.cells?.['B1']?.datavalue;
    });

    console.log('\n=== RESULT ===');
    if (a1 === 'HELLO' && b1 === 'HELLO') {
        console.log('✅ SUCCESS! Copy/Paste working with SocialCalc.DoCmd');
    } else {
        console.log('❌ FAIL - A1:', a1, 'B1:', b1);
    }

    await browser.close();
})();
