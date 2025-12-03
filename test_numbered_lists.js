const puppeteer = require('puppeteer');

(async () => {
    console.log('🧪 Testing Numbered Lists in Examples Dialog...\n');
    
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    try {
        console.log('1️⃣  Opening CoSheet...');
        await page.goto('http://localhost:1234', { waitUntil: 'networkidle2', timeout: 10000 });
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log('2️⃣  Clicking Examples button...');
        await page.click('#sheet-examples');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log('3️⃣  Selecting Bar Chart example...');
        await page.click('.example-item');
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Check for numbered lists (<ol>)
        const hasOrderedLists = await page.evaluate(() => {
            const preview = document.getElementById('examples-preview');
            if (!preview) return false;
            
            const olElements = preview.querySelectorAll('ol');
            const ulElements = preview.querySelectorAll('ul');
            
            return {
                orderedListCount: olElements.length,
                unorderedListCount: ulElements.length,
                hasOrderedLists: olElements.length > 0,
                hasUnorderedLists: ulElements.length > 0,
                firstOlHTML: olElements.length > 0 ? olElements[0].innerHTML.substring(0, 200) : '',
                firstUlHTML: ulElements.length > 0 ? ulElements[0].innerHTML.substring(0, 200) : ''
            };
        });
        
        console.log('\n📊 List Detection Results:');
        console.log('   Numbered lists (<ol>): ' + hasOrderedLists.orderedListCount);
        console.log('   Bullet lists (<ul>): ' + hasOrderedLists.unorderedListCount);
        console.log('   Has <ol> tags: ' + (hasOrderedLists.hasOrderedLists ? '✅ YES' : '❌ NO'));
        console.log('   Has <ul> tags: ' + (hasOrderedLists.hasUnorderedLists ? '✅ YES' : '❌ NO'));
        
        if (hasOrderedLists.firstOlHTML) {
            console.log('\n   First <ol> content preview:');
            console.log('   ' + hasOrderedLists.firstOlHTML.replace(/\n/g, ' '));
        }
        
        if (hasOrderedLists.firstUlHTML) {
            console.log('\n   First <ul> content preview:');
            console.log('   ' + hasOrderedLists.firstUlHTML.replace(/\n/g, ' '));
        }
        
        // Check if numbered list items are properly rendered with CSS
        const listStyles = await page.evaluate(() => {
            const preview = document.getElementById('examples-preview');
            if (!preview) return null;
            
            const olElement = preview.querySelector('ol');
            if (!olElement) return null;
            
            const styles = window.getComputedStyle(olElement);
            return {
                listStyleType: styles.listStyleType,
                paddingLeft: styles.paddingLeft
            };
        });
        
        if (listStyles) {
            console.log('\n   <ol> CSS styles:');
            console.log('   list-style-type: ' + listStyles.listStyleType);
            console.log('   padding-left: ' + listStyles.paddingLeft);
            console.log('   Style check: ' + (listStyles.listStyleType === 'decimal' ? '✅ CORRECT' : '⚠️  INCORRECT'));
        }
        
        console.log('\n🎯 Final Assessment:');
        const success = hasOrderedLists.hasOrderedLists && hasOrderedLists.hasUnorderedLists;
        console.log(success ? '✅ Numbered lists are properly rendered!' : '❌ Numbered lists not detected!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        await browser.close();
    }
})();
