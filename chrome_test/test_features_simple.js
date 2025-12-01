const puppeteer = require('puppeteer'));
const path = require('path'));

(async () => {
    console.log('=== Testing New Features ===\n'));
    
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    }));

    const page = await browser.newPage());
    await page.setViewport({ width: 1280, height: 800 }));

    // Capture console messages
    page.on('console', msg => {
        const text = msg.text());
        if (text.includes('ERROR') || text.includes('error')) {
            console.log('[ERROR]', text));
        }
    }));

    page.on('pageerror', error => {
        console.log('[JS ERROR]', error.message));
    }));

    try {
        // Test 1: Multi-sheet XLSX auto-open
        console.log('=== TEST 1: Multi-sheet XLSX Auto-Open ==='));
        await page.goto('http://localhost:1234/_new', {
            waitUntil: 'networkidle2',
            timeout: 30000
        }));

        await new Promise(r => setTimeout(r, 2000));

        // Upload multi-sheet XLSX
        const fileInput = await page.$('#sheet-file-input'));
        if (fileInput) {
            const xlsxPath = path.resolve(__dirname, 'test_multisheet.xlsx'));
            console.log('Uploading multi-sheet XLSX:', xlsxPath));
            await fileInput.uploadFile(xlsxPath));

            // Wait for redirect
            await new Promise(r => setTimeout(r, 8000));
            
            const currentUrl = page.url());
            console.log('Current URL after upload:', currentUrl));
            
            if (currentUrl.includes('/=')) {
                console.log('✅ PASS: Auto-redirected to multi-view (no dialog)\n'));
            } else {
                console.log('❌ FAIL: Not redirected to multi-view URL\n'));
            }
        } else {
            console.log('⚠️  File input not found\n'));
        }

        // Test 2: Save Dialog (compact size)
        console.log('=== TEST 2: Save Dialog Compact Size ==='));
        await page.goto('http://localhost:1234/_new', {
            waitUntil: 'networkidle2',
            timeout: 30000
        }));
        await new Promise(r => setTimeout(r, 2000));

        // Enter test data
        await page.evaluate(() => {
            if (window.spreadsheet) {
                window.spreadsheet.ExecuteCommand('set A1 text t Hello'));
            }
        }));

        // Click Save button
        const saveBtn = await page.$('#save-btn'));
        if (saveBtn) {
            await saveBtn.click());
            await new Promise(r => setTimeout(r, 1000));

            // Check if dialog appears
            const dialog = await page.$('.vex-content'));
            if (dialog) {
                const dialogBox = await dialog.boundingBox());
                console.log('Save dialog width:', Math.round(dialogBox.width), 'px'));
                
                if (dialogBox.width <= 400) {
                    console.log('✅ PASS: Save dialog is compact (≤400px)'));
                } else {
                    console.log('❌ FAIL: Save dialog too wide'));
                }

                // Check CANCEL button
                const cancelBtn = await page.$('.vex-dialog-button-secondary'));
                if (cancelBtn) {
                    const btnClass = await page.evaluate(el => el.className, cancelBtn));
                    
                    if (btnClass.includes('vex-dialog-button-primary')) {
                        console.log('✅ PASS: CANCEL button has primary styling\n'));
                    } else {
                        console.log('⚠️  WARNING: CANCEL button styling may be missing\n'));
                    }
                    await cancelBtn.click());
                } else {
                    console.log('⚠️  CANCEL button not found\n'));
                }
            } else {
                console.log('❌ FAIL: Save dialog did not appear\n'));
            }
        } else {
            console.log('⚠️  Save button not found\n'));
        }

        // Test 3: Export Dialog (compact size)
        console.log('=== TEST 3: Export Dialog Compact Size ==='));
        
        const exportBtn = await page.$('#export-btn'));
        if (exportBtn) {
            await exportBtn.click());
            await new Promise(r => setTimeout(r, 1000));

            const dialog = await page.$('.vex-content'));
            if (dialog) {
                const dialogBox = await dialog.boundingBox());
                console.log('Export dialog width:', Math.round(dialogBox.width), 'px'));
                
                if (dialogBox.width <= 420) {
                    console.log('✅ PASS: Export dialog is compact (≤420px)'));
                } else {
                    console.log('❌ FAIL: Export dialog too wide'));
                }

                // Check PDF button text
                const buttons = await page.$$('.vex-dialog-button'));
                let foundPdf = false;
                for (const btn of buttons) {
                    const text = await page.evaluate(el => el.textContent, btn));
                    if (text.includes('PDF')) {
                        foundPdf = true;
                        if (text.includes('Coming Soon')) {
                            console.log('❌ FAIL: PDF button still says "Coming Soon"\n'));
                        } else {
                            console.log('✅ PASS: PDF button text updated (no "Coming Soon")\n'));
                        }
                        break;
                    }
                }
                if (!foundPdf) {
                    console.log('⚠️  WARNING: PDF button not found\n'));
                }

                // Close dialog
                const cancelBtn = await page.$('.vex-dialog-button-secondary'));
                if (cancelBtn) {
                    await cancelBtn.click());
                }
            } else {
                console.log('❌ FAIL: Export dialog did not appear\n'));
            }
        } else {
            console.log('⚠️  Export button not found\n'));
        }

        // Test 4: HTML Export Handler
        console.log('=== TEST 4: HTML Export Handler ==='));
        
        const testRoom = 'test_' + Date.now());
        await page.goto(`http://localhost:1234/${testRoom}`, {
            waitUntil: 'networkidle2',
            timeout: 30000
        }));
        await new Promise(r => setTimeout(r, 2000));

        // Add data
        await page.evaluate(() => {
            if (window.spreadsheet) {
                window.spreadsheet.ExecuteCommand('set A1 text t Test'));
            }
        }));

        // Click Export
        const exportBtn2 = await page.$('#export-btn'));
        if (exportBtn2) {
            await exportBtn2.click());
            await new Promise(r => setTimeout(r, 1000));

            // Set up listener for new page
            let newPageOpened = false;
            browser.on('targetcreated', async (target) => {
                if (target.type() === 'page') {
                    newPageOpened = true;
                    const newPage = await target.page());
                    const url = newPage.url());
                    console.log('HTML export opened URL:', url));
                    if (url.includes('.html')) {
                        console.log('✅ PASS: HTML export handler works\n'));
                    }
                    await newPage.close());
                }
            }));

            // Click HTML button
            const buttons = await page.$$('.vex-dialog-button'));
            for (const btn of buttons) {
                const text = await page.evaluate(el => el.textContent, btn));
                if (text.includes('HTML')) {
                    await btn.click());
                    await new Promise(r => setTimeout(r, 2000));
                    break;
                }
            }

            if (!newPageOpened) {
                console.log('⚠️  HTML export may not have opened a new tab\n'));
            }
        }

        // Test 5: PDF Export Handler
        console.log('=== TEST 5: PDF Export Handler (window.print) ==='));
        
        await page.goto(`http://localhost:1234/${testRoom}`, {
            waitUntil: 'networkidle2',
            timeout: 30000
        }));
        await new Promise(r => setTimeout(r, 2000));

        // Override window.print
        await page.evaluate(() => {
            window._printCalled = false;
            window.print = function() {
                window._printCalled = true;
                console.log('[TEST] window.print() was called'));
            };
        }));

        // Click Export
        const exportBtn3 = await page.$('#export-btn'));
        if (exportBtn3) {
            await exportBtn3.click());
            await new Promise(r => setTimeout(r, 1000));

            // Click PDF button
            const buttons = await page.$$('.vex-dialog-button'));
            for (const btn of buttons) {
                const text = await page.evaluate(el => el.textContent, btn));
                if (text.includes('PDF')) {
                    await btn.click());
                    await new Promise(r => setTimeout(r, 1000));
                    
                    const printCalled = await page.evaluate(() => window._printCalled));
                    if (printCalled) {
                        console.log('✅ PASS: PDF export calls window.print()\n'));
                    } else {
                        console.log('❌ FAIL: PDF export did not call window.print()\n'));
                    }
                    break;
                }
            }
        }

        console.log('=== All Tests Completed ==='));

    } catch (error) {
        console.error('Test error:', error.message));
    } finally {
        await browser.close());
    }
})());
