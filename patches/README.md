# SocialCalc Patches

This directory contains patched versions of SocialCalc library files to fix critical bugs.

## Patches Applied

### 1. `socialcalcspreadsheetcontrol.js.patched`
**Location:** `node_modules/socialcalc/js/socialcalcspreadsheetcontrol.js`  
**Line:** 2952  
**Function:** `SocialCalc.SpreadsheetControlSortLoad`

**Issue:** Function tries to access `document` object in Node.js server context, causing crashes when loading saved spreadsheets with sort settings.

**Fix:** Added check at start of function:
```javascript
if (typeof document === 'undefined') {
   var parts = line.split(":");
   var spreadsheet = SocialCalc.GetSpreadsheetControlObject();
   if (spreadsheet) {
      spreadsheet.sortrange = SocialCalc.decodeFromSave(parts[1]);
   }
   return;
}
```

### 2. `SocialCalc.js.patched`
**Location:** `node_modules/socialcalc/dist/SocialCalc.js`  
**Line:** 25968  
**Function:** Same as above in concatenated dist file

## How to Apply

### Automatic (Recommended)
The patches are automatically applied after `npm install` via the `postinstall` script in `package.json`.

### Manual
```bash
bash scripts/apply-patches.sh
```

## When Deploying to New Server

1. Clone repository
2. Run `npm install` (patches auto-apply via postinstall)
3. Verify patch applied:
```bash
grep -A5 "typeof document === 'undefined'" node_modules/socialcalc/js/socialcalcspreadsheetcontrol.js
```

## Why These Patches Are Needed

EtherCalc runs SocialCalc code in both browser (client) and Node.js (server) contexts. When loading saved spreadsheets, the server needs to parse settings including sort data. The original SocialCalc code assumes a browser environment and tries to update DOM elements, which don't exist in Node.js.

Without this patch:
- Server crashes with: `ReferenceError: document is not defined`
- Saved data cannot be loaded
- Users lose their work after page refresh

With this patch:
- ✅ Server safely skips DOM updates in Node.js
- ✅ Data loads correctly
- ✅ Sort range data preserved
- ✅ No crashes

## Reporting Upstream

This is a bug in the SocialCalc library. Consider reporting to:
- https://github.com/audreyt/socialcalc

Until fixed upstream, these patches must be maintained.
