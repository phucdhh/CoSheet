# Manual Test Plan for In-Cell Editing

## Test on: http://localhost:1234/

### Test 1: Type to start editing
1. Open http://localhost:1234/
2. Click on any cell (e.g., B2)
3. Start typing "Hello"
4. **Expected**: Blue-bordered editor appears IN the cell
5. **Expected**: Formula bar shows "Hello" too

### Test 2: Double-click to edit
1. Double-click on another cell (e.g., C3)
2. **Expected**: Blue-bordered editor appears IN the cell
3. Type "World"
4. **Expected**: Both in-cell and formula bar show "World"

### Test 3: F2 to edit
1. Click cell D4
2. Press F2
3. **Expected**: Blue-bordered editor appears IN the cell
4. Type "Test"
5. **Expected**: Both editors sync

### Test 4: Enter to finish
1. While editing, press Enter
2. **Expected**: Editor closes, cell shows the value
3. **Expected**: Selection moves down

### Test 5: Escape to cancel
1. Double-click a cell
2. Type something
3. Press Escape
4. **Expected**: Editor closes, changes discarded

### Test 6: Formula bar sync
1. Double-click a cell
2. Type in formula bar
3. **Expected**: In-cell editor updates too
4. Type in cell editor
5. **Expected**: Formula bar updates too

## Success Criteria
- ✓ Blue editor box appears over cell
- ✓ Typing works in cell
- ✓ Formula bar syncs both ways
- ✓ Enter/Escape/Tab work correctly

Run these tests in Chrome/Firefox and report results!
