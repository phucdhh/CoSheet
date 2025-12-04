// AI Assistant API Proxy
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

module.exports = function(app, basepath) {
    const endpoint = (basepath || '') + '/api/ai/chat';
    
    app.post(endpoint, (req, res) => {
        console.log('[AI Proxy] Received request');
        
        // Load AI config
        const configPath = path.join(__dirname, 'static/AI-help/ai.conf');
        
        if (!fs.existsSync(configPath)) {
            console.error('[AI Proxy] Config file not found');
            return res.status(500).json({ error: 'AI configuration not found' });
        }
        
        let config;
        try {
            config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        } catch (err) {
            console.error('[AI Proxy] Config parse error:', err);
            return res.status(500).json({ error: 'Invalid AI configuration' });
        }
        
        if (!config.enabled || !config.apiKey || config.apiKey === 'YOUR_GROQ_API_KEY_HERE') {
            console.error('[AI Proxy] Config not properly set');
            return res.status(500).json({ error: 'AI service not configured' });
        }
        
        const userMessage = req.body.message;
        if (!userMessage) {
            return res.status(400).json({ error: 'Message is required' });
        }
        
        console.log('[AI Proxy] Forwarding to Groq API...');
        
        // Forward request to Groq
        fetch(config.apiEndpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${config.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: config.model,
                messages: [
                    {
                        role: 'system',
                        content: req.body.systemPrompt || ''
                    },
                    {
                        role: 'user',
                        content: userMessage
                    }
                ],
                temperature: config.temperature || 0.3,
                max_tokens: config.maxTokens || 500
            })
        })
        .then(response => {
            console.log('[AI Proxy] Groq responded:', response.status);
            return response.json();
        })
        .then(data => {
            console.log('[AI Proxy] Sending response to client');
            res.json(data);
        })
        .catch(err => {
            console.error('[AI Proxy] Error:', err.message);
            res.status(500).json({ error: 'Failed to connect to AI service: ' + err.message });
        });
    });
    
    console.log(`AI Assistant API endpoint registered: POST ${endpoint}`);
};
