const puppeteer = require('puppeteer');

async function testCellBorder() {
    console.log('[Test] Starting cell border test...');
    
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 800 });
        
        console.log('[Test] Navigating to EtherCalc...');
        await page.goto('http://localhost:1234/', { waitUntil: 'networkidle0' });
        
        // Wait for spreadsheet to load
        await page.waitForSelector('#te_fullgrid', { timeout: 10000 });
        console.log('[Test] Spreadsheet loaded');
        
        // Wait a bit for initialization
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Click on cell C2
        console.log('[Test] Clicking on cell C2...');
        const cellC2 = await page.$('#cell_C2');
        if (!cellC2) {
            console.error('[Test] Cell C2 not found!');
            await browser.close();
            return;
        }
        
        await cellC2.click();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Get computed styles of cell C2
        const cellInfo = await page.evaluate(() => {
            const cell = document.getElementById('cell_C2');
            if (!cell) return null;
            
            const computed = window.getComputedStyle(cell);
            const inline = cell.getAttribute('style');
            
            // Check editor state
            const editor = window.spreadsheet?.editor;
            const ecell = editor?.ecell;
            
            return {
                className: cell.className,
                inlineStyle: inline,
                computedBorder: computed.border,
                computedBorderTop: computed.borderTop,
                computedBorderRight: computed.borderRight,
                computedBorderBottom: computed.borderBottom,
                computedBorderLeft: computed.borderLeft,
                computedBoxShadow: computed.boxShadow,
                computedZIndex: computed.zIndex,
                computedPosition: computed.position,
                ecellCoord: ecell?.coord || 'not set',
                editorExists: !!editor
            };
        });
        
        console.log('\n[Test] Cell C2 Styles:');
        console.log('  Editor exists:', cellInfo.editorExists);
        console.log('  ECell coord:', cellInfo.ecellCoord);
        console.log('  Class:', cellInfo.className);
        console.log('  Inline Style:', cellInfo.inlineStyle);
        console.log('  Border:', cellInfo.computedBorder);
        console.log('  Border Top:', cellInfo.computedBorderTop);
        console.log('  Border Right:', cellInfo.computedBorderRight);
        console.log('  Border Bottom:', cellInfo.computedBorderBottom);
        console.log('  Border Left:', cellInfo.computedBorderLeft);
        console.log('  Box Shadow:', cellInfo.computedBoxShadow);
        console.log('  Z-Index:', cellInfo.computedZIndex);
        console.log('  Position:', cellInfo.computedPosition);
        
        // Check if border is blue and thick
        const hasBlueBorder = cellInfo.computedBorderTop && 
                             (cellInfo.computedBorderTop.includes('rgb(26, 115, 232)') || 
                              cellInfo.computedBorderTop.includes('#1a73e8'));
        const hasThickBorder = cellInfo.computedBorderTop && 
                              cellInfo.computedBorderTop.includes('3px');
        
        console.log('\n[Test] Validation:');
        console.log('  Has blue border:', hasBlueBorder);
        console.log('  Has thick border (3px):', hasThickBorder);
        
        if (hasBlueBorder && hasThickBorder) {
            console.log('\n✅ TEST PASSED - Cell has blue 3px border!');
        } else {
            console.log('\n❌ TEST FAILED - Cell border not as expected');
        }
        
        // Take screenshot
        await page.screenshot({ path: '/root/ethercalc/chrome_test/cell_border.png' });
        console.log('\n[Test] Screenshot saved to cell_border.png');
        
    } catch (error) {
        console.error('[Test] Error:', error);
    } finally {
        await browser.close();
        console.log('[Test] Test completed');
    }
}

testCellBorder();
