/**
 * AI Formula Assistant for CoSheet
 * Uses Groq API to help users create formulas in Vietnamese
 */

class AIFormulaAssistant {
    constructor() {
        this.sidebar = null;
        this.isOpen = false;
        this.currentCell = null;
        this.apiKey = null;
        this.apiEndpoint = 'https://api.groq.com/openai/v1/chat/completions';
        this.model = 'llama-3.3-70b-versatile';
        this.temperature = 0.3;
        this.maxTokens = 500;
        this.configLoaded = false;
        this.conversationHistory = []; // Store conversation history
        this.maxHistoryLength = 10; // Keep last 10 interactions
        this.conversationSummary = null; // Store summarized old conversations
        
        this.init();
    }
    
    init() {
        this.createSidebar();
        this.attachEventListeners();
        this.loadConfig();
    }
    
    async loadConfig() {
        try {
            const response = await fetch('./static/AI-help/ai.conf');
            if (response.ok) {
                const config = await response.json();
                if (config.enabled && config.apiKey && config.apiKey !== 'YOUR_GROQ_API_KEY_HERE') {
                    this.configLoaded = true;
                    console.log('[AI Assistant] Config loaded successfully');
                } else {
                    console.warn('[AI Assistant] Config not properly configured');
                }
            }
        } catch (error) {
            console.error('[AI Assistant] Failed to load config:', error);
        }
    }
    
