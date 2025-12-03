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
    await page.goto('http://localhost:1234/_new', {
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

    await new Promise(r => setTimeout(r, 1000));
    console.log('✅ Clicked Sheet tab');

    // Check for Examples button
    console.log('\\n--- Checking Examples Button ---');
    const examplesButton = await page.evaluate(() => {
        const btn = document.querySelector('#sheet-examples');
        return {
            exists: !!btn,
            title: btn?.title,
            visible: btn?.offsetParent !== null,
            hasIcon: btn?.querySelector('svg') !== null
        };
    });

    console.log('Examples Button:', examplesButton);
    if (examplesButton.exists) {
        console.log('✅ Examples button found');
        console.log('  - Title:', examplesButton.title);
        console.log('  - Visible:', examplesButton.visible ? '✅' : '❌');
        console.log('  - Has SVG icon:', examplesButton.hasIcon ? '✅' : '❌');
    } else {
        console.log('❌ Examples button NOT found');
    }

    // Test Examples dialog
    console.log('\\n--- Testing Examples Dialog ---');
    await page.evaluate(() => {
        window.SheetLayout.showExamples();
    });

    await new Promise(r => setTimeout(r, 1500));

    const dialogContent = await page.evaluate(() => {
        const dialog = document.querySelector('.vex-content');
        if (!dialog) return null;

        const container = document.querySelector('.examples-container');
        const list = document.getElementById('examples-list');
        const preview = document.getElementById('examples-preview');
        const loadBtn = document.getElementById('examples-load-btn');
        const cancelBtn = document.querySelector('.examples-cancel-btn');

        return {
            exists: true,
            hasContainer: !!container,
            hasList: !!list,
            hasPreview: !!preview,
            hasLoadButton: !!loadBtn,
            hasCancelButton: !!cancelBtn,
            loadButtonDisabled: loadBtn?.disabled,
            exampleCount: list?.querySelectorAll('.example-item').length || 0,
            title: document.querySelector('.examples-title')?.innerText,
            footerInfo: document.querySelector('.examples-footer-info')?.innerText,
            previewText: preview?.innerText?.substring(0, 100)
        };
    });

    console.log('Examples Dialog:', dialogContent);

    if (dialogContent && dialogContent.exists) {
        console.log('✅ Examples dialog appeared');
        console.log('  - Container:', dialogContent.hasContainer ? '✅' : '❌');
        console.log('  - List panel:', dialogContent.hasList ? '✅' : '❌');
        console.log('  - Preview panel:', dialogContent.hasPreview ? '✅' : '❌');
        console.log('  - Load button:', dialogContent.hasLoadButton ? '✅' : '❌');
        console.log('  - Cancel button:', dialogContent.hasCancelButton ? '✅' : '❌');
        console.log('  - Example count:', dialogContent.exampleCount);
        console.log('  - Dialog title:', dialogContent.title);
        console.log('  - Footer info:', dialogContent.footerInfo);
        console.log('  - Load button disabled:', dialogContent.loadButtonDisabled ? '✅ (correct)' : '❌');

        // Test selecting an example
        console.log('\\n--- Testing Example Selection ---');
        await page.evaluate(() => {
            const firstExample = document.querySelector('.example-item');
            if (firstExample) firstExample.click();
        });

        await new Promise(r => setTimeout(r, 2000)); // Wait for MD to load

        const afterSelection = await page.evaluate(() => {
            const selectedItem = document.querySelector('.example-item.selected');
            const loadBtn = document.getElementById('examples-load-btn');
            const preview = document.getElementById('examples-preview');

            return {
                hasSelection: !!selectedItem,
                selectedName: selectedItem?.querySelector('.example-item-name')?.innerText,
                loadButtonEnabled: loadBtn && !loadBtn.disabled,
                previewHasContent: preview && preview.innerText.length > 100,
                previewText: preview?.innerText?.substring(0, 200)
            };
        });

        console.log('After Selection:', afterSelection);
        console.log('  - Has selection:', afterSelection.hasSelection ? '✅' : '❌');
        console.log('  - Selected:', afterSelection.selectedName);
        console.log('  - Load button enabled:', afterSelection.loadButtonEnabled ? '✅' : '❌');
        console.log('  - Preview has content:', afterSelection.previewHasContent ? '✅' : '❌');
        if (afterSelection.previewText) {
            console.log('  - Preview start:', afterSelection.previewText.substring(0, 80) + '...');
        }

        // Test Load button
        console.log('\\n--- Testing Load Functionality ---');

        // Get initial cell count
        const beforeLoad = await page.evaluate(() => {
            const ctrl = window.SocialCalc?.GetSpreadsheetControlObject();
            if (!ctrl || !ctrl.sheet) return { cellCount: 0 };
            return {
                cellCount: Object.keys(ctrl.sheet.cells).length
            };
        });

        console.log('Before load - Cell count:', beforeLoad.cellCount);

        // Click Load button
        await page.evaluate(() => {
            const loadBtn = document.getElementById('examples-load-btn');
            if (loadBtn && !loadBtn.disabled) loadBtn.click();
        });

        await new Promise(r => setTimeout(r, 3000)); // Wait for CSV to load

        // Check if dialog closed and data loaded
        const afterLoad = await page.evaluate(() => {
            const dialog = document.querySelector('.vex-content');
            const ctrl = window.SocialCalc?.GetSpreadsheetControlObject();

            if (!ctrl || !ctrl.sheet) {
                return { dialogClosed: !dialog, cellCount: 0, hasData: false };
            }

            const cells = ctrl.sheet.cells;
            const cellCount = Object.keys(cells).length;

            // Check for data in A1, A2, B1, B2
            const a1 = cells['A1']?.datavalue || '';
            const a2 = cells['A2']?.datavalue || '';
            const b1 = cells['B1']?.datavalue || '';
            const b2 = cells['B2']?.datavalue || '';

            return {
                dialogClosed: !dialog,
                cellCount: cellCount,
                hasData: cellCount > 10,
                sampleCells: { A1: a1, A2: a2, B1: b1, B2: b2 }
            };
        });

        console.log('After load:', afterLoad);
        console.log('  - Dialog closed:', afterLoad.dialogClosed ? '✅' : '❌');
        console.log('  - Cell count:', afterLoad.cellCount);
        console.log('  - Has data (>10 cells):', afterLoad.hasData ? '✅' : '❌');
        if (afterLoad.sampleCells) {
            console.log('  - Sample cells:', afterLoad.sampleCells);
        }

    } else {
        console.log('❌ Examples dialog did NOT appear');
    }

    // Screenshot
    await page.screenshot({ path: '/root/ethercalc/chrome_test/examples_test.png', fullPage: true });
    console.log('\\n📸 Screenshot saved: examples_test.png');

    console.log('\\n--- Console Logs (last 10) ---');
    logs.slice(-10).forEach(log => console.log('  ' + log));

    console.log('\\n--- Errors ---');
    console.log('Total errors:', errors.length);
    if (errors.length > 0) {
        errors.forEach((err, i) => console.log(`${i + 1}. ${err}`));
    }

    await browser.close();

    // Summary
    console.log('\\n=== TEST SUMMARY ===');
    console.log('Examples button exists:', examplesButton?.exists ? '✅ PASS' : '❌ FAIL');
    console.log('Dialog opens:', dialogContent?.exists ? '✅ PASS' : '❌ FAIL');
    console.log('10 examples listed:', dialogContent?.exampleCount === 10 ? '✅ PASS' : `❌ FAIL (${dialogContent?.exampleCount})`);
    console.log('Load button initially disabled:', dialogContent?.loadButtonDisabled ? '✅ PASS' : '❌ FAIL');
    console.log('Selection works:', afterSelection?.hasSelection ? '✅ PASS' : '❌ FAIL');
    console.log('Preview loads:', afterSelection?.previewHasContent ? '✅ PASS' : '❌ FAIL');
    console.log('Load button enables:', afterSelection?.loadButtonEnabled ? '✅ PASS' : '❌ FAIL');
    console.log('CSV data loads:', afterLoad?.hasData ? '✅ PASS' : '❌ FAIL');
    console.log('Dialog closes after load:', afterLoad?.dialogClosed ? '✅ PASS' : '❌ FAIL');

    const allPassed = examplesButton?.exists &&
        dialogContent?.exists &&
        dialogContent?.exampleCount === 10 &&
        afterSelection?.hasSelection &&
        afterSelection?.previewHasContent &&
        afterLoad?.hasData &&
        afterLoad?.dialogClosed;

    console.log('\\n' + (allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'));
})();
