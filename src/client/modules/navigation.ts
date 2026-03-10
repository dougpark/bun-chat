// src/client/modules/navigation.ts
import type { NavigateOptions, ViewConfig } from '../types/types.ts';

// ========== STATE ========== //
const navigationStack: string[] = [];
let views: Record<string, ViewConfig> = {};

const navButtonMap: Record<string, string> = {
    home: 'nav-home',
    checkin: 'nav-checkin',
    members: 'nav-members',
    settings: 'nav-settings',
    admin: 'nav-admin'
};

// ========== GETTERS (injected from script.ts) ========== //
let _getWs: () => WebSocket | null = () => null;
let _getCurrentTag: () => string = () => '';

export function initNavigation(config: {
    getWs: () => WebSocket | null;
    getCurrentTag: () => string;
}): void {
    _getWs = config.getWs;
    _getCurrentTag = config.getCurrentTag;

    views = {
        home: { el: document.getElementById('view-home') as HTMLDivElement },
        chat: { el: document.getElementById('view-chat') as HTMLDivElement },
        settings: { el: document.getElementById('view-settings') as HTMLDivElement },
        profile: { el: document.getElementById('view-profile') as HTMLDivElement },
        admin: { el: document.getElementById('view-admin') as HTMLDivElement },
        adminNav: { el: document.getElementById('view-admin-nav') as HTMLDivElement },
        adminZones: { el: document.getElementById('view-admin-zones') as HTMLDivElement },
        announcements: { el: document.getElementById('view-announcements') as HTMLDivElement },
        zoneEdit: { el: document.getElementById('view-zone-edit') as HTMLDivElement },
        userEdit: { el: document.getElementById('view-user-edit') as HTMLDivElement },
        members: { el: document.getElementById('view-members') as HTMLDivElement },
        checkin: { el: document.getElementById('view-checkin') as HTMLDivElement },
        checkinHistory: { el: document.getElementById('view-checkin-history') as HTMLDivElement },
    };

    navigationStack.push('home');
    updateNavButtonStates('home');
}

// Views that should hide the bottom nav bar (saves vertical space on mobile Safari)
const VIEWS_WITHOUT_NAV = new Set(['chat']);

function setBottomNavVisible(visible: boolean): void {
    const nav = document.getElementById('bottom-nav');
    if (nav) nav.classList.toggle('hidden', !visible);
}

export function navigateTo(viewName: string, options: NavigateOptions = {}): void {
    const ws = _getWs();
    const currentTag = _getCurrentTag();
    const current = navigationStack[navigationStack.length - 1];

    // If leaving chat view, mark current tag as fully read
    if (current === 'chat' && viewName !== 'chat' && currentTag) {
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

    setBottomNavVisible(!VIEWS_WITHOUT_NAV.has(viewName));

    navigationStack.push(viewName);
    updateNavButtonStates(viewName);

    if (options.onNavigate) {
        options.onNavigate();
    }
}

export function goBack(): void {
    if (navigationStack.length > 1) {
        const ws = _getWs();
        const currentTag = _getCurrentTag();
        const current = navigationStack[navigationStack.length - 1];

        // If leaving chat view, mark current tag as fully read
        if (current === 'chat' && currentTag) {
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'openTag', tag: currentTag }));
            }
        }

        navigationStack.pop();
        const previous = navigationStack[navigationStack.length - 1];

        // Close all views then open the previous one
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

        setBottomNavVisible(!VIEWS_WITHOUT_NAV.has(previous));
        updateNavButtonStates(previous);
    }
}

export function updateNavButtonStates(currentView: string): void {
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
