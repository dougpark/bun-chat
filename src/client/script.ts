// src/client/script.ts

// Main client-side script for the Bun Chat application
// This file initializes the application, manages global state, and handles navigation between views.
// It also sets up WebSocket communication and defines global functions for authentication, profile management, and more.
// The code is organized into sections for clarity, and it imports various modules for specific functionalities like dropdowns, announcements, and DOM manipulation.
//  Note: Global function declarations are defined in src/client/types/globals.d.ts, which is a TypeScript declaration file that describes the shape of global functions without containing their implementations.

// Import necessary modules and types

// import { ICONS_SVG } from './modules/icons_svg.js';
import { ZONE_LEVELS, USER_LEVELS, WEATHER_LEVELS } from '../shared/constants.ts';
import type { DashboardData, Announcement, Post, Tag, User, CheckIn, NavigateOptions, ViewConfig } from './types/types.ts';
import { ICONS } from './modules/icons-init.ts';
import { DOM_CORE } from './modules/dom-core.ts';
import { DOM_AUTH } from './modules/dom-auth.ts';
import { DROPDOWNS } from './modules/dropdowns.ts';
import * as ANNOUNCEMENTS from './modules/announcements.ts';
import * as AUTH from './modules/auth.ts';
import * as ADMIN from './modules/admin.ts';
import * as CHECKIN from './modules/checkin.ts';
import * as MEMBERS from './modules/members.ts';

// Global Declarations are defined in globals.d.ts, 

// Wait for DOM content to be fully loaded before initializing the application
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

    // DOM Auth Elements Initialization
    DOM_AUTH.init();

    // Icon Injection
    ICONS.initIcons();


    // Init dropdowns
    DROPDOWNS.initLevelDropdowns();
    DROPDOWNS.initHazardDropdown();
    DROPDOWNS.initWeatherDropdown();
    DROPDOWNS.initAnnouncementHazardDropdown();

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
            ANNOUNCEMENTS.displayAnnouncement(data.announcement);
        }
    }

    // Call on page load
    ANNOUNCEMENTS.fetchAndDisplayAnnouncement();

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

    // ========== AUTH LOGIC ========== //
    const authConfig = {
        viewAuth,
        navAdmin,
        onAuthSuccess: () => initWebSocket()
    };

    AUTH.checkAuth(authConfig);
    updateNavButtonStates('home');

    window.toggleAuthMode = (mode: string): void => AUTH.toggleAuthMode(mode);
    window.openProfile = async (): Promise<void> => AUTH.openProfile(navigateTo);

    AUTH.initAuthForms(authConfig);
    AUTH.initProfileForm();

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

    window.openMembers = (): Promise<void> => MEMBERS.openMembers();
    window.toggleHelpFilter = (): void => MEMBERS.toggleHelpFilter();

    MEMBERS.initMembers({ navigateTo });
    CHECKIN.initCheckIn({ navigateTo });
    window.viewCheckInHistory = (userId, memberName): Promise<void> => CHECKIN.viewCheckInHistory(userId, memberName);
    window.openCheckIn = (): void => CHECKIN.openCheckIn();
    window.submitCheckIn = (statusType): Promise<void> => CHECKIN.submitCheckIn(statusType);

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

    // ========== ADMIN LOGIC ========== //
    ADMIN.initAdmin({ navigateTo, goBack });

    window.openAdmin = (): void => ADMIN.openAdmin();
    window.openAdminSection = (section: string): Promise<void> => ADMIN.openAdminSection(section);
    window.updateUserLevel = (userId: number, newLevel: string | number): Promise<void> => ADMIN.updateUserLevel(userId, newLevel);
    window.openUserEdit = (userId: number): Promise<void> => ADMIN.openUserEdit(userId);
    window.closeUserEdit = (): void => ADMIN.closeUserEdit();
    window.openZoneEdit = (zoneId: number): Promise<void> => ADMIN.openZoneEdit(zoneId);
    window.closeZoneEdit = (): void => ADMIN.closeZoneEdit();

    // ========== ANNOUNCEMENTS MANAGEMENT ========== //
    window.clearCurrentAnnouncement = ANNOUNCEMENTS.clearCurrentAnnouncement;
    ANNOUNCEMENTS.initAnnouncementsForm();


});
