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
        // Create sidebar HTML
        const sidebar = document.createElement('div');
        sidebar.className = 'ai-assistant-sidebar';
        sidebar.innerHTML = `
            <div class="ai-assistant-header">
                <div class="ai-assistant-title">AI Assistant</div>
                <button class="ai-assistant-close" onclick="aiAssistant.close()">×</button>
            </div>
            <div class="ai-assistant-body">
                <div class="ai-input-section">
                    <label class="ai-input-label">Nhập yêu cầu cho ô mà bạn đang chọn:</label>
                    <textarea 
                        id="ai-input-box" 
                        class="ai-input-box" 
                        placeholder="Ví dụ: Tính trung bình cộng các điểm từ B2 đến B36"
                    ></textarea>
                    <button class="ai-send-button" onclick="aiAssistant.sendRequest()">Gửi</button>
                </div>
                
                <div id="ai-loading" class="ai-loading">
                    <div class="ai-loading-spinner"></div>
                    <span>Đang suy nghĩ...</span>
                </div>
                
                <div id="ai-error" class="ai-error"></div>
                
                <div id="ai-response-section" class="ai-response-section">
                    <div class="ai-prompt-echo">
                        <strong>Lệnh gợi ý:</strong> <span id="ai-prompt-text"></span>
                    </div>
                    
                    <div class="ai-formula-box">
                        <div id="ai-formula-code" class="ai-formula-code"></div>
                    </div>
                    
                    <div class="ai-explanation-box">
                        <div class="ai-formula-label">Giải thích:</div>
                        <div id="ai-explanation-text" class="ai-explanation-text"></div>
                    </div>
                    
                    <div class="ai-action-buttons">
                        <button class="ai-button ai-button-secondary" onclick="aiAssistant.close()">
                            Để tôi suy nghĩ đã
                        </button>
                        <button class="ai-button ai-button-primary" onclick="aiAssistant.insertFormula()">
                            Chèn ngay
                        </button>
                    </div>
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
                // Prevent event from bubbling to spreadsheet
                e.stopPropagation();
                
                if (e.key === 'Enter' && e.ctrlKey) {
                    this.sendRequest();
                }
            });
            
            // Also stop propagation on keypress and keyup
            inputBox.addEventListener('keypress', (e) => e.stopPropagation());
            inputBox.addEventListener('keyup', (e) => e.stopPropagation());
        }
    }
    
    open() {
        if (!this.sidebar) return;
        
        // Get current selected cell
        if (window.spreadsheet && window.spreadsheet.editor) {
            const ecell = window.spreadsheet.editor.ecell;
            if (ecell) {
                this.currentCell = ecell.coord;
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
        return `Bạn là trợ lý AI chuyên về công thức Excel/Google Sheets dành cho học sinh và giáo viên Việt Nam.

NHIỆM VỤ:
- Luôn trả lời bằng tiếng Việt dễ hiểu, thân thiện
- Tạo công thức Excel/Google Sheets chính xác
- Giải thích ngắn gọn, dễ hiểu
- Ưu tiên các hàm thống kê phổ biến

OUTPUT FORMAT (BẮT BUỘC JSON):
{
  "formula": "=AVERAGE(B2:B36)",
  "explanation": "Tính trung bình cộng các điểm từ ô B2 đến B36. Kết quả sẽ là giá trị trung bình của tất cả các số trong phạm vi này."
}

CHÚ Ý:
- Formula PHẢI bắt đầu bằng dấu =
- Sử dụng tên hàm tiếng Anh chuẩn Excel
- Giải thích phải rõ ràng, cụ thể
- Chỉ trả về JSON, không có text nào khác`;
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
        
        this.hideResponse();
        this.showLoading(true);
        
        try {
            // Load config from server
            const configResponse = await fetch('./static/AI-help/ai.conf');
            const config = await configResponse.json();
            
            if (!config.apiKey || config.apiKey === 'YOUR_GROQ_API_KEY_HERE') {
                throw new Error('API key not configured');
            }
            
            // Call Groq API directly (temporary - should use proxy in production)
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
                            role: 'system',
                            content: this.getSystemPrompt()
                        },
                        {
                            role: 'user',
                            content: userPrompt
                        }
                    ],
                    temperature: config.temperature || 0.3,
                    max_tokens: config.maxTokens || 500
                })
            });
            
            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            const aiResponse = data.choices[0]?.message?.content;
            
            if (!aiResponse) {
                throw new Error('Không nhận được phản hồi từ AI');
            }
            
            // Parse JSON response
            const result = JSON.parse(aiResponse);
            
            this.showResponse(
                userPrompt,
                result.formula || '=ERROR()',
                result.explanation || 'Không có giải thích'
            );
            
        } catch (error) {
            console.error('AI Request Error:', error);
            this.showError(`Lỗi: ${error.message}`);
        } finally {
            this.showLoading(false);
        }
    }
    
    insertFormula() {
        const formulaCode = document.getElementById('ai-formula-code');
        let formula = formulaCode?.textContent;
        
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
                // Set cell content
                const cmd = `set ${this.currentCell} formula ${formula}`;
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