    createSidebar() {
        // Create sidebar HTML - Messenger style
        const sidebar = document.createElement('div');
        sidebar.className = 'ai-assistant-sidebar';
        sidebar.innerHTML = `
            <div class="ai-assistant-header">
                <div class="ai-assistant-title">AI Assistant</div>
                <button class="ai-assistant-close" onclick="aiAssistant.close()">×</button>
            </div>
            <div class="ai-assistant-body">
                <div id="ai-chat-container" class="ai-chat-container">
                    <div id="ai-loading" class="ai-loading">
                        <div class="ai-loading-spinner"></div>
                        <span>Đang suy nghĩ...</span>
                    </div>
                    
                    <div id="ai-error" class="ai-error"></div>
                </div>
            </div>
            <div class="ai-input-section">
                <label class="ai-input-label">Nhập yêu cầu cho ô mà bạn đang chọn:</label>
                <div class="ai-input-row">
                    <textarea 
                        id="ai-input-box" 
                        class="ai-input-box" 
                        placeholder="Ví dụ: Tính trung bình cộng các điểm từ B2 đến B36"
                        rows="2"
                    ></textarea>
                    <button class="ai-send-button" onclick="aiAssistant.sendRequest()">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <path d="M2 21L23 12L2 3V10L17 12L2 14V21Z" fill="currentColor"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(sidebar);
        this.sidebar = sidebar;
    }
    
    attachEventListeners() {
        // Enter key to send
        const inputBox = document.getElementById('ai-input-box');
        if (inputBox) {
            inputBox.addEventListener('keydown', (e) => {
                // Allow copy/cut/paste shortcuts
                if ((e.ctrlKey || e.metaKey) && ['c', 'x', 'v', 'a'].includes(e.key.toLowerCase())) {
                    // Don't stop propagation for copy/cut/paste/select all
                    return;
                }
                
                // Prevent other events from bubbling to spreadsheet
                e.stopPropagation();
                
                if (e.key === 'Enter' && e.ctrlKey) {
                    this.sendRequest();
                }
            });
            
            // Allow copy/paste on keypress and keyup too
            inputBox.addEventListener('keypress', (e) => {
                if ((e.ctrlKey || e.metaKey) && ['c', 'x', 'v', 'a'].includes(e.key.toLowerCase())) {
                    return;
                }
                e.stopPropagation();
            });
            
            inputBox.addEventListener('keyup', (e) => {
                if ((e.ctrlKey || e.metaKey) && ['c', 'x', 'v', 'a'].includes(e.key.toLowerCase())) {
                    return;
                }
                e.stopPropagation();
            });
        }
    }
    
    open() {
        if (!this.sidebar) return;
        
        // Get current selected cell
        if (window.spreadsheet && window.spreadsheet.editor) {
            const ecell = window.spreadsheet.editor.ecell;
            if (ecell) {
                this.currentCell = ecell.coord;
                // Update label with current cell
                this.updateLabel(ecell.coord);
            }
        }
        
        this.sidebar.classList.add('open');
        this.isOpen = true;
        
        // Focus input
        setTimeout(() => {
            const input = document.getElementById('ai-input-box');
            if (input) input.focus();
        }, 300);
    }
    
    updateLabel(cellCoord) {
        const label = document.querySelector('.ai-input-label');
        if (label && cellCoord) {
            label.textContent = `Nhập yêu cầu cho ô ${cellCoord}:`;
        }
    }
    
    close() {
        if (!this.sidebar) return;
        this.sidebar.classList.remove('open');
        this.isOpen = false;
    }
    
    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }
    
    showLoading(show) {
        const loading = document.getElementById('ai-loading');
        const sendBtn = document.querySelector('.ai-send-button');
        
        if (loading) {
            loading.className = show ? 'ai-loading visible' : 'ai-loading';
        }
        if (sendBtn) {
            sendBtn.disabled = show;
        }
    }
    
    showError(message) {
        const errorBox = document.getElementById('ai-error');
        if (errorBox) {
            errorBox.textContent = message;
            errorBox.className = 'ai-error visible';
            
            setTimeout(() => {
                errorBox.className = 'ai-error';
            }, 5000);
        }
    }
    
    hideResponse() {
        const responseSection = document.getElementById('ai-response-section');
        if (responseSection) {
            responseSection.className = 'ai-response-section';
        }
    }
    
    showResponse(prompt, formula, explanation) {
        const responseSection = document.getElementById('ai-response-section');
        const promptText = document.getElementById('ai-prompt-text');
        const formulaCode = document.getElementById('ai-formula-code');
        const explanationText = document.getElementById('ai-explanation-text');
        
        if (promptText) promptText.textContent = prompt;
        if (formulaCode) formulaCode.textContent = formula;
        if (explanationText) explanationText.textContent = explanation;
        
        if (responseSection) {
            responseSection.className = 'ai-response-section visible';
        }
    }
    
    getSystemPrompt() {
        return `Bạn là trợ lý AI chuyên về Excel/Google Sheets dành cho học sinh và giáo viên Việt Nam.

BẠN CÓ THỂ:
1. Tạo CÔNG THỨC (formula) để tính toán
2. Tạo DỮ LIỆU MẪU (data) cho học tập thống kê, thực hành

OUTPUT FORMAT - 2 LOẠI (BẮT BUỘC JSON):

LOẠI 1 - CÔNG THỨC:
{
  "type": "formula",
  "formula": "=AVERAGE(B2:B36)",
  "explanation": "Tính trung bình cộng các điểm từ ô B2 đến B36"
}

LOẠI 2 - DỮ LIỆU MẪU:
{
  "type": "data",
  "data": [
    ["Họ tên", "Toán", "Văn", "Anh"],
    ["Nguyễn Văn A", 8.5, 7.0, 9.0],
    ["Trần Thị B", 9.0, 8.5, 8.0]
  ],
  "explanation": "Dữ liệu mẫu 2 học sinh với 3 môn học. Phù hợp để thực hành tính điểm trung bình, xếp loại, vẽ biểu đồ."
}

QUY TẮC TẠO DỮ LIỆU:
- Dòng đầu tiên là HEADER (tên cột)
- Dữ liệu phải realistic, phù hợp giáo dục Việt Nam
- Số lượng: 10-30 dòng dữ liệu (tùy yêu cầu)
- Phù hợp cho thực hành thống kê: trung bình, độ lệch chuẩn, biểu đồ
- Ưu tiên số liệu về: điểm thi, dân số, kinh tế, khoa học

QUAN TRỌNG:
- Formula PHẢI bắt đầu bằng dấu =
- Response PHẢI là PURE JSON, KHÔNG được có markdown code blocks
- KHÔNG được có \`\`\`json hoặc \`\`\` trong response
- KHÔNG được có bất kỳ text nào ngoài JSON object
- CHỈ trả về JSON object duy nhất, bắt đầu bằng { và kết thúc bằng }
- Phân tích yêu cầu: nếu hỏi về formula thì type="formula", nếu yêu cầu tạo/điền dữ liệu thì type="data"`;
    }
    
