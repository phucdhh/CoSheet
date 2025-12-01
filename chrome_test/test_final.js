const puppeteer = require('puppeteer');
const path = require('path');

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

(async () => {
    console.log('=== Testing New Features ===\n');
    
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    // Suppress console noise
    page.on('console', msg => {
        const text = msg.text();
        if (text.includes('PASS') || text.includes('FAIL') || text.includes('[TEST]')) {
            console.log('[PAGE]', text);
        }
    });

    try {
        // Test 1: Multi-sheet XLSX auto-open
        console.log('=== TEST 1: Multi-sheet XLSX Auto-Open ===');
        await page.goto('http://localhost:1234/_new', {
            waitUntil: 'networkidle2',
            timeout: 30000
        });

        await wait(2000);

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

        // Test 2: Save Dialog
        console.log('=== TEST 2: Save Dialog Size ===');
        await page.goto('http://localhost:1234/_new', {
            waitUntil: 'networkidle2',
            timeout: 30000
        });
        await wait(2000);

        await page.evaluate(() => {
            if (window.spreadsheet) {
                window.spreadsheet.ExecuteCommand('set A1 text t Test');
            }
        });

        const saveBtn = await page.$('#save-btn');
        if (saveBtn) {
            await saveBtn.click();
            await wait(1000);

            const dialog = await page.$('.vex-content');
            if (dialog) {
                const box = await dialog.boundingBox();
                console.log('Dialog width:', Math.round(box.width), 'px');
                
                if (box.width <= 400) {
                    console.log('✅ PASS: Compact size (≤400px)');
                } else {
                    console.log('❌ FAIL: Too wide');
                }

                const cancelBtn = await page.$('.vex-dialog-button-secondary');
                if (cancelBtn) {
                    const btnClass = await page.evaluate(el => el.className, cancelBtn);
                    
                    if (btnClass.includes('vex-dialog-button-primary')) {
                        console.log('✅ PASS: CANCEL styled as primary\n');
                    } else {
                        console.log('❌ FAIL: CANCEL styling missing\n');
                    }
                    await cancelBtn.click();
                }
            } else {
                console.log('❌ FAIL: Dialog not shown\n');
            }
        } else {
            console.log('⚠️  Save button not found\n');
        }

        // Test 3: Export Dialog
        console.log('=== TEST 3: Export Dialog Size ===');
        
        const exportBtn = await page.$('#export-btn');
        if (exportBtn) {
            await exportBtn.click();
            await wait(1000);

            const dialog = await page.$('.vex-content');
            if (dialog) {
                const box = await dialog.boundingBox();
                console.log('Dialog width:', Math.round(box.width), 'px');
                
                if (box.width <= 420) {
                    console.log('✅ PASS: Compact size (≤420px)');
                } else {
                    console.log('❌ FAIL: Too wide');
                }

                const buttons = await page.$$('.vex-dialog-button');
                for (const btn of buttons) {
                    const text = await page.evaluate(el => el.textContent, btn);
                    if (text.includes('PDF')) {
                        if (text.includes('Coming Soon')) {
                            console.log('❌ FAIL: PDF says "Coming Soon"\n');
                        } else {
                            console.log('✅ PASS: PDF text updated\n');
                        }
                        break;
                    }
                }

                const cancelBtn = await page.$('.vex-dialog-button-secondary');
                if (cancelBtn) await cancelBtn.click();
            } else {
                console.log('❌ FAIL: Dialog not shown\n');
            }
        } else {
            console.log('⚠️  Export button not found\n');
        }

        // Test 4: HTML Export
        console.log('=== TEST 4: HTML Export Handler ===');
        
        const testRoom = 'test_' + Date.now();
        await page.goto(`http://localhost:1234/${testRoom}`, {
            waitUntil: 'networkidle2',
            timeout: 30000
        });
        await wait(2000);

        await page.evaluate(() => {
            if (window.spreadsheet) {
                window.spreadsheet.ExecuteCommand('set A1 text t Data');
            }
        });

        let htmlExportWorked = false;
        browser.on('targetcreated', async (target) => {
            if (target.type() === 'page') {
                const newPage = await target.page();
                const url = newPage.url();
                if (url.includes('.html')) {
                    htmlExportWorked = true;
                    console.log('Opened:', url);
                    console.log('✅ PASS: HTML handler works\n');
                }
                await newPage.close();
            }
        });

        const exportBtn2 = await page.$('#export-btn');
        if (exportBtn2) {
            await exportBtn2.click();
            await wait(1000);

            const buttons = await page.$$('.vex-dialog-button');
            for (const btn of buttons) {
                const text = await page.evaluate(el => el.textContent, btn);
                if (text.includes('HTML')) {
                    await btn.click();
                    await wait(2000);
                    break;
                }
            }

            if (!htmlExportWorked) {
                console.log('❌ FAIL: HTML export did not open tab\n');
            }
        }

        // Test 5: PDF Export
        console.log('=== TEST 5: PDF Export Handler ===');
        
        await page.goto(`http://localhost:1234/${testRoom}`, {
            waitUntil: 'networkidle2',
            timeout: 30000
        });
        await wait(2000);

        await page.evaluate(() => {
            window._printCalled = false;
            window.print = function() {
                window._printCalled = true;
            };
        });

        const exportBtn3 = await page.$('#export-btn');
        if (exportBtn3) {
            await exportBtn3.click();
            await wait(1000);

            const buttons = await page.$$('.vex-dialog-button');
            for (const btn of buttons) {
                const text = await page.evaluate(el => el.textContent, btn);
                if (text.includes('PDF')) {
                    await btn.click();
                    await wait(1000);
                    
                    const called = await page.evaluate(() => window._printCalled);
                    if (called) {
                        console.log('✅ PASS: window.print() called\n');
                    } else {
                        console.log('❌ FAIL: window.print() not called\n');
                    }
                    break;
                }
            }
        }

        console.log('=== Tests Complete ===');

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await browser.close();
    }
})();
