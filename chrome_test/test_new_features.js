const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
    console.log('=== Testing New Features ===\n');
    
    const browser = await puppeteer.launch({
        headless: true, // Headless mode for server
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    // Capture console messages
    page.on('console', msg => {
        const text = msg.text();
        if (text.includes('ERROR') || text.includes('error')) {
            console.log('[PAGE ERROR]', text);
        } else {
            console.log('[PAGE]', text);
        }
    });

    page.on('pageerror', error => {
        console.log('[JS ERROR]', error.message);
    });

    try {
        // Test 1: Multi-sheet XLSX auto-open
        console.log('\n=== TEST 1: Multi-sheet XLSX Auto-Open ===');
        await page.goto('http://localhost:1234/_new', {
            waitUntil: 'networkidle2',
            timeout: 30000
        });

        await page.waitForTimeout(2000);

        // Upload multi-sheet XLSX
        const fileInput = await page.$('#sheet-file-input');
        if (fileInput) {
            const xlsxPath = path.resolve(__dirname, 'test_multisheet.xlsx');
            console.log('Uploading multi-sheet XLSX:', xlsxPath);
            await fileInput.uploadFile(xlsxPath);

            // Wait for redirect to multi-view
            await page.waitForTimeout(5000);
            
            const currentUrl = page.url();
            console.log('Current URL after upload:', currentUrl);
            
            if (currentUrl.includes('/=')) {
                console.log('✅ PASS: Auto-redirected to multi-view (no dialog)');
            } else {
                console.log('❌ FAIL: Not redirected to multi-view URL');
            }
        } else {
            console.log('⚠️  File input not found');
        }

        // Test 2: Save Dialog (compact size)
        console.log('\n=== TEST 2: Save Dialog Compact Size ===');
        await page.goto('http://localhost:1234/_new', {
            waitUntil: 'networkidle2',
            timeout: 30000
        });
        await page.waitForTimeout(2000);

        // Enter some test data
        await page.evaluate(() => {
            window.spreadsheet.ExecuteCommand('set A1 text t Hello');
            window.spreadsheet.ExecuteCommand('set B1 text t World');
        });

        // Click Save button
        const saveBtn = await page.$('#save-btn');
        if (saveBtn) {
            await saveBtn.click();
            await page.waitForTimeout(1000);

            // Check if dialog appears
            const dialog = await page.$('.vex-content');
            if (dialog) {
                const dialogBox = await dialog.boundingBox();
                console.log('Save dialog width:', dialogBox.width, 'px');
                
                if (dialogBox.width <= 400) {
                    console.log('✅ PASS: Save dialog is compact (≤400px)');
                } else {
                    console.log('❌ FAIL: Save dialog too wide:', dialogBox.width, 'px');
                }

                // Check CANCEL button styling
                const cancelBtn = await page.$('.vex-dialog-button-secondary');
                if (cancelBtn) {
                    const btnClass = await page.evaluate(el => el.className, cancelBtn);
                    console.log('CANCEL button classes:', btnClass);
                    
                    if (btnClass.includes('vex-dialog-button-primary')) {
                        console.log('✅ PASS: CANCEL button has primary styling');
                    } else {
                        console.log('⚠️  WARNING: CANCEL button may not be prominent');
                    }
                }

                // Close dialog
                await cancelBtn.click();
                await page.waitForTimeout(500);
            } else {
                console.log('❌ FAIL: Save dialog did not appear');
            }
        } else {
            console.log('⚠️  Save button not found');
        }

        // Test 3: Export Dialog (compact size)
        console.log('\n=== TEST 3: Export Dialog Compact Size ===');
        
        const exportBtn = await page.$('#export-btn');
        if (exportBtn) {
            await exportBtn.click();
            await page.waitForTimeout(1000);

            const dialog = await page.$('.vex-content');
            if (dialog) {
                const dialogBox = await dialog.boundingBox();
                console.log('Export dialog width:', dialogBox.width, 'px');
                
                if (dialogBox.width <= 420) {
                    console.log('✅ PASS: Export dialog is compact (≤420px)');
                } else {
                    console.log('❌ FAIL: Export dialog too wide:', dialogBox.width, 'px');
                }

                // Check if PDF button exists and doesn't say "Coming Soon"
                const buttons = await page.$$('.vex-dialog-button');
                let foundPdf = false;
                for (const btn of buttons) {
                    const text = await page.evaluate(el => el.textContent, btn);
                    if (text.includes('PDF')) {
                        foundPdf = true;
                        if (text.includes('Coming Soon')) {
                            console.log('❌ FAIL: PDF button still says "Coming Soon"');
                        } else {
                            console.log('✅ PASS: PDF button text updated');
                        }
                    }
                }
                if (!foundPdf) {
                    console.log('⚠️  WARNING: PDF button not found');
                }

                // Close dialog
                const cancelBtn = await page.$('.vex-dialog-button-secondary');
                if (cancelBtn) {
                    await cancelBtn.click();
                    await page.waitForTimeout(500);
                }
            } else {
                console.log('❌ FAIL: Export dialog did not appear');
            }
        } else {
            console.log('⚠️  Export button not found');
        }

        // Test 4: HTML Export Handler
        console.log('\n=== TEST 4: HTML Export Handler ===');
        
        // Create a new sheet with known ID
        const testRoom = 'test_' + Date.now();
        await page.goto(`http://localhost:1234/${testRoom}`, {
            waitUntil: 'networkidle2',
            timeout: 30000
        });
        await page.waitForTimeout(2000);

        // Add some data
        await page.evaluate(() => {
            window.spreadsheet.ExecuteCommand('set A1 text t HTML Test');
        });

        // Click Export button
        const exportBtn2 = await page.$('#export-btn');
        if (exportBtn2) {
            await exportBtn2.click();
            await page.waitForTimeout(1000);

            // Click HTML button
            const buttons = await page.$$('.vex-dialog-button');
            for (const btn of buttons) {
                const text = await page.evaluate(el => el.textContent, btn);
                if (text.includes('HTML')) {
                    console.log('Clicking HTML export button...');
                    
                    // Listen for new tabs
                    const newTargetPromise = new Promise(resolve => 
                        browser.once('targetcreated', target => resolve(target))
                    );
                    
                    await btn.click();
                    await page.waitForTimeout(2000);
                    
                    const newTarget = await newTargetPromise;
                    if (newTarget) {
                        const newPage = await newTarget.page();
                        await page.waitForTimeout(2000);
                        const htmlUrl = newPage.url();
                        console.log('HTML export opened:', htmlUrl);
                        
                        if (htmlUrl.includes('.html')) {
                            console.log('✅ PASS: HTML export handler works');
                        } else {
                            console.log('❌ FAIL: HTML export opened wrong URL:', htmlUrl);
                        }
                        await newPage.close();
                    } else {
                        console.log('❌ FAIL: HTML export did not open new tab');
                    }
                    break;
                }
            }
        }

        // Test 5: PDF Export Handler (window.print)
        console.log('\n=== TEST 5: PDF Export Handler ===');
        
        await page.goto(`http://localhost:1234/${testRoom}`, {
            waitUntil: 'networkidle2',
            timeout: 30000
        });
        await page.waitForTimeout(2000);

        // Override window.print to detect call
        await page.evaluate(() => {
            window._printCalled = false;
            window.print = function() {
                window._printCalled = true;
                console.log('window.print() was called');
            };
        });

        // Click Export button
        const exportBtn3 = await page.$('#export-btn');
        if (exportBtn3) {
            await exportBtn3.click();
            await page.waitForTimeout(1000);

            // Click PDF button
            const buttons = await page.$$('.vex-dialog-button');
            for (const btn of buttons) {
                const text = await page.evaluate(el => el.textContent, btn);
                if (text.includes('PDF')) {
                    console.log('Clicking PDF export button...');
                    await btn.click();
                    await page.waitForTimeout(1000);
                    
                    const printCalled = await page.evaluate(() => window._printCalled);
                    if (printCalled) {
                        console.log('✅ PASS: PDF export calls window.print()');
                    } else {
                        console.log('❌ FAIL: PDF export did not call window.print()');
                    }
                    break;
                }
            }
        }

        console.log('\n=== All Tests Completed ===');

    } catch (error) {
        console.error('Test error:', error.message);
        console.error(error.stack);
    } finally {
        await browser.close();
    }
})();
