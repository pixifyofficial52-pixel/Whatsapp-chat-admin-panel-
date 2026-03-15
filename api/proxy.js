const axios = require('axios');

// Your configuration
const MAIN_APP_URL = 'https://live-whats-chatting-production.up.railway.app';
const ADMIN_API_KEY = 'hjchat-admin-secret-key-2024';

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle preflight
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Handle login (no API key needed)
    if (req.url === '/login' && req.method === 'POST') {
        const { username, password } = req.body;
        
        // Admin credentials (change these!)
        if (username === 'admin' && password === 'admin123') {
            res.json({ 
                success: true, 
                token: 'admin-token-' + Date.now() 
            });
        } else {
            res.status(401).json({ success: false, error: 'Invalid credentials' });
        }
        return;
    }

    // Check authentication for other requests
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Unauthorized - Please login' });
        return;
    }

    // Forward request to main app
    try {
        console.log(`Forwarding ${req.method} request to: ${MAIN_APP_URL}/api/admin${req.url}`);
        
        const response = await axios({
            method: req.method,
            url: `${MAIN_APP_URL}/api/admin${req.url}`,
            data: req.body,
            headers: {
                'x-api-key': ADMIN_API_KEY,
                'Content-Type': 'application/json'
            },
            timeout: 10000 // 10 second timeout
        });

        res.status(response.status).json(response.data);
    } catch (error) {
        console.error('Proxy error:', error.message);
        
        if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
            res.status(503).json({ error: 'Main app is offline' });
        } else if (error.response) {
            res.status(error.response.status).json(error.response.data);
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};
