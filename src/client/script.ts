// src/client/script.ts

import { ICONS } from './modules/icons.js';
import { ZONE_LEVELS, USER_LEVELS, WEATHER_LEVELS } from '../shared/constants.ts';
import type { DashboardData, Announcement, Post, Tag, User, Member, CheckIn, NavigateOptions, ViewConfig } from './modules/types.ts';
import { initIcons } from './modules/init-icons.ts';
import { DOM as DOM_CORE } from './modules/dom-core.ts';
import { DOM as DOM_AUTH } from './modules/dom-auth.ts';

// Extend Window interface for global functions
declare global {
    interface Window {
        toggleAuthMode: (mode: string) => void;
        openProfile: () => Promise<void>;
        toggleTheme: () => void;
        openZone: (tagName: string) => void;
        goHome: () => void;
        openSettings: () => void;
        openMembers: () => Promise<void>;
        toggleHelpFilter: () => void;
        viewCheckInHistory: (userId: number, memberName: string) => Promise<void>;
        openCheckIn: () => void;
        submitCheckIn: (statusType: string) => Promise<void>;
        logout: () => void;
        openAdmin: () => void;
        openAdminSection: (section: string) => Promise<void>;
        updateUserLevel: (userId: number, newLevel: string | number) => Promise<void>;
        openUserEdit: (userId: number) => Promise<void>;
        closeUserEdit: () => void;
        openZoneEdit: (zoneId: number) => Promise<void>;
        closeZoneEdit: () => void;
        clearCurrentAnnouncement: () => Promise<void>;
    }
}

