// ========== Global Variables ==========
let authToken = null;
let allUsers = [];
let autoRefreshInterval = null;

// API Base URL
const API_BASE = '/api';

// ========== Login Function ==========
async function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    try {
        const response = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            authToken = data.token;
            document.getElementById('loginScreen').style.display = 'none';
            document.getElementById('dashboard').classList.add('active');
            
            // Load initial data
            loadDashboardData();
            loadAllUsers();
            loadCallLogs();
            loadFiles();
            populateUserSelect();
            
            // Auto refresh every 30 seconds
            autoRefreshInterval = setInterval(() => {
                if (document.getElementById('section-dashboard').classList.contains('active')) {
                    loadDashboardData();
                } else if (document.getElementById('section-users').classList.contains('active')) {
                    loadAllUsers();
                }
            }, 30000);
            
            showToast('Login successful!', 'success');
        } else {
            document.getElementById('loginError').textContent = 'Invalid credentials';
        }
    } catch (error) {
        document.getElementById('loginError').textContent = 'Connection error';
    }
}

// ========== Logout ==========
function logout() {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
    }
    authToken = null;
    document.getElementById('dashboard').classList.remove('active');
    document.getElementById('loginScreen').style.display = 'flex';
    showToast('Logged out', 'info');
}

// ========== API Helper ==========
async function apiCall(endpoint, method = 'GET', body = null) {
    try {
        const options = {
            method,
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        };
        
        if (body) {
            options.body = JSON.stringify(body);
        }
        
        const response = await fetch(`${API_BASE}${endpoint}`, options);
        
        if (response.status === 401) {
            showToast('Session expired. Please login again.', 'error');
            setTimeout(() => logout(), 2000);
            return null;
        }
        
        return await response.json();
    } catch (error) {
        showToast('API error: ' + error.message, 'error');
        return null;
    }
}

// ========== Dashboard ==========
async function loadDashboardData() {
    const stats = await apiCall('/stats');
    
    if (stats) {
        const statsGrid = document.getElementById('statsGrid');
        statsGrid.innerHTML = `
            <div class="stat-card">
                <div class="stat-info">
                    <h3>Total Users</h3>
                    <div class="stat-number">${stats.totalUsers || 0}</div>
                    <div class="stat-label">registered</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-info">
                    <h3>Online Now</h3>
                    <div class="stat-number">${stats.onlineUsers || 0}</div>
                    <div class="stat-label">active</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-info">
                    <h3>Total Messages</h3>
                    <div class="stat-number">${stats.totalMessages || 0}</div>
                    <div class="stat-label">sent</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-info">
                    <h3>Calls Today</h3>
                    <div class="stat-number">${stats.callsToday || 0}</div>
                    <div class="stat-label">calls</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-info">
                    <h3>Total Files</h3>
                    <div class="stat-number">${stats.totalFiles || 0}</div>
                    <div class="stat-label">uploaded</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-info">
                    <h3>Blocked Users</h3>
                    <div class="stat-number">${stats.blockedUsers || 0}</div>
                    <div class="stat-label">blocked</div>
                </div>
            </div>
        `;
    }
    
    // Load recent users
    if (allUsers.length > 0) {
        displayRecentUsers(allUsers.slice(0, 5));
    }
}

function displayRecentUsers(users) {
    let html = '';
    users.forEach(user => {
        html += `
            <tr>
                <td>${user.userId ? user.userId.substring(0, 8) + '...' : 'N/A'}</td>
                <td>${user.name || 'Unknown'}</td>
                <td><span class="status-badge ${user.online ? 'status-online' : 'status-offline'}">${user.online ? 'Online' : 'Offline'}</span></td>
                <td>${user.deviceId || 'N/A'}</td>
                <td>${user.lastSeen ? new Date(user.lastSeen).toLocaleString() : 'Never'}</td>
                <td>
                    <button class="action-btn view" onclick="viewUser('${user.userId}')"><i class="fas fa-eye"></i></button>
                    <button class="action-btn block" onclick="toggleBlockUser('${user.userId}')"><i class="fas fa-ban"></i></button>
                    <button class="action-btn delete" onclick="deleteUser('${user.userId}')"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `;
    });
    document.getElementById('recentUsersBody').innerHTML = html;
}

