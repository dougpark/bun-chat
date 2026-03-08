// src/client/modules/chat.ts
import { ZONE_LEVELS } from '../../shared/constants.ts';
import type { DashboardData, Post, Tag } from '../types/types.ts';
import { DOM_CORE } from './dom-core.ts';
import * as NAV from './navigation.ts';
import * as DASHBOARD from './dashboard.ts';

// ========== STATE ========== //
let ws: WebSocket | null = null;
let currentTag = '#general';
let allTags: Tag[] = [];

let chatHeader: HTMLDivElement;
let hazardBar: HTMLDivElement;

// ========== GETTERS ========== //
export function getWs(): WebSocket | null { return ws; }
export function getCurrentTag(): string { return currentTag; }

// ========== INIT ========== //
export function initChat(): void {
    chatHeader = document.getElementById('chat-header') as HTMLDivElement;
    hazardBar = document.getElementById('hazard-bar') as HTMLDivElement;

    DOM_CORE.postForm.addEventListener('submit', (e: Event): void => {
        e.preventDefault();
        const content = DOM_CORE.postContent.value.trim();
        if (content && ws) {
            ws.send(JSON.stringify({ type: 'post', content: content, tag: currentTag }));
            DOM_CORE.postContent.value = '';
        }
    });
}

export function initWebSocket(): void {
    if (ws) return;
    ws = new WebSocket(`ws://${window.location.host}/ws`);

    ws.onopen = (): void => {
        console.log('WebSocket connection established.');
        updateConnectionStatus(true);
    };

    ws.onmessage = (event: MessageEvent): void => {
        const data = JSON.parse(event.data) as Record<string, any>;

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
            DASHBOARD.updateDashboard(data as DashboardData);
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

export function disconnect(): void {
    if (ws) {
        ws.close();
        ws = null;
    }
}

export function openZone(tagName: string): void {
    currentTag = tagName;
    DOM_CORE.activeTagName.textContent = tagName;

    const tag = allTags.find((t: Tag) => t.name === tagName);
    if (tag) updateHeaderStyle(tag.hazard_level_id);

    // Clear previous messages
    DOM_CORE.messageContainer.innerHTML = '';

    // Navigate to chat view
    NAV.navigateTo('chat');

    // Send openTag message to update last_viewed_at on server
    if (ws && ws.readyState === WebSocket.OPEN) {
        // First, send openTag to mark as viewed
        ws.send(JSON.stringify({ type: 'openTag', tag: tagName }));
        // Request fresh tags to update unread counts for all zones
        ws.send(JSON.stringify({ type: 'requestTags' }));
        // Then subscribe to receive new messages
        ws.send(JSON.stringify({ type: 'subscribe', tag: tagName }));
    }
}

// ========== PRIVATE HELPERS ========== //

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
