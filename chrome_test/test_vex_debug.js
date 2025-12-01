const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ 
        headless: true, 
        args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });
    
    const page = await browser.newPage();
    
    console.log('Loading page...');
    await page.goto('http://localhost:1234/test_vex', { 
        waitUntil: 'networkidle0', 
        timeout: 30000 
    });
    
    await page.waitForFunction(() => window.SocialCalc && window.vex, { timeout: 10000 });
    console.log('✅ Page and vex ready');
    
    // Test simple vex alert
    console.log('\n--- Test 1: Simple vex.dialog.alert ---');
    await page.evaluate(() => {
        vex.dialog.alert('This is a simple alert');
    });
    
    await new Promise(r => setTimeout(r, 1000));
    
    let result = await page.evaluate(() => {
        const dialog = document.querySelector('.vex-content');
        return {
            exists: !!dialog,
            text: dialog?.innerText,
            html: dialog?.innerHTML.substring(0, 500)
        };
    });
    
    console.log('Simple alert result:', result);
    
    // Close
    await page.evaluate(() => vex.closeAll());
    await new Promise(r => setTimeout(r, 500));
    
    // Test unsafeMessage
    console.log('\n--- Test 2: vex.dialog.open with unsafeMessage ---');
    await page.evaluate(() => {
        vex.dialog.open({
            unsafeMessage: '<div style="color:red; font-size:20px;">This is <strong>unsafe</strong> HTML</div>',
            buttons: [],
            callback: function(){}
        });
    });
    
    await new Promise(r => setTimeout(r, 1000));
    
    result = await page.evaluate(() => {
        const dialog = document.querySelector('.vex-content');
        return {
            exists: !!dialog,
            text: dialog?.innerText,
            html: dialog?.innerHTML.substring(0, 500)
        };
    });
    
    console.log('unsafeMessage result:', result);
    
    // Close
    await page.evaluate(() => vex.closeAll());
    await new Promise(r => setTimeout(r, 500));
    
    // Test with button in unsafeMessage
    console.log('\n--- Test 3: unsafeMessage with button ---');
    await page.evaluate(() => {
        vex.dialog.open({
            unsafeMessage: '<div><button class="test-btn" style="background:red; color:white; padding:20px;">Click Me</button></div>',
            buttons: [],
            callback: function(){}
        });
    });
    
    await new Promise(r => setTimeout(r, 1000));
    
    result = await page.evaluate(() => {
        const dialog = document.querySelector('.vex-content');
        const btn = document.querySelector('.test-btn');
        return {
            exists: !!dialog,
            text: dialog?.innerText,
            hasButton: !!btn,
            buttonText: btn?.textContent,
            html: dialog?.innerHTML.substring(0, 500)
        };
    });
    
    console.log('Button in unsafeMessage result:', result);
    
    await page.screenshot({ path: '/root/ethercalc/chrome_test/vex_test.png', fullPage: true });
    console.log('\n📸 Screenshot: vex_test.png');
    
    await browser.close();
})();
