const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    const page = await browser.newPage();

    // Capture console logs
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));

    console.log('\n=== Testing Format Tab Controls ===\n');

    await page.goto('http://localhost:1234/_new', {
        waitUntil: 'networkidle2',
        timeout: 30000
    });
    await new Promise(resolve => setTimeout(resolve, 4000));

    // Set A1 value to "TEST"
    await page.evaluate(() => {
        if (window.spreadsheet) {
            window.spreadsheet.ExecuteCommand("set A1 text t TEST", "");
        }
    });
    await new Promise(resolve => setTimeout(resolve, 500));

    // Activate Format tab
    console.log('1. Activating Format tab...');
    await page.evaluate(() => {
        // Format tab ID is usually "SocialCalc-id-settingstab"
        const formatTab = document.querySelector('[id$="settingstab"]');
        if (formatTab) {
            formatTab.click();
            console.log('Format tab clicked');
        } else {
            console.error('Format tab not found');
        }
    });
    await new Promise(resolve => setTimeout(resolve, 1200));

    // Check if FormatLayout is loaded
    const layoutLoaded = await page.evaluate(() => !!window.FormatLayout);
    console.log('   FormatLayout loaded:', layoutLoaded);

    // Test Bold Button
    console.log('\n2. Testing Bold button...');
    await page.evaluate(() => {
        const btn = document.getElementById('format-bold');
        if (btn) {
            if (btn.hasAttribute('onclick')) {
                console.error('ERROR: Inline onclick attribute still present!');
            } else {
                console.log('Verified: Inline onclick attribute removed.');
            }
            console.log('Bold button found, clicking...');
            btn.click();
        } else {
            console.error('Bold button not found');
        }
    });
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check A1 style
    const a1Style = await page.evaluate(() => {
        const cell = window.spreadsheet.sheet.cells['A1'];
        return {
            font: cell.font, // index to font table
            fontObj: window.spreadsheet.sheet.fonts[cell.font]
        };
    });
    console.log('   A1 Font Style:', a1Style);

    // Test Align Center
    console.log('\n3. Testing Align Center...');
    await page.evaluate(() => {
        const btn = document.getElementById('format-align-center');
        if (btn) btn.click();
    });
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check A1 alignment
    const a1Align = await page.evaluate(() => {
        const cell = window.spreadsheet.sheet.cells['A1'];
        return cell.cellformat; // "center"
    });
    console.log('   A1 Alignment:', a1Align);

    // Test Font Size
    console.log('\n4. Testing Font Size 18...');
    await page.evaluate(() => {
        const select = document.getElementById('format-font-size');
        if (select) {
            select.value = '18';
            select.dispatchEvent(new Event('change'));
        }
    });
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check A1 font string (should contain 18pt)
    const a1FontStr = await page.evaluate(() => {
        const cell = window.spreadsheet.sheet.cells['A1'];
        const fontObj = window.spreadsheet.sheet.fonts[cell.font];
        return fontObj; // e.g. "normal bold 18pt *"
    });
    console.log('   A1 Font String:', a1FontStr);

    // Test Text Color
    console.log('\n5. Testing Text Color Red...');
    await page.evaluate(() => {
        const input = document.getElementById('format-text-color');
        if (input) {
            input.value = '#ff0000';
            input.dispatchEvent(new Event('change'));
        }
    });
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check A1 color
    const a1Color = await page.evaluate(() => {
        const cell = window.spreadsheet.sheet.cells['A1'];
        return window.spreadsheet.sheet.colors[cell.color];
    });
    console.log('   A1 Color:', a1Color);

    await browser.close();
})();
