// src/client/script.ts

// Main client-side script for the Bun Chat application
// This file initializes the application, manages global state, and handles navigation between views.
// It also sets up WebSocket communication and defines global functions for authentication, profile management, and more.
// The code is organized into sections for clarity, and it imports various modules for specific functionalities like dropdowns, announcements, and DOM manipulation.
//  Note: Global function declarations are defined in src/client/types/globals.d.ts, which is a TypeScript declaration file that describes the shape of global functions without containing their implementations.

// Import necessary modules and types

// import { ICONS_SVG } from './modules/icons_svg.js';
import * as CHAT from './modules/chat.ts';
import { ICONS } from './modules/icons-init.ts';
import { DOM_CORE } from './modules/dom-core.ts';
import { DOM_AUTH } from './modules/dom-auth.ts';
import { DROPDOWNS } from './modules/dropdowns.ts';
import * as ANNOUNCEMENTS from './modules/announcements.ts';
import * as AUTH from './modules/auth.ts';
import * as ADMIN from './modules/admin.ts';
import * as CHECKIN from './modules/checkin.ts';
import * as MEMBERS from './modules/members.ts';
import * as THEME from './modules/theme.ts';
import * as NAV from './modules/navigation.ts';
import * as DASHBOARD from './modules/dashboard.ts';

// Global Declarations are defined in globals.d.ts, 

// Wait for DOM content to be fully loaded before initializing the application
document.addEventListener('DOMContentLoaded', (): void => {
    // DOM Core Elements Initialization
    DOM_CORE.init();

    const viewAuth = document.getElementById('view-auth') as HTMLDivElement;
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

    // Call on page load
    ANNOUNCEMENTS.fetchAndDisplayAnnouncement();

    CHAT.initChat();
    NAV.initNavigation({ getWs: CHAT.getWs, getCurrentTag: CHAT.getCurrentTag });

    // ========== AUTH LOGIC ========== //
    const authConfig = {
        viewAuth,
        navAdmin,
        onAuthSuccess: () => CHAT.initWebSocket()
    };

    AUTH.checkAuth(authConfig);

    window.toggleAuthMode = (mode: string): void => AUTH.toggleAuthMode(mode);
    window.openProfile = async (): Promise<void> => AUTH.openProfile();

    AUTH.initAuthForms(authConfig);
    AUTH.initProfileForm();

    THEME.initTheme();
    window.toggleTheme = (): void => THEME.toggleTheme();

    window.openZone = CHAT.openZone;

    window.goHome = (): void => {
        NAV.navigateTo('home', {
            onNavigate: (): void => {
                const ws = CHAT.getWs();
                if (ws && ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({ type: 'requestTags' }));
                }
            }
        });
    };

    window.openSettings = (): void => {
        NAV.navigateTo('settings');
    };

    window.openMembers = (): Promise<void> => MEMBERS.openMembers();
    window.toggleHelpFilter = (): void => MEMBERS.toggleHelpFilter();

    MEMBERS.initMembers();
    CHECKIN.initCheckIn();
    window.viewCheckInHistory = (userId, memberName): Promise<void> => CHECKIN.viewCheckInHistory(userId, memberName);
    window.openCheckIn = (): void => CHECKIN.openCheckIn();
    window.submitCheckIn = (statusType): Promise<void> => CHECKIN.submitCheckIn(statusType);

    // Logout Logic
    window.logout = (): void => {
        // Clear cookies
        document.cookie = 'session_id=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        document.cookie = 'session_id_sig=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';

        // Close WebSocket
        CHAT.disconnect();

        // Show Auth View
        viewAuth.classList.remove('hidden');

        // Reset UI (go home, close settings)
        window.goHome();
    };

    // ========== ADMIN LOGIC ========== //
    ADMIN.initAdmin();

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
