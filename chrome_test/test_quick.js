const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ 
        headless: true, 
        args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });
    
    const page = await browser.newPage();
    
    console.log('Loading page...');
    await page.goto('http://localhost:1234/test', { 
        waitUntil: 'networkidle2', 
        timeout: 15000 
    });
    
    console.log('Waiting for UI...');
    await new Promise(r => setTimeout(r, 4000));
    
    console.log('\nChecking buttons...');
    const saveBtn = await page.$('#sheet-save');
    const exportBtn = await page.$('#sheet-export');
    const fileInput = await page.$('#sheet-file-input');
    
    console.log('Save button:', saveBtn ? '✅ FOUND' : '❌ NOT FOUND');
    console.log('Export button:', exportBtn ? '✅ FOUND' : '❌ NOT FOUND');
    console.log('File input:', fileInput ? '✅ FOUND' : '❌ NOT FOUND');
    
    if (saveBtn) {
        console.log('\n=== Testing Save Dialog ===');
        await saveBtn.click();
        await new Promise(r => setTimeout(r, 1500));
        
        const dialog = await page.$('.vex-content');
        if (dialog) {
            const box = await dialog.boundingBox();
            console.log('Width:', Math.round(box.width), 'px');
            console.log('Status:', box.width <= 400 ? '✅ COMPACT' : '❌ TOO WIDE');
            
            // Check CANCEL button styling
            const cancelBtn = await page.$('.vex-dialog-button-secondary');
            if (cancelBtn) {
                const classes = await page.evaluate(el => el.className, cancelBtn);
                console.log('CANCEL classes:', classes);
                console.log('Primary styled:', classes.includes('vex-dialog-button-primary') ? '✅ YES' : '❌ NO');
                await cancelBtn.click();
            }
        } else {
            console.log('❌ Dialog not shown');
        }
    }
    
    if (exportBtn) {
        console.log('\n=== Testing Export Dialog ===');
        await new Promise(r => setTimeout(r, 500));
        await exportBtn.click();
        await new Promise(r => setTimeout(r, 1500));
        
        const dialog = await page.$('.vex-content');
        if (dialog) {
            const box = await dialog.boundingBox();
            console.log('Width:', Math.round(box.width), 'px');
            console.log('Status:', box.width <= 420 ? '✅ COMPACT' : '❌ TOO WIDE');
            
            // Check PDF button text
            const buttons = await page.$$('.vex-dialog-button');
            for (const btn of buttons) {
                const text = await page.evaluate(el => el.textContent, btn);
                if (text.includes('PDF')) {
                    console.log('PDF button text:', text);
                    console.log('No "Coming Soon":', !text.includes('Coming Soon') ? '✅ YES' : '❌ NO');
                    break;
                }
            }
        } else {
            console.log('❌ Dialog not shown');
        }
    }
    
    await browser.close();
    console.log('\n=== Test Complete ===');
})().catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
});