// ========== User Management ==========
async function loadAllUsers() {
    const users = await apiCall('/users');
    
    if (users) {
        allUsers = users;
        displayAllUsers(users);
    }
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
                <td>${user.lastSeen ? new Date(user.lastSeen).toLocaleString() : 'Never'}</td>
                <td>
                    <button class="action-btn view" onclick="viewUser('${user.userId}')"><i class="fas fa-eye"></i></button>
                    <button class="action-btn block" onclick="toggleBlockUser('${user.userId}')"><i class="fas fa-ban"></i></button>
                    <button class="action-btn delete" onclick="deleteUser('${user.userId}')"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `;
    });
    document.getElementById('usersBody').innerHTML = html;
}

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

function viewUser(userId) {
    const user = allUsers.find(u => u.userId === userId);
    if (!user) return;
    
    const modalBody = document.getElementById('userModalBody');
    modalBody.innerHTML = `
        <div class="user-detail">
            <label>User ID</label>
            <p>${user.userId || 'N/A'}</p>
        </div>
        <div class="user-detail">
            <label>Name</label>
            <p>${user.name || 'N/A'}</p>
        </div>
        <div class="user-detail">
            <label>Device ID</label>
            <p>${user.deviceId || 'N/A'}</p>
        </div>
        <div class="user-detail">
            <label>Status</label>
            <p><span class="status-badge ${user.online ? 'status-online' : 'status-offline'}">${user.online ? 'Online' : 'Offline'}</span></p>
        </div>
        <div class="user-detail">
            <label>Joined</label>
            <p>${user.joined || 'N/A'}</p>
        </div>
        <div class="user-detail">
            <label>Last Seen</label>
            <p>${user.lastSeen ? new Date(user.lastSeen).toLocaleString() : 'Never'}</p>
        </div>
    `;
    
    document.getElementById('userModal').classList.add('active');
}

function closeModal() {
    document.getElementById('userModal').classList.remove('active');
}

async function toggleBlockUser(userId) {
    if (confirm('Block/unblock this user?')) {
        const result = await apiCall(`/block/${userId}`, 'POST');
        if (result) {
            showToast('User status updated', 'success');
            loadAllUsers();
        }
    }
}

async function deleteUser(userId) {
    if (confirm('Are you sure you want to delete this user? This action cannot be undone!')) {
        const result = await apiCall(`/user/${userId}`, 'DELETE');
        if (result) {
            showToast('User deleted', 'success');
            closeModal();
            loadAllUsers();
            loadDashboardData();
        }
    }
}

// ========== Chat Monitor ==========
async function populateUserSelect() {
    const select = document.getElementById('userSelect');
    let options = '<option value="">Select a user...</option>';
    
    allUsers.forEach(user => {
        options += `<option value="${user.userId}">${user.name} (${user.userId})</option>`;
    });
    
    select.innerHTML = options;
}

async function loadUserChats() {
    const userId = document.getElementById('userSelect').value;
    if (!userId) {
        document.getElementById('chatMessages').innerHTML = '<p class="no-data">Select a user to view chats</p>';
        return;
    }
    
    const messages = await apiCall(`/messages/${userId}`);
    
    if (messages && messages.length > 0) {
        let html = '';
        messages.forEach(msg => {
            html += `
                <div class="chat-message ${msg.type || 'received'}">
                    <div class="message-header">
                        <span>${msg.fromName || 'Unknown'}</span>
                        <span>${msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : ''}</span>
                    </div>
                    <div class="message-text">${msg.message || '[Media message]'}</div>
                    <div class="message-footer">
                        <span>${msg.timestamp ? new Date(msg.timestamp).toLocaleDateString() : ''}</span>
                        <button class="delete-msg-btn" onclick="deleteMessage('${msg.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        });
        document.getElementById('chatMessages').innerHTML = html;
    } else {
        document.getElementById('chatMessages').innerHTML = '<p class="no-data">No messages found</p>';
    }
}

