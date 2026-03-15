// ========== GLOBAL VARIABLES ==========
let authToken = null;
let allUsers = [];

// ========== LOGIN ==========
async function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            authToken = data.token;
            document.getElementById('loginScreen').style.display = 'none';
            document.getElementById('dashboard').classList.add('active');
            loadDashboard();
            showToast('Login successful!', 'success');
        } else {
            showToast('Invalid credentials', 'error');
        }
    } catch (error) {
        showToast('Connection error', 'error');
    }
}

// ========== LOGOUT ==========
function logout() {
    authToken = null;
    document.getElementById('dashboard').classList.remove('active');
    document.getElementById('loginScreen').style.display = 'flex';
}

// ========== LOAD DASHBOARD ==========
async function loadDashboard() {
    // Load users
    const users = await apiCall('/users');
    if (users) {
        allUsers = users;
        displayRecentUsers(users.slice(0, 5));
        displayAllUsers(users);
        document.getElementById('totalUsers').innerText = users.length;
        document.getElementById('onlineUsers').innerText = users.filter(u => u.online).length;
    }
    
    // Load stats
    const stats = await apiCall('/stats');
    if (stats) {
        document.getElementById('totalUsers').innerText = stats.totalUsers || 0;
        document.getElementById('onlineUsers').innerText = stats.onlineUsers || 0;
        document.getElementById('totalMessages').innerText = stats.totalMessages || 0;
        document.getElementById('callsToday').innerText = stats.callsToday || 0;
        document.getElementById('totalFiles').innerText = stats.totalFiles || 0;
        document.getElementById('blockedUsers').innerText = stats.blockedUsers || 0;
    }
}

// ========== DISPLAY USERS ==========
function displayRecentUsers(users) {
    let html = '';
    users.forEach(user => {
        html += `
            <tr>
                <td>${user.userId ? user.userId.substring(0,8)+'...' : 'N/A'}</td>
                <td>${user.name || 'Unknown'}</td>
                <td><span class="status-badge ${user.online ? 'status-online' : 'status-offline'}">${user.online ? 'Online' : 'Offline'}</span></td>
                <td>${user.deviceId || 'N/A'}</td>
                <td>${user.lastSeen ? new Date(user.lastSeen).toLocaleString() : 'Just now'}</td>
                <td>
                    <button class="action-btn view" onclick="viewUser('${user.userId}')">👁️</button>
                    <button class="action-btn block" onclick="blockUser('${user.userId}')">🚫</button>
                </td>
            </tr>
        `;
    });
    document.getElementById('recentUsersBody').innerHTML = html || '<tr><td colspan="6" class="loading-row">No users</td></tr>';
}

function displayAllUsers(users) {
    let html = '';
    users.forEach(user => {
        html += `
            <tr>
                <td>${user.userId || 'N/A'}</td>
                <td>${user.name || 'Unknown'}</td>
                <td><span class="status-badge ${user.online ? 'status-online' : 'status-offline'}">${user.online ? 'Online' : 'Offline'}</span></td>
                <td>${user.deviceId || 'N/A'}</td>
                <td>${user.joined || 'N/A'}</td>
                <td>${user.lastSeen ? new Date(user.lastSeen).toLocaleString() : 'Just now'}</td>
                <td>
                    <button class="action-btn view" onclick="viewUser('${user.userId}')">👁️</button>
                    <button class="action-btn block" onclick="blockUser('${user.userId}')">🚫</button>
                </td>
            </tr>
        `;
    });
    document.getElementById('usersBody').innerHTML = html || '<tr><td colspan="7" class="loading-row">No users</td></tr>';
}

// ========== API CALL ==========
async function apiCall(endpoint) {
    if (!authToken) return null;
    
    try {
        const response = await fetch(`/api${endpoint}`, {
            headers: { 'Authorization': 'Bearer ' + authToken }
        });
        return await response.json();
    } catch (error) {
        console.log('API error:', error);
        return null;
    }
}

// ========== SEARCH ==========
function searchUsers() {
    const query = document.getElementById('searchUsers').value.toLowerCase();
    const filtered = allUsers.filter(u => 
        (u.name && u.name.toLowerCase().includes(query)) ||
        (u.userId && u.userId.toLowerCase().includes(query))
    );
    displayRecentUsers(filtered.slice(0, 5));
}

function searchAllUsers() {
    const query = document.getElementById('searchAllUsers').value.toLowerCase();
    const filtered = allUsers.filter(u => 
        (u.name && u.name.toLowerCase().includes(query)) ||
        (u.userId && u.userId.toLowerCase().includes(query))
    );
    displayAllUsers(filtered);
}

// ========== USER ACTIONS ==========
function viewUser(userId) {
    const user = allUsers.find(u => u.userId === userId);
    alert(`User: ${user?.name}\nID: ${userId}\nStatus: ${user?.online ? 'Online' : 'Offline'}`);
}

function blockUser(userId) {
    if (confirm(`Block user ${userId}?`)) {
        alert('User blocked (demo)');
    }
}

// ========== SECTION CHANGE ==========
function showSection(section) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById(`section-${section}`).classList.add('active');
    
    if (section === 'users') loadDashboard();
    if (section === 'calls') loadCalls();
    if (section === 'files') loadFiles();
}

// ========== LOAD CALLS ==========
async function loadCalls() {
    const calls = await apiCall('/calls');
    let html = '';
    if (calls && calls.length > 0) {
        calls.forEach(call => {
            html += `<tr><td>${call.caller}</td><td>${call.receiver}</td><td>${call.type}</td><td>${call.duration || '-'}</td><td>${call.status}</td><td>${new Date(call.timestamp).toLocaleString()}</td></tr>`;
        });
    } else {
        html = '<tr><td colspan="6" class="loading-row">No calls</td></tr>';
    }
    document.getElementById('callsBody').innerHTML = html;
}

// ========== LOAD FILES ==========
async function loadFiles() {
    const files = await apiCall('/files');
    let html = '';
    if (files && files.length > 0) {
        files.forEach(file => {
            html += `<tr><td>${file.name}</td><td>${(file.size/1024/1024).toFixed(2)} MB</td><td>${new Date(file.uploaded).toLocaleString()}</td><td><a href="${file.url}" target="_blank" class="action-btn view">👁️</a></td></tr>`;
        });
    } else {
        html = '<tr><td colspan="4" class="loading-row">No files</td></tr>';
    }
    document.getElementById('filesBody').innerHTML = html;
}

// ========== SETTINGS ==========
function saveSettings() {
    alert('Settings saved (demo)');
}

// ========== TOAST ==========
function showToast(message, type) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i><span>${message}</span>`;
    document.getElementById('toastContainer').appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}
