// AI Assistant API Proxy
const fetch = require('node-fetch');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports = function(app, basepath) {
    const endpoint = (basepath || '') + '/api/ai/chat';

    app.post(endpoint, async (req, res) => {
        console.log('[AI Proxy] Received request');

        // Ensure we have parsed JSON body (main.js registers express.json() later).
        // If req.body is undefined, parse raw request body here.
        if (typeof req.body === 'undefined') {
            try {
                let raw = '';
                await new Promise((resolve, reject) => {
                    req.on('data', chunk => raw += chunk);
                    req.on('end', () => resolve());
                    req.on('error', err => reject(err));
                });
                if (raw) {
                    try { req.body = JSON.parse(raw); } catch (e) { req.body = {}; }
                } else {
                    req.body = {};
                }
            } catch (e) {
                console.error('[AI Proxy] Failed to read request body', e && e.message);
                req.body = {};
            }
        }

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

        if (!config.enabled) {
            console.error('[AI Proxy] AI disabled in config');
            return res.status(500).json({ error: 'AI service disabled' });
        }

        // Determine which model to use: request override -> defaultModel -> first model
        const requestedModelId = (req.body && req.body.modelId) || req.query.modelId;
        let modelConfig = null;

        if (requestedModelId && Array.isArray(config.models)) {
            modelConfig = config.models.find(m => m.id === requestedModelId);
        }

        if (!modelConfig && config.defaultModel && Array.isArray(config.models)) {
            modelConfig = config.models.find(m => m.id === config.defaultModel);
        }

        if (!modelConfig && Array.isArray(config.models) && config.models.length > 0) {
            modelConfig = config.models[0];
        }

        if (!modelConfig) {
            console.error('[AI Proxy] No model configuration found');
            return res.status(500).json({ error: 'No AI model configured' });
        }

        const userMessage = (req.body && (req.body.message || req.body.input)) || '';
        if (!userMessage) {
            return res.status(400).json({ error: 'Message is required' });
        }

        const provider = (modelConfig.provider || '').toLowerCase();

        try {
            if (provider === 'groq' || provider === 'openai') {
                // Prepare headers (use model-specific apiKey if present, otherwise top-level)
                const apiKey = modelConfig.apiKey || config.apiKey;
                if (!apiKey) {
                    console.error('[AI Proxy] Groq/OpenAI API key missing');
                    return res.status(500).json({ error: 'AI API key not configured' });
                }

                const endpointUrl = modelConfig.apiEndpoint || config.apiEndpoint;
                console.log(`[AI Proxy] Forwarding to Groq/OpenAI at ${endpointUrl}`);

                const payload = {
                    model: modelConfig.model || config.model,
                    messages: [
                        { role: 'system', content: req.body.systemPrompt || '' },
                        { role: 'user', content: userMessage }
                    ],
                    temperature: modelConfig.temperature || config.temperature || 0.3,
                    max_tokens: modelConfig.maxTokens || config.maxTokens || 500
                };

                const r = await fetch(endpointUrl, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });

                const data = await r.json();
                console.log('[AI Proxy] Response status:', r.status);
                return res.status(r.status).json(data);

            } else if (provider === 'ollama' || provider === 'local') {
                // Forward to local Ollama-like server from server-side (avoids browser CSP and localhost issues)
                let endpointUrl = modelConfig.apiEndpoint || config.apiEndpoint;
                endpointUrl = String(endpointUrl).replace(/\/$/, '');
                const chatUrl = endpointUrl + '/api/chat';
                console.log(`[AI Proxy] Forwarding to Ollama at ${chatUrl}`);

                // Build a generic payload similar to chat completions and request streaming
                const payload = {
                    model: modelConfig.model || modelConfig.id,
                    messages: [
                        { role: 'system', content: req.body.systemPrompt || '' },
                        { role: 'user', content: userMessage }
                    ],
                    stream: true
                };

                const axiosRes = await axios.post(chatUrl, payload, {
                    responseType: 'stream',
                    headers: { 'Content-Type': 'application/json' },
                    // no timeout for long streams
                    timeout: 0
                });

                // Stream NDJSON lines directly back to the client
                res.writeHead(200, {
                    'Content-Type': 'application/x-ndjson; charset=utf-8',
                    'Transfer-Encoding': 'chunked'
                });

                axiosRes.data.on('data', (chunk) => {
                    try {
                        // Forward raw chunk bytes as-is. Ollama sends newline-delimited JSON.
                        res.write(chunk);
                    } catch (e) {
                        console.error('[AI Proxy] Error forwarding chunk:', e && e.message);
                    }
                });

                axiosRes.data.on('end', () => {
                    try { res.end(); } catch (e) { /* ignore */ }
                });

                axiosRes.data.on('error', (err) => {
                    console.error('[AI Proxy] Stream error:', err && err.message);
                    try { res.end(); } catch (e) { /* ignore */ }
                });

                // Don't return here - response will be ended by stream handlers
                return;
            } else {
                console.error('[AI Proxy] Unsupported provider:', provider);
                return res.status(500).json({ error: 'Unsupported AI provider: ' + provider });
            }
        } catch (err) {
            console.error('[AI Proxy] Error forwarding request:', err && err.message);
            return res.status(500).json({ error: 'Failed to connect to AI service: ' + (err && err.message) });
        }
    });

    console.log(`AI Assistant API endpoint registered: POST ${endpoint}`);
};
