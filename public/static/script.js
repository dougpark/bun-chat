// public/static/script.js

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const messageContainer = document.getElementById('message-container');
    const postForm = document.getElementById('post-form');
    const postContent = document.getElementById('post-content');
    const activeTagName = document.getElementById('active-tag-name');
    const connectionStatus = document.getElementById('connection-status');
    const zoneList = document.getElementById('zone-list');

    // View Management
    const viewHome = document.getElementById('view-home');
    const viewChat = document.getElementById('view-chat');
    const viewSettings = document.getElementById('view-settings');
    const viewProfile = document.getElementById('view-profile');
    const viewAdmin = document.getElementById('view-admin');
    const viewAdminNav = document.getElementById('view-admin-nav');
    const viewAdminZones = document.getElementById('view-admin-zones');
    const viewZoneEdit = document.getElementById('view-zone-edit');
    const viewAuth = document.getElementById('view-auth');
    const chatHeader = document.getElementById('chat-header');
    const hazardBar = document.getElementById('hazard-bar');
    const navAdmin = document.getElementById('nav-admin');
    const adminUserList = document.getElementById('admin-user-list');
    const adminUserFilter = document.getElementById('admin-user-filter');
    const adminZoneList = document.getElementById('admin-zone-list');
    const adminZoneFilter = document.getElementById('admin-zone-filter');
    const zoneEditForm = document.getElementById('zone-edit-form');

    // Auth Elements
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const authError = document.getElementById('auth-error');
    const profileForm = document.getElementById('profile-form');
    const profileMessage = document.getElementById('profile-message');

    let currentTag = '#general';
    let allTags = [];
    // let allUsers = [];
    let currentUserLevel = 0;
    let allZones = [];
    let currentEditingZoneId = null;

    // Auth Logic
    async function checkAuth() {
        try {
            const res = await fetch('/api/me');
            if (res.ok) {
                viewAuth.classList.add('hidden');

                const user = await res.json();
                currentUserLevel = user.level || 0;

                if ((user.level || 0) >= 2) {
                    navAdmin.classList.remove('hidden');
                } else {
                    navAdmin.classList.add('hidden');
                }

                initWebSocket();
            } else {
                viewAuth.classList.remove('hidden');
            }
        } catch (e) {
            console.error('Auth check failed:', e);
            viewAuth.classList.remove('hidden');
        }
    }

    // Call immediately
    checkAuth();

    window.toggleAuthMode = (mode) => {
        authError.classList.add('hidden');
        authError.textContent = '';
        if (mode === 'register') {
            loginForm.classList.add('hidden');
            registerForm.classList.remove('hidden');
        } else {
            loginForm.classList.remove('hidden');
            registerForm.classList.add('hidden');
        }
    };

    async function handleAuthSubmit(e, url) {
        e.preventDefault();
        authError.classList.add('hidden');

        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());

        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (res.ok) {
                // Success
                viewAuth.classList.add('hidden');
                initWebSocket();
                e.target.reset();
            } else {
                const result = await res.json();
                authError.textContent = result.error || 'Authentication failed';
                authError.classList.remove('hidden');
            }
        } catch (err) {
            authError.textContent = 'Network error occurred';
            authError.classList.remove('hidden');
        }
    }

    loginForm.addEventListener('submit', (e) => handleAuthSubmit(e, '/api/login'));
    registerForm.addEventListener('submit', (e) => handleAuthSubmit(e, '/api/register'));

    // Profile Logic
    window.openProfile = async () => {
        // Close other views
        viewChat.classList.remove('translate-x-0');
        viewChat.classList.add('translate-x-full');
        viewSettings.classList.remove('translate-x-0');
        viewSettings.classList.add('translate-x-full');

        // Close admin if open
        viewAdmin.classList.remove('translate-x-0');
        viewAdmin.classList.add('translate-x-full');

        // Close admin nav if open
        viewAdminNav.classList.remove('translate-x-0');
        viewAdminNav.classList.add('translate-x-full');

        // Close zone admin if open
        viewAdminZones.classList.remove('translate-x-0');
        viewAdminZones.classList.add('translate-x-full');

        // Close zone edit if open
        viewZoneEdit.classList.remove('translate-x-0');
        viewZoneEdit.classList.add('translate-x-full');

        // Open Profile
        viewProfile.classList.remove('translate-x-full');
        viewProfile.classList.add('translate-x-0');

        // Fetch User Data
        try {
            const res = await fetch('/api/me');
            if (res.ok) {
                const user = await res.json();
                const form = document.getElementById('profile-form');
                form.elements['full_name'].value = user.full_name || '';
                form.elements['email'].value = user.email || '';
                form.elements['phone_number'].value = user.phone_number || '';
                form.elements['physical_address'].value = user.physical_address || '';

                // Update Level Display
                const levelDisplay = document.getElementById('profile-level-display');
                if (levelDisplay) {
                    const levels = {
                        0: 'Unverified',
                        1: 'Verified',
                        2: 'Zone Admin',
                        3: 'System Admin'
                    };
                    const level = user.level || 0;
                    levelDisplay.textContent = `${level} - ${levels[level] || 'Unknown'}`;
                }
            }
        } catch (e) {
            console.error('Failed to fetch profile', e);
        }
    };

    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        profileMessage.classList.add('hidden');

        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());

        try {
            const res = await fetch('/api/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (res.ok) {
                profileMessage.textContent = 'Profile updated successfully!';
                profileMessage.className = 'text-center text-sm mt-2 text-green-600 dark:text-green-400';
                profileMessage.classList.remove('hidden');
            } else {
                const result = await res.json();
                profileMessage.textContent = result.error || 'Update failed';
                profileMessage.className = 'text-center text-sm mt-2 text-red-600 dark:text-red-400';
                profileMessage.classList.remove('hidden');
            }
        } catch (err) {
            profileMessage.textContent = 'Network error';
            profileMessage.className = 'text-center text-sm mt-2 text-red-600 dark:text-red-400';
            profileMessage.classList.remove('hidden');
        }
    });

    // Theme Logic
    const html = document.documentElement;

    function applyTheme(isDark) {
        if (isDark) {
            html.classList.add('dark');
        } else {
            html.classList.remove('dark');
        }
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    }

    // Initialize Theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        applyTheme(true);
    } else {
        applyTheme(false);
    }

    window.toggleTheme = () => {
        const isDark = html.classList.contains('dark');
        applyTheme(!isDark);
    };

    // WebSocket Setup
    let ws;
    function initWebSocket() {
        if (ws) return;
        ws = new WebSocket(`ws://${window.location.host}/ws`);

        ws.onopen = () => {
            console.log('WebSocket connection established.');
            updateConnectionStatus(true);
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            // console.log('Message from server:', data);

            if (data.type === 'newPost') {
                addMessageToChat(data.post);
            } else if (data.type === 'history') {
                messageContainer.innerHTML = ''; // Clear previous messages
                data.posts.forEach(post => addMessageToChat(post));
            } else if (data.type === 'error') {
                alert(data.message);
            } else if (data.type === 'tags') {
                allTags = data.tags;
                renderZoneList(data.tags);
                // If already viewing a tag, update the header in case its level changed
                if (currentTag) {
                    const tag = allTags.find(t => t.name === currentTag);
                    if (tag) updateHeaderStyle(tag.hazard_level);
                }
            }
        };

        ws.onclose = () => {
            console.log('WebSocket connection closed.');
            updateConnectionStatus(false);
            ws = null;
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            updateConnectionStatus(false);
        };
    }

    // UI Logic: Navigation
    window.openZone = (tagName) => {
        currentTag = tagName;
        activeTagName.textContent = tagName;

        const tag = allTags.find(t => t.name === tagName);
        if (tag) updateHeaderStyle(tag.hazard_level);

        // Clear previous messages
        messageContainer.innerHTML = '';

        // Slide animation: Move chat into view
        viewChat.classList.remove('translate-x-full');
        viewChat.classList.add('translate-x-0');

        // Ensure settings is closed
        viewSettings.classList.remove('translate-x-0');
        viewSettings.classList.add('translate-x-full');

        // Ensure profile is closed
        viewProfile.classList.remove('translate-x-0');
        viewProfile.classList.add('translate-x-full');

        // Ensure admin is closed
        viewAdmin.classList.remove('translate-x-0');
        viewAdmin.classList.add('translate-x-full');

        // Ensure admin nav is closed
        viewAdminNav.classList.remove('translate-x-0');
        viewAdminNav.classList.add('translate-x-full');

        // Ensure zone admin is closed
        viewAdminZones.classList.remove('translate-x-0');
        viewAdminZones.classList.add('translate-x-full');

        // Ensure zone edit is closed
        viewZoneEdit.classList.remove('translate-x-0');
        viewZoneEdit.classList.add('translate-x-full');

        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'subscribe', tag: tagName }));
        }
    };

    window.goHome = () => {
        // Slide animation: Move chat out of view
        viewChat.classList.remove('translate-x-0');
        viewChat.classList.add('translate-x-full');

        // Slide settings out of view
        viewSettings.classList.remove('translate-x-0');
        viewSettings.classList.add('translate-x-full');

        // Slide profile out of view
        viewProfile.classList.remove('translate-x-0');
        viewProfile.classList.add('translate-x-full');

        // Slide admin out of view
        viewAdmin.classList.remove('translate-x-0');
        viewAdmin.classList.add('translate-x-full');

        // Slide admin nav out of view
        viewAdminNav.classList.remove('translate-x-0');
        viewAdminNav.classList.add('translate-x-full');

        // Slide zone admin out of view
        viewAdminZones.classList.remove('translate-x-0');
        viewAdminZones.classList.add('translate-x-full');

        // Slide zone edit out of view
        viewZoneEdit.classList.remove('translate-x-0');
        viewZoneEdit.classList.add('translate-x-full');
    };

    window.openSettings = () => {
        // Close chat if open
        viewChat.classList.remove('translate-x-0');
        viewChat.classList.add('translate-x-full');

        // Close profile if open
        viewProfile.classList.remove('translate-x-0');
        viewProfile.classList.add('translate-x-full');

        // Close admin if open
        viewAdmin.classList.remove('translate-x-0');
        viewAdmin.classList.add('translate-x-full');

        // Close admin nav if open
        viewAdminNav.classList.remove('translate-x-0');
        viewAdminNav.classList.add('translate-x-full');

        // Close zone admin if open
        viewAdminZones.classList.remove('translate-x-0');
        viewAdminZones.classList.add('translate-x-full');

        // Close zone edit if open
        viewZoneEdit.classList.remove('translate-x-0');
        viewZoneEdit.classList.add('translate-x-full');

        // Open settings
        viewSettings.classList.remove('translate-x-full');
        viewSettings.classList.add('translate-x-0');
    };

    // UI Logic: Forms
    postForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const content = postContent.value.trim();
        if (content && ws) {
            // Assume authentication is handled via cookie or session logic on server for now
            // or we'd send a token. relying on ws.data for now.
            const message = { type: 'post', content: content, tag: currentTag };
            ws.send(JSON.stringify(message));
            postContent.value = '';
        }
    });

    // Helper: Add Message
    function addMessageToChat(post) {
        // Only show message if it belongs to the current tag (simple client-side filter)
        // In a real app, server handles subscriptions.
        if (post.tagName && post.tagName !== currentTag) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = 'bg-white dark:bg-slate-800 p-3 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 self-start max-w-[85%] animate-fade-in-up';

        // Ensure timestamp is treated as UTC if it's a bare SQLite timestamp string
        let timestamp = post.timestamp;
        if (typeof timestamp === 'string' && !timestamp.includes('Z') && !timestamp.includes('+')) {
            timestamp = timestamp.replace(' ', 'T') + 'Z';
        }
        const dateObj = new Date(timestamp);
        const timeString = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const dateString = dateObj.toLocaleDateString([], { month: '2-digit', day: '2-digit', year: '2-digit' });

        messageDiv.innerHTML = `
            <p class="text-xs font-bold text-orange-600 dark:text-orange-400 mb-1">${post.userName}</p>
            <p class="text-slate-800 dark:text-slate-200">${post.content}</p>
            <p class="text-[10px] text-slate-400 dark:text-slate-500 mt-1">${dateString} ${timeString}</p>
        `;

        messageContainer.appendChild(messageDiv);
        scrollToBottom();
    }

    function scrollToBottom() {
        messageContainer.scrollTop = messageContainer.scrollHeight;
    }

    function updateConnectionStatus(isOnline) {
        if (!connectionStatus) return;

        if (isOnline) {
            connectionStatus.classList.remove('bg-red-500');
            connectionStatus.classList.add('bg-emerald-400', 'animate-pulse');
        } else {
            connectionStatus.classList.remove('bg-emerald-400', 'animate-pulse');
            connectionStatus.classList.add('bg-red-500');
        }
    }

    // Helper: Render Zone List
    function renderZoneList(tags) {
        if (!zoneList) return;
        zoneList.innerHTML = '';
        tags.forEach(tag => {
            const button = document.createElement('button');

            // Base text color
            let nameClass = 'font-bold text-orange-600 dark:text-orange-400';

            // Apply colors based on hazard level if present
            if (tag.hazard_level === 'green') {
                nameClass = 'font-bold text-green-600 dark:text-green-400';
            } else if (tag.hazard_level === 'red') {
                nameClass = 'font-bold text-red-600 dark:text-red-400';
            } else if (tag.hazard_level === 'yellow') {
                nameClass = 'font-bold text-amber-600 dark:text-amber-400';
            } else if (tag.hazard_level === 'orange') {
                nameClass = 'font-bold text-orange-600 dark:text-orange-400';
            }

            button.className = 'w-full text-left p-4 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors mb-2';
            button.onclick = () => openZone(tag.name);

            button.innerHTML = `
                <span class="${nameClass}">${tag.name}</span>
                <p class="text-xs text-slate-500 dark:text-slate-400">${tag.description || ''}</p>
            `;

            zoneList.appendChild(button);
        });
    }

    // Helper: Update Header Style based on Hazard Level
    function updateHeaderStyle(level) {
        if (!chatHeader || !hazardBar) return;
        level = (level || 'green').toLowerCase();

        // Remove existing colors first
        const headerColors = [
            'bg-green-700', 'dark:bg-green-800',
            'bg-indigo-700', 'bg-red-700', 'bg-orange-600', 'bg-amber-500', 'bg-emerald-600', 'bg-slate-700',
            'dark:bg-indigo-900', 'dark:bg-red-900', 'dark:bg-orange-800', 'dark:bg-amber-600', 'dark:bg-emerald-800', 'dark:bg-slate-800'
        ];
        chatHeader.classList.remove(...headerColors);

        let headerBg, headerBgDark, barBg, barBorder, barText;

        if (level === 'red') {
            headerBg = 'bg-red-700';
            headerBgDark = 'dark:bg-red-900';
            barBg = 'bg-white/20';
            barBorder = 'border-white/30';
            barText = 'Hazard Level: Danger (Red)';
        } else if (level === 'orange') {
            headerBg = 'bg-orange-600';
            headerBgDark = 'dark:bg-orange-800';
            barBg = 'bg-white/20';
            barBorder = 'border-white/30';
            barText = 'Hazard Level: Warning (Orange)';
        } else if (level === 'yellow') {
            headerBg = 'bg-amber-500';
            headerBgDark = 'dark:bg-amber-600';
            barBg = 'bg-black/10';
            barBorder = 'border-black/20';
            barText = 'Hazard Level: Caution (Yellow)';
        } else {
            // Default Green
            headerBg = 'bg-green-700';
            headerBgDark = 'dark:bg-green-800';
            barBg = 'bg-emerald-500/20';
            barBorder = 'border-emerald-500/30';
            barText = 'Hazard Level: Clear (Green)';
        }

        chatHeader.classList.add(headerBg, headerBgDark);
        hazardBar.className = `mt-2 text-xs p-1 rounded text-center border ${barBg} ${barBorder}`;
        hazardBar.textContent = barText;
    }

    // Logout Logic
    window.logout = () => {
        // Clear cookies
        document.cookie = 'session_id=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        document.cookie = 'session_id_sig=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';

        // Close WebSocket
        if (ws) {
            ws.close();
            ws = null;
        }

        // Show Auth View
        viewAuth.classList.remove('hidden');

        // Reset UI (go home, close settings)
        goHome();
    };

    let allUsers = [];

    // Admin Logic
    window.openAdmin = () => {
        // Close other views
        viewChat.classList.remove('translate-x-0');
        viewChat.classList.add('translate-x-full');
        viewSettings.classList.remove('translate-x-0');
        viewSettings.classList.add('translate-x-full');
        viewProfile.classList.remove('translate-x-0');
        viewProfile.classList.add('translate-x-full');

        // Close admin content
        viewAdmin.classList.remove('translate-x-0');
        viewAdmin.classList.add('translate-x-full');

        // Close zone admin if open
        viewAdminZones.classList.remove('translate-x-0');
        viewAdminZones.classList.add('translate-x-full');

        // Close zone edit if open
        viewZoneEdit.classList.remove('translate-x-0');
        viewZoneEdit.classList.add('translate-x-full');

        // Open Admin Nav
        viewAdminNav.classList.remove('translate-x-full');
        viewAdminNav.classList.add('translate-x-0');
    };

    window.openAdminSection = async (section) => {
        if (section === 'users') {
            // Close Admin Nav
            viewAdminNav.classList.remove('translate-x-0');
            viewAdminNav.classList.add('translate-x-full');

            // Open Admin
            viewAdmin.classList.remove('translate-x-full');
            viewAdmin.classList.add('translate-x-0');

            // Close zone admin if open
            viewAdminZones.classList.remove('translate-x-0');
            viewAdminZones.classList.add('translate-x-full');

            // Fetch Users
            try {
                const res = await fetch('/api/admin/users');
                if (res.ok) {
                    const users = await res.json();
                    allUsers = users; // Store for filtering
                    renderAdminUserList(users);
                } else {
                    alert('Failed to fetch users');
                }
            } catch (e) {
                console.error('Error fetching users:', e);
            }
        } else if (section === 'zones') {
            // Close Admin Nav
            viewAdminNav.classList.remove('translate-x-0');
            viewAdminNav.classList.add('translate-x-full');

            // Close Admin
            viewAdmin.classList.remove('translate-x-0');
            viewAdmin.classList.add('translate-x-full');

            // Open Zone Admin
            viewAdminZones.classList.remove('translate-x-full');
            viewAdminZones.classList.add('translate-x-0');

            // Fetch Zones
            try {
                const res = await fetch('/api/admin/tags');
                if (res.ok) {
                    const zones = await res.json();
                    allZones = zones;
                    renderAdminZoneList(zones);
                } else {
                    alert('Failed to fetch zones');
                }
            } catch (e) {
                console.error('Error fetching zones:', e);
            }
        }
    };

    // Filter Logic
    if (adminUserFilter) {
        adminUserFilter.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const filtered = allUsers.filter(u => u.full_name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term));
            renderAdminUserList(filtered);
        });
    }

    function renderAdminUserList(users) {
        adminUserList.innerHTML = '';
        users.forEach(user => {
            const div = document.createElement('div');
            div.className = 'flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded border border-slate-200 dark:border-slate-600';

            div.innerHTML = `
                <div>
                    <p class="font-bold text-slate-800 dark:text-slate-200">${user.full_name}</p>
                    <p class="text-xs text-slate-500 dark:text-slate-400">${user.email}</p>
                    <p class="text-xs text-slate-500 dark:text-slate-400">${user.phone_number}</p>
                    <p class="text-xs text-slate-500 dark:text-slate-400">${user.physical_address}</p>
                </div>
                <select onchange="updateUserLevel(${user.id}, this.value)" class="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-500 text-slate-800 dark:text-slate-200 text-sm rounded p-1">
                    <option value="0" ${user.level === 0 ? 'selected' : ''}>0 Unverified</option>
                    <option value="1" ${user.level === 1 ? 'selected' : ''}>1 Verified</option>
                    <option value="2" ${user.level === 2 ? 'selected' : ''}>2 Zone Admin</option>
                    <option value="3" ${user.level === 3 ? 'selected' : ''}>3 System Admin</option>
                </select>
            `;
            adminUserList.appendChild(div);
        });
    }

    window.updateUserLevel = async (userId, newLevel) => {
        try {
            const res = await fetch('/api/admin/update-level', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, newLevel: parseInt(newLevel) })
            });

            if (!res.ok) {
                alert('Failed to update level');
            }
        } catch (e) {
            console.error('Error updating level:', e);
        }
    };

    // Zone Admin Filter Logic
    if (adminZoneFilter) {
        adminZoneFilter.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const filtered = allZones.filter(z => z.name.toLowerCase().includes(term) || (z.description && z.description.toLowerCase().includes(term)));
            renderAdminZoneList(filtered);
        });
    }

    function renderAdminZoneList(zones) {
        adminZoneList.innerHTML = '';
        zones.forEach(zone => {
            const div = document.createElement('div');
            div.className = 'flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded border border-slate-200 dark:border-slate-600 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600';

            let hazardClass = 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
            if (zone.hazard_level === 'yellow') {
                hazardClass = 'bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200';
            } else if (zone.hazard_level === 'orange') {
                hazardClass = 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200';
            } else if (zone.hazard_level === 'red') {
                hazardClass = 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200';
            }

            div.innerHTML = `
                <div class="flex-1">
                    <p class="font-bold text-slate-800 dark:text-slate-200">${zone.name}</p>
                    <p class="text-xs text-slate-500 dark:text-slate-400">${zone.description || 'No description'}</p>
                </div>
                <div class="flex items-center gap-2">
                    <span class="px-2 py-1 rounded text-xs font-semibold ${hazardClass}">${zone.hazard_level || 'green'}</span>
                    <button onclick="openZoneEdit(${zone.id})" class="px-3 py-1 bg-orange-500 text-white rounded text-xs font-bold hover:bg-orange-600">Edit</button>
                </div>
            `;
            adminZoneList.appendChild(div);
        });
    }

    window.openZoneEdit = async (zoneId) => {
        currentEditingZoneId = zoneId;
        const zone = allZones.find(z => z.id === zoneId);

        if (!zone) {
            alert('Zone not found');
            return;
        }

        // Populate form
        document.getElementById('zone-name-input').value = zone.name;
        document.getElementById('zone-description-input').value = zone.description || '';
        document.getElementById('zone-hazard-level-input').value = zone.hazard_level || 'green';
        document.getElementById('zone-level-input').value = zone.level || '0';
        document.getElementById('zone-weather-input').value = zone.weather || '';
        document.getElementById('zone-person-in-charge-input').value = zone.person_in_charge || '';

        // Close zone list, open edit view
        viewAdminZones.classList.remove('translate-x-0');
        viewAdminZones.classList.add('translate-x-full');

        viewZoneEdit.classList.remove('translate-x-full');
        viewZoneEdit.classList.add('translate-x-0');
    };

    window.closeZoneEdit = () => {
        // Close edit view, open zone list
        viewZoneEdit.classList.remove('translate-x-0');
        viewZoneEdit.classList.add('translate-x-full');

        viewAdminZones.classList.remove('translate-x-full');
        viewAdminZones.classList.add('translate-x-0');
    };

    if (zoneEditForm) {
        zoneEditForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const zoneEditMessage = document.getElementById('zone-edit-message');
            zoneEditMessage.classList.add('hidden');

            if (!currentEditingZoneId) {
                alert('No zone selected');
                return;
            }

            const data = {
                name: document.getElementById('zone-name-input').value,
                description: document.getElementById('zone-description-input').value,
                hazard_level: document.getElementById('zone-hazard-level-input').value,
                level: parseInt(document.getElementById('zone-level-input').value),
                weather: document.getElementById('zone-weather-input').value,
                person_in_charge: document.getElementById('zone-person-in-charge-input').value
            };

            try {
                const res = await fetch(`/api/admin/tags/${currentEditingZoneId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                if (res.ok) {
                    zoneEditMessage.textContent = 'Zone updated successfully!';
                    zoneEditMessage.className = 'text-center text-sm mt-2 text-green-600 dark:text-green-400';
                    zoneEditMessage.classList.remove('hidden');

                    // Refresh zone list
                    setTimeout(() => {
                        closeZoneEdit();
                        openAdminSection('zones');
                    }, 1500);
                } else {
                    const result = await res.json();
                    zoneEditMessage.textContent = result.error || 'Update failed';
                    zoneEditMessage.className = 'text-center text-sm mt-2 text-red-600 dark:text-red-400';
                    zoneEditMessage.classList.remove('hidden');
                }
            } catch (err) {
                zoneEditMessage.textContent = 'Network error';
                zoneEditMessage.className = 'text-center text-sm mt-2 text-red-600 dark:text-red-400';
                zoneEditMessage.classList.remove('hidden');
            }
        });
    }
});
