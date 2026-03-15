const axios = require('axios');

// ========== CONFIGURATION ==========
const MAIN_APP_URL = 'https://live-whats-chatting-production.up.railway.app';
const ADMIN_API_KEY = 'hjchat-admin-secret-key-2024';

// Admin credentials (change in production)
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin123';

// ========== MAIN HANDLER ==========
module.exports = async (req, res) => {
    // Enable CORS for all requests
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // ========== LOGIN ENDPOINT ==========
    // Important: Login endpoint ko sabse pehle handle karo
    if (req.url === '/login' || req.url.endsWith('/login')) {
        // Sirf POST method allow karo
        if (req.method !== 'POST') {
            return res.status(405).json({ 
                success: false, 
                error: 'Method not allowed. Use POST.' 
            });
        }

        try {
            console.log('🔐 Login attempt received');
            console.log('Request body:', req.body);

            const { username, password } = req.body || {};

            // Validate input
            if (!username || !password) {
                console.log('❌ Missing username or password');
                return res.status(400).json({ 
                    success: false, 
                    error: 'Username and password are required' 
                });
            }

            // Check credentials
            if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
                console.log('✅ Login successful for user:', username);
                
                // Generate token
                const token = Buffer.from(`${username}:${Date.now()}`).toString('base64');
                
                return res.status(200).json({
                    success: true,
                    token: token,
                    message: 'Login successful'
                });
            } else {
                console.log('❌ Invalid credentials for user:', username);
                return res.status(401).json({
                    success: false,
                    error: 'Invalid username or password'
                });
            }
        } catch (error) {
            console.error('❌ Login error:', error.message);
            return res.status(500).json({
                success: false,
                error: 'Internal server error during login'
            });
        }
    }

    // ========== API PROXY ENDPOINTS ==========
    // Check authentication for all other endpoints
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('❌ No auth token provided for:', req.url);
        return res.status(401).json({ 
            error: 'Unauthorized - Please login first' 
        });
    }

    // Extract token (optional validation)
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    console.log('🔑 Token received for:', req.url);

    // ========== FORWARD REQUEST TO MAIN APP ==========
    try {
        console.log(`🔄 Forwarding ${req.method} request to main app: ${req.url}`);
        console.log(`📡 Target URL: ${MAIN_APP_URL}/api/admin${req.url}`);

        // Prepare request configuration
        const config = {
            method: req.method,
            url: `${MAIN_APP_URL}/api/admin${req.url}`,
            headers: {
                'x-api-key': ADMIN_API_KEY,
                'Content-Type': req.headers['content-type'] || 'application/json'
            },
            timeout: 15000, // 15 second timeout
            validateStatus: false // Don't throw on any status code
        };

        // Add body for POST/PUT requests
        if (req.method !== 'GET' && req.method !== 'DELETE') {
            config.data = req.body;
        }

        // Make the request
        const response = await axios(config);

        console.log(`✅ Main app responded with status: ${response.status}`);

        // Return the response from main app
        return res.status(response.status).json(response.data);

    } catch (error) {
        console.error('❌ Proxy error:', error.message);

        // Handle different types of errors
        if (error.code === 'ECONNREFUSED') {
            return res.status(503).json({ 
                error: 'Main app is offline or not responding',
                details: 'Connection refused'
            });
        } else if (error.code === 'ENOTFOUND') {
            return res.status(503).json({ 
                error: 'Main app URL could not be resolved',
                details: MAIN_APP_URL
            });
        } else if (error.code === 'ETIMEDOUT') {
            return res.status(504).json({ 
                error: 'Main app request timeout',
                details: 'Server took too long to respond'
            });
        } else if (error.response) {
            // The request was made and the server responded with a status code
            console.error('Response data:', error.response.data);
            return res.status(error.response.status).json({
                error: 'Main app error',
                status: error.response.status,
                details: error.response.data
            });
        } else {
            // Something happened in setting up the request
            return res.status(500).json({ 
                error: 'Internal proxy error',
                details: error.message
            });
        }
    }
};
