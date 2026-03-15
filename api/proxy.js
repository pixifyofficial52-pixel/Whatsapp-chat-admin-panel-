const axios = require('axios');

// ========== CONFIGURATION ==========
const MAIN_APP_URL = 'https://live-whats-chatting-production.up.railway.app';
const ADMIN_API_KEY = 'hjchat-admin-secret-key-2024';
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin123';

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
    if (req.url === '/login' && req.method === 'POST') {
        const { username, password } = req.body || {};
        
        if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
            return res.status(200).json({ 
                success: true, 
                token: 'admin-token-' + Date.now() 
            });
        } else {
            return res.status(401).json({ 
                success: false, 
                error: 'Invalid credentials' 
            });
        }
    }

    // Check authentication for other endpoints
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    // ========== USERS ENDPOINT ==========
    if (req.url === '/users' || req.url.endsWith('/users')) {
        try {
            const response = await axios({
                method: 'GET',
                url: `${MAIN_APP_URL}/api/admin/users`,
                headers: { 'x-api-key': ADMIN_API_KEY },
                timeout: 5000
            });
            return res.status(200).json(response.data);
        } catch (error) {
            // Return sample data if main app fails
            return res.status(200).json([
                {
                    userId: 'user_001',
                    name: 'John Doe',
                    online: true,
                    deviceId: 'Android',
                    lastSeen: new Date().toISOString(),
                    joined: '2024-01-01'
                },
                {
                    userId: 'user_002',
                    name: 'Jane Smith',
                    online: false,
                    deviceId: 'iPhone',
                    lastSeen: new Date().toISOString(),
                    joined: '2024-01-15'
                },
                {
                    userId: 'user_003',
                    name: 'Bob Wilson',
                    online: true,
                    deviceId: 'Web',
                    lastSeen: new Date().toISOString(),
                    joined: '2024-02-01'
                }
            ]);
        }
    }

    // ========== STATS ENDPOINT ==========
    if (req.url === '/stats' || req.url.endsWith('/stats')) {
        try {
            const response = await axios({
                method: 'GET',
                url: `${MAIN_APP_URL}/api/admin/stats`,
                headers: { 'x-api-key': ADMIN_API_KEY },
                timeout: 5000
            });
            return res.status(200).json(response.data);
        } catch (error) {
            return res.status(200).json({
                totalUsers: 3,
                onlineUsers: 2,
                totalMessages: 150,
                callsToday: 5,
                totalFiles: 12,
                blockedUsers: 1
            });
        }
    }

    // ========== FORWARD OTHER REQUESTS ==========
    try {
        const response = await axios({
            method: req.method,
            url: `${MAIN_APP_URL}/api/admin${req.url}`,
            data: req.method !== 'GET' ? req.body : undefined,
            headers: { 'x-api-key': ADMIN_API_KEY },
            timeout: 5000
        });
        return res.status(response.status).json(response.data);
    } catch (error) {
        return res.status(500).json({ error: 'Main app not responding' });
    }
};
