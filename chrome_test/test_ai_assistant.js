const puppeteer = require('puppeteer');

(async () => {
    console.log('='.repeat(60));
    console.log('AI Assistant Integration Test');
    console.log('='.repeat(60));
    
    const browser = await puppeteer.launch({ 
        headless: true,  // Headless mode for server without X
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox',
            '--window-size=1920,1080'
        ] 
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Collect console messages
    page.on('console', msg => {
        const text = msg.text();
        console.log('📱 Console:', text);
    });
    
    console.log('\n1. Loading page...');
    await page.goto('http://localhost:1234/_new', { 
        waitUntil: 'networkidle2', 
        timeout: 15000 
    });
    
    // Force reload to clear cache
    await page.reload({ waitUntil: 'networkidle2' });
    
    await new Promise(r => setTimeout(r, 3000));
    console.log('✅ Page loaded');
    
    // Check AI Assistant initialization
    console.log('\n2. Checking AI Assistant initialization...');
    const aiInitialized = await page.evaluate(() => {
        return typeof window.aiAssistant !== 'undefined' && window.aiAssistant !== null;
    });
    console.log(aiInitialized ? '✅ AI Assistant initialized' : '❌ AI Assistant NOT initialized');
    
    // Check config loaded
    const configLoaded = await page.evaluate(() => {
        return window.aiAssistant?.configLoaded || false;
    });
    console.log(configLoaded ? '✅ Config loaded' : '❌ Config NOT loaded');
    
    // Click Sheet tab
    console.log('\n3. Opening Sheet tab...');
    await page.evaluate(() => {
        const tabs = document.querySelectorAll('.te_fullgrid_slider_div');
        for (let tab of tabs) {
            if (tab.textContent.includes('Sheet')) {
                tab.click();
                return;
            }
        }
    });
    
    await new Promise(r => setTimeout(r, 2000));
    console.log('✅ Sheet tab opened');
    
    // Check AI button exists
    console.log('\n4. Checking AI button...');
    const aiButton = await page.$('#sheet-ai-assistant');
    console.log(aiButton ? '✅ AI button found' : '❌ AI button NOT found');
    
    if (!aiButton) {
        console.log('\n❌ Test failed: AI button not found');
        await browser.close();
        process.exit(1);
    }
    
    // Take screenshot before clicking
    await page.screenshot({ path: '/root/ethercalc/chrome_test/ai_before_click.png' });
    console.log('📸 Screenshot saved: ai_before_click.png');
    
    // Click AI button
    console.log('\n5. Clicking AI button...');
    await page.click('#sheet-ai-assistant');
    await new Promise(r => setTimeout(r, 1000));
    
    // Check if sidebar opened
    const sidebarOpen = await page.evaluate(() => {
        const sidebar = document.querySelector('.ai-assistant-sidebar');
        return sidebar && sidebar.classList.contains('open');
    });
    console.log(sidebarOpen ? '✅ Sidebar opened' : '❌ Sidebar NOT opened');
    
    // Take screenshot of opened sidebar
    await page.screenshot({ path: '/root/ethercalc/chrome_test/ai_sidebar_open.png' });
    console.log('📸 Screenshot saved: ai_sidebar_open.png');
    
    if (!sidebarOpen) {
        console.log('\n❌ Test failed: Sidebar did not open');
        await browser.close();
        process.exit(1);
    }
    
    // Type a test prompt
    console.log('\n6. Testing AI request...');
    await page.waitForSelector('#ai-input-box', { visible: true });
    
    // Use evaluate to set value directly
    await page.evaluate(() => {
        const input = document.getElementById('ai-input-box');
        if (input) {
            input.value = 'Tính tổng từ A1 đến A10';
            console.log('[Test] Input value set:', input.value);
        }
    });
    
    await new Promise(r => setTimeout(r, 500));
    
    // Verify input value
    const inputValue = await page.evaluate(() => {
        return document.getElementById('ai-input-box')?.value;
    });
    console.log('📝 Input value:', inputValue);
    
    // Take screenshot with prompt
    await page.screenshot({ path: '/root/ethercalc/chrome_test/ai_with_prompt.png' });
    console.log('📸 Screenshot saved: ai_with_prompt.png');
    
    // Click Send button
    console.log('\n7. Sending request to AI...');
    await page.click('.ai-send-button');
    
    // Wait for response (max 10 seconds)
    console.log('⏳ Waiting for AI response...');
    const responseReceived = await page.waitForFunction(
        () => {
            const responseSection = document.getElementById('ai-response-section');
            const errorBox = document.getElementById('ai-error');
            return (responseSection && responseSection.classList.contains('visible')) ||
                   (errorBox && errorBox.classList.contains('visible'));
        },
        { timeout: 10000 }
    ).then(() => true).catch(() => false);
    
    if (!responseReceived) {
        console.log('❌ No response received within 10 seconds');
        await page.screenshot({ path: '/root/ethercalc/chrome_test/ai_timeout.png' });
        console.log('📸 Screenshot saved: ai_timeout.png');
    }
    
    // Check if response or error
    const result = await page.evaluate(() => {
        const errorBox = document.getElementById('ai-error');
        const responseSection = document.getElementById('ai-response-section');
        
        if (errorBox && errorBox.classList.contains('visible')) {
            return {
                success: false,
                error: errorBox.textContent
            };
        }
        
        if (responseSection && responseSection.classList.contains('visible')) {
            const formula = document.getElementById('ai-formula-code')?.textContent;
            const explanation = document.getElementById('ai-explanation-text')?.textContent;
            return {
                success: true,
                formula: formula,
                explanation: explanation
            };
        }
        
        return { success: false, error: 'Unknown state' };
    });
    
    console.log('\n8. Result:');
    if (result.success) {
        console.log('✅ SUCCESS! AI responded');
        console.log('📝 Formula:', result.formula);
        console.log('💡 Explanation:', result.explanation);
        
        // Take screenshot of response
        await page.screenshot({ path: '/root/ethercalc/chrome_test/ai_response_success.png' });
        console.log('📸 Screenshot saved: ai_response_success.png');
        
        // Test insert formula
        console.log('\n9. Testing formula insertion...');
        
        // Click on a cell first
        await page.evaluate(() => {
            const cell = document.querySelector('[id*="cell-A1"]') || 
                        document.querySelector('td.data');
            if (cell) cell.click();
        });
        
        await new Promise(r => setTimeout(r, 500));
        
        // Click insert button
        const insertBtn = await page.$('.ai-insert-button');
        if (insertBtn) {
            await insertBtn.click();
            await new Promise(r => setTimeout(r, 1000));
            console.log('✅ Insert button clicked');
            
            await page.screenshot({ path: '/root/ethercalc/chrome_test/ai_formula_inserted.png' });
            console.log('📸 Screenshot saved: ai_formula_inserted.png');
        }
        
    } else {
        console.log('❌ FAILED! Error:', result.error);
        await page.screenshot({ path: '/root/ethercalc/chrome_test/ai_error.png' });
        console.log('📸 Screenshot saved: ai_error.png');
    }
    
    console.log('\n' + '='.repeat(60));
    console.log(result.success ? '✅ TEST PASSED' : '❌ TEST FAILED');
    console.log('='.repeat(60));
    
    // Keep browser open for 5 seconds to see result
    console.log('\nKeeping browser open for 5 seconds...');
    await new Promise(r => setTimeout(r, 5000));
    
    await browser.close();
    process.exit(result.success ? 0 : 1);
})();