    async summarizeOldConversations() {
        try {
            const configResponse = await fetch('./static/AI-help/ai.conf');
            const config = await configResponse.json();
            
            // Get old conversations (all but the last 5)
            const oldConversations = this.conversationHistory.slice(0, -5);
            
            // Build summary request
            const summaryPrompt = `Hãy tóm tắt ngắn gọn các cuộc hội thoại sau về công thức Excel/Google Sheets. Chỉ nêu những yêu cầu chính và công thức đã được tạo:

${oldConversations.map((msg, index) => {
    if (msg.role === 'user') {
        return `Yêu cầu ${Math.floor(index/2) + 1}: ${msg.content}`;
    } else {
        try {
            const parsed = JSON.parse(msg.content);
            return `Công thức: ${parsed.formula}`;
        } catch {
            return '';
        }
    }
}).filter(line => line).join('\n')}

Tóm tắt bằng tiếng Việt, ngắn gọn trong 3-5 câu.`;
            
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${config.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: config.model || 'llama-3.3-70b-versatile',
                    messages: [
                        {
                            role: 'user',
                            content: summaryPrompt
                        }
                    ],
                    temperature: 0.5,
                    max_tokens: 300
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                this.conversationSummary = data.choices[0]?.message?.content || '';
                
                // Keep only the last 5 conversations
                this.conversationHistory = this.conversationHistory.slice(-5);
            }
        } catch (error) {
            console.error('Error summarizing conversations:', error);
            // If summarization fails, just truncate history
            this.conversationHistory = this.conversationHistory.slice(-5);
        }
    }
    
