const axios = require('axios');

// ========== YAHAN PE APNI SAHI INFORMATION DAALO ==========
const MAIN_APP_URL = 'https://live-whats-chatting-production.up.railway.app';
const ADMIN_API_KEY = 'hjchat-admin-secret-key-2024';
// ==========================================================

module.exports = async (req, res) => {
    // CORS headers set karo
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Admin login handle karo
    if (req.url === '/login' && req.method === 'POST') {
        const { username, password } = req.body;
        if (username === 'admin' && password === 'admin123') {
            return res.json({ success: true, token: 'admin-token-' + Date.now() });
        } else {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }
    }

    // API key check karo
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        console.log(`🔄 Forwarding: ${req.method} ${req.url}`);
        console.log(`📡 To: ${MAIN_APP_URL}/api/admin${req.url}`);

        const response = await axios({
            method: req.method,
            url: `${MAIN_APP_URL}/api/admin${req.url}`,
            data: req.body,
            headers: {
                'x-api-key': ADMIN_API_KEY,
                'Content-Type': 'application/json'
            },
            timeout: 10000
        });

        console.log(`✅ Success from main app`);
        return res.status(response.status).json(response.data);

    } catch (error) {
        console.error('❌ Proxy Error:', error.message);
        
        // Detailed error response
        if (error.code === 'ECONNREFUSED') {
            return res.status(503).json({ error: 'Main app is offline (connection refused)' });
        } else if (error.code === 'ENOTFOUND') {
            return res.status(503).json({ error: 'Main app URL not found' });
        } else if (error.response) {
            // The request was made and the server responded with a status code
            return res.status(error.response.status).json({
                error: `Main app error: ${error.response.status}`,
                details: error.response.data
            });
        } else if (error.request) {
            // The request was made but no response was received
            return res.status(504).json({ error: 'Main app not responding (timeout)' });
        } else {
            // Something happened in setting up the request
            return res.status(500).json({ error: 'Proxy error: ' + error.message });
        }
    }
};
