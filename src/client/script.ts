// src/client/script.ts
//
// Application entry point and orchestration layer.
//
// Responsibilities:
//   - Boot sequence: initializes all modules in the correct order after DOMContentLoaded
//   - Auth gate: checks session on load; WebSocket only opens after successful auth
//   - Global function wiring: exposes window.* functions called from inline HTML handlers
//     (full type declarations live in src/client/types/globals.d.ts)
//
// This file intentionally contains NO business logic — each concern lives in its own module:
//   chat.ts        — WebSocket, zone list, message rendering, header styling
//   navigation.ts  — view stack, navigateTo / goBack, nav button state
//   auth.ts        — login/register/profile forms, session check
//   admin.ts       — user management panel
//   admin-zones.ts — zone management panel (initialised via admin.ts)
//   checkin.ts     — check-in submission and history
//   members.ts     — member directory
//   dashboard.ts   — dashboard stat card and severity styling
//   announcements.ts — announcement display and admin form
//   theme.ts       — light/dark mode toggle
//   dropdowns.ts   — shared reusable dropdown widgets
//   dom-core.ts    — references to shared DOM nodes (forms, containers, etc.)
//   dom-auth.ts    — references to auth-specific DOM nodes

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

document.addEventListener('DOMContentLoaded', (): void => {

    // ========== CORE DOM / ICON SETUP ========== //
    // Query and cache shared DOM nodes used across the app.
    DOM_CORE.init();
    DOM_AUTH.init();

    // DOM elements needed only in this orchestration layer.
    const viewAuth = document.getElementById('view-auth') as HTMLDivElement;
    const navAdmin = document.getElementById('nav-admin') as HTMLDivElement;

    // Inject inline SVG icons referenced throughout the templates.
    ICONS.initIcons();

    // ========== DROPDOWN WIDGETS ========== //
    // Populate all shared <select> dropdowns (access levels, hazard levels, weather).
    DROPDOWNS.initLevelDropdowns();
    DROPDOWNS.initHazardDropdown();
    DROPDOWNS.initWeatherDropdown();
    DROPDOWNS.initAnnouncementHazardDropdown();

    // ========== ANNOUNCEMENTS (pre-auth) ========== //
    // Fetch and display the current announcement immediately — visible before login.
    ANNOUNCEMENTS.fetchAndDisplayAnnouncement();

    // ========== CHAT + NAVIGATION ========== //
    // Set up the post form listener and query chat DOM nodes.
    // Must run before NAV.initNavigation so the getter callbacks are ready.
    CHAT.initChat();

    // Build the view map and push 'home' as the initial stack entry.
    // Passes getter functions so navigation always reads the live ws / currentTag values.
    NAV.initNavigation({ getWs: CHAT.getWs, getCurrentTag: CHAT.getCurrentTag });

    // ========== AUTH ========== //
    // authConfig is shared by checkAuth, initAuthForms so they act on the same elements.
    // onAuthSuccess opens the WebSocket — this is the gate that starts real-time data.
    const authConfig = {
        viewAuth,
        navAdmin,
        onAuthSuccess: () => CHAT.initWebSocket()
    };

    // Hit /api/me to check for an existing session; shows the app or the login screen.
    AUTH.checkAuth(authConfig);

    // Wire auth form actions (login / register toggle, submit handlers, profile save).
    window.toggleAuthMode = (mode: string): void => AUTH.toggleAuthMode(mode);
    window.openProfile = async (): Promise<void> => AUTH.openProfile();
    AUTH.initAuthForms(authConfig);
    AUTH.initProfileForm();

    // ========== THEME ========== //
    THEME.initTheme();
    window.toggleTheme = (): void => THEME.toggleTheme();

    // ========== ZONE / CHAT NAVIGATION ========== //
    // openZone is called from zone list buttons; switches currentTag and navigates to chat.
    window.openZone = CHAT.openZone;

    // goHome navigates to the home view and requests a fresh tag list (unread counts).
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

    window.openSettings = (): void => NAV.navigateTo('settings');

    // ========== MEMBERS ========== //
    MEMBERS.initMembers();
    window.openMembers = (): Promise<void> => MEMBERS.openMembers();
    window.toggleHelpFilter = (): void => MEMBERS.toggleHelpFilter();
    window.toggleOnlineFilter = (): void => MEMBERS.toggleOnlineFilter();

    // ========== CHECK-IN ========== //
    CHECKIN.initCheckIn();
    window.viewCheckInHistory = (userId, memberName): Promise<void> => CHECKIN.viewCheckInHistory(userId, memberName);
    window.openCheckIn = (): void => CHECKIN.openCheckIn();
    window.submitCheckIn = (statusType): Promise<void> => CHECKIN.submitCheckIn(statusType);

    // ========== LOGOUT ========== //
    window.logout = (): void => {
        // Expire both session cookies so the browser won't send them on the next request.
        document.cookie = 'session_id=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        document.cookie = 'session_id_sig=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';

        // Close the WebSocket cleanly before resetting UI state.
        CHAT.disconnect();

        // Reveal the auth screen again and navigate back to the home view.
        viewAuth.classList.remove('hidden');
        window.goHome();
    };

    // ========== ADMIN ========== //
    // initAdmin also initialises the admin-zones sub-panel internally.
    ADMIN.initAdmin();

    window.openAdmin = (): void => ADMIN.openAdmin();
    window.openAdminSection = (section: string): Promise<void> => ADMIN.openAdminSection(section);
    window.updateUserLevel = (userId: number, newLevel: string | number): Promise<void> => ADMIN.updateUserLevel(userId, newLevel);
    window.openUserEdit = (userId: number): Promise<void> => ADMIN.openUserEdit(userId);
    window.closeUserEdit = (): void => ADMIN.closeUserEdit();
    window.openZoneEdit = (zoneId: number): Promise<void> => ADMIN.openZoneEdit(zoneId);
    window.closeZoneEdit = (): void => ADMIN.closeZoneEdit();

    // ========== ANNOUNCEMENTS (admin form) ========== //
    window.clearCurrentAnnouncement = ANNOUNCEMENTS.clearCurrentAnnouncement;
    window.openAnnouncementModal = ANNOUNCEMENTS.openAnnouncementModal;
    window.closeAnnouncementModal = ANNOUNCEMENTS.closeAnnouncementModal;
    ANNOUNCEMENTS.initAnnouncementsForm();

    // ========== REACTIONS SHEET ========== //
    window.closeReactionsSheet = CHAT.closeReactionsSheet;

});