document.addEventListener('DOMContentLoaded', (): void => {
    // DOM Core Elements Initialization
    DOM_CORE.init();

    // View Management
    const viewHome = document.getElementById('view-home') as HTMLDivElement;
    const viewChat = document.getElementById('view-chat') as HTMLDivElement;
    const viewSettings = document.getElementById('view-settings') as HTMLDivElement;
    const viewProfile = document.getElementById('view-profile') as HTMLDivElement;
    const viewAdmin = document.getElementById('view-admin') as HTMLDivElement;
    const viewAdminNav = document.getElementById('view-admin-nav') as HTMLDivElement;
    const viewAdminZones = document.getElementById('view-admin-zones') as HTMLDivElement;
    const viewZoneEdit = document.getElementById('view-zone-edit') as HTMLDivElement;
    const viewUserEdit = document.getElementById('view-user-edit') as HTMLDivElement;
    const viewAnnouncements = document.getElementById('view-announcements') as HTMLDivElement;
    const viewMembers = document.getElementById('view-members') as HTMLDivElement;
    const viewCheckIn = document.getElementById('view-checkin') as HTMLDivElement;
    const viewCheckInHistory = document.getElementById('view-checkin-history') as HTMLDivElement;
    const viewAuth = document.getElementById('view-auth') as HTMLDivElement;
    const chatHeader = document.getElementById('chat-header') as HTMLDivElement;
    const hazardBar = document.getElementById('hazard-bar') as HTMLDivElement;
    const navAdmin = document.getElementById('nav-admin') as HTMLDivElement;
    const adminUserList = document.getElementById('admin-user-list') as HTMLDivElement;
    const adminUserFilter = document.getElementById('admin-user-filter') as HTMLInputElement;
    const adminZoneList = document.getElementById('admin-zone-list') as HTMLDivElement;
    const adminZoneFilter = document.getElementById('admin-zone-filter') as HTMLInputElement;
    const membersList = document.getElementById('members-list') as HTMLDivElement;
    const membersFilter = document.getElementById('members-filter') as HTMLInputElement;
    const membersFilterHelpBtn = document.getElementById('members-filter-help') as HTMLButtonElement;
    let showOnlyHelpNeeded = false;
    const zoneEditForm = document.getElementById('zone-edit-form') as HTMLFormElement;
    const userEditForm = document.getElementById('user-edit-form') as HTMLFormElement;
    const checkinForm = document.getElementById('checkin-form') as HTMLFormElement;
    const checkinStatus = document.getElementById('checkin-status') as HTMLTextAreaElement;

    // DOM Auth Elements Initialization
    DOM_AUTH.init();

    // Icon Injection
    initIcons();


    // ========== POPULATE LEVEL DROPDOWNS ========== //
    const initLevelDropdowns = (): void => {
        const zoneLevelSelect = document.getElementById('zone-level-input') as HTMLSelectElement;
        const userLevelSelect = document.getElementById('user-level-input') as HTMLSelectElement;

        // Populate both dropdowns with USER_LEVELS
        [zoneLevelSelect, userLevelSelect].forEach((select: HTMLSelectElement) => {
            if (select) {
                // Clear existing options
                select.innerHTML = '';

                // Add options from USER_LEVELS constant
                Object.keys(USER_LEVELS).forEach((level: string) => {
                    const option = document.createElement('option');
                    option.value = level;
                    option.textContent = `${level} ${USER_LEVELS[parseInt(level) as keyof typeof USER_LEVELS].label}`;
                    select.appendChild(option);
                });
            }
        });
    };

    const initHazardDropdown = (): void => {
        const hazardSelect = document.getElementById('zone-hazard-level-id-input') as HTMLSelectElement;
        if (!hazardSelect) return;

        hazardSelect.innerHTML = '';

        Object.keys(ZONE_LEVELS).forEach((levelId: string) => {
            const option = document.createElement('option');
            option.value = levelId;
            option.textContent = `${levelId} ${ZONE_LEVELS[parseInt(levelId) as keyof typeof ZONE_LEVELS].label}`;
            hazardSelect.appendChild(option);
        });
    };

    const initWeatherDropdown = (): void => {
        const weatherSelect = document.getElementById('zone-weather-id-input') as HTMLSelectElement;
        if (!weatherSelect) return;

        weatherSelect.innerHTML = '';

        Object.keys(WEATHER_LEVELS).forEach((weatherId: string) => {
            const option = document.createElement('option');
            option.value = weatherId;
            option.textContent = `${weatherId} ${WEATHER_LEVELS[parseInt(weatherId) as keyof typeof WEATHER_LEVELS].name}`;
            weatherSelect.appendChild(option);
        });
    };

    const initAnnouncementHazardDropdown = (): void => {
        const hazardSelect = document.getElementById('announcement-hazard-level-input') as HTMLSelectElement;
        if (!hazardSelect) return;

        hazardSelect.innerHTML = '';

        Object.keys(ZONE_LEVELS).forEach((levelId: string) => {
            const option = document.createElement('option');
            option.value = levelId;
            option.textContent = `${ZONE_LEVELS[parseInt(levelId) as keyof typeof ZONE_LEVELS].label}`;
            hazardSelect.appendChild(option);
        });
    };

    // Run it immediately
    initLevelDropdowns();
    initHazardDropdown();
    initWeatherDropdown();
    initAnnouncementHazardDropdown();

    // ========== Dashboard Update Logic ========== //
    function updateDashboard(data: DashboardData): void {
        const dash = document.getElementById('dashboard') as HTMLDivElement;
        if (!dash) return;

        const totalOnline = Number(data.total_online ?? data.members_count ?? 0);
        const recentlyOk = Number(data.recently_ok ?? 0);
        const helpAlerts = Number(data.help_alerts ?? data.help_count ?? 0);
        const zoneAlerts = Number(data.zone_alerts ?? data.non_green_count ?? 0);

        const statOkEl = document.getElementById('stat-ok') as HTMLDivElement;
        const membersEl = document.getElementById('stat-members') as HTMLDivElement;
        const helpEl = document.getElementById('stat-help') as HTMLDivElement;
        const alertsEl = document.getElementById('stat-alerts') as HTMLDivElement;

        // Update numbers
        if (statOkEl) {
            statOkEl.textContent = String(recentlyOk);
            // If recently_ok is less than 20% of total_online, change color to amber (stale data warning)
            if (totalOnline > 0 && recentlyOk < totalOnline * 0.2) {
                statOkEl.className = 'text-lg font-black text-vsdark-active5 dark:vsdark-active5';
            } else {
                statOkEl.className = 'text-lg font-black text-green-600 dark:text-green-400';
            }
        }
        statOkEl.className = 'text-lg font-black text-slate-100 dark:text-vsdark-text';
        if (membersEl) membersEl.textContent = String(totalOnline);
        if (helpEl) helpEl.textContent = String(helpAlerts);
        if (alertsEl) alertsEl.textContent = String(zoneAlerts);

        // Visual State Escalation based on highest severity from server
        // Get highest severity from server data, default to 1 (Clear)
        const highestSeverity = Number(data.highest_severity ?? 1);
        const zoneLevel = ZONE_LEVELS[highestSeverity] || ZONE_LEVELS[1];
        const borderHex = zoneLevel.hex;

        // Remove all possible state classes first for clean state transitions
        const stateClasses = [
            'bg-emerald-50/50', 'bg-amber-50/50', 'bg-red-50/80',
            'border-emerald-500', 'border-amber-500', 'border-red-600',
            'dark:bg-emerald-950/20', 'dark:bg-amber-950/20', 'dark:bg-red-900/30',
            'dark:border-emerald-500', 'dark:border-amber-500', 'dark:border-red-500'
        ];
        stateClasses.forEach(cls => dash.classList.remove(cls));
        dash.classList.remove('animate-pulse');

        // Apply border color using hex code from ZONE_LEVELS
        dash.style.borderColor = borderHex;

        // Apply appropriate background based on severity
        if (highestSeverity === 4) {
            // Danger: Red background
            dash.classList.add('bg-red-50/80', 'dark:bg-red-900/30');
            if (helpAlerts > 0) {
                dash.classList.add('animate-pulse'); // Pulse animation for active help alerts
            }
        } else if (highestSeverity === 3) {
            // Warning: Orange/Amber background
            dash.classList.add('bg-amber-50/50', 'dark:bg-amber-950/20');
        } else if (highestSeverity === 2) {
            // Caution: Yellow/Amber background
            dash.classList.add('bg-amber-50/50', 'dark:bg-amber-950/20');
        } else {
            // Clear: Green background
            dash.classList.add('bg-emerald-50/50', 'dark:bg-emerald-950/20');
        }

        // Handle announcement if present in data
        if (data.announcement !== undefined) {
            displayAnnouncement(data.announcement);
        }
    }

    // ========== ANNOUNCEMENT DISPLAY LOGIC ========== //
    function displayAnnouncement(announcement: Announcement | null): void {
        const announcementContainer = document.getElementById('announcement-container') as HTMLDivElement;
        const announcementDisplay = document.getElementById('announcement-display') as HTMLDivElement;
        const announcementText = document.getElementById('announcement-text') as HTMLParagraphElement;
        const announcementLevelBadge = document.getElementById('announcement-level-badge') as HTMLSpanElement;
        const announcementMeta = document.getElementById('announcement-meta') as HTMLParagraphElement;

        if (!announcement || !announcement.is_active) {
            announcementContainer.classList.add('hidden');
            return;
        }

        // Show announcement
        announcementContainer.classList.remove('hidden');
        announcementText.textContent = announcement.announcement_text;

        // Get hazard level styling
        const hazardLevel = ZONE_LEVELS[announcement.hazard_level_id as keyof typeof ZONE_LEVELS] || ZONE_LEVELS[1];
        const borderColor = hazardLevel.hex;
        const bgColor = hazardLevel.hex;

        // Update display styling
        announcementDisplay.style.borderColor = borderColor;
        announcementDisplay.style.backgroundColor = bgColor + '20'; // Add transparency

        // tbd remove for now since we're using background color for severity indication
        // Update level badge
        // announcementLevelBadge.textContent = hazardLevel.label;
        // announcementLevelBadge.style.backgroundColor = hazardLevel.hex;
        // announcementLevelBadge.style.color = 'white';

        // Format metadata
        let timestamp = announcement.created_at;
        if (typeof timestamp === 'string' && !timestamp.includes('Z') && !timestamp.includes('+')) {
            timestamp = timestamp.replace(' ', 'T') + 'Z';
        }
        const date = new Date(timestamp);
        const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        announcementMeta.textContent = `Posted by ${announcement.created_by_user_name} on ${dateStr} at ${timeStr}`;
    }

    // Fetch and display current announcement
    async function fetchAndDisplayAnnouncement(): Promise<void> {
        try {
            const res = await fetch('/api/announcements');
            if (res.ok) {
                const announcement: Announcement = await res.json();
                displayAnnouncement(announcement);
            }
        } catch (err) {
            console.error('Error fetching announcement:', err);
        }
    }

    // Call on page load
    fetchAndDisplayAnnouncement();

    // ========== CENTRALIZED NAVIGATION SYSTEM ==========
    const navigationStack: string[] = [];

    const views: Record<string, ViewConfig> = {
        home: { el: viewHome },
        chat: { el: viewChat },
        settings: { el: viewSettings },
        profile: { el: viewProfile },
        admin: { el: viewAdmin },
        adminNav: { el: viewAdminNav },
        adminZones: { el: viewAdminZones },
        announcements: { el: viewAnnouncements },
        zoneEdit: { el: viewZoneEdit },
        userEdit: { el: viewUserEdit },
        members: { el: viewMembers },
        checkin: { el: viewCheckIn },
        checkinHistory: { el: viewCheckInHistory },
    };

    function navigateTo(viewName: string, options: NavigateOptions = {}): void {
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
            const currentEl = views[current].el;
            if (currentEl) {
                currentEl.classList.add('translate-x-full');
                currentEl.classList.remove('translate-x-0');
            }
        }

        // Open new view
        if (views[viewName]) {
            const newEl = views[viewName].el;
            if (newEl) {
                newEl.classList.remove('translate-x-full');
                newEl.classList.add('translate-x-0');
            }
        }

        navigationStack.push(viewName);

        // Update active nav button state
        updateNavButtonStates(viewName);

        // Call any callbacks tied to this navigation
        if (options.onNavigate) {
            options.onNavigate();
        }
    }

    function goBack(): void {
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
            Object.values(views).forEach((view: ViewConfig) => {
                if (view.el) {
                    view.el.classList.add('translate-x-full');
                    view.el.classList.remove('translate-x-0');
                }
            });

            if (views[previous]) {
                const prevEl = views[previous].el;
                if (prevEl) {
                    prevEl.classList.remove('translate-x-full');
                    prevEl.classList.add('translate-x-0');
                }
            }

            // Update active nav button state
            updateNavButtonStates(previous);
        }
    }

    // Initialize home view as starting point
    navigationStack.push('home');

    // Map viewNames to nav button IDs for active state styling
    const navButtonMap: Record<string, string> = {
        home: 'nav-home',
        checkin: 'nav-checkin',
        members: 'nav-members',
        settings: 'nav-settings',
        admin: 'nav-admin'
    };

    // Update nav button active states
    function updateNavButtonStates(currentView: string): void {
        document.querySelectorAll('.nav-btn').forEach((btn: Element) => {
            btn.classList.remove('text-orange-500', 'dark:text-vsdark-text');
            btn.classList.add('text-slate-400', 'dark:text-vsdark-text-secondary');
        });

        const activeButtonId = navButtonMap[currentView];
        if (activeButtonId) {
            const activeBtn = document.getElementById(activeButtonId);
            if (activeBtn) {
                activeBtn.classList.remove('text-slate-400', 'dark:text-vsdark-text-secondary');
                activeBtn.classList.add('text-orange-500', 'dark:text-vsdark-text');
            }
        }
    }

    // ========== END NAVIGATION SYSTEM ==========

    let currentTag = '#general';
    let allTags: Tag[] = [];
    let currentUserLevel = 0;
    let currentUserName = '';
    let allZones: Tag[] = [];
    let currentEditingZoneId: number | null = null;
    let allUsers: User[] = [];
    let currentEditingUserId: number | null = null;
    let allMembers: Member[] = [];

    // Auth Logic
    async function checkAuth(): Promise<void> {
        try {
            const res = await fetch('/api/me');
            if (res.ok) {
                viewAuth.classList.add('hidden');

                const user: User = await res.json();
                currentUserLevel = user.user_level || 0;
                currentUserName = user.name || 'Admin';

                if ((user.user_level || 0) >= 2) {
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

    // Set initial nav button state for home view
    updateNavButtonStates('home');

    window.toggleAuthMode = (mode: string): void => {
        DOM_AUTH.init();
        DOM_AUTH.authError.classList.add('hidden');
        DOM_AUTH.authError.textContent = '';
        if (mode === 'register') {
            DOM_AUTH.loginForm.classList.add('hidden');
            DOM_AUTH.registerForm.classList.remove('hidden');
        } else {
            DOM_AUTH.loginForm.classList.remove('hidden');
            DOM_AUTH.registerForm.classList.add('hidden');
        }
    };

    async function handleAuthSubmit(e: SubmitEvent, url: string): Promise<void> {
        e.preventDefault();
        DOM_AUTH.authError.classList.add('hidden');

        const formData = new FormData(e.target as HTMLFormElement);
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
                (e.target as HTMLFormElement).reset();
            } else {
                const result = await res.json() as Record<string, string>;
                DOM_AUTH.authError.textContent = result.error || 'Authentication failed';
                DOM_AUTH.authError.classList.remove('hidden');
            }
        } catch (err) {
            DOM_AUTH.authError.textContent = 'Network error occurred';
            DOM_AUTH.authError.classList.remove('hidden');
        }
    }

    DOM_AUTH.loginForm.addEventListener('submit', (e: Event) => handleAuthSubmit(e as SubmitEvent, '/api/login'));
    DOM_AUTH.registerForm.addEventListener('submit', (e: Event) => handleAuthSubmit(e as SubmitEvent, '/api/register'));

    // Profile Logic
    window.openProfile = async (): Promise<void> => {
        // Fetch user profile data
        try {
            const res = await fetch('/api/me');
            if (res.ok) {
                const user: User = await res.json();
                const form = document.getElementById('profile-form') as HTMLFormElement;
                (form.elements.namedItem('full_name') as HTMLInputElement).value = user.full_name || '';
                (form.elements.namedItem('email') as HTMLInputElement).value = user.email || '';
                (form.elements.namedItem('phone_number') as HTMLInputElement).value = user.phone_number || '';
                (form.elements.namedItem('physical_address') as HTMLInputElement).value = user.physical_address || '';

                // Update Level Display
                const levelDisplay = document.getElementById('profile-level-display');
                if (levelDisplay) {
                    const level = user.user_level || 0;
                    const levelLabel = USER_LEVELS[level as keyof typeof USER_LEVELS]?.label || 'Unknown';
                    levelDisplay.textContent = `${level} - ${levelLabel}`;
                }
            }
        } catch (e) {
            console.error('Failed to fetch profile', e);
        }

        navigateTo('profile');
    };

    DOM_AUTH.profileForm.addEventListener('submit', async (e: Event): Promise<void> => {
        e.preventDefault();
        DOM_AUTH.profileMessage.classList.add('hidden');

        const formData = new FormData(e.target as HTMLFormElement);
        const data = Object.fromEntries(formData.entries());

        try {
            const res = await fetch('/api/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (res.ok) {
                DOM_AUTH.profileMessage.textContent = 'Profile updated successfully!';
                DOM_AUTH.profileMessage.className = 'text-center text-sm mt-2 text-green-600 dark:text-green-400';
                DOM_AUTH.profileMessage.classList.remove('hidden');
            } else {
                const result = await res.json() as Record<string, string>;
                DOM_AUTH.profileMessage.textContent = result.error || 'Update failed';
                DOM_AUTH.profileMessage.className = 'text-center text-sm mt-2 text-red-600 dark:text-red-400';
                DOM_AUTH.profileMessage.classList.remove('hidden');
            }
        } catch (err) {
            DOM_AUTH.profileMessage.textContent = 'Network error';
            DOM_AUTH.profileMessage.className = 'text-center text-sm mt-2 text-red-600 dark:text-red-400';
            DOM_AUTH.profileMessage.classList.remove('hidden');
        }
    });

    // Theme Logic
    const html = document.documentElement;

    function applyTheme(isDark: boolean): void {
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

    window.toggleTheme = (): void => {
        const isDark = html.classList.contains('dark');
        applyTheme(!isDark);
    };

    // WebSocket Setup
    let ws: WebSocket | null;
    function initWebSocket(): void {
        if (ws) return;
        ws = new WebSocket(`ws://${window.location.host}/ws`);

        ws.onopen = (): void => {
            console.log('WebSocket connection established.');
            updateConnectionStatus(true);
        };

        ws.onmessage = (event: MessageEvent): void => {
            const data = JSON.parse(event.data) as Record<string, any>;
            // console.log('Message from server:', data);

            if (data.type === 'newPost') {
                // If it's for the current tag, add to chat
                if (data.post.tagName === currentTag) {
                    addMessageToChat(data.post as Post);
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
                DOM_CORE.messageContainer.innerHTML = ''; // Clear previous messages
                (data.posts as Post[]).forEach((post: Post) => addMessageToChat(post));
            } else if (data.type === 'error') {
                alert(data.message);
            } else if (data.type === 'tags') {
                allTags = data.tags as Tag[];
                renderZoneList(data.tags as Tag[]);
                // If already viewing a tag, update the header in case its level changed
                if (currentTag) {
                    const tag = allTags.find((t: Tag) => t.name === currentTag);
                    if (tag) updateHeaderStyle(tag.hazard_level_id);
                }
            } else if (data.type === 'DASHBOARD_UPDATE') {
                updateDashboard(data as DashboardData);
            }
        };

        ws.onclose = (): void => {
            console.log('WebSocket connection closed.');
            updateConnectionStatus(false);
            ws = null;
        };

        ws.onerror = (error: Event): void => {
            console.error('WebSocket error:', error);
            updateConnectionStatus(false);
        };
    }

    // UI Logic: Navigation
    window.openZone = (tagName: string): void => {
        currentTag = tagName;
        DOM_CORE.activeTagName.textContent = tagName;

        const tag = allTags.find((t: Tag) => t.name === tagName);
        if (tag) updateHeaderStyle(tag.hazard_level_id);

        // Clear previous messages
        DOM_CORE.messageContainer.innerHTML = '';

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

    window.goHome = (): void => {
        navigateTo('home', {
            onNavigate: (): void => {
                // Request fresh tags with current unread counts when navigating home
                if (ws && ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({ type: 'requestTags' }));
                }
            }
        });
    };

    window.openSettings = (): void => {
        navigateTo('settings');
    };

    window.openMembers = async (): Promise<void> => {
        navigateTo('members', {
            onNavigate: async (): Promise<void> => {
                try {
                    const res = await fetch('/api/members');
                    if (res.ok) {
                        const members = await res.json() as Member[];
                        allMembers = members;
                        applyMembersFilters();
                    } else {
                        alert('Failed to fetch members');
                    }
                } catch (e) {
                    console.error('Error fetching members:', e);
                }
            }
        });
    };

    function renderMembersList(members: Member[]): void {
        membersList.innerHTML = '';
        members.forEach((member: Member) => {
            const div = document.createElement('div');
            div.className = 'p-3 bg-white dark:bg-vsdark-input rounded border border-slate-200 dark:border-vsdark-border-light';

            const memberLevel = USER_LEVELS[member.user_level as keyof typeof USER_LEVELS]?.label
                ? `${member.user_level} ${USER_LEVELS[member.user_level as keyof typeof USER_LEVELS].label}`
                : `${member.user_level} Unknown`;

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
                const diffMs = (now as any) - (checkinDate as any);
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
                            <button type="button" onclick="window.viewCheckInHistory(${member.id}, '${(member.full_name || '').replace(/'/g, "\\'")}')"
                                class="px-2 py-0.5 bg-vsdark-active5 text-white rounded text-xs font-semibold hover:bg-vsdark-active1 transition-colors whitespace-nowrap">
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
    window.toggleHelpFilter = (): void => {
        showOnlyHelpNeeded = !showOnlyHelpNeeded;
        membersFilterHelpBtn.classList.toggle('bg-red-100');
        membersFilterHelpBtn.classList.toggle('dark:bg-red-800');
        applyMembersFilters();
    };

    function applyMembersFilters(): void {
        if (!membersFilter) {
            renderMembersList(allMembers);
            return;
        }

        const term = (membersFilter.value || '').toLowerCase().trim();
        const filtered = allMembers.filter((m: Member) => {
            const fullName = String(m.full_name ?? '').toLowerCase();
            const email = String(m.email ?? '').toLowerCase();
            const matchesSearch = !term || fullName.includes(term) || email.includes(term);
            const matchesHelpStatus = !showOnlyHelpNeeded || Number(m.status_id) === 1;
            return matchesSearch && matchesHelpStatus;
        });
        renderMembersList(filtered);
    }

    if (membersFilter) {
        membersFilter.addEventListener('input', (): void => applyMembersFilters());
    }

    // View Check-in History
    let currentViewingUserId: number | null = null;
    let currentViewingUserLatestCheckin: CheckIn | null = null;

    window.viewCheckInHistory = async (userId: number, memberName: string): Promise<void> => {
        // Track the viewing user for admin feedback
        currentViewingUserId = userId;
        currentViewingUserLatestCheckin = null;

        // Set member name
        (document.getElementById('checkin-history-name') as HTMLElement).textContent = memberName;

        // Show/hide admin feedback panel based on current user level
        const feedbackPanel = document.getElementById('admin-feedback-panel') as HTMLDivElement;
        const feedbackText = document.getElementById('admin-feedback-text') as HTMLTextAreaElement;
        const feedbackMessage = document.getElementById('feedback-message') as HTMLDivElement;

        if (feedbackPanel) {
            if (currentUserLevel >= 2) {
                feedbackPanel.classList.remove('hidden');
                feedbackText.value = '';
                feedbackMessage.classList.add('hidden');
            } else {
                feedbackPanel.classList.add('hidden');
            }
        }

        // Fetch check-in history
        try {
            const res = await fetch(`/api/user/${userId}/checkins`);
            if (res.ok) {
                const checkins: CheckIn[] = await res.json();
                // Store the latest checkin for admin use
                if (checkins.length > 0) {
                    currentViewingUserLatestCheckin = checkins[0];
                }
                renderCheckInHistory(checkins);
            } else {
                (document.getElementById('checkin-history-list') as HTMLDivElement).innerHTML = '<p class="text-red-600 dark:text-red-400">Failed to load check-in history</p>';
            }
        } catch (err) {
            console.error('Error fetching check-in history:', err);
            (document.getElementById('checkin-history-list') as HTMLDivElement).innerHTML = '<p class="text-red-600 dark:text-red-400">Error loading check-in history</p>';
        }

        navigateTo('checkinHistory');
    };

    function renderCheckInHistory(checkins: CheckIn[]): void {
        const historyList = document.getElementById('checkin-history-list') as HTMLDivElement;
        historyList.innerHTML = '';

        if (checkins.length === 0) {
            historyList.innerHTML = '<p class="text-slate-500 dark:text-vsdark-text-secondary text-center">No check-in history</p>';
            return;
        }

        checkins.forEach((checkin: CheckIn) => {
            const div = createCheckInHistoryEntry(checkin);
            historyList.appendChild(div);
        });
    }

    function createCheckInHistoryEntry(checkin: CheckIn): HTMLDivElement {
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
        return div;
    }

    function prependAdminFeedbackEntry(feedbackText: string, statusId: number): void {
        const historyList = document.getElementById('checkin-history-list') as HTMLDivElement;

        // Create a fake checkin object for this entry
        const now = new Date();
        const fakeCheckin: CheckIn = {
            id: 'admin-' + Date.now(),
            status_id: statusId,
            timestamp: now.toISOString(),
            status: `[${currentUserName}] ${feedbackText}`
        };

        const div = createCheckInHistoryEntry(fakeCheckin);
        historyList.insertBefore(div, historyList.firstChild);
    }

    // Admin Feedback Button Handlers
    const feedbackSubmitBtn = document.getElementById('btn-feedback-submit') as HTMLButtonElement;
    const feedbackCloseBtn = document.getElementById('btn-feedback-close') as HTMLButtonElement;

    if (feedbackSubmitBtn) {
        feedbackSubmitBtn.addEventListener('click', async (): Promise<void> => {
            const feedbackText = (document.getElementById('admin-feedback-text') as HTMLTextAreaElement).value.trim();
            const feedbackMessage = document.getElementById('feedback-message') as HTMLDivElement;

            if (!feedbackText) {
                feedbackMessage.classList.remove('hidden');
                feedbackMessage.textContent = 'Please enter feedback text';
                feedbackMessage.className = 'text-center text-sm mt-2 text-red-600 dark:text-red-400';
                return;
            }

            if (!currentViewingUserLatestCheckin) {
                feedbackMessage.classList.remove('hidden');
                feedbackMessage.textContent = 'Error: No check-in data available';
                feedbackMessage.className = 'text-center text-sm mt-2 text-red-600 dark:text-red-400';
                return;
            }

            try {
                feedbackSubmitBtn.disabled = true;
                feedbackCloseBtn.disabled = true;

                const res = await fetch(`/api/admin/checkins/${currentViewingUserLatestCheckin.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        status: feedbackText,
                        status_id: currentViewingUserLatestCheckin.status_id // Keep original status
                    })
                });

                if (res.ok) {
                    feedbackMessage.classList.remove('hidden');
                    feedbackMessage.textContent = 'Feedback submitted successfully';
                    feedbackMessage.className = 'text-center text-sm mt-2 text-green-600 dark:text-green-400';

                    // Add new entry to history immediately
                    prependAdminFeedbackEntry(feedbackText, currentViewingUserLatestCheckin.status_id);

                    // Clear feedback text
                    (document.getElementById('admin-feedback-text') as HTMLTextAreaElement).value = '';
                } else {
                    feedbackMessage.classList.remove('hidden');
                    feedbackMessage.textContent = 'Failed to submit feedback';
                    feedbackMessage.className = 'text-center text-sm mt-2 text-red-600 dark:text-red-400';
                }
            } catch (err) {
                console.error('Error submitting feedback:', err);
                feedbackMessage.classList.remove('hidden');
                feedbackMessage.textContent = 'Error: ' + (err as Error).message;
                feedbackMessage.className = 'text-center text-sm mt-2 text-red-600 dark:text-red-400';
            } finally {
                feedbackSubmitBtn.disabled = false;
                feedbackCloseBtn.disabled = false;
            }
        });
    }

    if (feedbackCloseBtn) {
        feedbackCloseBtn.addEventListener('click', async (): Promise<void> => {
            const feedbackText = (document.getElementById('admin-feedback-text') as HTMLTextAreaElement).value.trim();
            const feedbackMessage = document.getElementById('feedback-message') as HTMLDivElement;

            if (!feedbackText) {
                feedbackMessage.classList.remove('hidden');
                feedbackMessage.textContent = 'Please enter feedback text';
                feedbackMessage.className = 'text-center text-sm mt-2 text-red-600 dark:text-red-400';
                return;
            }

            if (!currentViewingUserLatestCheckin) {
                feedbackMessage.classList.remove('hidden');
                feedbackMessage.textContent = 'Error: No check-in data available';
                feedbackMessage.className = 'text-center text-sm mt-2 text-red-600 dark:text-red-400';
                return;
            }

            try {
                feedbackSubmitBtn.disabled = true;
                feedbackCloseBtn.disabled = true;

                const res = await fetch(`/api/admin/checkins/${currentViewingUserLatestCheckin.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        status: feedbackText,
                        status_id: 0 // Close the request (OK status)
                    })
                });

                if (res.ok) {
                    feedbackMessage.classList.remove('hidden');
                    feedbackMessage.textContent = 'Help request closed and feedback submitted';
                    feedbackMessage.className = 'text-center text-sm mt-2 text-green-600 dark:text-green-400';

                    // Add new entry to history immediately (status_id: 0 = closed/OK)
                    prependAdminFeedbackEntry(feedbackText, 0);

                    // Clear feedback text
                    (document.getElementById('admin-feedback-text') as HTMLTextAreaElement).value = '';
                } else {
                    feedbackMessage.classList.remove('hidden');
                    feedbackMessage.textContent = 'Failed to close help request';
                    feedbackMessage.className = 'text-center text-sm mt-2 text-red-600 dark:text-red-400';
                }
            } catch (err) {
                console.error('Error closing help request:', err);
                feedbackMessage.classList.remove('hidden');
                feedbackMessage.textContent = 'Error: ' + (err as Error).message;
                feedbackMessage.className = 'text-center text-sm mt-2 text-red-600 dark:text-red-400';
            } finally {
                feedbackSubmitBtn.disabled = false;
                feedbackCloseBtn.disabled = false;
            }
        });
    }

    // Check In Logic
    window.openCheckIn = (): void => {
        navigateTo('checkin');

        // Clear status box and message
        checkinStatus.value = '';
        const messageDiv = document.getElementById('checkin-message') as HTMLDivElement;
        messageDiv.textContent = '';
        messageDiv.className = 'text-center text-sm font-medium p-3 rounded hidden';
    };

    window.submitCheckIn = async (statusType: string): Promise<void> => {
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
                const messageDiv = document.getElementById('checkin-message') as HTMLDivElement;
                messageDiv.textContent = `Check-in submitted: ${previousText}`;
                messageDiv.className = 'text-center text-sm font-medium p-3 rounded bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';

                // Reset and go home after a delay
                checkinStatus.value = '';
                setTimeout((): void => {
                    window.goHome();
                }, 1500);
            } else {
                const result = await res.json() as Record<string, string>;
                const messageDiv = document.getElementById('checkin-message') as HTMLDivElement;
                messageDiv.textContent = result.error || 'Check-in failed';
                messageDiv.className = 'text-center text-sm font-medium p-3 rounded bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
            }
        } catch (err) {
            console.error('Error submitting check-in:', err);
            const messageDiv = document.getElementById('checkin-message') as HTMLDivElement;
            messageDiv.textContent = 'Network error occurred';
            messageDiv.className = 'text-center text-sm font-medium p-3 rounded bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
        }
    };

    // UI Logic: Forms
    DOM_CORE.postForm.addEventListener('submit', (e: Event): void => {
        e.preventDefault();
        const content = DOM_CORE.postContent.value.trim();
        if (content && ws) {
            // Assume authentication is handled via cookie or session logic on server for now
            // or we'd send a token. relying on ws.data for now.
            const message = { type: 'post', content: content, tag: currentTag };
            ws.send(JSON.stringify(message));
            DOM_CORE.postContent.value = '';
        }
    });

    // Helper: Add Message
    function addMessageToChat(post: Post): void {
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
            <p class="text-xs font-bold text-orange-600 dark:text-vsdark-active1 mb-1">${post.userName}</p>
            <p class="text-slate-800 dark:text-vsdark-text">${post.content}</p>
            <p class="text-[10px] text-slate-400 dark:text-vsdark-text-muted mt-1">${dateString} ${timeString}</p>
        `;

        DOM_CORE.messageContainer.appendChild(messageDiv);
        scrollToBottom();
    }

    function scrollToBottom(): void {
        DOM_CORE.messageContainer.scrollTop = DOM_CORE.messageContainer.scrollHeight;
    }

    function updateConnectionStatus(isOnline: boolean): void {
        if (!DOM_CORE.connectionStatus) return;

        if (isOnline) {
            DOM_CORE.connectionStatus.classList.remove('bg-red-500');
            DOM_CORE.connectionStatus.classList.add('bg-emerald-400', 'animate-pulse');
        } else {
            DOM_CORE.connectionStatus.classList.remove('bg-emerald-400', 'animate-pulse');
            DOM_CORE.connectionStatus.classList.add('bg-red-500');
        }
    }

    // Helper: Render Zone List
    function renderZoneList(tags: Tag[]): void {
        if (!DOM_CORE.zoneList) return;
        DOM_CORE.zoneList.innerHTML = '';

        tags.forEach((tag: Tag) => {
            const button = document.createElement('button');

            const zoneLevel = ZONE_LEVELS[tag.hazard_level_id as keyof typeof ZONE_LEVELS] || ZONE_LEVELS[1];

            // Base text color
            let nameClass = 'font-bold text-orange-600 dark:text-vsdark-active1';

            // Apply colors based on hazard level id
            if (zoneLevel.color === 'emerald') {
                nameClass = 'font-bold text-green-600 dark:text-green-400';
            } else if (zoneLevel.color === 'red') {
                nameClass = 'font-bold text-red-600 dark:text-red-400';
            } else if (zoneLevel.color === 'amber') {
                nameClass = 'font-bold text-amber-600 dark:text-amber-400';
            } else if (zoneLevel.color === 'orange') {
                nameClass = 'font-bold text-orange-600 dark:text-orange-400';
            }

            button.className = 'w-full text-left p-4 bg-white dark:bg-vsdark-surface rounded-lg shadow-sm border border-slate-200 dark:border-vsdark-border hover:bg-slate-50 dark:hover:bg-vsdark-input transition-colors mb-2';
            button.onclick = (): void => window.openZone(tag.name);

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

            DOM_CORE.zoneList.appendChild(button);
        });
    }

    // Helper: Update Header Style based on Hazard Level
    function updateHeaderStyle(levelId: number | string): void {
        if (!chatHeader || !hazardBar) return;
        const zoneLevel = ZONE_LEVELS[Number(levelId) as keyof typeof ZONE_LEVELS] || ZONE_LEVELS[1];

        // Remove existing colors first
        const headerColors = [
            'bg-green-700', 'dark:bg-green-800',
            'bg-indigo-700', 'bg-red-700', 'bg-orange-600', 'bg-amber-500', 'bg-emerald-600', 'bg-slate-700',
            'dark:bg-indigo-900', 'dark:bg-red-900', 'dark:bg-orange-800', 'dark:bg-amber-600', 'dark:bg-emerald-800', 'dark:bg-vsdark-surface'
        ];
        chatHeader.classList.remove(...headerColors);

        let headerBg, headerBgDark, barBg, barBorder, barText;

        if (zoneLevel.color === 'red') {
            headerBg = 'bg-red-700';
            headerBgDark = 'dark:bg-red-900';
            barBg = 'bg-white/20';
            barBorder = 'border-white/30';
        } else if (zoneLevel.color === 'orange') {
            headerBg = 'bg-orange-600';
            headerBgDark = 'dark:bg-orange-800';
            barBg = 'bg-white/20';
            barBorder = 'border-white/30';
        } else if (zoneLevel.color === 'amber') {
            headerBg = 'bg-amber-500';
            headerBgDark = 'dark:bg-amber-600';
            barBg = 'bg-black/10';
            barBorder = 'border-black/20';
        } else {
            // Default Clear
            headerBg = 'bg-green-700';
            headerBgDark = 'dark:bg-green-800';
            barBg = 'bg-emerald-500/20';
            barBorder = 'border-emerald-500/30';
        }
        barText = `Hazard Level: ${zoneLevel.label}`;

        chatHeader.classList.add(headerBg, headerBgDark);
        hazardBar.className = `mt-2 text-xs p-1 rounded text-center border ${barBg} ${barBorder}`;
        hazardBar.textContent = barText;
    }

    // Logout Logic
    window.logout = (): void => {
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
        window.goHome();
    };

    // Admin Logic
    window.openAdmin = (): void => {
        navigateTo('adminNav');
    };

    window.openAdminSection = async (section: string): Promise<void> => {
        if (section === 'users') {
            // Fetch Users
            try {
                const res = await fetch('/api/admin/users');
                if (res.ok) {
                    const users = await res.json() as User[];
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
                    const zones = await res.json() as Tag[];
                    allZones = zones;
                    renderAdminZoneList(zones);
                } else {
                    alert('Failed to fetch zones');
                }
            } catch (e) {
                console.error('Error fetching zones:', e);
            }
            navigateTo('adminZones');
        } else if (section === 'announcements') {
            // Fetch Announcements
            try {
                const res = await fetch('/api/announcements');
                if (res.ok) {
                    const currentAnnouncement: Announcement = await res.json();
                    displayCurrentAnnouncement(currentAnnouncement);
                }

                const historyRes = await fetch('/api/admin/announcements');
                if (historyRes.ok) {
                    const history: Announcement[] = await historyRes.json();
                    renderAnnouncementsHistory(history);
                }
            } catch (e) {
                console.error('Error fetching announcements:', e);
            }
            navigateTo('announcements');
        }
    };

    // Filter Logic
    if (adminUserFilter) {
        adminUserFilter.addEventListener('input', (e: Event): void => {
            const term = (e.target as HTMLInputElement).value.toLowerCase();
            const filtered = allUsers.filter((u: User) => u.full_name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term));
            renderAdminUserList(filtered);
        });
    }

    function renderAdminUserList(users: User[]): void {
        adminUserList.innerHTML = '';
        users.forEach((user: User) => {
            const div = document.createElement('div');
            div.className = 'flex items-center justify-between p-3 bg-slate-50 dark:bg-vsdark-input rounded border border-slate-200 dark:border-vsdark-border-light cursor-pointer hover:bg-slate-100 dark:hover:bg-vsdark-border-light';

            const userLevel = USER_LEVELS[user.user_level as keyof typeof USER_LEVELS]?.label
                ? `${user.user_level} ${USER_LEVELS[user.user_level as keyof typeof USER_LEVELS].label}`
                : `${user.user_level} Unknown`;

            div.innerHTML = `
                <div class="flex-1">
                    <p class="font-bold text-slate-800 dark:text-vsdark-text">${user.full_name}</p>
                    <p class="text-xs text-slate-500 dark:text-vsdark-text-secondary">${user.email}</p>
                    <p class="text-xs text-slate-500 dark:text-vsdark-text-secondary">${user.phone_number || 'N/A'}</p>
                </div>
                <div class="flex items-center gap-2">
                    <span class="px-2 py-1 rounded text-xs font-semibold bg-slate-200 dark:bg-vsdark-input text-slate-800 dark:text-vsdark-text">${userLevel}</span>
                    <button onclick="window.openUserEdit(${user.id})" class="px-3 py-1 bg-vsdark-active5 text-white rounded text-xs font-bold hover:bg-vsdark-active1">Edit</button>
                </div>
            `;
            adminUserList.appendChild(div);
        });
    }

    window.updateUserLevel = async (userId: number, newLevel: string | number): Promise<void> => {
        try {
            const res = await fetch('/api/admin/update-level', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, newLevel: parseInt(String(newLevel)) })
            });

            if (!res.ok) {
                alert('Failed to update level');
            }
        } catch (e) {
            console.error('Error updating level:', e);
        }
    };

    window.openUserEdit = async (userId: number): Promise<void> => {
        currentEditingUserId = userId;
        const user = allUsers.find((u: User) => u.id === userId);

        if (!user) {
            alert('User not found');
            return;
        }

        // Populate form
        (document.getElementById('user-fullname-input') as HTMLInputElement).value = user.full_name || '';
        (document.getElementById('user-email-input') as HTMLInputElement).value = user.email || '';
        (document.getElementById('user-phone-input') as HTMLInputElement).value = user.phone_number || '';
        (document.getElementById('user-address-input') as HTMLInputElement).value = user.physical_address || '';
        (document.getElementById('user-level-input') as HTMLSelectElement).value = String(user.user_level || '0');

        navigateTo('userEdit');
    };

    window.closeUserEdit = (): void => {
        goBack();
    };

    if (userEditForm) {
        userEditForm.addEventListener('submit', async (e: Event): Promise<void> => {
            e.preventDefault();

            const userEditMessage = document.getElementById('user-edit-message') as HTMLDivElement;
            userEditMessage.classList.add('hidden');

            if (!currentEditingUserId) {
                alert('No user selected');
                return;
            }

            const data = {
                full_name: (document.getElementById('user-fullname-input') as HTMLInputElement).value,
                email: (document.getElementById('user-email-input') as HTMLInputElement).value,
                phone_number: (document.getElementById('user-phone-input') as HTMLInputElement).value,
                physical_address: (document.getElementById('user-address-input') as HTMLInputElement).value,
                user_level: parseInt((document.getElementById('user-level-input') as HTMLSelectElement).value)
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
                    setTimeout((): void => {
                        window.closeUserEdit();
                        window.openAdminSection('users');
                    }, 1500);
                } else {
                    const result = await res.json() as Record<string, string>;
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
        adminZoneFilter.addEventListener('input', (e: Event): void => {
            const term = (e.target as HTMLInputElement).value.toLowerCase();
            const filtered = allZones.filter((z: Tag) => z.name.toLowerCase().includes(term) || (z.description && z.description.toLowerCase().includes(term)));
            renderAdminZoneList(filtered);
        });
    }

    function renderAdminZoneList(zones: Tag[]): void {
        adminZoneList.innerHTML = '';
        zones.forEach((zone: Tag) => {
            const div = document.createElement('div');
            div.className = 'flex items-center justify-between p-3 bg-slate-50 dark:bg-vsdark-input rounded border border-slate-200 dark:border-vsdark-border-light cursor-pointer hover:bg-slate-100 dark:hover:bg-vsdark-border-light';

            const zoneLevel = ZONE_LEVELS[zone.hazard_level_id as keyof typeof ZONE_LEVELS] || ZONE_LEVELS[1];

            let hazardClass = 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
            if (zoneLevel.color === 'amber') {
                hazardClass = 'bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200';
            } else if (zoneLevel.color === 'orange') {
                hazardClass = 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200';
            } else if (zoneLevel.color === 'red') {
                hazardClass = 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200';
            }

            const weatherName = WEATHER_LEVELS[zone.id as unknown as keyof typeof WEATHER_LEVELS]?.name || 'Unknown';

            div.innerHTML = `
                <div class="flex-1">
                    <p class="font-bold text-slate-800 dark:text-vsdark-text">${zone.name}</p>
                    <p class="text-xs text-slate-500 dark:text-vsdark-text-secondary">${zone.description || 'No description'}</p>
                    <p class="text-xs text-slate-500 dark:text-vsdark-text-secondary">Weather: ${weatherName}</p>
                </div>
                <div class="flex items-center gap-2">
                    <span class="px-2 py-1 rounded text-xs font-semibold ${hazardClass}">${zoneLevel.label}</span>
                    <button onclick="window.openZoneEdit(${zone.id})" class="px-3 py-1 bg-vsdark-active5 text-white rounded text-xs font-bold hover:bg-vsdark-active1">Edit</button>
                </div>
            `;
            adminZoneList.appendChild(div);
        });
    }

    window.openZoneEdit = async (zoneId: number): Promise<void> => {
        currentEditingZoneId = zoneId;
        const zone = allZones.find((z: Tag) => z.id === zoneId);

        if (!zone) {
            alert('Zone not found');
            return;
        }

        // Populate form
        (document.getElementById('zone-name-input') as HTMLInputElement).value = zone.name;
        (document.getElementById('zone-description-input') as HTMLTextAreaElement).value = zone.description || '';
        (document.getElementById('zone-hazard-level-id-input') as HTMLSelectElement).value = String(zone.hazard_level_id || 1);
        (document.getElementById('zone-level-input') as HTMLSelectElement).value = String(zone.access_level || '0');
        (document.getElementById('zone-weather-id-input') as HTMLSelectElement).value = String(zone.id || 1);
        (document.getElementById('zone-person-in-charge-input') as HTMLInputElement).value = '';

        navigateTo('zoneEdit');
    };

    window.closeZoneEdit = (): void => {
        goBack();
    };

    if (zoneEditForm) {
        zoneEditForm.addEventListener('submit', async (e: Event): Promise<void> => {
            e.preventDefault();

            const zoneEditMessage = document.getElementById('zone-edit-message') as HTMLDivElement;
            zoneEditMessage.classList.add('hidden');

            if (!currentEditingZoneId) {
                alert('No zone selected');
                return;
            }

            const data = {
                name: (document.getElementById('zone-name-input') as HTMLInputElement).value,
                description: (document.getElementById('zone-description-input') as HTMLTextAreaElement).value,
                hazard_level_id: parseInt((document.getElementById('zone-hazard-level-id-input') as HTMLSelectElement).value),
                access_level: parseInt((document.getElementById('zone-level-input') as HTMLSelectElement).value),
                weather_id: parseInt((document.getElementById('zone-weather-id-input') as HTMLSelectElement).value),
                person_in_charge: (document.getElementById('zone-person-in-charge-input') as HTMLInputElement).value
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
                    setTimeout((): void => {
                        window.closeZoneEdit();
                        window.openAdminSection('zones');
                    }, 1500);
                } else {
                    const result = await res.json() as Record<string, string>;
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

    // ========== ANNOUNCEMENTS MANAGEMENT ========== //
    let currentAnnouncementId: number | null = null;

    function displayCurrentAnnouncement(announcement: Announcement | null): void {
        const displayEl = document.getElementById('current-announcement-display') as HTMLDivElement;
        const clearBtn = document.getElementById('btn-clear-announcement') as HTMLButtonElement;

        if (!announcement || !announcement.is_active) {
            displayEl.innerHTML = '<p class="text-sm text-slate-500 dark:text-vsdark-text-secondary text-center">No active announcement</p>';
            clearBtn.disabled = true;
            currentAnnouncementId = null;
            return;
        }

        currentAnnouncementId = announcement.id;
        clearBtn.disabled = false;

        const hazardLevel = ZONE_LEVELS[announcement.hazard_level_id as keyof typeof ZONE_LEVELS] || ZONE_LEVELS[1];
        let timestamp = announcement.created_at;
        if (typeof timestamp === 'string' && !timestamp.includes('Z') && !timestamp.includes('+')) {
            timestamp = timestamp.replace(' ', 'T') + 'Z';
        }
        const date = new Date(timestamp);
        const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
        const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        displayEl.innerHTML = `
            <div class="space-y-2">
                <div class="flex items-center gap-2">
                    <span class="px-2 py-1 rounded text-xs font-bold" style="background-color: ${hazardLevel.hex}; color: white;">
                        ${hazardLevel.label}
                    </span>
                    <span class="text-xs text-slate-500 dark:text-vsdark-text-secondary">${dateStr} at ${timeStr}</span>
                </div>
                <p class="text-sm font-semibold dark:text-vsdark-text">${announcement.announcement_text}</p>
                <p class="text-xs text-slate-500 dark:text-vsdark-text-secondary">By ${announcement.created_by_user_name}</p>
            </div>
        `;
    }

    function renderAnnouncementsHistory(announcements: Announcement[]): void {
        const historyList = document.getElementById('announcements-history-list') as HTMLDivElement;
        historyList.innerHTML = '';

        if (announcements.length === 0) {
            historyList.innerHTML = '<p class="text-sm text-slate-500 dark:text-vsdark-text-secondary text-center">No history</p>';
            return;
        }

        announcements.forEach((ann: Announcement) => {
            const div = document.createElement('div');
            div.className = 'p-3 bg-slate-50 dark:bg-vsdark-input rounded border border-slate-200 dark:border-vsdark-border-light';

            const hazardLevel = ZONE_LEVELS[ann.hazard_level_id as keyof typeof ZONE_LEVELS] || ZONE_LEVELS[1];
            const statusClass = ann.is_active ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300';
            const statusText = ann.is_active ? 'Active' : 'Cleared';

            let timestamp = ann.created_at;
            if (typeof timestamp === 'string' && !timestamp.includes('Z') && !timestamp.includes('+')) {
                timestamp = timestamp.replace(' ', 'T') + 'Z';
            }
            const date = new Date(timestamp);
            const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
            const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            let clearedInfo = '';
            if (!ann.is_active && ann.cleared_at) {
                let clearedTimestamp = ann.cleared_at;
                if (typeof clearedTimestamp === 'string' && !clearedTimestamp.includes('Z') && !clearedTimestamp.includes('+')) {
                    clearedTimestamp = clearedTimestamp.replace(' ', 'T') + 'Z';
                }
                const clearedDate = new Date(clearedTimestamp);
                const clearedDateStr = clearedDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
                const clearedTimeStr = clearedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                clearedInfo = `<p class="text-xs text-slate-500 dark:text-vsdark-text-secondary mt-1">Cleared by ${ann.cleared_by_user_name} on ${clearedDateStr} at ${clearedTimeStr}</p>`;
            }

            div.innerHTML = `
                <div class="flex items-center gap-2 mb-2">
                    <span class="px-2 py-0.5 rounded text-xs font-bold ${statusClass}">${statusText}</span>
                    <span class="px-2 py-0.5 rounded text-xs font-bold" style="background-color: ${hazardLevel.hex}; color: white;">
                        ${hazardLevel.label}
                    </span>
                    <span class="text-xs text-slate-500 dark:text-vsdark-text-secondary">${dateStr} ${timeStr}</span>
                </div>
                <p class="text-sm dark:text-vsdark-text">${ann.announcement_text}</p>
                <p class="text-xs text-slate-500 dark:text-vsdark-text-secondary mt-1">By ${ann.created_by_user_name}</p>
                ${clearedInfo}
            `;
            historyList.appendChild(div);
        });
    }

    window.clearCurrentAnnouncement = async (): Promise<void> => {
        if (!currentAnnouncementId) return;

        if (!confirm('Are you sure you want to clear the current announcement?')) {
            return;
        }

        try {
            const res = await fetch(`/api/admin/announcements/${currentAnnouncementId}/clear`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' }
            });

            if (res.ok) {
                // Refresh the display
                displayCurrentAnnouncement(null);

                // Reload history
                const historyRes = await fetch('/api/admin/announcements');
                if (historyRes.ok) {
                    const history: Announcement[] = await historyRes.json();
                    renderAnnouncementsHistory(history);
                }
            } else {
                alert('Failed to clear announcement');
            }
        } catch (e) {
            console.error('Error clearing announcement:', e);
            alert('Error clearing announcement');
        }
    };

    // Handle announcement form submission
    const announcementForm = document.getElementById('announcement-form') as HTMLFormElement;
    if (announcementForm) {
        announcementForm.addEventListener('submit', async (e: Event): Promise<void> => {
            e.preventDefault();
            const announcementMessage = document.getElementById('announcement-message') as HTMLDivElement;
            announcementMessage.classList.add('hidden');

            const data = {
                announcement_text: (document.getElementById('announcement-text-input') as HTMLTextAreaElement).value,
                hazard_level_id: parseInt((document.getElementById('announcement-hazard-level-input') as HTMLSelectElement).value)
            };

            try {
                const res = await fetch('/api/admin/announcements', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                if (res.ok) {
                    announcementMessage.textContent = 'Announcement published successfully!';
                    announcementMessage.className = 'text-center text-sm mt-2 text-green-600 dark:text-green-400';
                    announcementMessage.classList.remove('hidden');

                    // Clear form
                    announcementForm.reset();

                    // Refresh displays
                    setTimeout(async (): Promise<void> => {
                        const currentRes = await fetch('/api/announcements');
                        if (currentRes.ok) {
                            const current: Announcement = await currentRes.json();
                            displayCurrentAnnouncement(current);
                        }

                        const historyRes = await fetch('/api/admin/announcements');
                        if (historyRes.ok) {
                            const history: Announcement[] = await historyRes.json();
                            renderAnnouncementsHistory(history);
                        }
                    }, 500);
                } else {
                    const result = await res.json() as Record<string, string>;
                    announcementMessage.textContent = result.error || 'Failed to publish announcement';
                    announcementMessage.className = 'text-center text-sm mt-2 text-red-600 dark:text-red-400';
                    announcementMessage.classList.remove('hidden');
                }
            } catch (err) {
                announcementMessage.textContent = 'Network error';
                announcementMessage.className = 'text-center text-sm mt-2 text-red-600 dark:text-red-400';
                announcementMessage.classList.remove('hidden');
            }
        });
    }
});