    async sendRequest() {
        const inputBox = document.getElementById('ai-input-box');
        const userPrompt = inputBox?.value.trim();
        
        if (!userPrompt) {
            this.showError('Vui lòng nhập yêu cầu của bạn');
            return;
        }
        
        if (!this.configLoaded) {
            this.showError('Chưa cấu hình AI API Key. Vui lòng liên hệ quản trị viên để cấu hình trong file ai.conf');
            return;
        }
        
        // Add user message bubble
        this.addUserMessage(userPrompt);
        
        // Clear input
        inputBox.value = '';
        
        this.showLoading(true);
        
        try {
            // Check if we need to summarize old conversations
            if (this.conversationHistory.length >= this.maxHistoryLength) {
                await this.summarizeOldConversations();
            }
            
            // Load config from server
            const configResponse = await fetch('./static/AI-help/ai.conf');
            const config = await configResponse.json();
            
            if (!config.apiKey || config.apiKey === 'YOUR_GROQ_API_KEY_HERE') {
                throw new Error('API key not configured');
            }
            
            // Build messages array with history
            const messages = [
                {
                    role: 'system',
                    content: this.getSystemPrompt()
                }
            ];
            
            // Add conversation summary if exists
            if (this.conversationSummary) {
                messages.push({
                    role: 'system',
                    content: `Tóm tắt các cuộc hội thoại trước:\n${this.conversationSummary}`
                });
            }
            
            // Add conversation history
            this.conversationHistory.forEach(msg => {
                messages.push(msg);
            });
            
            // Add current user message
            messages.push({
                role: 'user',
                content: userPrompt
            });
            
            // Call Groq API directly (temporary - should use proxy in production)
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${config.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: config.model || 'llama-3.3-70b-versatile',
                    messages: messages,
                    temperature: config.temperature || 0.3,
                    max_tokens: config.maxTokens || 500
                })
            });
            
            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            let aiResponse = data.choices[0]?.message?.content;
            
            if (!aiResponse) {
                throw new Error('Không nhận được phản hồi từ AI');
            }
            
            // Clean up response - remove markdown code blocks if present
            aiResponse = aiResponse.trim();
            
            // Remove ```json ... ``` or ``` ... ``` wrapper
            if (aiResponse.startsWith('```')) {
                // Find first newline after opening ```
                const firstNewline = aiResponse.indexOf('\n');
                // Find closing ```
                const lastBackticks = aiResponse.lastIndexOf('```');
                
                if (firstNewline > 0 && lastBackticks > firstNewline) {
                    aiResponse = aiResponse.substring(firstNewline + 1, lastBackticks).trim();
                }
            }
            
            console.log('[AI Assistant] Cleaned response:', aiResponse.substring(0, 100) + '...');
            
            // Parse JSON response
            let result;
            try {
                result = JSON.parse(aiResponse);
            } catch (parseError) {
                console.error('[AI Assistant] JSON parse error:', parseError);
                console.error('[AI Assistant] Response was:', aiResponse);
                throw new Error('AI trả về format không đúng. Vui lòng thử lại.');
            }
            
            // Save to conversation history
            this.conversationHistory.push({
                role: 'user',
                content: userPrompt
            });
            this.conversationHistory.push({
                role: 'assistant',
                content: JSON.stringify(result) // Store cleaned JSON
            });
            
            // Handle different response types
            if (result.type === 'data') {
                // Data response - show data preview
                this.addDataMessage(
                    result.explanation || 'Dữ liệu mẫu',
                    result.data || []
                );
            } else {
                // Formula response - show formula
                this.addAIMessage(
                    result.explanation || 'Không có giải thích',
                    result.formula || '=ERROR()'
                );
            }
            
        } catch (error) {
            console.error('AI Request Error:', error);
            this.showError(`Lỗi: ${error.message}`);
        } finally {
            this.showLoading(false);
        }
    }
    
    addUserMessage(text) {
        const chatContainer = document.getElementById('ai-chat-container');
        const messageDiv = document.createElement('div');
        messageDiv.className = 'ai-message ai-message-user';
        messageDiv.innerHTML = `
            <div class="ai-message-bubble ai-bubble-user">
                ${this.escapeHtml(text)}
            </div>
        `;
        chatContainer.appendChild(messageDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }
    
    addAIMessage(explanation, formula) {
        const chatContainer = document.getElementById('ai-chat-container');
        const messageDiv = document.createElement('div');
        messageDiv.className = 'ai-message ai-message-ai';
        
        // Create elements programmatically to avoid HTML escaping issues
        const bubble = document.createElement('div');
        bubble.className = 'ai-message-bubble ai-bubble-ai';
        bubble.textContent = explanation;
        
        const preview = document.createElement('div');
        preview.className = 'ai-formula-preview';
        
        const codeDiv = document.createElement('div');
        codeDiv.className = 'ai-formula-code';
        codeDiv.textContent = formula;
        
        const insertBtn = document.createElement('button');
        insertBtn.className = 'ai-insert-button';
        insertBtn.setAttribute('data-formula', formula); // Store raw formula
        insertBtn.onclick = () => this.insertFormulaFromButton(insertBtn);
        insertBtn.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="currentColor"/>
            </svg>
            Insert
        `;
        
        preview.appendChild(codeDiv);
        preview.appendChild(insertBtn);
        
        bubble.appendChild(preview);
        messageDiv.appendChild(bubble);
        chatContainer.appendChild(messageDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }
    
    addDataMessage(explanation, dataArray) {
        const chatContainer = document.getElementById('ai-chat-container');
        const messageDiv = document.createElement('div');
        messageDiv.className = 'ai-message ai-message-ai';
        
        // Create bubble
        const bubble = document.createElement('div');
        bubble.className = 'ai-message-bubble ai-bubble-ai';
        bubble.textContent = explanation;
        
        // Create data preview table
        const preview = document.createElement('div');
        preview.className = 'ai-data-preview';
        
        const table = document.createElement('table');
        table.className = 'ai-data-table';
        
        // Show first 5 rows as preview
        const previewRows = dataArray.slice(0, 5);
        previewRows.forEach((row, rowIndex) => {
            const tr = document.createElement('tr');
            row.forEach((cell, colIndex) => {
                const td = document.createElement(rowIndex === 0 ? 'th' : 'td');
                td.textContent = cell;
                tr.appendChild(td);
            });
            table.appendChild(tr);
        });
        
        // Add "..." if there are more rows
        if (dataArray.length > 5) {
            const tr = document.createElement('tr');
            const td = document.createElement('td');
            td.colSpan = dataArray[0].length;
            td.textContent = `... và ${dataArray.length - 5} hàng nữa`;
            td.style.textAlign = 'center';
            td.style.fontStyle = 'italic';
            td.style.color = '#888';
            tr.appendChild(td);
            table.appendChild(tr);
        }
        
        preview.appendChild(table);
        
        // Add fill button
        const fillBtn = document.createElement('button');
        fillBtn.className = 'ai-insert-button';
        fillBtn.setAttribute('data-data', JSON.stringify(dataArray)); // Store data
        fillBtn.onclick = () => this.fillDataFromButton(fillBtn);
        fillBtn.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="currentColor"/>
            </svg>
            Điền vào bảng tính
        `;
        
        preview.appendChild(fillBtn);
        
        bubble.appendChild(preview);
        messageDiv.appendChild(bubble);
        chatContainer.appendChild(messageDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }
    
    fillDataFromButton(button) {
        const dataStr = button.getAttribute('data-data');
        
        if (!dataStr) {
            this.showError('Không có dữ liệu để điền');
            return;
        }
        
        try {
            const data = JSON.parse(dataStr);
            const success = this.fillDataToSpreadsheet(data);
            
            if (success) {
                this.showError('✓ Đã điền dữ liệu vào bảng tính');
                setTimeout(() => {
                    this.close();
                }, 1500);
            }
        } catch (error) {
            console.error('[AI Assistant] Error filling data:', error);
            this.showError('Lỗi khi điền dữ liệu');
        }
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    insertFormulaFromButton(button) {
        let formula = button.getAttribute('data-formula');
        
        if (!formula) {
            this.showError('Không có công thức để chèn');
            return;
        }
        
        // Remove leading = if exists (SocialCalc adds it automatically)
        formula = formula.trim();
        if (formula.startsWith('=')) {
            formula = formula.substring(1);
        }
        
        // Insert formula into current cell
        if (window.spreadsheet && window.spreadsheet.editor) {
            const editor = window.spreadsheet.editor;
            
            if (this.currentCell) {
                // Use text command for formulas with special characters
                // Wrap formula in quotes to preserve spaces and special chars
                const cmd = `set ${this.currentCell} formula ${formula}`;
                
                console.log('[AI Assistant] Inserting formula:', formula);
                console.log('[AI Assistant] Command:', cmd);
                
                editor.EditorScheduleSheetCommands(cmd, true, false);
                
                // Success feedback
                this.showError('✓ Đã chèn công thức vào ô ' + this.currentCell);
                
                setTimeout(() => {
                    this.close();
                }, 1500);
            } else {
                this.showError('Không xác định được ô để chèn');
            }
        }
    }
    
    // Find next empty column in spreadsheet
    findNextEmptyColumn() {
        if (!window.spreadsheet || !window.spreadsheet.editor) {
            return 'A';
        }
        
        const sheet = window.spreadsheet.editor.context?.sheetobj?.sheet;
        if (!sheet || !sheet.cells) {
            return 'A'; // Default to column A if sheet not ready
        }
        
        let lastCol = 0;
        
        // Check all cells to find the rightmost column with data
        for (const cellCoord in sheet.cells) {
            const col = SocialCalc.coordToCr(cellCoord).col;
            if (col > lastCol) {
                lastCol = col;
            }
        }
        
        // Return next column (A=1, B=2, etc)
        const nextCol = lastCol + 1;
        return SocialCalc.rcColname(nextCol);
    }
    
    // Fill data array into spreadsheet starting from a cell
    fillDataToSpreadsheet(data, startCell = null) {
        if (!window.spreadsheet || !window.spreadsheet.editor) {
            this.showError('Không thể truy cập spreadsheet');
            return false;
        }
        
        const editor = window.spreadsheet.editor;
        
        // Check if we have the command function
        if (typeof editor.EditorScheduleSheetCommands !== 'function') {
            this.showError('EditorScheduleSheetCommands không khả dụng');
            return false;
        }
        
        // If no startCell specified, find empty column
        if (!startCell) {
            const emptyCol = this.findNextEmptyColumn();
            startCell = `${emptyCol}1`;
        }
        
        // Parse start cell to get row and column
        const startCoord = SocialCalc.coordToCr(startCell);
        let currentRow = startCoord.row;
        const startCol = startCoord.col;
        
        // Build batch command for all cells
        const commands = [];
        
        for (let i = 0; i < data.length; i++) {
            const rowData = data[i];
            for (let j = 0; j < rowData.length; j++) {
                const cellCol = startCol + j;
                const cellRow = currentRow + i;
                const cellCoord = SocialCalc.crToCoord(cellCol, cellRow);
                const value = rowData[j];
                
                // Determine if it's a number or text
                if (typeof value === 'number') {
                    commands.push(`set ${cellCoord} value n ${value}`);
                } else {
                    // Convert to string and escape any existing quotes
                    const textValue = String(value);
                    // Only escape if text contains quotes, otherwise use as-is
                    const escapedValue = textValue.includes('"') ? textValue.replace(/"/g, '\\"') : textValue;
                    commands.push(`set ${cellCoord} text t ${escapedValue}`);
                }
            }
        }
        
        // Execute all commands at once
        // This will automatically initialize sheet if needed
        const batchCmd = commands.join('\n');
        console.log('[AI Assistant] Filling', data.length, 'rows x', data[0]?.length, 'cols from', startCell);
        console.log('[AI Assistant] First command:', commands[0]);
        
        try {
            editor.EditorScheduleSheetCommands(batchCmd, true, false);
            console.log('[AI Assistant] Commands executed successfully');
            return true;
        } catch (error) {
            console.error('[AI Assistant] Error executing commands:', error);
            this.showError('Lỗi khi điền dữ liệu: ' + error.message);
            return false;
        }
    }
    
}

// Initialize global instance immediately
window.aiAssistant = null;

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.aiAssistant = new AIFormulaAssistant();
        console.log('[AI Assistant] Initialized');
    });
} else {
    // DOM already loaded
    window.aiAssistant = new AIFormulaAssistant();
    console.log('[AI Assistant] Initialized');
}
