// ========== SIMPLIFIED ADMIN JS ==========
let authToken = null;

// ========== LOGIN FUNCTION ==========
async function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    // Show loading
    const loginBtn = document.querySelector('.login-btn');
    loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
    
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                username: username, 
                password: password 
            })
        });
        
        const data = await response.json();
        console.log('Login response:', data);
        
        if (data.success) {
            authToken = data.token;
            // Hide login screen
            document.getElementById('loginScreen').style.display = 'none';
            document.getElementById('dashboard').classList.add('active');
            // Load data
            loadDashboard();
        } else {
            alert('❌ Login failed: ' + (data.error || 'Invalid credentials'));
            loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login to Dashboard';
        }
    } catch (error) {
        alert('❌ Connection error: ' + error.message);
        loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login to Dashboard';
    }
}

// ========== LOAD DASHBOARD ==========
async function loadDashboard() {
    // Show loading
    document.getElementById('recentUsersBody').innerHTML = '<tr><td colspan="6" class="loading-row">Loading...</td></tr>';
    
    // Load users
    try {
        const response = await fetch('/api/users', {
            headers: { 'Authorization': 'Bearer ' + authToken }
        });
        const users = await response.json();
        
        if (users && users.length > 0) {
            displayUsers(users);
            document.getElementById('totalUsers').innerText = users.length;
            document.getElementById('onlineUsers').innerText = users.filter(u => u.online).length;
        }
    } catch (error) {
        console.log('Error loading users:', error);
    }
    
    // Load stats
    try {
        const response = await fetch('/api/stats', {
            headers: { 'Authorization': 'Bearer ' + authToken }
        });
        const stats = await response.json();
        
        if (stats) {
            document.getElementById('totalUsers').innerText = stats.totalUsers || 0;
            document.getElementById('onlineUsers').innerText = stats.onlineUsers || 0;
            document.getElementById('totalMessages').innerText = stats.totalMessages || 0;
            document.getElementById('callsToday').innerText = stats.callsToday || 0;
            document.getElementById('totalFiles').innerText = stats.totalFiles || 0;
            document.getElementById('blockedUsers').innerText = stats.blockedUsers || 0;
        }
    } catch (error) {
        console.log('Error loading stats:', error);
    }
}

// ========== DISPLAY USERS ==========
function displayUsers(users) {
    let recentHtml = '';
    let allHtml = '';
    
    users.forEach(user => {
        const statusClass = user.online ? 'status-online' : 'status-offline';
        const statusText = user.online ? 'Online' : 'Offline';
        const lastSeen = user.lastSeen ? new Date(user.lastSeen).toLocaleString() : 'Just now';
        
        const row = `
            <tr>
                <td>${user.userId.substring(0,8)}...</td>
                <td>${user.name}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td>${user.deviceId || 'N/A'}</td>
                <td>${lastSeen}</td>
                <td>
                    <button class="action-btn view" onclick="alert('User: ${user.name}')">👁️</button>
                    <button class="action-btn block" onclick="alert('Block ${user.name}')">🚫</button>
                </td>
            </tr>
        `;
        
        recentHtml += row;
        allHtml += row;
    });
    
    document.getElementById('recentUsersBody').innerHTML = recentHtml;
    document.getElementById('usersBody').innerHTML = allHtml;
}

// ========== LOGOUT ==========
function logout() {
    authToken = null;
    document.getElementById('dashboard').classList.remove('active');
    document.getElementById('loginScreen').style.display = 'flex';
}

// ========== SHOW SECTION ==========
function showSection(section) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById(`section-${section}`).classList.add('active');
    
    if (section === 'dashboard') loadDashboard();
}

// ========== SEARCH FUNCTIONS ==========
function searchUsers() {}
function searchAllUsers() {}
function loadCalls() {}
function loadFiles() {}
function saveSettings() { alert('Settings saved'); }
