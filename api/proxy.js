const axios = require('axios');

// ========== CONFIGURATION ==========
const MAIN_APP_URL = 'https://live-whats-chatting-production.up.railway.app';
const ADMIN_API_KEY = 'hjchat-admin-secret-key-2024';

// Simple hardcoded credentials
const VALID_USERNAME = 'admin';
const VALID_PASSWORD = 'admin123';

module.exports = async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // ========== LOGIN ENDPOINT - SIMPLIFIED ==========
    if (req.url === '/login') {
        console.log('🔐 Login attempt received');
        
        // Only POST allowed
        if (req.method !== 'POST') {
            return res.status(405).json({ 
                success: false, 
                error: 'Method not allowed' 
            });
        }

        try {
            const { username, password } = req.body || {};
            console.log(`Username: ${username}, Password: ${password}`);

            // Direct comparison
            if (username === VALID_USERNAME && password === VALID_PASSWORD) {
                console.log('✅ Login successful');
                return res.status(200).json({
                    success: true,
                    token: 'simple-token-123',
                    message: 'Login successful'
                });
            } else {
                console.log('❌ Login failed');
                return res.status(401).json({
                    success: false,
                    error: 'Invalid credentials'
                });
            }
        } catch (error) {
            console.error('Login error:', error);
            return res.status(500).json({
                success: false,
                error: 'Server error'
            });
        }
    }

    // ========== USERS ENDPOINT ==========
    if (req.url === '/users') {
        // Check token (simplified)
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ error: 'No token' });
        }

        // Return sample users
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
            }
        ]);
    }

    // ========== STATS ENDPOINT ==========
    if (req.url === '/stats') {
        return res.status(200).json({
            totalUsers: 2,
            onlineUsers: 1,
            totalMessages: 50,
            callsToday: 3,
            totalFiles: 8,
            blockedUsers: 0
        });
    }

    // ========== DEFAULT RESPONSE ==========
    return res.status(404).json({ error: 'Endpoint not found' });
};
