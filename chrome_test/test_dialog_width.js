const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ 
        headless: true, 
        args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });
    
    const page = await browser.newPage();
    
    console.log('Testing dialog width at different viewport sizes...\n');
    
    // Test with various viewport widths
    const viewports = [
        { width: 800, height: 600, name: 'Small (800px)' },
        { width: 1280, height: 720, name: 'Medium (1280px)' },
        { width: 1920, height: 1080, name: 'Large (1920px)' },
        { width: 2560, height: 1440, name: 'XL (2560px)' }
    ];
    
    for (const viewport of viewports) {
        console.log(`--- ${viewport.name} ---`);
        
        await page.setViewport(viewport);
        await page.goto('http://localhost:1234/test_width', { 
            waitUntil: 'networkidle0', 
            timeout: 30000 
        });
        
        await page.waitForFunction(() => window.SocialCalc && window.SheetLayout, { timeout: 10000 });
        
        // Click Sheet tab
        await page.evaluate(() => {
            const sheetTab = document.querySelector('[id$="-sheettab"]');
            if (sheetTab) sheetTab.click();
        });
        
        await new Promise(r => setTimeout(r, 300));
        
        // Open Save dialog
        await page.evaluate(() => {
            window.SheetLayout.saveFile();
        });
        
        await new Promise(r => setTimeout(r, 800));
        
        // Measure dialog width
        const measurements = await page.evaluate(() => {
            const vexContent = document.querySelector('.vex-content');
            const innerDiv = document.querySelector('.vex-content > div > div');
            
            if (!vexContent) return null;
            
            return {
                vexContentWidth: vexContent.offsetWidth,
                vexContentComputedWidth: window.getComputedStyle(vexContent).width,
                vexContentMaxWidth: window.getComputedStyle(vexContent).maxWidth,
                innerDivWidth: innerDiv ? innerDiv.offsetWidth : null,
                dialogExists: true
            };
        });
        
        if (measurements) {
            console.log(`  Viewport: ${viewport.width}px`);
            console.log(`  .vex-content width: ${measurements.vexContentWidth}px`);
            console.log(`  .vex-content max-width: ${measurements.vexContentMaxWidth}`);
            console.log(`  Inner div width: ${measurements.innerDivWidth}px`);
            
            const isFixed = measurements.vexContentWidth === 300;
            console.log(`  Fixed width: ${isFixed ? '✅ YES' : '❌ NO (stretching!)'}`);
        } else {
            console.log('  ❌ Dialog not found');
        }
        
        // Close dialog
        await page.evaluate(() => {
            if (window.vex) vex.closeAll();
        });
        
        await new Promise(r => setTimeout(r, 300));
        console.log('');
    }
    
    // Take screenshot at 1920px
    await page.setViewport({ width: 1920, height: 1080 });
    await page.goto('http://localhost:1234/test_width_final', { 
        waitUntil: 'networkidle0', 
        timeout: 30000 
    });
    
    await page.waitForFunction(() => window.SocialCalc && window.SheetLayout, { timeout: 10000 });
    
    await page.evaluate(() => {
        const sheetTab = document.querySelector('[id$="-sheettab"]');
        if (sheetTab) sheetTab.click();
    });
    
    await new Promise(r => setTimeout(r, 500));
    
    await page.evaluate(() => {
        window.SheetLayout.saveFile();
    });
    
    await new Promise(r => setTimeout(r, 1000));
    
    await page.screenshot({ path: '/root/ethercalc/chrome_test/dialog_width_1920.png', fullPage: false });
    console.log('📸 Screenshot at 1920px: dialog_width_1920.png');
    
    await browser.close();
})();
