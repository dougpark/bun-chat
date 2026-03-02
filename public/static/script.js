// public/static/script.js

import { ICONS } from './icons.js';

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
    const viewUserEdit = document.getElementById('view-user-edit');
    const viewMembers = document.getElementById('view-members');
    const viewCheckIn = document.getElementById('view-checkin');
    const viewCheckInHistory = document.getElementById('view-checkin-history');
    const viewAuth = document.getElementById('view-auth');
    const chatHeader = document.getElementById('chat-header');
    const hazardBar = document.getElementById('hazard-bar');
    const navAdmin = document.getElementById('nav-admin');
    const adminUserList = document.getElementById('admin-user-list');
    const adminUserFilter = document.getElementById('admin-user-filter');
    const adminZoneList = document.getElementById('admin-zone-list');
    const adminZoneFilter = document.getElementById('admin-zone-filter');
    const membersList = document.getElementById('members-list');
    const membersFilter = document.getElementById('members-filter');
    const membersFilterHelpBtn = document.getElementById('members-filter-help');
    let showOnlyHelpNeeded = false;
    const zoneEditForm = document.getElementById('zone-edit-form');
    const userEditForm = document.getElementById('user-edit-form');
    const checkinForm = document.getElementById('checkin-form');
    const checkinStatus = document.getElementById('checkin-status');

    // Auth Elements
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const authError = document.getElementById('auth-error');
    const profileForm = document.getElementById('profile-form');
    const profileMessage = document.getElementById('profile-message');

    // ========== ICONS ========== //

    // insert svg icons into DOM at

    const initIcons = () => {
        const inject = (selector, iconHtml) => {
            document.querySelectorAll(selector).forEach(el => el.innerHTML = iconHtml);
        };

        inject('.icon-shield', ICONS.shield);
        inject('.icon-back', ICONS.back);
        inject('.icon-send', ICONS.send);
        inject('.icon-home', ICONS.home);
        inject('.icon-bell', ICONS.bell);
        inject('.icon-users', ICONS.users);
        inject('.icon-settings', ICONS.settings);
        inject('.icon-admin', ICONS.admin);
        inject('.icon-zones', ICONS.zones);
    };

    // Run it immediately
    initIcons();

    // ========== Dashboard Update Logic ========== //
    function updateDashboard(data) {
        const dash = document.getElementById('dashboard');
        if (!dash) return;

        const totalOnline = Number(data.total_online ?? data.members_count ?? 0);
        const recentlyOk = Number(data.recently_ok ?? 0);
        const helpAlerts = Number(data.help_alerts ?? data.help_count ?? 0);
        const zoneAlerts = Number(data.zone_alerts ?? data.non_green_count ?? 0);

        const statOkEl = document.getElementById('stat-ok');
        const membersEl = document.getElementById('stat-members');
        const helpEl = document.getElementById('stat-help');
        const alertsEl = document.getElementById('stat-alerts');

        // Update numbers
        if (statOkEl) {
            statOkEl.textContent = String(recentlyOk);
            // If recently_ok is less than 20% of total_online, change color to amber (stale data warning)
            if (totalOnline > 0 && recentlyOk < totalOnline * 0.2) {
                statOkEl.className = 'text-lg font-black text-amber-500 dark:text-amber-400';
            } else {
                statOkEl.className = 'text-lg font-black text-emerald-600 dark:text-emerald-400';
            }
        }
        if (membersEl) membersEl.textContent = String(totalOnline);
        if (helpEl) helpEl.textContent = String(helpAlerts);
        if (alertsEl) alertsEl.textContent = String(zoneAlerts);

        // Apply dashboard-level styling based on alerts
        if (helpAlerts > 0) {
            // Red alert with pulse animation
            dash.classList.replace('bg-emerald-50/50', 'bg-red-50/80');
            dash.classList.replace('border-emerald-500', 'border-red-600');
            dash.classList.replace('dark:bg-emerald-950/20', 'dark:bg-red-900/30');
            dash.classList.replace('dark:border-emerald-500', 'dark:border-red-500');
            if (!dash.classList.contains('animate-pulse')) {
                dash.classList.add('animate-pulse');
            }
        } else if (zoneAlerts > 0) {
            // Solid red border but no pulse
            dash.classList.replace('bg-emerald-50/50', 'bg-red-50/80');
            dash.classList.replace('border-emerald-500', 'border-red-600');
            dash.classList.replace('dark:bg-emerald-950/20', 'dark:bg-red-900/30');
            dash.classList.replace('dark:border-emerald-500', 'dark:border-red-500');
            dash.classList.remove('animate-pulse');
        } else {
            // Green normal state
            dash.classList.replace('bg-red-50/80', 'bg-emerald-50/50');
            dash.classList.replace('border-red-600', 'border-emerald-500');
            dash.classList.replace('dark:bg-red-900/30', 'dark:bg-emerald-950/20');
            dash.classList.replace('dark:border-red-500', 'dark:border-emerald-500');
            dash.classList.remove('animate-pulse');
        }
    }

    // ========== CENTRALIZED NAVIGATION SYSTEM ==========
    const navigationStack = [];

    const views = {
        home: { el: viewHome },
        chat: { el: viewChat },
        settings: { el: viewSettings },
        profile: { el: viewProfile },
        admin: { el: viewAdmin },
        adminNav: { el: viewAdminNav },
        adminZones: { el: viewAdminZones },
        zoneEdit: { el: viewZoneEdit },
        userEdit: { el: viewUserEdit },
        members: { el: viewMembers },
        checkin: { el: viewCheckIn },
        checkinHistory: { el: viewCheckInHistory },
    };

    function navigateTo(viewName, options = {}) {
        // If leaving chat view, mark current tag as fully read
        const current = navigationStack[navigationStack.length - 1];
        if (current === 'chat' && viewName !== 'chat' && currentTag) {
            // Update last_viewed_at for the tag we're leaving
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'openTag', tag: currentTag }));
            }
        }

        // Close current view
        if (current && views[current]) {
            views[current].el.classList.add('translate-x-full');
            views[current].el.classList.remove('translate-x-0');
        }

        // Open new view
        if (views[viewName]) {
            views[viewName].el.classList.remove('translate-x-full');
            views[viewName].el.classList.add('translate-x-0');
        }

        navigationStack.push(viewName);

        // Call any callbacks tied to this navigation
        if (options.onNavigate) {
            options.onNavigate();
        }
    }

    function goBack() {
        if (navigationStack.length > 1) {
            // If leaving chat view, mark current tag as fully read
            const current = navigationStack[navigationStack.length - 1];
            if (current === 'chat' && currentTag) {
                // Update last_viewed_at for the tag we're leaving
                if (ws && ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({ type: 'openTag', tag: currentTag }));
                }
            }

            navigationStack.pop();
            const previous = navigationStack[navigationStack.length - 1];

            // Close all views and open previous
            Object.values(views).forEach(view => {
                view.el.classList.add('translate-x-full');
                view.el.classList.remove('translate-x-0');
            });

            if (views[previous]) {
                views[previous].el.classList.remove('translate-x-full');
                views[previous].el.classList.add('translate-x-0');
            }
        }
    }

    // Initialize home view as starting point
    navigationStack.push('home');
    // ========== END NAVIGATION SYSTEM ==========

    let currentTag = '#general';
    let allTags = [];
    // let allUsers = [];
    let currentUserLevel = 0;
    let allZones = [];
    let currentEditingZoneId = null;
    let allUsers = [];
    let currentEditingUserId = null;
    let allMembers = [];

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
        // Fetch user profile data
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

        navigateTo('profile');
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
                // If it's for the current tag, add to chat
                if (data.post.tagName === currentTag) {
                    addMessageToChat(data.post);
                }
                // Refresh all tag unread counts
                if (ws && ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({ type: 'requestTags' }));
                }
            } else if (data.type === 'postUpdate') {
                // New post arrived somewhere, refresh all unread counts for current user
                if (ws && ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({ type: 'requestTags' }));
                }
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
            } else if (data.type === 'DASHBOARD_UPDATE') {
                updateDashboard(data);
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

        // Navigate to chat view
        navigateTo('chat');

        // Send openTag message to update last_viewed_at on server
        if (ws && ws.readyState === WebSocket.OPEN) {
            // First, send openTag to mark as viewed
            ws.send(JSON.stringify({ type: 'openTag', tag: tagName }));
            // Request fresh tags to update unread counts for all zones
            ws.send(JSON.stringify({ type: 'requestTags' }));
            // Then subscribe to receive new messages
            ws.send(JSON.stringify({ type: 'subscribe', tag: tagName }));
        }
    };

    window.goHome = () => {
        navigateTo('home', {
            onNavigate: () => {
                // Request fresh tags with current unread counts when navigating home
                if (ws && ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({ type: 'requestTags' }));
                }
            }
        });
    };

    window.openSettings = () => {
        navigateTo('settings');
    };

    window.openMembers = async () => {
        navigateTo('members', {
            onNavigate: async () => {
                try {
                    const res = await fetch('/api/members');
                    if (res.ok) {
                        const members = await res.json();
                        allMembers = members;
                        renderMembersList(members);
                    } else {
                        alert('Failed to fetch members');
                    }
                } catch (e) {
                    console.error('Error fetching members:', e);
                }
            }
        });
    };

    function renderMembersList(members) {
        membersList.innerHTML = '';
        members.forEach(member => {
            const div = document.createElement('div');
            div.className = 'p-3 bg-white dark:bg-vsdark-input rounded border border-slate-200 dark:border-vsdark-border-light';

            const levelNames = ['0 Unverified', '1 Verified', '2 Zone Admin', '3 System Admin'];
            const memberLevel = levelNames[member.level] || `${member.level} Unknown`;

            // Format check-in info if available
            let checkinHTML = '';
            if (member.timestamp) {
                // Convert SQLite timestamp to ISO format for proper timezone handling
                let timestamp = member.timestamp;
                if (typeof timestamp === 'string' && !timestamp.includes('Z') && !timestamp.includes('+')) {
                    timestamp = timestamp.replace(' ', 'T') + 'Z';
                }
                const checkinDate = new Date(timestamp);
                const dateStr = checkinDate.toLocaleDateString([], { month: '2-digit', day: '2-digit', year: '2-digit' });
                const timeStr = checkinDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                // Calculate relative time
                const now = new Date();
                const diffMs = now - checkinDate;
                const diffMins = Math.floor(diffMs / 60000);
                const diffHours = Math.floor(diffMs / 3600000);
                let relativeTime;
                if (diffHours > 0) {
                    relativeTime = `${diffHours}h ${diffMins % 60}m ago`;
                } else {
                    relativeTime = `${diffMins}m ago`;
                }

                const statusBadgeClass = member.status_id === 0
                    ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                    : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200';
                const statusText = member.status_id === 0 ? 'OK' : 'Help';

                checkinHTML = `
                    <div class="mt-3 pt-3 border-t border-slate-300 dark:border-vsdark-border-light">
                        <div class="flex items-center justify-between gap-2 mb-1">
                            <div class="flex items-center gap-2">
                                <span class="px-2 py-0.5 rounded text-xs font-semibold ${statusBadgeClass}">${statusText}</span>
                                <span class="text-xs text-slate-500 dark:text-vsdark-text-secondary">${dateStr} ${timeStr}</span>
                                <span class="text-xs text-slate-400 dark:text-vsdark-text-muted">(${relativeTime})</span>
                            </div>
                            <button type="button" onclick="viewCheckInHistory(${member.id}, '${member.full_name.replace(/'/g, "\\'")}')"
                                class="px-2 py-0.5 bg-blue-500 text-white rounded text-xs font-semibold hover:bg-blue-600 transition-colors whitespace-nowrap">
                                History
                            </button>
                        </div>
                        <p class="text-xs text-slate-600 dark:text-vsdark-text-dim">${member.status || ''}</p>
                    </div>
                `;
            }

            div.innerHTML = `
                <div class="flex justify-between items-start mb-2">
                    <p class="font-bold text-slate-800 dark:text-vsdark-text">${member.full_name}</p>
                    <span class="px-2 py-1 rounded text-xs font-semibold bg-slate-200 dark:bg-vsdark-input text-slate-800 dark:text-vsdark-text">${memberLevel}</span>
                </div>
                <p class="text-xs text-slate-500 dark:text-vsdark-text-secondary mb-1">${member.email}</p>
                <p class="text-xs text-slate-500 dark:text-vsdark-text-secondary">${member.phone_number || 'N/A'}</p>
                <p class="text-xs text-slate-500 dark:text-vsdark-text-secondary mt-1">${member.physical_address || 'N/A'}</p>
                ${checkinHTML}
            `;
            membersList.appendChild(div);
        });
    }

    // Members filter functionality
    window.toggleHelpFilter = () => {
        showOnlyHelpNeeded = !showOnlyHelpNeeded;
        membersFilterHelpBtn.classList.toggle('bg-red-100');
        membersFilterHelpBtn.classList.toggle('dark:bg-red-800');
        applyMembersFilters();
    };

    function applyMembersFilters() {
        const term = membersFilter.value.toLowerCase();
        const filtered = allMembers.filter(m => {
            const matchesSearch = m.full_name.toLowerCase().includes(term) || m.email.toLowerCase().includes(term);
            const matchesHelpStatus = !showOnlyHelpNeeded || m.status_id === 1;
            return matchesSearch && matchesHelpStatus;
        });
        renderMembersList(filtered);
    }

    if (membersFilter) {
        membersFilter.addEventListener('input', applyMembersFilters);
    }

    // View Check-in History
    window.viewCheckInHistory = async (userId, memberName) => {
        // Set member name
        document.getElementById('checkin-history-name').textContent = memberName;

        // Fetch check-in history
        try {
            const res = await fetch(`/api/user/${userId}/checkins`);
            if (res.ok) {
                const checkins = await res.json();
                renderCheckInHistory(checkins);
            } else {
                document.getElementById('checkin-history-list').innerHTML = '<p class="text-red-600 dark:text-red-400">Failed to load check-in history</p>';
            }
        } catch (err) {
            console.error('Error fetching check-in history:', err);
            document.getElementById('checkin-history-list').innerHTML = '<p class="text-red-600 dark:text-red-400">Error loading check-in history</p>';
        }

        navigateTo('checkinHistory');
    };

    function renderCheckInHistory(checkins) {
        const historyList = document.getElementById('checkin-history-list');
        historyList.innerHTML = '';

        if (checkins.length === 0) {
            historyList.innerHTML = '<p class="text-slate-500 dark:text-vsdark-text-secondary text-center">No check-in history</p>';
            return;
        }

        checkins.forEach(checkin => {
            const div = document.createElement('div');
            div.className = 'p-3 bg-slate-100 dark:bg-vsdark-input rounded border border-slate-200 dark:border-vsdark-border-light';

            // Convert timestamp to local timezone
            let timestamp = checkin.timestamp;
            if (typeof timestamp === 'string' && !timestamp.includes('Z') && !timestamp.includes('+')) {
                timestamp = timestamp.replace(' ', 'T') + 'Z';
            }
            const checkinDate = new Date(timestamp);
            const dateStr = checkinDate.toLocaleDateString([], { month: '2-digit', day: '2-digit', year: '2-digit' });
            const timeStr = checkinDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            const statusBadgeClass = checkin.status_id === 0
                ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200';
            const statusText = checkin.status_id === 0 ? 'OK' : 'Help';

            div.innerHTML = `
                <div class="flex items-center gap-2 mb-2">
                    <span class="px-2 py-0.5 rounded text-xs font-semibold ${statusBadgeClass}">${statusText}</span>
                    <span class="text-xs text-slate-600 dark:text-vsdark-text-dim">${dateStr} ${timeStr}</span>
                </div>
                <p class="text-xs text-slate-600 dark:text-vsdark-text-dim">${checkin.status || '(No message)'}</p>
            `;
            historyList.appendChild(div);
        });
    }

    // Check In Logic
    window.openCheckIn = () => {
        navigateTo('checkin');

        // Clear status box and message
        checkinStatus.value = '';
        const messageDiv = document.getElementById('checkin-message');
        messageDiv.textContent = '';
        messageDiv.className = 'text-center text-sm font-medium p-3 rounded hidden';
    };

    window.submitCheckIn = async (statusType) => {
        const status = checkinStatus.value.trim();

        try {
            const res = await fetch('/api/checkin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status_id: statusType === 'ok' ? 0 : 1,
                    status: status
                })
            });

            if (res.ok) {
                // Show success message
                const previousText = statusType === 'ok' ? 'OK' : 'Help';
                const messageDiv = document.getElementById('checkin-message');
                messageDiv.textContent = `Check-in submitted: ${previousText}`;
                messageDiv.className = 'text-center text-sm font-medium p-3 rounded bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';

                // Reset and go home after a delay
                checkinStatus.value = '';
                setTimeout(() => {
                    goHome();
                }, 1500);
            } else {
                const result = await res.json();
                const messageDiv = document.getElementById('checkin-message');
                messageDiv.textContent = result.error || 'Check-in failed';
                messageDiv.className = 'text-center text-sm font-medium p-3 rounded bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
            }
        } catch (err) {
            console.error('Error submitting check-in:', err);
            const messageDiv = document.getElementById('checkin-message');
            messageDiv.textContent = 'Network error occurred';
            messageDiv.className = 'text-center text-sm font-medium p-3 rounded bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
        }
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
        messageDiv.className = 'bg-white dark:bg-vsdark-surface p-3 rounded-lg shadow-sm border border-slate-200 dark:border-vsdark-border self-start max-w-[85%] animate-fade-in-up';

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
            <p class="text-slate-800 dark:text-vsdark-text">${post.content}</p>
            <p class="text-[10px] text-slate-400 dark:text-vsdark-text-muted mt-1">${dateString} ${timeString}</p>
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

            button.className = 'w-full text-left p-4 bg-white dark:bg-vsdark-surface rounded-lg shadow-sm border border-slate-200 dark:border-vsdark-border hover:bg-slate-50 dark:hover:bg-vsdark-input transition-colors mb-2';
            button.onclick = () => openZone(tag.name);

            // Build unread badge if there are unread messages
            const unreadBadge = (tag.unread_count || 0) > 0
                ? `<span class="ml-auto bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold ">${tag.unread_count}</span>`
                : '';

            button.innerHTML = `
                <div class="flex items-start justify-between gap-2">
                    <div class="flex-1">
                        <span class="${nameClass}">${tag.name}</span>
                        <p class="text-xs text-slate-500 dark:text-vsdark-text-secondary">${tag.description || ''}</p>
                    </div>
                    ${unreadBadge}
                </div>
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
            'dark:bg-indigo-900', 'dark:bg-red-900', 'dark:bg-orange-800', 'dark:bg-amber-600', 'dark:bg-emerald-800', 'dark:bg-vsdark-surface'
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



    // Admin Logic
    window.openAdmin = () => {
        navigateTo('adminNav');
    };

    window.openAdminSection = async (section) => {
        if (section === 'users') {
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
            navigateTo('admin');
        } else if (section === 'zones') {
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
            navigateTo('adminZones');
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
            div.className = 'flex items-center justify-between p-3 bg-slate-50 dark:bg-vsdark-input rounded border border-slate-200 dark:border-vsdark-border-light cursor-pointer hover:bg-slate-100 dark:hover:bg-vsdark-border-light';

            const levelNames = ['0 Unverified', '1 Verified', '2 Zone Admin', '3 System Admin'];
            const userLevel = levelNames[user.level] || `${user.level} Unknown`;

            div.innerHTML = `
                <div class="flex-1">
                    <p class="font-bold text-slate-800 dark:text-vsdark-text">${user.full_name}</p>
                    <p class="text-xs text-slate-500 dark:text-vsdark-text-secondary">${user.email}</p>
                    <p class="text-xs text-slate-500 dark:text-vsdark-text-secondary">${user.phone_number || 'N/A'}</p>
                </div>
                <div class="flex items-center gap-2">
                    <span class="px-2 py-1 rounded text-xs font-semibold bg-slate-200 dark:bg-vsdark-input text-slate-800 dark:text-vsdark-text">${userLevel}</span>
                    <button onclick="openUserEdit(${user.id})" class="px-3 py-1 bg-orange-500 text-white rounded text-xs font-bold hover:bg-orange-600">Edit</button>
                </div>
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

    window.openUserEdit = async (userId) => {
        currentEditingUserId = userId;
        const user = allUsers.find(u => u.id === userId);

        if (!user) {
            alert('User not found');
            return;
        }

        // Populate form
        document.getElementById('user-fullname-input').value = user.full_name || '';
        document.getElementById('user-email-input').value = user.email || '';
        document.getElementById('user-phone-input').value = user.phone_number || '';
        document.getElementById('user-address-input').value = user.physical_address || '';
        document.getElementById('user-level-input').value = user.level || '0';

        navigateTo('userEdit');
    };

    window.closeUserEdit = () => {
        goBack();
    };

    if (userEditForm) {
        userEditForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const userEditMessage = document.getElementById('user-edit-message');
            userEditMessage.classList.add('hidden');

            if (!currentEditingUserId) {
                alert('No user selected');
                return;
            }

            const data = {
                full_name: document.getElementById('user-fullname-input').value,
                email: document.getElementById('user-email-input').value,
                phone_number: document.getElementById('user-phone-input').value,
                physical_address: document.getElementById('user-address-input').value,
                level: parseInt(document.getElementById('user-level-input').value)
            };

            try {
                const res = await fetch(`/api/admin/users/${currentEditingUserId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                if (res.ok) {
                    userEditMessage.textContent = 'User updated successfully!';
                    userEditMessage.className = 'text-center text-sm mt-2 text-green-600 dark:text-green-400';
                    userEditMessage.classList.remove('hidden');

                    // Refresh user list
                    setTimeout(() => {
                        closeUserEdit();
                        openAdminSection('users');
                    }, 1500);
                } else {
                    const result = await res.json();
                    userEditMessage.textContent = result.error || 'Update failed';
                    userEditMessage.className = 'text-center text-sm mt-2 text-red-600 dark:text-red-400';
                    userEditMessage.classList.remove('hidden');
                }
            } catch (err) {
                userEditMessage.textContent = 'Network error';
                userEditMessage.className = 'text-center text-sm mt-2 text-red-600 dark:text-red-400';
                userEditMessage.classList.remove('hidden');
            }
        });
    }

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
            div.className = 'flex items-center justify-between p-3 bg-slate-50 dark:bg-vsdark-input rounded border border-slate-200 dark:border-vsdark-border-light cursor-pointer hover:bg-slate-100 dark:hover:bg-vsdark-border-light';

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
                    <p class="font-bold text-slate-800 dark:text-vsdark-text">${zone.name}</p>
                    <p class="text-xs text-slate-500 dark:text-vsdark-text-secondary">${zone.description || 'No description'}</p>
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

        navigateTo('zoneEdit');
    };

    window.closeZoneEdit = () => {
        goBack();
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
