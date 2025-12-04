const puppeteer = require('puppeteer');

(async () => {
    console.log('🧪 Testing Fill Pattern - Multiple Scenarios...\n');
    
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    try {
        console.log('Opening CoSheet...');
        await page.goto('http://localhost:1234', { waitUntil: 'networkidle2', timeout: 10000 });
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Test 1: Increment by 1 (1, 2, 3 → 4, 5, 6)
        console.log('\n📋 Test 1: Increment by 1 (1,2,3 → 4,5,6,7)');
        await page.evaluate(() => {
            var spreadsheet = SocialCalc.GetSpreadsheetControlObject();
            spreadsheet.editor.EditorScheduleSheetCommands('set A1 value n 1\nset A2 value n 2\nset A3 value n 3', true, false);
            spreadsheet.editor.ecell = {coord: 'A1'};
            spreadsheet.editor.range = {hasrange: true};
            spreadsheet.editor.range2 = {hasrange: true, top: 1, bottom: 3, left: 1, right: 1};
            spreadsheet.ExecuteCommand('filldown A1:A7 all', '');
        });
        await new Promise(resolve => setTimeout(resolve, 500));
        
        var result1 = await page.evaluate(() => {
            var sheet = SocialCalc.GetSpreadsheetControlObject().context.sheetobj;
            return {
                A4: sheet.cells['A4'] ? sheet.cells['A4'].datavalue : null,
                A7: sheet.cells['A7'] ? sheet.cells['A7'].datavalue : null
            };
        });
        console.log('   A4 =', result1.A4, result1.A4 == 4 ? '✅' : '❌');
        console.log('   A7 =', result1.A7, result1.A7 == 7 ? '✅' : '❌');
        
        // Test 2: Increment by 2 (2, 4, 6 → 8, 10)
        console.log('\n📋 Test 2: Increment by 2 (2,4,6 → 8,10)');
        await page.evaluate(() => {
            var spreadsheet = SocialCalc.GetSpreadsheetControlObject();
            spreadsheet.editor.EditorScheduleSheetCommands('set B1 value n 2\nset B2 value n 4\nset B3 value n 6', true, false);
            spreadsheet.editor.ecell = {coord: 'B1'};
            spreadsheet.editor.range2 = {hasrange: true, top: 1, bottom: 3, left: 2, right: 2};
            spreadsheet.ExecuteCommand('filldown B1:B5 all', '');
        });
        await new Promise(resolve => setTimeout(resolve, 500));
        
        var result2 = await page.evaluate(() => {
            var sheet = SocialCalc.GetSpreadsheetControlObject().context.sheetobj;
            return {
                B4: sheet.cells['B4'] ? sheet.cells['B4'].datavalue : null,
                B5: sheet.cells['B5'] ? sheet.cells['B5'].datavalue : null
            };
        });
        console.log('   B4 =', result2.B4, result2.B4 == 8 ? '✅' : '❌');
        console.log('   B5 =', result2.B5, result2.B5 == 10 ? '✅' : '❌');
        
        // Test 3: Decrement (10, 9, 8 → 7, 6)
        console.log('\n📋 Test 3: Decrement -1 (10,9,8 → 7,6,5)');
        await page.evaluate(() => {
            var spreadsheet = SocialCalc.GetSpreadsheetControlObject();
            spreadsheet.editor.EditorScheduleSheetCommands('set C1 value n 10\nset C2 value n 9\nset C3 value n 8', true, false);
            spreadsheet.editor.ecell = {coord: 'C1'};
            spreadsheet.editor.range2 = {hasrange: true, top: 1, bottom: 3, left: 3, right: 3};
            spreadsheet.ExecuteCommand('filldown C1:C6 all', '');
        });
        await new Promise(resolve => setTimeout(resolve, 500));
        
        var result3 = await page.evaluate(() => {
            var sheet = SocialCalc.GetSpreadsheetControlObject().context.sheetobj;
            return {
                C4: sheet.cells['C4'] ? sheet.cells['C4'].datavalue : null,
                C5: sheet.cells['C5'] ? sheet.cells['C5'].datavalue : null,
                C6: sheet.cells['C6'] ? sheet.cells['C6'].datavalue : null
            };
        });
        console.log('   C4 =', result3.C4, result3.C4 == 7 ? '✅' : '❌');
        console.log('   C5 =', result3.C5, result3.C5 == 6 ? '✅' : '❌');
        console.log('   C6 =', result3.C6, result3.C6 == 5 ? '✅' : '❌');
        
        // Test 4: Only 2 cells (5, 10 → 15, 20)
        console.log('\n📋 Test 4: Two cells pattern (5,10 → 15,20)');
        await page.evaluate(() => {
            var spreadsheet = SocialCalc.GetSpreadsheetControlObject();
            spreadsheet.editor.EditorScheduleSheetCommands('set D1 value n 5\nset D2 value n 10', true, false);
            spreadsheet.editor.ecell = {coord: 'D1'};
            spreadsheet.editor.range2 = {hasrange: true, top: 1, bottom: 2, left: 4, right: 4};
            spreadsheet.ExecuteCommand('filldown D1:D4 all', '');
        });
        await new Promise(resolve => setTimeout(resolve, 500));
        
        var result4 = await page.evaluate(() => {
            var sheet = SocialCalc.GetSpreadsheetControlObject().context.sheetobj;
            return {
                D3: sheet.cells['D3'] ? sheet.cells['D3'].datavalue : null,
                D4: sheet.cells['D4'] ? sheet.cells['D4'].datavalue : null
            };
        });
        console.log('   D3 =', result4.D3, result4.D3 == 15 ? '✅' : '❌');
        console.log('   D4 =', result4.D4, result4.D4 == 20 ? '✅' : '❌');
        
        // Summary
        const allPassed = 
            result1.A4 == 4 && result1.A7 == 7 &&
            result2.B4 == 8 && result2.B5 == 10 &&
            result3.C4 == 7 && result3.C5 == 6 && result3.C6 == 5 &&
            result4.D3 == 15 && result4.D4 == 20;
        
        console.log('\n🎯 Overall: ' + (allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'));
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        await browser.close();
    }
})();
