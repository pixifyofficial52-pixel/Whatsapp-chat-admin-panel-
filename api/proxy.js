const axios = require('axios');

// ========== CONFIGURATION ==========
const MAIN_APP_URL = 'https://live-whats-chatting-production.up.railway.app';
const ADMIN_API_KEY = 'hjchat-admin-secret-key-2024';

module.exports = async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // ========== LOGIN ENDPOINT ==========
    if (req.url === '/login' || req.url === '/api/login') {
        console.log('🔐 Login request received');
        
        if (req.method === 'POST') {
            const { username, password } = req.body || {};
            
            if (username === 'admin' && password === 'admin123') {
                console.log('✅ Login successful');
                return res.status(200).json({
                    success: true,
                    token: 'admin-token-' + Date.now()
                });
            } else {
                console.log('❌ Login failed');
                return res.status(401).json({ 
                    success: false, 
                    error: 'Invalid credentials' 
                });
            }
        }
    }

    // Check auth for other endpoints
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('❌ No auth token');
        return res.status(401).json({ error: 'Unauthorized - No token' });
    }

    // ========== FORWARD TO MAIN APP WITH API KEY ==========
    try {
        console.log(`🔄 Forwarding: ${req.method} ${req.url} to main app`);
        console.log(`🔑 Using API Key: ${ADMIN_API_KEY}`);

        const response = await axios({
            method: req.method,
            url: `${MAIN_APP_URL}/api/admin${req.url}`,
            data: req.method !== 'GET' ? req.body : undefined,
            headers: {
                'x-api-key': ADMIN_API_KEY,
                'Content-Type': 'application/json'
            },
            timeout: 10000
        });

        console.log(`✅ Main app responded with status: ${response.status}`);
        
        // Cache-Control headers hatao taake fresh data aaye
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        
        return res.status(response.status).json(response.data);

    } catch (error) {
        console.error('❌ Proxy error:', error.message);
        
        if (error.response) {
            // Main app responded with error
            console.error('Main app error status:', error.response.status);
            console.error('Main app error data:', error.response.data);
            
            return res.status(error.response.status).json({
                error: 'Main app error',
                status: error.response.status,
                details: error.response.data
            });
        } else if (error.request) {
            // No response from main app
            return res.status(503).json({ 
                error: 'Main app not responding',
                message: 'Check if Railway app is running',
                url: MAIN_APP_URL
            });
        } else {
            // Other error
            return res.status(500).json({ 
                error: 'Proxy error',
                message: error.message
            });
        }
    }
};
