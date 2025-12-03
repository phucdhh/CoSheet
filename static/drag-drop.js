// Drag and Drop File Upload for CoSheet
// Allows dragging CSV/XLSX files directly into browser window

(function() {
    'use strict';
    
    var dropZone = null;
    var dropOverlay = null;
    var dragCounter = 0;
    
    function initDragDrop() {
        // Create visual overlay for drag feedback
        createDropOverlay();
        
        // Attach drag/drop event listeners to document body
        document.addEventListener('dragenter', handleDragEnter, false);
        document.addEventListener('dragleave', handleDragLeave, false);
        document.addEventListener('dragover', handleDragOver, false);
        document.addEventListener('drop', handleDrop, false);
        
        // console.log('[DragDrop] Initialized');
    }
    
    function createDropOverlay() {
        dropOverlay = document.createElement('div');
        dropOverlay.id = 'cosheet-drop-overlay';
        dropOverlay.style.cssText = [
            'position: fixed',
            'top: 0',
            'left: 0',
            'width: 100%',
            'height: 100%',
            'background: rgba(12, 49, 89, 0.9)',
            'z-index: 99999',
            'display: none',
            'pointer-events: none'
        ].join(';');
        
        var dropMessage = document.createElement('div');
        dropMessage.style.cssText = [
            'position: absolute',
            'top: 50%',
            'left: 50%',
            'transform: translate(-50%, -50%)',
            'color: white',
            'font-size: 32px',
            'font-weight: bold',
            'text-align: center',
            'font-family: Arial, sans-serif'
        ].join(';');
        
        dropMessage.innerHTML = '<div style="font-size: 64px; margin-bottom: 20px;">📁</div>' +
                                'Thả file CSV/XLSX vào đây<br>' +
                                '<span style="font-size: 18px; font-weight: normal;">Hỗ trợ: .csv, .xlsx, .ods</span>';
        
        dropOverlay.appendChild(dropMessage);
        document.body.appendChild(dropOverlay);
    }
    
    function handleDragEnter(e) {
        e.preventDefault();
        dragCounter++;
        
        if (dragCounter === 1) {
            // Check if dragged items contain files
            if (e.dataTransfer && e.dataTransfer.types) {
                for (var i = 0; i < e.dataTransfer.types.length; i++) {
                    if (e.dataTransfer.types[i] === 'Files') {
                        showDropOverlay();
                        break;
                    }
                }
            }
        }
    }
    
    function handleDragLeave(e) {
        e.preventDefault();
        dragCounter--;
        
        if (dragCounter === 0) {
            hideDropOverlay();
        }
    }
    
    function handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        
        // Show copy cursor
        if (e.dataTransfer) {
            e.dataTransfer.dropEffect = 'copy';
        }
    }
    
    function handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        
        dragCounter = 0;
        hideDropOverlay();
        
        var files = e.dataTransfer.files;
        
        if (!files || files.length === 0) {
            return;
        }
        
        // Get the first file
        var file = files[0];
        
        // Check file type
        var fileName = file.name.toLowerCase();
        var validExtensions = ['.csv', '.xlsx', '.ods'];
        var isValid = validExtensions.some(function(ext) {
            return fileName.endsWith(ext);
        });
        
        if (!isValid) {
            alert('Chỉ hỗ trợ file CSV, XLSX hoặc ODS!\nFile của bạn: ' + file.name);
            return;
        }
        
        console.log('[DragDrop] File dropped:', file.name, file.type, file.size);
        
        // Check file type and call appropriate handler
        var isBinary = /\.xlsx$|\.xlsm$|\.xlsb$|\.xls$|\.ods$/i.test(file.name);
        
        if (isBinary) {
            // Call XLSX handler directly if available
            // Use handleXLSXFile (sync mode) instead of worker to avoid cache issues
            if (typeof window.handleXLSXFile === 'function') {
                window.handleXLSXFile(file);
                console.log('[DragDrop] Calling handleXLSXFile (sync mode)');
            } else {
                console.error('[DragDrop] handleXLSXFile not found');
                alert('Chức năng upload chưa sẵn sàng. Vui lòng thử lại sau vài giây.');
            }
        } else if (/\.csv$/i.test(file.name)) {
            // CSV file - read and load
            var reader = new FileReader();
            reader.onload = function(e) {
                var text = e.target.result;
                if (typeof window.loadCSV === 'function') {
                    window.loadCSV(text);
                    console.log('[DragDrop] CSV loaded');
                } else {
                    console.error('[DragDrop] loadCSV not found');
                    alert('Chức năng upload CSV chưa sẵn sàng.');
                }
            };
            reader.readAsText(file);
        } else {
            alert('Định dạng file không được hỗ trợ: ' + file.name);
        }
    }
    
    function showDropOverlay() {
        if (dropOverlay) {
            dropOverlay.style.display = 'block';
        }
    }
    
    function hideDropOverlay() {
        if (dropOverlay) {
            dropOverlay.style.display = 'none';
        }
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initDragDrop);
    } else {
        initDragDrop();
    }
    
})();
