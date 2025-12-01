/**
 * Graph Layout Manager for CoSheet
 * Handles the 3-panel layout, Chart.js integration, and UI interactions
 */

(function () {
    'use strict';

    window.GraphLayout = {
        currentMode: 'ribbon', // 'ribbon' or '3panel'
        selectedType: null,
        container: null,
        panels: {},

        /**
         * Initialize the graph layout system
         */
        /**
         * Initialize the graph layout
         */
        init: function (containerId) {
            this.container = document.getElementById(containerId);
            if (!this.container) {
                return;
            }

            // Hide legacy tools immediately
            this.hideLegacyTools();

            // Show 3-panel layout
            this.show3PanelLayout();

            // Ensure spreadsheet remains visible (in case it was hidden)
            const spreadsheet = window.spreadsheet;
            if (spreadsheet && spreadsheet.editorDiv) {
                spreadsheet.editorDiv.style.display = 'block';
            }
        },

        localize: function (str) {
            if (typeof SocialCalc !== 'undefined' && SocialCalc.LocalizeString) {
                return SocialCalc.LocalizeString(str);
            }
            return str;
        },

        /**
         * Hide legacy graph tools
         */
        hideLegacyTools: function () {
            // Hide all children of graphtools except our container
            const graphTools = document.querySelector('[id$="graphtools"]');
            if (graphTools) {
                Array.from(graphTools.children).forEach(child => {
                    if (child.id !== 'graph-layout-container') {
                        child.style.display = 'none';
                    }
                });
            }
        },

        /**
         * Show ribbon with graph type icons
         */
        getRibbonHTML: function () {
            return `
        <div id="graph-ribbon" class="graph-ribbon">
          
          <button class="graph-type-btn ${this.selectedType === 'bar' ? 'selected' : ''}" 
                  data-type="bar" 
                  onclick="GraphLayout.selectGraphType('bar')"
                  title="${this.localize('Bar Chart')}">
            <img src="./static/images/charts/bar.svg" alt="Bar Chart" class="chart-icon">
          </button>
          <button class="graph-type-btn ${this.selectedType === 'grouped' ? 'selected' : ''}" 
                  data-type="grouped" 
                  onclick="GraphLayout.selectGraphType('grouped')"
                  title="${this.localize('Grouped Bar Chart')}">
            <img src="./static/images/charts/grouped.svg" alt="Grouped Bar" class="chart-icon">
          </button>
          <button class="graph-type-btn ${this.selectedType === 'stacked' ? 'selected' : ''}" 
                  data-type="stacked" 
                  onclick="GraphLayout.selectGraphType('stacked')"
                  title="${this.localize('Stacked Bar Chart')}">
            <img src="./static/images/charts/stacked.svg" alt="Stacked Bar" class="chart-icon">
          </button>
          <button class="graph-type-btn ${this.selectedType === 'line' ? 'selected' : ''}" 
                  data-type="line" 
                  onclick="GraphLayout.selectGraphType('line')"
                  title="${this.localize('Line Chart')}">
            <img src="./static/images/charts/line.svg" alt="Line Chart" class="chart-icon">
          </button>
          <button class="graph-type-btn ${this.selectedType === 'pie' ? 'selected' : ''}" 
                  data-type="pie" 
                  onclick="GraphLayout.selectGraphType('pie')"
                  title="${this.localize('Pie Chart')}">
            <img src="./static/images/charts/pie.svg" alt="Pie Chart" class="chart-icon">
          </button>
          <button class="graph-type-btn ${this.selectedType === 'doughnut' ? 'selected' : ''}" 
                  data-type="doughnut" 
                  onclick="GraphLayout.selectGraphType('doughnut')"
                  title="${this.localize('Doughnut Chart')}">
            <img src="./static/images/charts/doughnut.svg" alt="Doughnut" class="chart-icon">
          </button>
          <button class="graph-type-btn ${this.selectedType === 'scatter' ? 'selected' : ''}" 
                  data-type="scatter" 
                  onclick="GraphLayout.selectGraphType('scatter')"
                  title="${this.localize('Scatter Plot')}">
            <img src="./static/images/charts/scatter.svg" alt="Scatter" class="chart-icon">
          </button>
          <button class="graph-type-btn ${this.selectedType === 'radar' ? 'selected' : ''}" 
                  data-type="radar" 
                  onclick="GraphLayout.selectGraphType('radar')"
                  title="${this.localize('Radar Chart')}">
            <img src="./static/images/charts/radar.svg" alt="Radar" class="chart-icon">
          </button>
          <button class="graph-type-btn ${this.selectedType === 'polarArea' ? 'selected' : ''}" 
                  data-type="polarArea" 
                  onclick="GraphLayout.selectGraphType('polarArea')"
                  title="${this.localize('Polar Area')}">
            <img src="./static/images/charts/polar.svg" alt="Polar Area" class="chart-icon">
          </button>
          <button class="graph-type-btn ${this.selectedType === 'histogram' ? 'selected' : ''}" 
                  data-type="histogram" 
                  onclick="GraphLayout.selectGraphType('histogram')"
                  title="${this.localize('Histogram')}">
            <img src="./static/images/charts/histogram.svg" alt="Histogram" class="chart-icon">
          </button>
          <button class="graph-type-btn ${this.selectedType === 'box' ? 'selected' : ''}" 
                  data-type="box" 
                  onclick="GraphLayout.selectGraphType('box')"
                  title="${this.localize('Box Plot')}">
            <img src="./static/images/charts/box.svg" alt="Box Plot" class="chart-icon">
          </button>
        </div>
      `;
        },

        /**
         * Generate options HTML based on graph type
         */
        getOptionsHTML: function (graphType) {
            if (!graphType) {
                return '<p style="padding: 20px; color: #999;">Select a chart type to see options.</p>';
            }

            // Common Options (Left Column)
            let contentOptions = `
        <div class="graph-option-section">
                    <h4>${this.localize('Data & Content')}</h4>
                    <div class="graph-option-row">
                      <label>${this.localize('Data Range')}</label>
                      <input type="text" id="graph-data-range" placeholder="e.g., A1:B10" value="" oninput="GraphLayout.validateOptions()">
                    </div>
                    <div class="graph-option-row">
                      <label>${this.localize('Chart Title')}</label>
                      <input type="text" id="graph-title" placeholder="${this.localize('Chart Title')}">
                    </div>
    `;

            if (['bar', 'line', 'scatter'].includes(graphType)) {
                contentOptions += `
        <div class="graph-option-row">
                      <label>${this.localize('X-Axis Label')}</label>
                      <input type="text" id="graph-xlabel" placeholder="${this.localize('X-Axis Label')}">
                    </div>
                    <div class="graph-option-row">
                      <label>${this.localize('Y-Axis Label')}</label>
                      <input type="text" id="graph-ylabel" placeholder="${this.localize('Y-Axis Label')}">
                    </div>
    `;
            }
            contentOptions += `</div > `;

            // Appearance Options (Right Column)
            let appearanceOptions = `
        <div class="graph-option-section">
            <h4>${this.localize('Appearance')}</h4>
    `;

            if (graphType === 'bar') {
                appearanceOptions += `
        <div class="graph-option-row">
                        <label>Orientation</label>
                        <select id="graph-orientation">
                            <option value="vertical">Vertical</option>
                            <option value="horizontal">Horizontal</option>
                        </select>
                    </div >
        `;
            }

            // Add more appearance options here later (colors, etc.)
            appearanceOptions += `
        <div class="graph-option-row">
                        <label>${this.localize('Primary Color')}</label>
                        <input type="color" id="graph-color" value="#36a2eb" style="height: 30px; padding: 0;">
                    </div>
                    <div class="graph-option-row">
                        <label>${this.localize('Theme')}</label>
                        <select id="graph-theme">
                            <option value="default">Default</option>
                            <option value="pastel">Pastel</option>
                            <option value="vibrant">Vibrant</option>
                        </select>
                    </div>
    `;

            appearanceOptions += `</div > `;

            return `
        <div class="graph-options-header">
                    <h3>${this.localize('Chart Options')}</h3>
                    <button id="graph-plot-btn" class="graph-plot-button" onclick="GraphLayout.plotGraph()" disabled>
                      ${this.localize('Plot Chart')}
                    </button>
                </div >
        <div class="graph-options-grid">
            ${contentOptions}
            ${appearanceOptions}
        </div>
    `;
        },

        validateOptions: function () {
            const rangeInput = document.getElementById('graph-data-range');
            const plotBtn = document.getElementById('graph-plot-btn');
            if (rangeInput && plotBtn) {
                plotBtn.disabled = !rangeInput.value.trim();
                if (!plotBtn.disabled) {
                    plotBtn.classList.remove('disabled');
                } else {
                    plotBtn.classList.add('disabled');
                }
            }
        },

        /**
         * Select and display options for a graph type
         */
        selectGraphType: function (type) {
            this.selectedType = type;

            // Update button states
            const buttons = document.querySelectorAll('.graph-type-btn');
            buttons.forEach(btn => {
                if (btn.getAttribute('data-type') === type) {
                    btn.classList.add('selected');
                } else {
                    btn.classList.remove('selected');
                }
            });

            // Show options panel with graph-specific options
            const optionsPanel = document.getElementById('graph-options');
            if (optionsPanel) {
                optionsPanel.style.display = 'block';
                optionsPanel.innerHTML = this.getOptionsHTML(type);
            }
        },

        /**
         * Create and show 3-panel layout
         */
        show3PanelLayout: function () {
            this.currentMode = '3panel';

            // Create layout with ribbon at top, then 3-panel grid below
            // Wrap everything in graph-3panel-container for proper positioning
            const layoutHTML = `
        <div class="graph-3panel-container">
            ${this.getRibbonHTML()}
    <div class="graph-panels">
        <div class="spreadsheet-panel" id="graph-spreadsheet-panel">
            <div class="resize-handle-vertical"></div>
        </div>
        <div class="graph-display-panel" id="graph-display">
            <div id="graph-content-container" style="flex: 1; overflow: auto; position: relative;">
                <div class="graph-placeholder">
                    <div class="graph-loading">${this.localize('Please select a chart type from the ribbon above.')}</div>
                </div>
            </div>
            <div class="resize-handle-horizontal"></div>
        </div>
        <div class="graph-options-panel" id="graph-options" style="display: none;">
            ${this.getOptionsHTML(null)}
        </div>
    </div>
        </div >
        `;

            this.container.innerHTML = layoutHTML;
            this.container.classList.add('active');

            // Move spreadsheet into the left panel
            this.moveSpreadsheetToPanel();

            // Setup resize handles
            this.setupResizeHandles();

            // Pre-fill data range if there's a selection
            this.updateDataRangeFromSelection();

            // Setup mobile touch optimization
            this.setupMobileTouchHandlers();
        },

        /**
         * Move the spreadsheet view into the left panel
         */
        moveSpreadsheetToPanel: function () {
            const spreadsheetPanel = document.getElementById('graph-spreadsheet-panel');
            const spreadsheet = window.spreadsheet;

            if (!spreadsheetPanel || !spreadsheet || !spreadsheet.editorDiv) {
                console.error('Cannot move spreadsheet: panel or editorDiv not found');
                return;
            }

            // Store original parent for restoration
            if (!this.originalSpreadsheetParent) {
                this.originalSpreadsheetParent = spreadsheet.editorDiv.parentNode;
            }

            // Move the editor div into the spreadsheet panel
            // Insert before the resize handle
            const resizeHandle = spreadsheetPanel.querySelector('.resize-handle-vertical');
            spreadsheetPanel.insertBefore(spreadsheet.editorDiv, resizeHandle);

            // Ensure editor div fills the panel and is visible
            spreadsheet.editorDiv.style.display = 'block';
            spreadsheet.editorDiv.style.width = '100%';
            spreadsheet.editorDiv.style.height = '100%';
            spreadsheet.editorDiv.style.flex = '1';
            spreadsheet.editorDiv.style.overflow = 'auto';

            // Set up ResizeObserver to handle panel resizing
            if (!this.spreadsheetResizeObserver) {
                this.spreadsheetResizeObserver = new ResizeObserver(() => {
                    if (spreadsheet.DoOnResize) {
                        spreadsheet.DoOnResize();
                    }
                });
                this.spreadsheetResizeObserver.observe(spreadsheetPanel);
            }

            // Trigger initial resize to adjust spreadsheet
            if (spreadsheet.DoOnResize) {
                setTimeout(() => spreadsheet.DoOnResize(), 100);
            }
        },

        /**
         * Restore spreadsheet to original location
         */
        restoreSpreadsheet: function () {
            const spreadsheet = window.spreadsheet;

            if (this.originalSpreadsheetParent && spreadsheet && spreadsheet.editorDiv) {
                this.originalSpreadsheetParent.appendChild(spreadsheet.editorDiv);

                // Trigger resize
                if (spreadsheet.DoOnResize) {
                    setTimeout(() => spreadsheet.DoOnResize(), 100);
                }
            }
        },

        /**
         * Update data range input from current spreadsheet selection
         */
        updateDataRangeFromSelection: function () {
            const rangeInput = document.getElementById('graph-data-range');
            if (!rangeInput) return;

            const spreadsheet = window.spreadsheet;
            if (!spreadsheet || !spreadsheet.editor) return;

            const editor = spreadsheet.editor;
            let range;

            if (editor.range && editor.range.hasrange) {
                // There's a range selected
                range = SocialCalc.crToCoord(editor.range.left, editor.range.top) + ':' +
                    SocialCalc.crToCoord(editor.range.right, editor.range.bottom);
            } else if (editor.ecell) {
                // Just a single cell
                range = editor.ecell.coord;
            }

            if (range) {
                rangeInput.value = range;
                this.validateOptions(); // Validate immediately
            }
        },

        /**
         * Setup resizable panel handles
         */
        setupResizeHandles: function () {
            const verticalHandle = document.querySelector('#graph-spreadsheet-panel .resize-handle-vertical');
            const horizontalHandle = document.querySelector('#graph-display .resize-handle-horizontal');

            if (verticalHandle) {
                this.makeResizable(verticalHandle, 'vertical');
            }

            if (horizontalHandle) {
                this.makeResizable(horizontalHandle, 'horizontal');
            }
        },

        /**
         * Make a panel resizable
         */
        makeResizable: function (handle, direction) {
            let isResizing = false;
            let startPos = 0;
            let startSize = 0;

            handle.addEventListener('mousedown', (e) => {
                isResizing = true;
                startPos = direction === 'vertical' ? e.clientX : e.clientY;

                const panels = document.querySelector('.graph-panels');
                if (direction === 'vertical') {
                    const cols = window.getComputedStyle(panels).gridTemplateColumns.split(' ');
                    startSize = parseFloat(cols[0]);
                } else {
                    const rows = window.getComputedStyle(panels).gridTemplateRows.split(' ');
                    startSize = parseFloat(rows[0]);
                }

                e.preventDefault();
            });

            document.addEventListener('mousemove', (e) => {
                if (!isResizing) return;

                const panels = document.querySelector('.graph-panels');
                if (!panels) return;

                const delta = (direction === 'vertical' ? e.clientX : e.clientY) - startPos;
                const containerSize = direction === 'vertical' ? panels.offsetWidth : panels.offsetHeight;

                let newSize = startSize + delta;
                const minSize = 200;
                const maxSize = containerSize - 200;

                newSize = Math.max(minSize, Math.min(maxSize, newSize));

                const newSizeFr = newSize / containerSize;
                const remainingFr = 1 - newSizeFr;

                if (direction === 'vertical') {
                    panels.style.gridTemplateColumns = `${newSizeFr}fr ${remainingFr} fr`;
                } else {
                    // For horizontal, we need to adjust the right column rows
                    panels.style.gridTemplateRows = `${newSizeFr}fr ${remainingFr} fr`;
                }

                // Trigger spreadsheet resize
                const spreadsheet = window.spreadsheet;
                if (spreadsheet && spreadsheet.DoOnResize) {
                    spreadsheet.DoOnResize();
                }
            });

            document.addEventListener('mouseup', () => {
                isResizing = false;
            });
        },

        /**
         * Setup mobile touch handlers for smarter scrolling
         */
        setupMobileTouchHandlers: function () {
            const panel = document.getElementById('graph-spreadsheet-panel');
            if (!panel) return;

            // Variables to track touch movement
            let startX, startY;
            let startScrollLeft, startScrollTop;
            const dampingY = 0.6; // Vertical damping
            const dampingX = 0.4; // Horizontal damping (slower as requested)

            panel.addEventListener('touchstart', (e) => {
                const touch = e.touches[0];
                startX = touch.pageX;
                startY = touch.pageY;

                // Find the scrollable element (could be panel or a child)
                // SocialCalc often scrolls an inner div
                const scroller = this.findScrollableChild(panel);
                if (scroller) {
                    startScrollLeft = scroller.scrollLeft;
                    startScrollTop = scroller.scrollTop;
                }
            }, { passive: true });

            panel.addEventListener('touchmove', (e) => {
                const scroller = this.findScrollableChild(panel);
                if (!scroller) return;

                const touch = e.touches[0];
                const deltaX = startX - touch.pageX;
                const deltaY = startY - touch.pageY;

                // Determine scroll direction
                const isVertical = Math.abs(deltaY) > Math.abs(deltaX);

                // Check if we can scroll in that direction
                const canScrollUp = scroller.scrollTop > 0;
                const canScrollDown = scroller.scrollTop < (scroller.scrollHeight - scroller.clientHeight);
                const canScrollLeft = scroller.scrollLeft > 0;
                const canScrollRight = scroller.scrollLeft < (scroller.scrollWidth - scroller.clientWidth);

                let shouldPreventDefault = false;

                if (isVertical) {
                    if ((deltaY < 0 && canScrollUp) || (deltaY > 0 && canScrollDown)) {
                        shouldPreventDefault = true;
                    }
                } else {
                    if ((deltaX < 0 && canScrollLeft) || (deltaX > 0 && canScrollRight)) {
                        shouldPreventDefault = true;
                    }
                }

                if (shouldPreventDefault && e.cancelable) {
                    e.preventDefault();
                    // Apply damped scrolling
                    scroller.scrollTop = startScrollTop + (deltaY * dampingY);
                    scroller.scrollLeft = startScrollLeft + (deltaX * dampingX);
                }
            }, { passive: false });

            // CRITICAL: Stop keyboard events from propagating to SocialCalc when typing in inputs
            const optionsPanel = document.getElementById('graph-options');
            if (optionsPanel) {
                optionsPanel.addEventListener('keydown', (e) => e.stopPropagation());
                optionsPanel.addEventListener('keypress', (e) => e.stopPropagation());
                optionsPanel.addEventListener('keyup', (e) => e.stopPropagation());
                // Also prevent SocialCalc from stealing focus back
                optionsPanel.addEventListener('mousedown', (e) => e.stopPropagation());
            }
        },

        findScrollableChild: function (parent) {
            if (parent.scrollHeight > parent.clientHeight || parent.scrollWidth > parent.clientWidth) {
                return parent;
            }
            // Check children (SocialCalc structure)
            const children = parent.children;
            for (let i = 0; i < children.length; i++) {
                const child = children[i];
                if (child.scrollHeight > child.clientHeight || child.scrollWidth > child.clientWidth) {
                    return child;
                }
            }
            return parent; // Default to parent if no better candidate
        },

        /**
         * Plot the graph with current settings
         */
        plotGraph: function () {
            const graphType = this.selectedType;
            if (!graphType) return;

            const dataRangeInput = document.getElementById('graph-data-range');
            const dataRange = dataRangeInput ? dataRangeInput.value : '';

            if (!dataRange) {
                alert(this.localize('Please enter a data range'));
                return;
            }

            const title = document.getElementById('graph-title').value;
            const xlabel = document.getElementById('graph-xlabel') ? document.getElementById('graph-xlabel').value : '';
            const ylabel = document.getElementById('graph-ylabel') ? document.getElementById('graph-ylabel').value : '';
            const orientation = document.getElementById('graph-orientation') ? document.getElementById('graph-orientation').value : 'vertical';
            const color = document.getElementById('graph-color') ? document.getElementById('graph-color').value : '#36a2eb';

            // Handle histogram differently - use existing plotHistogram function
            if (graphType === 'histogram') {
                this.plotHistogram(dataRange, title, xlabel, ylabel);
                return;
            }

            this.renderChartJS(graphType, dataRange, {
                title: title,
                xlabel: xlabel,
                ylabel: ylabel,
                orientation: orientation,
                color: color
            });
        },

        renderChartJS: function (type, range, options) {
            const graphContainer = document.getElementById('graph-content-container');
            if (!graphContainer) return;

            // Clear previous content
            graphContainer.innerHTML = '<canvas id="chartCanvas"></canvas>';
            const ctx = document.getElementById('chartCanvas').getContext('2d');

            // Parse data from range
            const spreadsheet = SocialCalc.GetSpreadsheetControlObject();
            const prange = SocialCalc.ParseRange(range);

            // Determine range boundaries
            let col1, row1, col2, row2;
            if (prange.cr1.col <= prange.cr2.col) { col1 = prange.cr1.col; col2 = prange.cr2.col; }
            else { col1 = prange.cr2.col; col2 = prange.cr1.col; }

            if (prange.cr1.row <= prange.cr2.row) { row1 = prange.cr1.row; row2 = prange.cr2.row; }
            else { row1 = prange.cr2.row; row2 = prange.cr1.row; }

            // Extract labels and datasets
            const labels = [];
            const datasets = [];

            const numCols = col2 - col1 + 1;
            const numRows = row2 - row1 + 1;

            // Extract labels from first column
            for (let r = row1; r <= row2; r++) {
                const cr = SocialCalc.rcColname(col1) + r;
                const cell = spreadsheet.sheet.GetAssuredCell(cr);
                labels.push(cell.datavalue || '');
            }

            // Colors for Pie/Polar/Doughnut
            // Use user selected color as base if possible, or generate palette
            const baseColor = options.color || '#36a2eb';

            // Helper to generate variations of base color
            const generatePalette = (base, count) => {
                // Simple placeholder: just return standard colors for now
                // In a real app, we'd manipulate HSL
                return [
                    base,
                    '#ff6384',
                    '#ffce56',
                    '#4bc0c0',
                    '#9966ff',
                    '#ff9f40',
                    '#c9cbcf'
                ];
            };

            const backgroundColors = generatePalette(baseColor, 7).map(c => {
                // Add alpha
                if (c.startsWith('#')) {
                    // Convert hex to rgba
                    const r = parseInt(c.slice(1, 3), 16);
                    const g = parseInt(c.slice(3, 5), 16);
                    const b = parseInt(c.slice(5, 7), 16);
                    return `rgba(${r}, ${g}, ${b}, 0.6)`;
                }
                return c;
            });

            const borderColors = generatePalette(baseColor, 7);

            // Extract datasets
            if (numCols === 1) {
                // Single column: Use row numbers as labels, values as data
                labels.length = 0;
                const data = [];
                for (let r = row1; r <= row2; r++) {
                    labels.push(r);
                    const cr = SocialCalc.rcColname(col1) + r;
                    const cell = spreadsheet.sheet.GetAssuredCell(cr);
                    let val = parseFloat(cell.datavalue);
                    if (isNaN(val)) val = 0;
                    data.push(val);
                }

                const ds = {
                    label: options.title || 'Data',
                    data: data,
                    borderWidth: 1
                };

                if (['pie', 'doughnut', 'polarArea'].includes(type)) {
                    ds.backgroundColor = backgroundColors;
                    ds.borderColor = borderColors;
                } else {
                    // Use selected color
                    const r = parseInt(baseColor.slice(1, 3), 16);
                    const g = parseInt(baseColor.slice(3, 5), 16);
                    const b = parseInt(baseColor.slice(5, 7), 16);
                    ds.backgroundColor = `rgba(${r}, ${g}, ${b}, 0.5)`;
                    ds.borderColor = baseColor;
                }
                datasets.push(ds);

            } else {
                // Multiple columns: First col = labels, others = series
                for (let c = col1 + 1; c <= col2; c++) {
                    const data = [];
                    const colName = SocialCalc.rcColname(c);
                    let seriesName = colName;

                    for (let r = row1; r <= row2; r++) {
                        const cr = colName + r;
                        const cell = spreadsheet.sheet.GetAssuredCell(cr);
                        let val = parseFloat(cell.datavalue);
                        if (isNaN(val)) val = 0;
                        data.push(val);
                    }

                    const colorIdx = (c - (col1 + 1)) % backgroundColors.length;

                    const ds = {
                        label: seriesName,
                        data: data,
                        borderWidth: 1
                    };

                    if (['pie', 'doughnut', 'polarArea'].includes(type)) {
                        // For these types, usually we only want ONE dataset with multiple values.
                        // If multiple columns are selected, it's ambiguous. 
                        // Let's assume user wants to compare series, but Pie charts don't do that well.
                        // We'll just take the first data column for now if type is Pie/Doughnut/Polar
                        if (datasets.length === 0) {
                            ds.backgroundColor = backgroundColors;
                            ds.borderColor = borderColors;
                            datasets.push(ds);
                        }
                    } else {
                        // For multi-series, rotate colors starting with base
                        if (c === col1 + 1) {
                            const r = parseInt(baseColor.slice(1, 3), 16);
                            const g = parseInt(baseColor.slice(3, 5), 16);
                            const b = parseInt(baseColor.slice(5, 7), 16);
                            ds.backgroundColor = `rgba(${r}, ${g}, ${b}, 0.5)`;
                            ds.borderColor = baseColor;
                        } else {
                            ds.backgroundColor = backgroundColors[colorIdx];
                            ds.borderColor = borderColors[colorIdx];
                        }
                        datasets.push(ds);
                    }
                }
            }

            // Determine chart type for Chart.js
            let chartType = type;
            if (type === 'grouped' || type === 'stacked') {
                chartType = 'bar';
            }

            // Chart.js Configuration
            const config = {
                type: (chartType === 'bar' && options.orientation === 'horizontal') ? 'bar' : chartType,
                data: {
                    labels: labels,
                    datasets: datasets
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    indexAxis: options.orientation === 'horizontal' ? 'y' : 'x',
                    plugins: {
                        title: {
                            display: !!options.title,
                            text: options.title,
                            font: { size: 16 }
                        },
                        legend: {
                            position: 'top',
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            stacked: type === 'stacked',
                            display: !['pie', 'doughnut', 'polarArea', 'radar'].includes(type),
                            title: {
                                display: !!options.ylabel,
                                text: options.ylabel
                            }
                        },
                        x: {
                            stacked: type === 'stacked',
                            display: !['pie', 'doughnut', 'polarArea', 'radar'].includes(type),
                            title: {
                                display: !!options.xlabel,
                                text: options.xlabel
                            }
                        }
                    }
                }
            };

            // Specific tweaks
            if (type === 'scatter') {
                // Remove black border if any
                config.options.elements = {
                    point: {
                        radius: 5,
                        hoverRadius: 7
                    }
                };
            }

            if (this.currentChart) {
                this.currentChart.destroy();
            }

            this.currentChart = new Chart(ctx, config);
        },

        /**
         * Plot a histogram from the data range
         */
        plotHistogram: function (dataRange, title, xlabel, ylabel) {
            const spreadsheet = SocialCalc.GetSpreadsheetControlObject();
            const graphContainer = document.getElementById('graph-content-container');

            if (!spreadsheet || !graphContainer) {
                console.error('Spreadsheet or graph container not found');
                return;
            }

            // Parse the range
            const prange = SocialCalc.ParseRange(dataRange);
            const range = {};

            if (prange.cr1.col <= prange.cr2.col) {
                range.left = prange.cr1.col;
                range.right = prange.cr2.col;
            } else {
                range.left = prange.cr2.col;
                range.right = prange.cr1.col;
            }

            if (prange.cr1.row <= prange.cr2.row) {
                range.top = prange.cr1.row;
                range.bottom = prange.cr2.row;
            } else {
                range.top = prange.cr2.row;
                range.bottom = prange.cr1.row;
            }

            // Collect numeric values from the range
            const values = [];
            const byrow = (range.left === range.right);
            const nitems = byrow ? (range.bottom - range.top + 1) : (range.right - range.left + 1);

            for (let i = 0; i < nitems; i++) {
                const cr = byrow
                    ? SocialCalc.rcColname(range.left) + (i + range.top)
                    : SocialCalc.rcColname(i + range.left) + range.top;

                const cell = spreadsheet.sheet.GetAssuredCell(cr);
                if (cell.valuetype.charAt(0) === 'n') {
                    values.push(cell.datavalue - 0);
                }
            }

            if (values.length === 0) {
                graphContainer.innerHTML = '<div class="graph-placeholder"><p>No numeric data found in range</p></div>';
                return;
            }

            // Calculate bins using Sturges' rule
            const numBins = Math.ceil(Math.log2(values.length) + 1);
            const minVal = Math.min(...values);
            const maxVal = Math.max(...values);
            const binWidth = (maxVal - minVal) / numBins;

            // Create bins
            const bins = new Array(numBins).fill(0);
            const binLabels = [];

            for (let i = 0; i < numBins; i++) {
                const binStart = minVal + i * binWidth;
                const binEnd = minVal + (i + 1) * binWidth;
                binLabels.push(`${binStart.toFixed(1)} -${binEnd.toFixed(1)} `);
            }

            // Count values in each bin
            values.forEach(val => {
                let binIndex = Math.floor((val - minVal) / binWidth);
                if (binIndex === numBins) binIndex = numBins - 1; // Handle max value
                bins[binIndex]++;
            });

            // Create canvas and render histogram
            const canvasHTML = `
        <canvas id="histogramCanvas" width="500" height="400" style="border: 1px solid #ccc;"></canvas>
            `;

            graphContainer.innerHTML = canvasHTML;

            const canvas = document.getElementById('histogramCanvas');
            const ctx = canvas.getContext('2d');

            // Drawing parameters
            const padding = 50;
            const chartWidth = canvas.width - 2 * padding;
            const chartHeight = canvas.height - 2 * padding;
            const barWidth = chartWidth / numBins;
            const maxFreq = Math.max(...bins);
            const yScale = chartHeight / maxFreq;

            // Draw axes
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(padding, padding);
            ctx.lineTo(padding, canvas.height - padding);
            ctx.lineTo(canvas.width - padding, canvas.height - padding);
            ctx.stroke();

            // Draw bars
            ctx.fillStyle = '#4285f4';
            bins.forEach((freq, i) => {
                const barHeight = freq * yScale;
                const x = padding + i * barWidth;
                const y = canvas.height - padding - barHeight;

                ctx.fillRect(x, y, barWidth - 2, barHeight);

                // Draw bin label
                ctx.save();
                ctx.font = '10px Arial';
                ctx.fillStyle = '#000';
                ctx.translate(x + barWidth / 2, canvas.height - padding + 15);
                ctx.rotate(-Math.PI / 4);
                ctx.textAlign = 'right';
                ctx.fillText(binLabels[i], 0, 0);
                ctx.restore();

                // Draw frequency on top of bar
                ctx.fillStyle = '#000';
                ctx.font = '12px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(freq, x + barWidth / 2, y - 5);
            });

            // Draw title
            if (title) {
                ctx.font = 'bold 16px Arial';
                ctx.textAlign = 'center';
                ctx.fillStyle = '#000';
                ctx.fillText(title, canvas.width / 2, 20);
            }

            // Draw axis labels
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            if (xlabel) {
                ctx.fillText(xlabel, canvas.width / 2, canvas.height - 5);
            }
            if (ylabel) {
                ctx.save();
                ctx.translate(15, canvas.height / 2);
                ctx.rotate(-Math.PI / 2);
                ctx.fillText(ylabel, 0, 0);
                ctx.restore();
            }
        },

        /**
         * Reset to ribbon view
         */
        reset: function () {
            this.restoreSpreadsheet();
            this.showRibbon();
            this.selectedType = null;
        }
    };

    // Initialize and hook into SocialCalc
    function installSocialCalcHook() {
        if (typeof SocialCalc === 'undefined' || !SocialCalc.SetTab) {
            return false;
        }

        // Avoid double hooking
        if (SocialCalc.SetTab.isGraphHooked) {
            return true;
        }

        // Will be called from the graph tab onclick handler
        window.GraphLayout.initOnTabClick = function () {
            // Find the graph tools container
            const graphTools = document.querySelector('[id$="graphtools"]');
            if (graphTools) {
                // Insert our layout inside the graph tools so it shows/hides with the tab
                if (!document.getElementById('graph-layout-container')) {
                    const container = document.createElement('div');
                    container.id = 'graph-layout-container';
                    graphTools.appendChild(container);

                    // Initialize only once
                    window.GraphLayout.init('graph-layout-container');
                } else {
                    // If already initialized, ensure spreadsheet is in the correct panel
                    // This is critical when returning to Graph tab
                    window.GraphLayout.moveSpreadsheetToPanel();
                }

                // CRITICAL: Ensure spreadsheet is visible every time Graph tab is activated
                const spreadsheet = window.spreadsheet;
                if (spreadsheet && spreadsheet.editorDiv) {
                    spreadsheet.editorDiv.style.display = 'block';
                }

                // Hide formula bar and search box in Graph tab
                // Use robust ID selection
                const idPrefix = (spreadsheet && spreadsheet.idPrefix) ? spreadsheet.idPrefix : 'SocialCalc-';
                const formulabarDiv = document.getElementById(idPrefix + 'formulabarDiv');
                const searchbar = document.getElementById('searchbar');

                if (formulabarDiv) {
                    formulabarDiv.style.display = 'none';
                } else {
                    // Fallback: try suffix selector again but with !important via class
                    document.body.classList.add('graph-mode-active');
                }

                if (searchbar) {
                    searchbar.style.display = 'none';
                }
            }
        };

        // Hook into SocialCalc.SetTab to detect when Graph tab is activated/deactivated
        let previousTab = '';
        const originalSetTab = SocialCalc.SetTab;

        SocialCalc.SetTab = function (tab) {
            // Check current tab before switching
            let tabName = '';
            if (typeof tab === 'string') {
                tabName = tab;
            } else if (tab && tab.id) {
                // Extract name from id (e.g., "SocialCalc-id-graphtab" -> "graph")
                const match = tab.id.match(/-([a-z]+)tab$/);
                if (match) {
                    tabName = match[1];
                }
            }

            // When leaving Graph tab, restore spreadsheet to original container
            const currentTabElement = document.querySelector('[id$="graphtab"]');
            const isCurrentlyGraphTab = currentTabElement && currentTabElement.style.cssText &&
                (currentTabElement.style.cssText.includes('background-color:#404040') ||
                    currentTabElement.style.cssText.includes('background-color: rgb(64, 64, 64)'));

            if (isCurrentlyGraphTab && tabName !== 'graph') {
                window.GraphLayout && window.GraphLayout.restoreSpreadsheet && window.GraphLayout.restoreSpreadsheet();

                // Restore formula bar and search box
                const spreadsheet = window.spreadsheet;
                const idPrefix = (spreadsheet && spreadsheet.idPrefix) ? spreadsheet.idPrefix : 'SocialCalc-';
                const formulabarDiv = document.getElementById(idPrefix + 'formulabarDiv');
                const searchbar = document.getElementById('searchbar');

                if (formulabarDiv) {
                    formulabarDiv.style.display = '';
                }
                document.body.classList.remove('graph-mode-active');

                if (searchbar) {
                    searchbar.style.display = '';
                }
            }

            // Call original function
            const ret = originalSetTab.apply(this, arguments);

            // When entering Graph tab, initialize
            if (tabName === 'graph') {
                if (window.GraphLayout && window.GraphLayout.initOnTabClick) {
                    window.GraphLayout.initOnTabClick();
                }
            }

            previousTab = tabName;

            return ret;
        };

        SocialCalc.SetTab.isGraphHooked = true;
        //console.log('[GraphLayout] SocialCalc.SetTab hooked successfully');
        return true;
    }

    // Try to install hook immediately
    if (!installSocialCalcHook()) {
        // If not ready, poll until ready
        const checkInterval = setInterval(() => {
            if (installSocialCalcHook()) {
                clearInterval(checkInterval);
            }
        }, 100);
    }

})();
