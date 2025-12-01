const puppeteer = require('puppeteer');
const path = require('path');

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

(async () => {
    console.log('=== Testing CoSheet New Features ===\n');
    
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    // Suppress noise
    let errors = [];
    page.on('pageerror', error => {
        errors.push(error.message);
    });

    try {
        console.log('1. Loading new spreadsheet...');
        await page.goto('http://localhost:1234/_new', {
            waitUntil: 'networkidle2',
            timeout: 30000
        });

        // Wait for SocialCalc to initialize
        await page.waitForFunction(() => typeof SocialCalc !== 'undefined', { timeout: 10000 });
        await wait(3000);

        // Test 1: Multi-sheet XLSX auto-open
        console.log('\n=== TEST 1: Multi-sheet XLSX Auto-Open ===');
        
        const fileInput = await page.$('#sheet-file-input');
        if (fileInput) {
            const xlsxPath = path.resolve(__dirname, 'test_multisheet.xlsx');
            console.log('Uploading:', xlsxPath);
            await fileInput.uploadFile(xlsxPath);

            await wait(8000);
            
            const currentUrl = page.url();
            console.log('Result URL:', currentUrl);
            
            if (currentUrl.includes('/=')) {
                console.log('✅ PASS: Auto-redirected to multi-view\n');
            } else {
                console.log('❌ FAIL: Not multi-view URL\n');
            }
        } else {
            console.log('⚠️  File input not found\n');
        }

        // Test 2 & 3: Save and Export Dialog sizes
        console.log('=== TEST 2 & 3: Dialog Sizes ===');
        
        // Go to fresh sheet
        await page.goto('http://localhost:1234/_new', {
            waitUntil: 'networkidle2',
            timeout: 30000
        });
        await page.waitForFunction(() => typeof SocialCalc !== 'undefined', { timeout: 10000 });
        await wait(3000);

        // Add some data first
        await page.evaluate(() => {
            if (window.spreadsheet && window.spreadsheet.ExecuteCommand) {
                window.spreadsheet.ExecuteCommand('set A1 text t Test');
            }
        });

        // Test Save button
        const saveBtn = await page.$('#sheet-save');
        if (saveBtn) {
            console.log('Testing Save dialog...');
            await saveBtn.click();
            await wait(1500);

            const dialog = await page.$('.vex-content');
            if (dialog) {
                const box = await dialog.boundingBox();
                console.log(' - Save dialog width:', Math.round(box.width), 'px');
                
                if (box.width <= 400) {
                    console.log(' ✅ Compact size');
                } else {
                    console.log(' ❌ Too wide');
                }

                const cancelBtn = await page.$('.vex-dialog-button-secondary');
                if (cancelBtn) {
                    const btnClass = await page.evaluate(el => el.className, cancelBtn);
                    if (btnClass.includes('vex-dialog-button-primary')) {
                        console.log(' ✅ CANCEL button styled\n');
                    } else {
                        console.log(' ❌ CANCEL styling missing\n');
                    }
                    await cancelBtn.click();
                    await wait(500);
                }
            } else {
                console.log(' ❌ Dialog not shown\n');
            }
        } else {
            console.log('⚠️  Save button not found\n');
        }

        // Test Export button
        const exportBtn = await page.$('#sheet-export');
        if (exportBtn) {
            console.log('Testing Export dialog...');
            await exportBtn.click();
            await wait(1500);

            const dialog = await page.$('.vex-content');
            if (dialog) {
                const box = await dialog.boundingBox();
                console.log(' - Export dialog width:', Math.round(box.width), 'px');
                
                if (box.width <= 420) {
                    console.log(' ✅ Compact size');
                } else {
                    console.log(' ❌ Too wide');
                }

                // Check PDF button
                const buttons = await page.$$('.vex-dialog-button');
                for (const btn of buttons) {
                    const text = await page.evaluate(el => el.textContent, btn);
                    if (text.includes('PDF')) {
                        if (text.includes('Coming Soon')) {
                            console.log(' ❌ PDF says "Coming Soon"');
                        } else {
                            console.log(' ✅ PDF text updated');
                        }
                        break;
                    }
                }

                const cancelBtn = await page.$('.vex-dialog-button-secondary');
                if (cancelBtn) {
                    await cancelBtn.click();
                    await wait(500);
                }
            } else {
                console.log(' ❌ Dialog not shown');
            }
        } else {
            console.log('⚠️  Export button not found');
        }

        // Test 4 & 5: HTML and PDF handlers
        console.log('\n=== TEST 4 & 5: Export Handlers ===');
        
        const testRoom = 'test_' + Date.now();
        await page.goto(`http://localhost:1234/${testRoom}`, {
            waitUntil: 'networkidle2',
            timeout: 30000
        });
        await page.waitForFunction(() => typeof SocialCalc !== 'undefined', { timeout: 10000 });
        await wait(3000);

        // Add data
        await page.evaluate(() => {
            if (window.spreadsheet) {
                window.spreadsheet.ExecuteCommand('set A1 text t Data');
            }
        });

        // Test window.print override
        await page.evaluate(() => {
            window._printCalled = false;
            window.print = function() {
                window._printCalled = true;
            };
        });

        // Test HTML export
        let htmlExportWorked = false;
        browser.on('targetcreated', async (target) => {
            if (target.type() === 'page') {
                const newPage = await target.page();
                const url = newPage.url();
                if (url.includes('.html')) {
                    htmlExportWorked = true;
                    console.log('HTML export opened:', url);
                    console.log(' ✅ HTML handler works');
                }
                await newPage.close();
            }
        });

        const exportBtn2 = await page.$('#sheet-export');
        if (exportBtn2) {
            await exportBtn2.click();
            await wait(1500);

            // Click HTML
            const buttons = await page.$$('.vex-dialog-button');
            for (const btn of buttons) {
                const text = await page.evaluate(el => el.textContent, btn);
                if (text.includes('HTML')) {
                    console.log('Clicking HTML button...');
                    await btn.click();
                    await wait(2000);
                    if (!htmlExportWorked) {
                        console.log(' ❌ HTML did not open tab');
                    }
                    break;
                }
            }

            // Close any dialog
            const cancel = await page.$('.vex-dialog-button-secondary');
            if (cancel) await cancel.click();
            await wait(500);

            // Test PDF
            await exportBtn2.click();
            await wait(1500);

            const buttons2 = await page.$$('.vex-dialog-button');
            for (const btn of buttons2) {
                const text = await page.evaluate(el => el.textContent, btn);
                if (text.includes('PDF')) {
                    console.log('Clicking PDF button...');
                    await btn.click();
                    await wait(1000);
                    
                    const called = await page.evaluate(() => window._printCalled);
                    if (called) {
                        console.log(' ✅ window.print() called');
                    } else {
                        console.log(' ❌ window.print() not called');
                    }
                    break;
                }
            }
        }

        console.log('\n=== Tests Complete ===');
        
        if (errors.length > 0) {
            console.log('\nJS Errors detected:', errors.length);
            console.log('First few errors:', errors.slice(0, 3));
        }

    } catch (error) {
        console.error('Test error:', error.message);
    } finally {
        await browser.close();
    }
})();
