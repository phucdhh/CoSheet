const puppeteer = require('puppeteer');

(async () => {
    console.log('🎨 Testing New Color Scheme...\n');
    
    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 800 });
    
    try {
        console.log('Opening CoSheet...');
        await page.goto('http://localhost:1234', { waitUntil: 'networkidle2', timeout: 10000 });
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        console.log('✅ CoSheet loaded with new color scheme!');
        console.log('\n📸 Taking screenshot...');
        await page.screenshot({ path: '/root/ethercalc/screenshot_new_colors.png', fullPage: false });
        console.log('✅ Screenshot saved to: /root/ethercalc/screenshot_new_colors.png');
        
        console.log('\n🎨 Color Scheme Applied:');
        console.log('   - Headers: #f8f9fa (light gray)');
        console.log('   - Selected headers: #e8f0fe (light blue)');
        console.log('   - Active cell border: #1a73e8(Google blue) - BOLD');
        console.log('   - Grid lines: #e0e0e0 (subtle gray)');
        console.log('   - Background: white (no color change on selection)');
        
        console.log('\n⏳ Browser will stay open for 10 seconds for manual inspection...');
        await new Promise(resolve => setTimeout(resolve, 10000));
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        await browser.close();
        console.log('\n✨ Test complete!');
    }
})();