async function deleteMessage(messageId) {
    if (confirm('Delete this message for everyone?')) {
        const result = await apiCall('/message', 'POST', { messageId });
        if (result) {
            showToast('Message deleted', 'success');
            loadUserChats();
        }
    }
}

// ========== Call Logs ==========
async function loadCallLogs() {
    const calls = await apiCall('/calls');
    
    if (calls) {
        let html = '';
        calls.forEach(call => {
            const duration = call.duration ? 
                `${Math.floor(call.duration/60)}:${(call.duration%60).toString().padStart(2,'0')}` : 
                '-';
            
            html += `
                <tr>
                    <td>${call.caller || 'N/A'}</td>
                    <td>${call.receiver || 'N/A'}</td>
                    <td><i class="fas fa-${call.type === 'video' ? 'video' : 'phone'}"></i> ${call.type || 'voice'}</td>
                    <td>${duration}</td>
                    <td><span class="status-badge status-${call.status || 'completed'}">${call.status || 'completed'}</span></td>
                    <td>${call.timestamp ? new Date(call.timestamp).toLocaleString() : 'N/A'}</td>
                </tr>
            `;
        });
        document.getElementById('callsBody').innerHTML = html || '<tr><td colspan="6" class="loading-row">No calls found</td></tr>';
    }
}

// ========== Files ==========
async function loadFiles() {
    const files = await apiCall('/files');
    
    if (files) {
        let html = '';
        files.forEach(file => {
            const sizeMB = (file.size / 1024 / 1024).toFixed(2);
            html += `
                <tr>
                    <td>${file.name || 'N/A'}</td>
                    <td>${sizeMB} MB</td>
                    <td>${file.uploaded ? new Date(file.uploaded).toLocaleString() : 'N/A'}</td>
                    <td>
                        <a href="${file.url || '#'}" target="_blank" class="action-btn view"><i class="fas fa-eye"></i></a>
                        <button class="action-btn delete" onclick="deleteFile('${file.name}')"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `;
        });
        document.getElementById('filesBody').innerHTML = html || '<tr><td colspan="4" class="loading-row">No files found</td></tr>';
    }
}

async function deleteFile(fileName) {
    if (confirm(`Delete ${fileName}?`)) {
        const result = await apiCall(`/file/${encodeURIComponent(fileName)}`, 'DELETE');
        if (result) {
            showToast('File deleted', 'success');
            loadFiles();
        }
    }
}

// ========== Settings ==========
async function saveSettings() {
    const settings = {
        siteName: document.getElementById('siteName').value,
        maintenanceMode: document.getElementById('maintenanceMode').checked,
        enableVoice: document.getElementById('enableVoice').checked,
        enableVideo: document.getElementById('enableVideo').checked
    };
    
    const result = await apiCall('/settings', 'POST', settings);
    if (result) {
        showToast('Settings saved!', 'success');
    }
}

// ========== UI Helpers ==========
function showSection(section) {
    // Update menu
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });
    event.target.closest('.menu-item').classList.add('active');
    
    // Show section
    document.querySelectorAll('.section').forEach(sec => {
        sec.classList.remove('active');
    });
    document.getElementById(`section-${section}`).classList.add('active');
    
    // Load section data if needed
    if (section === 'users') {
        loadAllUsers();
    } else if (section === 'calls') {
        loadCallLogs();
    } else if (section === 'files') {
        loadFiles();
    } else if (section === 'chats') {
        populateUserSelect();
    }
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = 'fa-info-circle';
    if (type === 'success') icon = 'fa-check-circle';
    if (type === 'error') icon = 'fa-times-circle';
    if (type === 'warning') icon = 'fa-exclamation-triangle';
    
    toast.innerHTML = `<i class="fas ${icon}"></i><span>${message}</span>`;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Keyboard shortcut
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'l') {
        e.preventDefault();
        logout();
    }
});
