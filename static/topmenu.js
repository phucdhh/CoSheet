// SocialCalc Tab Integration for Sheet and Help
// This script injects "Sheet" and "Help" tabs into the SocialCalc interface

(function () {
    var checkExist = setInterval(function () {
        if (typeof SocialCalc !== 'undefined' && SocialCalc.GetSpreadsheetControlObject) {
            var spreadsheet = SocialCalc.GetSpreadsheetControlObject();
            if (spreadsheet && spreadsheet.tabs) {
                clearInterval(checkExist);
                initCustomTabs(spreadsheet);
            }
        }
    }, 100);

    function initCustomTabs(spreadsheet) {
        var idPrefix = spreadsheet.idPrefix;

        // Inject Material Icons CSS if not present
        if (!document.getElementById('material-icons-css')) {
            var link = document.createElement('link');
            link.id = 'material-icons-css';
            link.rel = 'stylesheet';
            link.href = 'https://fonts.googleapis.com/icon?family=Material+Icons';
            document.head.appendChild(link);
        }

        // Inject Vex if not present
        if (typeof vex === 'undefined') {
            var script = document.createElement('script');
            script.src = './static/vex.combined.min.js';
            script.onload = function () {
                vex.defaultOptions.className = 'vex-theme-flat-attack';
            };
            document.head.appendChild(script);
        } else {
            vex.defaultOptions.className = 'vex-theme-flat-attack';
        }

        // Styles
        var iconStyle = 'vertical-align: middle; font-size: 24px; margin-right: 5px;';
        var btnStyle = 'font-size:14px; padding: 5px 10px; margin-right:5px; display:inline-flex; align-items:center; text-decoration:none; color:#333;';

        // Define Sheet Tab
        var sheetTab = {
            name: 'sheet',
            text: 'Sheet',
            html: '<div id="' + idPrefix + 'sheettools" style="display:none;">' +
                '<div style="padding:8px 0;">' +
                '  <button type="button" class="btn btn-link" style="' + btnStyle + '" onclick="window.location=\'./_new\'" title="New Spreadsheet">' +
                '    <i class="material-icons" style="' + iconStyle + ' color: #4CAF50;">note_add</i> New' +
                '  </button>' +
                '  <button type="button" class="btn btn-link" style="' + btnStyle + '" onclick="document.getElementById(\'custom-upload-input\').click();" title="Open">' +
                '    <i class="material-icons" style="' + iconStyle + ' color: #FFC107;">folder_open</i> Open' +
                '  </button>' +
                '  <button type="button" class="btn btn-link" style="' + btnStyle + '" onclick="window.dispatchEvent(new Event(\'ec-save-request\'));" title="Save">' +
                '    <i class="material-icons" style="' + iconStyle + ' color: #2196F3;">save</i> Save' +
                '  </button>' +
                '  <button type="button" class="btn btn-link" style="' + btnStyle + '" onclick="window.dispatchEvent(new Event(\'ec-save-xlsx-request\'));" title="Save as XLSX">' +
                '    <i class="material-icons" style="' + iconStyle + ' color: #4CAF50;">grid_on</i> Save as XLSX' +
                '  </button>' +
                '  <input type="file" id="custom-upload-input" style="display:none;" accept=".csv,.xlsx,.ods">' +
                '</div>' +
                '</div>',
            onclick: function (s, t) { }
        };

        // Define Help Tab
        var helpTab = {
            name: 'help',
            text: 'Help',
            html: '<div id="' + idPrefix + 'helptools" style="display:none;">' +
                '<div style="padding:8px 0;">' +
                '  <a href="https://ganjingworld.com" target="_blank" class="btn btn-link" style="' + btnStyle + '"><i class="material-icons" style="' + iconStyle + ' color: #9C27B0;">info</i> Introduction</a>' +
                '  <a href="/howtouse.html" target="_blank" class="btn btn-link" style="' + btnStyle + '"><i class="material-icons" style="' + iconStyle + ' color: #E91E63;">help_outline</i> How to use</a>' +
                '  <a href="#" class="btn btn-link" style="' + btnStyle + '"><i class="material-icons" style="' + iconStyle + ' color: #F44336;">ondemand_video</i> Video</a>' +
                '  <a href="/About.html" target="_blank" class="btn btn-link" style="' + btnStyle + '"><i class="material-icons" style="' + iconStyle + ' color: #3F51B5;">contacts</i> About</a>' +
                '</div>' +
                '</div>',
            onclick: function (s, t) { }
        };

        // --- Tab Management: Reorder and Filter ---
        console.log('[CoSheet] Starting tab reorganization...');
        console.log('[CoSheet] Current tabs:', spreadsheet.tabs.map(function (t) { return t.name; }));

        // Override tab CSS to remove borders
        spreadsheet.tabplainCSS = spreadsheet.tabplainCSS.replace(/border-right:[^;]+;/g, '');
        spreadsheet.tabselectedCSS = spreadsheet.tabselectedCSS.replace(/border-right:[^;]+;/g, '');

        // 1. Remove unwanted tabs (Audit, Comment, Names, Clipboard, Form)
        var tabsToRemove = ['audit', 'comment', 'names', 'clipboard', 'form'];
        var filteredTabs = [];

        for (var i = 0; i < spreadsheet.tabs.length; i++) {
            var tab = spreadsheet.tabs[i];
            if (tabsToRemove.indexOf(tab.name) === -1) {
                if (tab.name === 'graph') {
                    tab.text = 'Chart';
                }
                filteredTabs.push(tab);
            } else {
                console.log('[CoSheet] Removing tab:', tab.name);
            }
        }

        // 2. Add Sheet and Help tabs
        filteredTabs.unshift(sheetTab); // Add Sheet at beginning
        filteredTabs.push(helpTab);     // Add Help at end

        console.log('[CoSheet] After adding Sheet/Help:', filteredTabs.map(function (t) { return t.name; }));

        // 3. Reorder tabs: Sheet - Edit - Settings (Format) - Sort - Graph - Help
        var desiredOrder = ['sheet', 'edit', 'settings', 'sort', 'graph', 'help'];
        filteredTabs.sort(function (a, b) {
            var indexA = desiredOrder.indexOf(a.name);
            var indexB = desiredOrder.indexOf(b.name);

            // If not in desired order, put at end
            if (indexA === -1) indexA = 999;
            if (indexB === -1) indexB = 999;

            return indexA - indexB;
        });

        console.log('[CoSheet] Final tab order:', filteredTabs.map(function (t) { return t.name; }));

        // 4. Update spreadsheet tabs
        spreadsheet.tabs = filteredTabs;

        // Re-calculate tabnums
        spreadsheet.tabnums = {};
        for (var i = 0; i < spreadsheet.tabs.length; i++) {
            spreadsheet.tabnums[spreadsheet.tabs[i].name] = i;
        }

        // Rebuild the UI
        rebuildTabsUI(spreadsheet);

        // Remove alignment buttons from Edit tab after UI is built
        setTimeout(function () {
            console.log('[CoSheet] Removing alignment buttons from Edit tab...');
            var buttonsToRemove = ['button_alignleft', 'button_aligncenter', 'button_alignright'];
            buttonsToRemove.forEach(function (buttonId) {
                var fullId = spreadsheet.idPrefix + buttonId;
                var button = document.getElementById(fullId);
                if (button) {
                    console.log('[CoSheet] Removing button:', fullId);
                    button.parentNode.removeChild(button);
                } else {
                    console.log('[CoSheet] Button not found:', fullId);
                }
            });
        }, 500);

        // Attach File Input Handler
        setTimeout(attachCustomFileInputHandler, 1000);
    }

    // Worker instance
    var xlsxWorker;

    function attachCustomFileInputHandler() {
        var input = document.getElementById('custom-upload-input');
        if (!input) return;

        input.addEventListener('change', function (ev) {
            var f = ev.target.files && ev.target.files[0];
            if (!f) return;

            // Reset input value
            input.value = '';

            var isBinary = /\.xlsx$|\.xlsm$|\.xlsb$|\.xls$|\.ods$/i.test(f.name);

            if (isBinary) {
                if (typeof Worker !== 'undefined') {
                    handleXLSXWithWorker(f);
                } else {
                    alert('Web Workers not supported. Browser may freeze.');
                    handleXLSXSync(f);
                }
            } else {
                // Text/CSV
                var reader = new FileReader();
                reader.onload = function (e) {
                    var text = e.target.result;
                    loadCSV(text);
                };
                reader.readAsText(f);
            }
        });
    }

    // Helper to safely close vex dialog
    function closeDialog(dialog) {
        try {
            if (dialog && typeof vex !== 'undefined') {
                if (dialog.data && dialog.data.$vexContent) {
                    var vexData = dialog.data.$vexContent.data('vex');
                    if (vexData && vexData.id) {
                        vex.close(vexData.id);
                    }
                }
            }
        } catch (e) {
            console.warn('Failed to close dialog:', e);
        }
    }

    function handleXLSXWithWorker(file) {
        // Show loading spinner
        var loadingDialog;
        var workerTimeout;
        var progressLog = ['Đang tải dữ liệu...'];

        var updateProgress = function (msg) {
            // Add to log if new
            if (progressLog[progressLog.length - 1] !== msg) {
                progressLog.push(msg);
            }

            if (loadingDialog && typeof vex !== 'undefined') {
                var content = loadingDialog.data.$vexContent;
                if (content) {
                    var msgDiv = content.find('.vex-dialog-message');
                    if (msgDiv.length) {
                        // Update dialog with full history
                        // Use <br> for line breaks and smaller font for history
                        var html = progressLog.map(function (m, i) {
                            if (i === progressLog.length - 1) return '<b>' + m + '</b>'; // Current step bold
                            return '<span style="color: #666; font-size: smaller;">' + m + '</span>';
                        }).join('<br>');
                        msgDiv.html(html);
                    }
                }
            }
            // Also update Status Bar (Bottom Left)
            try {
                if (typeof SocialCalc !== 'undefined' && SocialCalc.GetSpreadsheetControlObject) {
                    var ctrl = SocialCalc.GetSpreadsheetControlObject();
                    if (ctrl && ctrl.editor && ctrl.editor.statusline) {
                        ctrl.editor.statusline.innerHTML = msg;
                        ctrl.editor.statusline.style.display = 'block'; // Ensure it's visible
                    }
                }
            } catch (e) { }
        };

        if (typeof vex !== 'undefined') {
            loadingDialog = vex.dialog.open({
                message: progressLog[0],
                buttons: [],
                closeAllOnPopState: false,
                escapeButtonCloses: false,
                overlayClosesOnClick: false
            });
        } else {
            console.warn('Vex not loaded yet, loading indicator skipped.');
        }

        // Set timeout for worker initialization
        workerTimeout = setTimeout(function () {
            closeDialog(loadingDialog);
            console.warn('Worker initialization timeout, falling back to sync mode');
            alert('Worker initialization timeout. Using fallback method...');
            handleXLSXSync(file);
        }, 10000);

        if (!xlsxWorker) {
            // Use relative path for worker
            try {
                xlsxWorker = new Worker('./static/xlsxworker.js');
            } catch (e) {
                console.error('Failed to create worker:', e);
                clearTimeout(workerTimeout);
                closeDialog(loadingDialog);
                alert('Failed to initialize Web Worker: ' + e.message + '. Using fallback method...');
                handleXLSXSync(file);
                return;
            }

            xlsxWorker.onerror = function (e) {
                clearTimeout(workerTimeout);
                closeDialog(loadingDialog);
                console.error('Worker Error Event:', e);
                var msg = 'Worker Error: ' + (e.message || 'Unknown error');
                if (e.filename) msg += '\nFile: ' + e.filename;
                if (e.lineno) msg += '\nLine: ' + e.lineno;
                alert(msg + '\n\nUsing fallback method...');
                handleXLSXSync(file);
            };

            xlsxWorker.onmessage = function (evt) {
                var msg = evt.data;
                switch (msg.t) {
                    case 'init':
                        // Worker script loaded successfully
                        clearTimeout(workerTimeout);

                        updateProgress('Bộ xử lý sẵn sàng, đang xử lý file...');
                        break;
                    case 'status':
                        updateProgress(msg.d);
                        break;
                    case 'ready':
                        clearTimeout(workerTimeout);
                        // Do NOT close dialog here, as we might proceed to multi-sheet conversion
                        // closeDialog(loadingDialog);

                        if (msg.metadata.SheetNames.length > 1) {
                            // Multiple sheets detected - Auto-switch to multi-view
                            updateProgress('Đang chuyển đổi ' + msg.metadata.SheetNames.length + ' sheet cho chế độ xem nhiều sheet...');
                            xlsxWorker.postMessage({ action: 'convert_multi' });
                        } else {
                            // Single sheet
                            requestSheetConversion(null);
                        }
                        break;
                    case 'socialcalc':
                        clearTimeout(workerTimeout);
                        closeDialog(loadingDialog);

                        // Show rendering dialog
                        var renderDialog = null;
                        if (typeof vex !== 'undefined') {
                            renderDialog = vex.dialog.open({
                                message: 'Đang hiển thị bảng tính...',
                                buttons: [],
                                closeAllOnPopState: false,
                                escapeButtonCloses: false,
                                overlayClosesOnClick: false
                            });
                        }

                        setTimeout(function () {
                            try {

                                var ctrl = SocialCalc.GetSpreadsheetControlObject();
                                if (ctrl && typeof ctrl.ParseSheetSave === 'function') {
                                    ctrl.ParseSheetSave(msg.save);

                                    // Auto-resize columns after loading
                                    autoResizeColumns(ctrl);

                                    ctrl.editor.ScheduleRender();

                                } else {
                                    throw new Error('SocialCalc control not found');
                                }
                            } catch (err) {
                                console.error('Error loading data:', err);
                                alert('Error rendering spreadsheet: ' + err.message);
                            } finally {

                                closeDialog(renderDialog);
                                setTimeout(function () {
                                    if (typeof vex !== 'undefined') {
                                        vex.closeAll();
                                    }
                                }, 500);
                            }
                        }, 100);
                        break;
                    case 'socialcalc_multi':
                        clearTimeout(workerTimeout);
                        updateProgress('Đang tải dữ liệu lên máy chủ...');

                        var sheets = msg.sheets;

                        // Generate a NEW unique room ID for this multi-sheet import
                        // EtherCalc uses base36 random strings for room IDs
                        var currentRoom = Math.random().toString(36).substring(2, 15);


                        var toc = '#url,#title\n';



                        // Sequential upload to avoid overwhelming the server and hitting limits
                        var uploadSequence = Promise.resolve();

                        sheets.forEach(function (sheet, index) {
                            uploadSequence = uploadSequence.then(function () {
                                var sheetId = currentRoom + '.' + (index + 1);
                                toc += '"/' + sheetId + '","' + sheet.name.replace(/"/g, '""') + '"\n';

                                updateProgress('Đang tải lên sheet ' + (index + 1) + '/' + sheets.length + ': ' + sheet.name);


                                // Use text/x-socialcalc to avoid JSON body limits
                                return uploadSheetData(sheetId, sheet.save, 'text/x-socialcalc').then(function () {

                                }).catch(function (err) {
                                    console.error('✗ Failed to upload sheet ' + (index + 1) + ':', err);
                                    throw err;
                                });
                            });
                        });

                        uploadSequence.then(function () {

                            return uploadSheetData(currentRoom, toc, 'text/csv');
                        }).then(function () {

                            closeDialog(loadingDialog);

                            // Small delay to ensure server has processed everything
                            setTimeout(function () {
                                window.location.href = '/=' + currentRoom;
                            }, 500);
                        }).catch(function (err) {
                            console.error('✗ Error uploading multi-sheet data:', err);
                            console.error('Error details:', err.stack || err.message || err);
                            closeDialog(loadingDialog);
                            alert('Error uploading sheets: ' + err.message);
                        });
                        break;

                    case 'csv':
                        // Fallback for legacy or if worker sends CSV
                        clearTimeout(workerTimeout);
                        closeDialog(loadingDialog);
                        if (msg.csv) {
                            SocialCalc.GetSpreadsheetControlObject().ParseSheetSave(msg.csv);
                        }
                        break;
                    case 'e':
                        clearTimeout(workerTimeout);
                        closeDialog(loadingDialog);
                        console.error('Worker error:', msg.d);
                        alert('Error processing file: ' + (typeof msg.d === 'object' ? JSON.stringify(msg.d) : msg.d));
                        break;
                }
            };
        }

        // Send the File object directly to the worker
        // This avoids reading the entire file into the main thread's memory
        updateProgress('Sending file to worker...');
        xlsxWorker.postMessage({
            action: 'read',
            file: file
        });
    }

    function requestSheetConversion(sheetName) {
        // Show loading again
        // loadingDialog is now declared in the outer scope
        if (typeof vex !== 'undefined') {
            // If loadingDialog is already open, update its message. Otherwise, open a new one.
            if (!loadingDialog) {
                loadingDialog = vex.dialog.open({
                    message: 'Converting Sheet...',
                    buttons: [],
                    closeAllOnPopState: false,
                    escapeButtonCloses: false,
                    overlayClosesOnClick: false
                });
            } else {
                var content = loadingDialog.data.$vexContent;
                if (content) {
                    var msgDiv = content.find('.vex-dialog-message');
                    if (msgDiv.length) msgDiv.text('Converting Sheet...');
                }
            }
        }

        // We need to handle the close in the onmessage handler, 
        // but we can't easily pass the dialog object if it was created here.
        // However, loadingDialog is in closure scope, so it should be fine.

        xlsxWorker.postMessage({
            action: 'convert',
            sheetName: sheetName
        });
    }

    // Helper for sync fallback (if needed, though we prioritize worker)
    function handleXLSXSync(f) {
        var reader = new FileReader();
        reader.onload = function (e) {
            try {
                var data = new Uint8Array(e.target.result);
                var wb = XLSX.read(data, { type: 'array' });

                if (wb.SheetNames.length > 1) {
                    // Show selection dialog with inline metadata
                    showSheetSelectionDialogSync(wb);
                } else {
                    try {
                        var csv = XLSX.utils.sheet_to_csv(wb.Sheets[wb.SheetNames[0]]);
                        loadCSV(csv);
                    } catch (csvErr) {
                        console.error('Error in sync CSV conversion:', csvErr);
                        alert('Error loading spreadsheet: ' + csvErr.message);
                    }
                }
            } catch (err) {
                console.error('Error reading file (sync mode):', err);
                alert('Error reading file: ' + err.message);
            }
        };
        reader.readAsArrayBuffer(f);
    }

    function showSheetSelectionDialog(metadata) {
        // Build HTML for sheet list
        var html = '<div style="max-height: 300px; overflow-y: auto;">';
        html += '<p>Please select a sheet to open:</p>';
        html += '<div class="list-group">';

        metadata.SheetNames.forEach(function (name) {
            var sheetInfo = metadata.Sheets[name];
            var ref = sheetInfo['!ref'] || 'Unknown range';
            // Estimate rows/cols
            var range = XLSX.utils.decode_range(ref);
            var rows = range.e.r - range.s.r + 1;
            var cols = range.e.c - range.s.c + 1;

            html += '<button type="button" class="list-group-item sheet-select-btn" data-sheet="' + name + '" style="width:100%; text-align:left; margin-bottom:5px; padding:10px; border:1px solid #ddd; background:#fff; cursor:pointer;">';
            html += '<strong>' + name + '</strong><br>';
            html += '<small class="text-muted">' + rows + ' rows x ' + cols + ' columns</small>';
            html += '</button>';
        });
        html += '</div></div>';

        if (typeof vex !== 'undefined') {
            vex.dialog.open({
                message: 'Select Sheet',
                input: html,
                buttons: [
                    $.extend({}, vex.dialog.buttons.NO, { text: 'Cancel' })
                ],
                callback: function (data) { }
            });

            setTimeout(function () {
                var btns = document.querySelectorAll('.sheet-select-btn');
                for (var i = 0; i < btns.length; i++) {
                    btns[i].onclick = function () {
                        var sheetName = this.getAttribute('data-sheet');
                        vex.closeAll(); // Close selection dialog
                        requestSheetConversion(sheetName);
                    };
                }
            }, 100);
        }
    }

    function showSheetSelectionDialogSync(wb) {
        // Build metadata from workbook
        var metadata = {
            SheetNames: wb.SheetNames,
            Sheets: {}
        };

        wb.SheetNames.forEach(function (name) {
            var sheet = wb.Sheets[name];
            metadata.Sheets[name] = {
                '!ref': sheet['!ref']
            };
        });

        // Build HTML for sheet list
        var html = '<div style="max-height: 300px; overflow-y: auto;">';
        html += '<p>Please select a sheet to open:</p>';
        html += '<div class="list-group">';

        metadata.SheetNames.forEach(function (name) {
            var sheetInfo = metadata.Sheets[name];
            var ref = sheetInfo['!ref'] || 'Unknown range';
            var range = XLSX.utils.decode_range(ref);
            var rows = range.e.r - range.s.r + 1;
            var cols = range.e.c - range.s.c + 1;

            html += '<button type="button" class="list-group-item sheet-select-btn-sync" data-sheet="' + name + '" style="width:100%; text-align:left; margin-bottom:5px; padding:10px; border:1px solid #ddd; background:#fff; cursor:pointer;">';
            html += '<strong>' + name + '</strong><br>';
            html += '<small class="text-muted">' + rows + ' rows x ' + cols + ' columns</small>';
            html += '</button>';
        });
        html += '</div></div>';

        if (typeof vex !== 'undefined') {
            vex.dialog.open({
                message: 'Select Sheet',
                input: html,
                buttons: [
                    $.extend({}, vex.dialog.buttons.NO, { text: 'Cancel' })
                ],
                callback: function (data) { }
            });

            setTimeout(function () {
                var btns = document.querySelectorAll('.sheet-select-btn-sync');
                for (var i = 0; i < btns.length; i++) {
                    btns[i].onclick = function () {
                        var sheetName = this.getAttribute('data-sheet');
                        vex.closeAll();
                        var csv = XLSX.utils.sheet_to_csv(wb.Sheets[sheetName]);
                        loadCSV(csv);
                    };
                }
            }, 100);
        }
    }

    function loadSheet(wb, sheetName) {
        // Legacy function, replaced by requestSheetConversion
    }

    function loadCSV(csvContent) {
        var ctrl = SocialCalc.GetSpreadsheetControlObject();
        if (ctrl && typeof ctrl.ParseSheetSave === 'function') {
            // Auto-detect delimiter (Excel may use semicolon in some locales)
            var detectedContent = csvContent;

            // Check first line to detect delimiter
            var firstLine = csvContent.split('\n')[0] || '';
            var semicolonCount = (firstLine.match(/;/g) || []).length;
            var commaCount = (firstLine.match(/,/g) || []).length;


            // If more semicolons than commas, convert semicolons to commas
            if (semicolonCount > commaCount && semicolonCount > 0) {
                detectedContent = csvContent.replace(/;/g, ',');
            }

            // Convert CSV to SocialCalc save format
            var save = SocialCalc.ConvertOtherFormatToSave(detectedContent, 'csv');

            // Debug: check save format


            ctrl.ParseSheetSave(save);

            // FIX: Recalculate lastrow/lastcol from actual cells
            // ConvertOtherFormatToSave may set these incorrectly with empty rows
            var maxRow = 0;
            var maxCol = 0;
            for (var cellCoord in ctrl.sheet.cells) {
                var cr = SocialCalc.coordToCr(cellCoord);
                if (cr.row > maxRow) maxRow = cr.row;
                if (cr.col > maxCol) maxCol = cr.col;
            }

            if (maxRow > 0) {
                ctrl.sheet.attribs.lastrow = maxRow;
            }
            if (maxCol > 0) {
                ctrl.sheet.attribs.lastcol = maxCol;
            }

            console.log('[loadCSV] Import complete. lastrow:', maxRow, 'lastcol:', maxCol);

            // AUTO-SAVE to server after CSV import (fix data loss on refresh)
            setTimeout(function () {
                console.log('[AUTO-SAVE] Triggering auto-save after CSV import');
                var room = window.location.pathname.split('/').filter(Boolean).pop() || 'sheet';
                console.log('[AUTO-SAVE] Room ID:', room);

                var snapshot = null;
                if (typeof ctrl.CreateSpreadsheetSave === 'function') {
                    console.log('[AUTO-SAVE] Using CreateSpreadsheetSave');
                    snapshot = ctrl.CreateSpreadsheetSave();
                } else if (ctrl.sheet && typeof ctrl.sheet.CreateSheetSave === 'function') {
                    console.log('[AUTO-SAVE] Using CreateSheetSave (wrapping in multipart)');
                    var sheetSave = ctrl.sheet.CreateSheetSave();
                    snapshot = 'socialcalc:version:1.0\nMIME-Version: 1.0\nContent-Type: multipart/mixed; boundary=SocialCalcSpreadsheetControlSave\n--SocialCalcSpreadsheetControlSave\nContent-type: text/plain; charset=UTF-8\n\n# SocialCalc Spreadsheet Control Save\nversion:1.0\npart:sheet\npart:edit\npart:audit\n--SocialCalcSpreadsheetControlSave\nContent-type: text/plain; charset=UTF-8\n\n' + sheetSave + '\n--SocialCalcSpreadsheetControlSave\nContent-type: text/plain; charset=UTF-8\n\nversion:1.0\nrowpane:0:1:14\ncolpane:0:1:16\necell:A1\n--SocialCalcSpreadsheetControlSave\nContent-type: text/plain; charset=UTF-8\n\n--SocialCalcSpreadsheetControlSave--\n';
                }

                if (!snapshot) {
                    console.error('[AUTO-SAVE] Could not create snapshot!');
                    return;
                }

                console.log('[AUTO-SAVE] Snapshot created, length:', snapshot.length);
                console.log('[AUTO-SAVE] Sending PUT request to:', '/_/' + encodeURIComponent(room));

                fetch('/_/' + encodeURIComponent(room), {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'text/x-socialcalc'
                    },
                    body: snapshot
                })
                    .then(function (response) {
                        if (response.ok) {
                            console.log('[AUTO-SAVE] ✅ Successfully saved to server!');
                        } else {
                            console.error('[AUTO-SAVE] ❌ Server returned error:', response.status, response.statusText);
                            return response.text().then(function (text) {
                                console.error('[AUTO-SAVE] Response body:', text);
                            });
                        }
                    })
                    .catch(function (error) {
                        console.error('[AUTO-SAVE] ❌ Failed to save:', error);
                    });
            }, 1500); // Wait 1.5s for spreadsheet to fully initialize

            // Debug: check final sheet state


            // Auto-resize columns after loading
            autoResizeColumns(ctrl);

            ctrl.editor.ScheduleRender();
        } else {
            alert('SocialCalc control not found.');
        }
    }

    function rebuildTabsUI(spreadsheet) {
        console.log('[CoSheet] Rebuilding tabs UI...');
        var tabsDiv = spreadsheet.spreadsheetDiv.querySelector('div > table[cellpadding="0"]');
        if (!tabsDiv) {
            console.log('[CoSheet] ERROR: tabsDiv not found');
            return;
        }

        var tabRow = tabsDiv.querySelector('tr');
        if (!tabRow) {
            console.log('[CoSheet] ERROR: tabRow not found');
            return;
        }

        // CRITICAL: Remove ALL existing tab TDs first to avoid stale tabs
        console.log('[CoSheet] Clearing old tabs from DOM...');
        while (tabRow.firstChild) {
            tabRow.removeChild(tabRow.firstChild);
        }

        // Add CoSheet logo at the beginning
        var logoTd = document.createElement('td');
        logoTd.style.cssText = 'padding: 4px 12px 4px 8px; vertical-align: middle;';
        var logoImg = document.createElement('img');
        logoImg.src = './static/images/cosheet_logo.svg';
        logoImg.alt = 'CoSheet';
        logoImg.style.cssText = 'height: 44px; width: auto; display: block;';
        logoTd.appendChild(logoImg);
        tabRow.appendChild(logoTd);

        // Iterate through tabs in the correct order and append them to the row
        console.log('[CoSheet] Adding new tabs to DOM...');
        for (var i = 0; i < spreadsheet.tabs.length; i++) {
            var tab = spreadsheet.tabs[i];
            var tabId = spreadsheet.idPrefix + tab.name + 'tab';

            // Always create fresh TD element
            var td = document.createElement('td');
            td.id = tabId;
            td.style.cssText = spreadsheet.tabplainCSS;
            td.onclick = function () { SocialCalc.SetTab(this); };
            td.innerHTML = SocialCalc.LocalizeString(tab.text);
            td.style.cursor = 'pointer';

            tabRow.appendChild(td);
            console.log('[CoSheet] Added tab to DOM:', tab.name);

            var toolId = spreadsheet.idPrefix + tab.name + 'tools';
            if (!document.getElementById(toolId) && tab.html) {
                var toolsDiv = document.createElement('div');
                toolsDiv.innerHTML = tab.html.replace(/%id/g, spreadsheet.idPrefix);

                var editTools = document.getElementById(spreadsheet.idPrefix + 'edittools');
                if (editTools && editTools.parentNode) {
                    while (toolsDiv.firstChild) {
                        editTools.parentNode.appendChild(toolsDiv.firstChild);
                    }
                }
            }
        }

        console.log('[CoSheet] Tab UI rebuild complete. Final tabs:', spreadsheet.tabs.map(function (t) { return t.name; }));

        // Force remove borders from all tabs after UI build
        setTimeout(function () {
            var allTabs = tabRow.querySelectorAll('td');
            for (var i = 0; i < allTabs.length; i++) {
                allTabs[i].style.borderRight = 'none';
                allTabs[i].style.borderLeft = 'none';
            }
            console.log('[CoSheet] Removed borders from', allTabs.length, 'tabs');
        }, 100);

        if (spreadsheet.currentTab >= 0 && spreadsheet.tabs[spreadsheet.currentTab]) {
            SocialCalc.SetTab(spreadsheet.tabs[spreadsheet.currentTab].name);
        }
    }
    function uploadSheetData(room, data, contentType) {
        return new Promise(function (resolve, reject) {
            var url = '/_/' + room;

            var xhr = new XMLHttpRequest();
            xhr.open('PUT', url, true);
            xhr.setRequestHeader('Content-Type', contentType || 'text/x-socialcalc');
            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4) {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        resolve();
                    } else {
                        reject(new Error('Upload failed: ' + xhr.statusText + ' (Status: ' + xhr.status + ')'));
                    }
                }
            };
            xhr.onerror = function () {
                reject(new Error('Network error'));
            };
            xhr.send(data);
        });
    }

    function autoResizeColumns(spreadsheet) {
        if (!spreadsheet || !spreadsheet.sheet) return;

        var sheet = spreadsheet.sheet;
        var maxCol = 0;

        // Find used range
        for (var coord in sheet.cells) {
            var cr = SocialCalc.coordToCr(coord);
            if (cr.col > maxCol) maxCol = cr.col;
        }

        if (maxCol === 0) return;

        var colWidths = {};
        var minWidth = 50;
        var maxWidth = 300;
        var charWidth = 8; // Approx px per char
        var padding = 20;

        // Calculate max width for each column
        for (var coord in sheet.cells) {
            var cell = sheet.cells[coord];
            var cr = SocialCalc.coordToCr(coord);
            var val = cell.datavalue || cell.displaystring || "";

            // Handle numeric values
            if (typeof val === 'number') val = val.toString();

            if (val) {
                var len = val.length;
                // Rough estimation
                var width = (len * charWidth) + padding;
                if (!colWidths[cr.col] || width > colWidths[cr.col]) {
                    colWidths[cr.col] = width;
                }
            }
        }

        // Apply widths
        var changed = false;
        for (var c = 1; c <= maxCol; c++) {
            var w = colWidths[c] || minWidth;
            if (w < minWidth) w = minWidth;
            if (w > maxWidth) w = maxWidth;

            var colName = SocialCalc.rcColname(c);
            // SocialCalc stores widths as strings
            if (sheet.colattribs.width[colName] != w) {
                sheet.colattribs.width[colName] = w + "";
                changed = true;
            }
        }

        if (changed) {
            // Force re-render if needed, though usually called before render
        }
    }
})();
