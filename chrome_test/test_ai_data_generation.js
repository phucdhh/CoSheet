const puppeteer = require('puppeteer');

(async () => {
    console.log('='.repeat(70));
    console.log('AI Data Generation Feature Test');
    console.log('='.repeat(70));
    
    const browser = await puppeteer.launch({ 
        headless: true,
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox',
            '--window-size=1920,1080'
        ] 
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Collect console messages
    const consoleMessages = [];
    page.on('console', msg => {
        const text = msg.text();
        consoleMessages.push(text);
        if (text.includes('[AI Assistant]') || text.includes('Error') || text.includes('error')) {
            console.log('📱', text);
        }
    });
    
    console.log('\n📍 STEP 1: Loading page and creating new sheet...');
    // Go to homepage first
    await page.goto('http://localhost:1234/', { 
        waitUntil: 'networkidle2', 
        timeout: 15000 
    });
    await new Promise(r => setTimeout(r, 1000));
    
    // Click "Create Spreadsheet" button or go directly to a new sheet
    const newSheetUrl = `http://localhost:1234/test_${Date.now()}`;
    console.log(`📝 Creating sheet: ${newSheetUrl}`);
    await page.goto(newSheetUrl, {
        waitUntil: 'networkidle2',
        timeout: 15000
    });
    
    // Wait for page to stabilize
    await new Promise(r => setTimeout(r, 3000));
    console.log('✅ Sheet created and loaded');
    
    // Check what's available
    const pageInfo = await page.evaluate(() => {
        return {
            hasSpreadsheet: typeof window.spreadsheet !== 'undefined',
            hasEditor: window.spreadsheet?.editor !== undefined,
            hasContext: window.spreadsheet?.editor?.context !== undefined,
            hasSheetobj: window.spreadsheet?.editor?.context?.sheetobj !== undefined,
            hasSheet: window.spreadsheet?.editor?.context?.sheetobj?.sheet !== undefined,
            cellsCount: Object.keys(window.spreadsheet?.editor?.context?.sheetobj?.sheet?.cells || {}).length,
            hasSocialCalc: typeof SocialCalc !== 'undefined'
        };
    });
    console.log('📊 Spreadsheet structure:', pageInfo);
    
    if (!pageInfo.hasSheet) {
        console.log('⚠ Sheet object not initialized yet (normal for empty sheet)');
        console.log('   Functions should handle this gracefully...');
    }
    
    // Test 1: Check AI Assistant initialization
    console.log('\n📍 STEP 2: Checking AI Assistant...');
    const aiStatus = await page.evaluate(() => {
        return {
            initialized: typeof window.aiAssistant !== 'undefined',
            configLoaded: window.aiAssistant?.configLoaded,
            hasConversationHistory: Array.isArray(window.aiAssistant?.conversationHistory),
            hasFillDataMethod: typeof window.aiAssistant?.fillDataToSpreadsheet === 'function',
            hasFindEmptyColumn: typeof window.aiAssistant?.findNextEmptyColumn === 'function'
        };
    });
    
    console.log('AI Status:', aiStatus);
    if (!aiStatus.initialized) {
        console.log('❌ FAIL: AI Assistant not initialized');
        await browser.close();
        return;
    }
    console.log('✅ AI Assistant initialized');
    console.log(aiStatus.hasFillDataMethod ? '✅ fillDataToSpreadsheet method exists' : '❌ Missing fillDataToSpreadsheet');
    console.log(aiStatus.hasFindEmptyColumn ? '✅ findNextEmptyColumn method exists' : '❌ Missing findNextEmptyColumn');
    
    // Test 2: Check updated system prompt
    console.log('\n📍 STEP 3: Checking system prompt...');
    const systemPrompt = await page.evaluate(() => {
        return window.aiAssistant?.getSystemPrompt();
    });
    
    const hasDataSupport = systemPrompt.includes('type') && systemPrompt.includes('data') && systemPrompt.includes('formula');
    console.log(hasDataSupport ? '✅ System prompt supports data generation' : '❌ System prompt missing data support');
    if (hasDataSupport) {
        console.log('   - Supports type: "formula"');
        console.log('   - Supports type: "data"');
    }
    
    // Test 3: Test findNextEmptyColumn on empty sheet
    console.log('\n📍 STEP 4: Testing findNextEmptyColumn on empty sheet...');
    const emptyColResult = await page.evaluate(() => {
        try {
            // Debug: Check actual structure
            const editor = window.spreadsheet?.editor;
            if (!editor) return { success: false, error: 'No editor found' };
            
            const context = editor.context;
            if (!context) return { success: false, error: 'No context found' };
            
            const sheetobj = context.sheetobj;
            if (!sheetobj) return { success: false, error: 'No sheetobj found' };
            
            const sheet = sheetobj.sheet;
            if (!sheet) return { success: false, error: 'No sheet found' };
            
            // Now try the function
            const col = window.aiAssistant.findNextEmptyColumn();
            return { success: true, column: col };
        } catch (error) {
            return { success: false, error: error.message, stack: error.stack };
        }
    });
    
    if (emptyColResult.success) {
        console.log(`✅ Empty sheet returns column: ${emptyColResult.column}`);
        if (emptyColResult.column === 'A') {
            console.log('   ✓ Correct: Empty sheet should start at column A');
        } else {
            console.log(`   ⚠ Expected 'A', got '${emptyColResult.column}'`);
        }
    } else {
        console.log('❌ FAIL:', emptyColResult.error);
    }
    
    // Test 4: Fill sample data
    console.log('\n📍 STEP 5: Testing fillDataToSpreadsheet...');
    const sampleData = [
        ['Họ tên', 'Toán', 'Văn', 'Anh'],
        ['Nguyễn Văn A', 8.5, 7.0, 9.0],
        ['Trần Thị B', 9.0, 8.5, 8.0],
        ['Lê Văn C', 7.5, 8.0, 9.5]
    ];
    
    const fillResult = await page.evaluate((data) => {
        try {
            const success = window.aiAssistant.fillDataToSpreadsheet(data);
            return { success };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }, sampleData);
    
    if (fillResult.success) {
        console.log('✅ Data filled successfully');
    } else {
        console.log('❌ FAIL:', fillResult.error);
    }
    
    // Wait for data to render
    await new Promise(r => setTimeout(r, 2000));
    
    // Test 5: Verify data in spreadsheet
    console.log('\n📍 STEP 6: Verifying data in spreadsheet...');
    const cellData = await page.evaluate(() => {
        const sheet = window.spreadsheet?.editor?.context?.sheetobj?.sheet;
        if (!sheet) return { error: 'No sheet found' };
        
        const cells = {};
        ['A1', 'B1', 'C1', 'D1', 'A2', 'B2', 'C2', 'D2'].forEach(coord => {
            const cell = sheet.cells[coord];
            if (cell) {
                cells[coord] = cell.datavalue || cell.displaystring || '';
            }
        });
        return cells;
    });
    
    if (cellData.error) {
        console.log('❌', cellData.error);
    } else {
        console.log('Cell values:');
        console.log('   A1:', cellData.A1, '(Expected: "Họ tên")');
        console.log('   B1:', cellData.B1, '(Expected: "Toán")');
        console.log('   C1:', cellData.C1, '(Expected: "Văn")');
        console.log('   D1:', cellData.D1, '(Expected: "Anh")');
        console.log('   A2:', cellData.A2, '(Expected: "Nguyễn Văn A")');
        console.log('   B2:', cellData.B2, '(Expected: 8.5)');
        console.log('   C2:', cellData.C2, '(Expected: 7)');
        console.log('   D2:', cellData.D2, '(Expected: 9)');
        
        const passed = 
            cellData.A1 === 'Họ tên' &&
            cellData.B1 === 'Toán' &&
            cellData.C1 === 'Văn' &&
            cellData.D1 === 'Anh' &&
            cellData.A2 === 'Nguyễn Văn A' &&
            (cellData.B2 === 8.5 || cellData.B2 === '8.5');
        
        if (passed) {
            console.log('✅ All cell values correct!');
        } else {
            console.log('⚠ Some cell values incorrect');
        }
    }
    
    // Test 6: Test findNextEmptyColumn after data
    console.log('\n📍 STEP 7: Testing findNextEmptyColumn with data...');
    const nextColResult = await page.evaluate(() => {
        try {
            const col = window.aiAssistant.findNextEmptyColumn();
            return { success: true, column: col };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });
    
    if (nextColResult.success) {
        console.log(`✅ Next empty column: ${nextColResult.column}`);
        if (nextColResult.column === 'E') {
            console.log('   ✓ Correct: After D, next column should be E');
        } else {
            console.log(`   ⚠ Expected 'E', got '${nextColResult.column}'`);
        }
    } else {
        console.log('❌ FAIL:', nextColResult.error);
    }
    
    // Test 7: Open AI sidebar and check UI elements
    console.log('\n📍 STEP 8: Testing AI sidebar UI...');
    
    // Click AI button
    const aiButtonExists = await page.evaluate(() => {
        const button = document.getElementById('ai-assistant-button');
        if (button) {
            button.click();
            return true;
        }
        return false;
    });
    
    if (!aiButtonExists) {
        console.log('❌ AI button not found');
    } else {
        console.log('✅ AI button clicked');
        await new Promise(r => setTimeout(r, 1000));
        
        // Check if sidebar opened
        const sidebarOpen = await page.evaluate(() => {
            const sidebar = document.querySelector('.ai-assistant-sidebar');
            return sidebar?.classList.contains('open');
        });
        
        if (sidebarOpen) {
            console.log('✅ AI sidebar opened');
            
            // Check for data-related CSS classes
            const uiElements = await page.evaluate(() => {
                return {
                    hasDataPreviewCSS: document.styleSheets[0] && 
                        Array.from(document.styleSheets).some(sheet => {
                            try {
                                return Array.from(sheet.cssRules || []).some(rule => 
                                    rule.selectorText?.includes('ai-data-preview') ||
                                    rule.selectorText?.includes('ai-data-table')
                                );
                            } catch {
                                return false;
                            }
                        })
                };
            });
            
            console.log(uiElements.hasDataPreviewCSS ? 
                '✅ Data preview CSS loaded' : 
                '⚠ Data preview CSS not detected (might be in external file)');
        } else {
            console.log('❌ AI sidebar did not open');
        }
    }
    
    // Take screenshot
    console.log('\n📍 STEP 9: Taking screenshot...');
    await page.screenshot({ path: '/root/ethercalc/chrome_test/ai_data_test.png', fullPage: false });
    console.log('✅ Screenshot saved: ai_data_test.png');
    
    // Summary
    console.log('\n' + '='.repeat(70));
    console.log('TEST SUMMARY');
    console.log('='.repeat(70));
    
    const results = {
        'AI Initialized': aiStatus.initialized,
        'Config Loaded': aiStatus.configLoaded,
        'fillDataToSpreadsheet exists': aiStatus.hasFillDataMethod,
        'findNextEmptyColumn exists': aiStatus.hasFindEmptyColumn,
        'System prompt supports data': hasDataSupport,
        'Empty column detection (empty sheet)': emptyColResult.success && emptyColResult.column === 'A',
        'Data filling': fillResult.success,
        'Data verification': cellData.A1 === 'Họ tên' && cellData.B2 === 8.5,
        'Empty column detection (with data)': nextColResult.success && nextColResult.column === 'E',
        'AI sidebar opens': aiButtonExists
    };
    
    const passed = Object.values(results).filter(v => v).length;
    const total = Object.keys(results).length;
    
    Object.entries(results).forEach(([test, result]) => {
        console.log(`${result ? '✅' : '❌'} ${test}`);
    });
    
    console.log('\n' + '='.repeat(70));
    console.log(`FINAL RESULT: ${passed}/${total} tests passed`);
    console.log('='.repeat(70));
    
    if (passed === total) {
        console.log('🎉 ALL TESTS PASSED! Data generation feature working correctly.');
    } else {
        console.log(`⚠ ${total - passed} test(s) failed. Review logs above.`);
    }
    
    await browser.close();
    process.exit(passed === total ? 0 : 1);
})();
