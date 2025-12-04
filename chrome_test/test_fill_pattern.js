const puppeteer = require('puppeteer');

(async () => {
    console.log('🧪 Testing Fill Pattern Feature...\n');
    
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    try {
        console.log('1️⃣  Opening CoSheet...');
        await page.goto('http://localhost:1234', { waitUntil: 'networkidle2', timeout: 10000 });
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        console.log('2️⃣  Setting up test data (A1=1, A2=2, A3=3)...');
        await page.evaluate(() => {
            if (typeof SocialCalc === 'undefined') throw new Error('SocialCalc not loaded');
            
            var spreadsheet = SocialCalc.GetSpreadsheetControlObject();
            if (!spreadsheet || !spreadsheet.editor) throw new Error('No editor');
            
            // Set values
            spreadsheet.editor.EditorScheduleSheetCommands('set A1 value n 1', true, false);
            spreadsheet.editor.EditorScheduleSheetCommands('set A2 value n 2', true, false);
            spreadsheet.editor.EditorScheduleSheetCommands('set A3 value n 3', true, false);
        });
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        console.log('3️⃣  Selecting range A1:A3 and filling down to A7...');
        await page.evaluate(() => {
            var spreadsheet = SocialCalc.GetSpreadsheetControlObject();
            var editor = spreadsheet.editor;
            
            // Set ecell and range
            editor.ecell = {coord: 'A1'};
            editor.range = {hasrange: true};
            editor.range2 = {
                hasrange: true,
                top: 1,
                bottom: 3,
                left: 1,
                right: 1
            };
            
            // Execute filldown command for A1:A7
            spreadsheet.ExecuteCommand('filldown A1:A7 all', '');
        });
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log('4️⃣  Checking filled values...');
        const values = await page.evaluate(() => {
            var sheet = SocialCalc.GetSpreadsheetControlObject().context.sheetobj;
            var results = {};
            for (var i = 1; i <= 7; i++) {
                var cell = sheet.cells['A' + i];
                results['A' + i] = cell ? cell.datavalue : null;
            }
            return results;
        });
        
        console.log('\n📊 Fill Results:');
        console.log('   A1:', values.A1, '(expected: 1)');
        console.log('   A2:', values.A2, '(expected: 2)');
        console.log('   A3:', values.A3, '(expected: 3)');
        console.log('   A4:', values.A4, '(expected: 4)');
        console.log('   A5:', values.A5, '(expected: 5)');
        console.log('   A6:', values.A6, '(expected: 6)');
        console.log('   A7:', values.A7, '(expected: 7)');
        
        // Check if pattern is correct
        const isCorrect = 
            values.A1 == 1 &&
            values.A2 == 2 &&
            values.A3 == 3 &&
            values.A4 == 4 &&
            values.A5 == 5 &&
            values.A6 == 6 &&
            values.A7 == 7;
        
        console.log('\n🎯 Pattern Detection:');
        console.log('   Increment detected: ' + (values.A4 == 4 ? '✅ YES (+1)' : '❌ NO'));
        console.log('   Sequential fill: ' + (isCorrect ? '✅ CORRECT' : '❌ WRONG'));
        
        console.log('\n🎉 Final Result: ' + (isCorrect ? '✅ FILL WORKS LIKE EXCEL!' : '❌ FILL STILL BROKEN'));
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        await browser.close();
    }
})();
