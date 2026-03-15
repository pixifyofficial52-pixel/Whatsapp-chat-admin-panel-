const axios = require('axios');

// ========== CONFIGURATION ==========
const MAIN_APP_URL = 'https://live-whats-chatting-production.up.railway.app';
const ADMIN_API_KEY = 'hjchat-admin-secret-key-2024';

module.exports = async (req, res) => {
    // Enable CORS for all requests
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // ========== LOGIN ENDPOINT - SIMPLEST POSSIBLE ==========
    if (req.url === '/login' || req.url === '/api/login') {
        console.log('🔐 Login request received');
        console.log('Method:', req.method);
        console.log('Body:', req.body);
        
        // Allow both GET and POST for testing
        if (req.method === 'POST') {
            const { username, password } = req.body || {};
            
            // Hardcoded check
            if (username === 'admin' && password === 'admin123') {
                return res.status(200).json({
                    success: true,
                    token: 'admin-token-12345',
                    message: 'Login successful'
                });
            } else {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid credentials'
                });
            }
        } else if (req.method === 'GET') {
            // For testing - allow GET with query params
            const username = req.query.username || 'admin';
            const password = req.query.password || 'admin123';
            
            if (username === 'admin' && password === 'admin123') {
                return res.status(200).json({
                    success: true,
                    token: 'admin-token-12345',
                    message: 'Login successful'
                });
            } else {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid credentials'
                });
            }
        }
    }

    // ========== USERS ENDPOINT ==========
    if (req.url === '/users' || req.url === '/api/users') {
        // Check token (simplified)
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ error: 'No token provided' });
        }

        // Return sample users
        return res.status(200).json([
            {
                userId: 'usr_001',
                name: 'John Doe',
                online: true,
                deviceId: 'android_123',
                lastSeen: new Date().toISOString(),
                joined: '2024-01-01'
            },
            {
                userId: 'usr_002',
                name: 'Jane Smith',
                online: false,
                deviceId: 'iphone_456',
                lastSeen: new Date().toISOString(),
                joined: '2024-01-15'
            },
            {
                userId: 'usr_003',
                name: 'Bob Wilson',
                online: true,
                deviceId: 'web_789',
                lastSeen: new Date().toISOString(),
                joined: '2024-02-01'
            }
        ]);
    }

    // ========== STATS ENDPOINT ==========
    if (req.url === '/stats' || req.url === '/api/stats') {
        return res.status(200).json({
            totalUsers: 3,
            onlineUsers: 2,
            totalMessages: 150,
            callsToday: 5,
            totalFiles: 12,
            blockedUsers: 1
        });
    }

    // ========== DEFAULT RESPONSE FOR TESTING ==========
    // Agar koi aur endpoint hit ho to ye response do
    return res.status(200).json({
        message: 'API is working',
        url: req.url,
        method: req.method,
        time: new Date().toISOString()
    });
};
