// src/client/modules/chat.ts
import { ZONE_LEVELS } from '../../shared/constants.ts';
import type { DashboardData, Post, Tag } from '../types/types.ts';
import { DOM_CORE } from './dom-core.ts';
import * as NAV from './navigation.ts';
import * as DASHBOARD from './dashboard.ts';
import * as MEMBERS from './members.ts';
import { linkify } from './linkify.ts';
import { ICONS_SVG } from './icons-svg.ts';
import { currentUserId, currentUserLevel } from './auth.ts';
import { showAiSummary, handleAiSummaryUpdate } from './ai-summary.ts';

// ========== STATE ========== //
let ws: WebSocket | null = null;
let currentTag = '#general';
let allTags: Tag[] = [];
let pendingSupersede: number | null = null; // postId being superseded
let pendingImageFile: File | null = null;   // image staged for compose

let chatHeader: HTMLDivElement;
let hazardBar: HTMLDivElement;

// ========== NOTIFICATIONS ========== //
let unreadCount = 0;
const BASE_TITLE = document.title || 'bun-chat';

export function showNotificationBanner(): void {
    // Already granted or permanently denied — nothing to show
    if ('Notification' in window && Notification.permission !== 'default') return;

    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
        || (navigator as any).standalone === true; // iOS Safari PWA flag

    // Clear any prior dismissal if now running as a PWA (context changed)
    if (isStandalone) sessionStorage.removeItem('notif-banner-dismissed');

    // Already dismissed this session (in non-standalone context)
    if (sessionStorage.getItem('notif-banner-dismissed')) return;
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const hasNotificationAPI = 'Notification' in window;

    console.log('[notif] isStandalone:', isStandalone, '| isIOS:', isIOS, '| Notification API:', hasNotificationAPI, '| permission:', hasNotificationAPI ? Notification.permission : 'n/a');

    const banner = document.createElement('div');
    banner.id = 'notif-banner';
    banner.className = 'fixed bottom-16 inset-x-0 mx-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg bg-indigo-600 text-white text-sm';

    if (!isStandalone && isIOS) {
        // iOS regular Safari — must install as PWA first
        banner.innerHTML = `
            <span class="flex-1">To enable notifications, tap <strong>Share → Add to Home Screen</strong> to install this app.</span>
            <button id="notif-banner-dismiss" class="shrink-0 text-indigo-200 hover:text-white font-bold text-lg leading-none">✕</button>
        `;
    } else if (isStandalone && isIOS && !hasNotificationAPI) {
        // Installed as PWA but iOS version is too old (requires 16.4+)
        banner.innerHTML = `
            <span class="flex-1">Notifications require <strong>iOS 16.4 or newer</strong>. Please update your device.</span>
            <button id="notif-banner-dismiss" class="shrink-0 text-indigo-200 hover:text-white font-bold text-lg leading-none">✕</button>
        `;
    } else if (hasNotificationAPI) {
        // Supporting browser — ask via a tap (required for iOS PWA + all browsers)
        banner.innerHTML = `
            <span class="flex-1">Enable notifications for new messages?</span>
            <button id="notif-banner-enable" class="shrink-0 px-3 py-1 rounded-lg bg-white text-indigo-700 font-semibold hover:bg-indigo-100">Enable</button>
            <button id="notif-banner-dismiss" class="shrink-0 text-indigo-200 hover:text-white font-bold text-lg leading-none ml-1">✕</button>
        `;
    } else {
        return; // Non-iOS browser without Notification support — nothing to do
    }

    document.body.appendChild(banner);

    document.getElementById('notif-banner-enable')?.addEventListener('click', (): void => {
        Notification.requestPermission().then((perm) => {
            if (perm === 'granted' || perm === 'denied') banner.remove();
        });
    });

    document.getElementById('notif-banner-dismiss')?.addEventListener('click', (): void => {
        sessionStorage.setItem('notif-banner-dismissed', '1');
        banner.remove();
    });
}

function updateTitleBar(): void {
    document.title = unreadCount > 0 ? `(${unreadCount}) ${BASE_TITLE}` : BASE_TITLE;
}

function showBrowserNotification(userName: string, content: string, tagName: string): void {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    const body = content.length > 120 ? content.slice(0, 120) + '…' : content;
    const n = new Notification(`${userName} in ${tagName}`, {
        body,
        icon: '/fav/favicon-96x96.png',
        tag: 'bun-chat-message', // replaces previous notification — no spam
    });
    n.onclick = (): void => { window.focus(); n.close(); };
}

function onNewMessage(post: Post): void {
    if (post.userId === currentUserId) return; // own message — no notification
    if (document.visibilityState === 'visible') return; // tab is active — no notification
    unreadCount++;
    updateTitleBar();
    showBrowserNotification(post.userName, post.content || '📷 Image', post.tagName);
}

// Reset unread count whenever the user returns to the tab
document.addEventListener('visibilitychange', (): void => {
    if (document.visibilityState === 'visible') {
        unreadCount = 0;
        updateTitleBar();
    }
});

// ========== GETTERS ========== //
export function getWs(): WebSocket | null { return ws; }
export function getCurrentTag(): string { return currentTag; }

// ========== INIT ========== //
export function initChat(): void {
    chatHeader = document.getElementById('chat-header') as HTMLDivElement;
    hazardBar = document.getElementById('hazard-bar') as HTMLDivElement;

    DOM_CORE.postForm.addEventListener('submit', async (e: Event): Promise<void> => {
        e.preventDefault();

        // Image-compose path — upload staged file with optional caption
        if (pendingImageFile !== null) {
            const caption = DOM_CORE.imageComposeCaption.value.trim();
            const fileToUpload = pendingImageFile;
            pendingImageFile = null;
            URL.revokeObjectURL(DOM_CORE.imageComposePreview.src);
            DOM_CORE.imageComposePreview.src = '';
            DOM_CORE.imageComposePanel.classList.add('hidden');
            DOM_CORE.imageComposePanel.classList.remove('flex');
            DOM_CORE.imageComposeCaption.value = '';
            DOM_CORE.chatInputArea.classList.remove('hidden');
            await uploadImage(fileToUpload, caption);
            return;
        }

        const content = DOM_CORE.postContent.value.trim();
        if (!content) return;

        if (pendingSupersede !== null) {
            // Post is an update to an existing post — use supersede API
            const targetId = pendingSupersede;
            try {
                const res = await fetch(`/api/posts/${targetId}/supersede`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ content }),
                });
                if (res.ok) {
                    DOM_CORE.postContent.value = '';
                    cancelSupersedeMode();
                } else {
                    const err = await res.json() as { error?: string };
                    alert(err.error || 'Failed to post update');
                }
            } catch {
                alert('Network error — update not sent');
            }
        } else if (ws) {
            ws.send(JSON.stringify({ type: 'post', content: content, tag: currentTag }));
            DOM_CORE.postContent.value = '';
        }
    });

    // Auto-resize textarea as user types
    DOM_CORE.postContent.addEventListener('input', () => {
        DOM_CORE.postContent.style.height = 'auto';
        DOM_CORE.postContent.style.height = `${DOM_CORE.postContent.scrollHeight}px`;
    });

    // Enter = send, Shift+Enter = newline
    DOM_CORE.postContent.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            DOM_CORE.postForm.requestSubmit();
        }
    });

    // "+" button toggles the popup menu
    const plusMenu = document.getElementById('plus-menu')!;
    DOM_CORE.openFilePickerBtn.addEventListener('click', (e: MouseEvent) => {
        e.stopPropagation();
        plusMenu.classList.toggle('hidden');
    });

    // Upload Photo menu item — same behaviour as the old "+" button
    document.getElementById('menu-upload-photo')!.addEventListener('click', () => {
        plusMenu.classList.add('hidden');
        DOM_CORE.imageFileInput.value = '';
        DOM_CORE.imageFileInput.click();
    });

    // AI Chat menu item — inserts /chat trigger into the message box
    document.getElementById('menu-ai-chat')!.addEventListener('click', () => {
        plusMenu.classList.add('hidden');
        const ta = DOM_CORE.postContent;
        ta.value = ta.value ? ta.value.trimEnd() + ' /chat ' : '/chat ';
        ta.dispatchEvent(new Event('input')); // trigger auto-resize
        ta.focus();
    });

    // Close menu when clicking anywhere outside the "+" area
    document.addEventListener('click', () => plusMenu.classList.add('hidden'));

    // File selected via file picker
    DOM_CORE.imageFileInput.addEventListener('change', () => {
        const file = DOM_CORE.imageFileInput.files?.[0];
        if (file) stageImageForCompose(file);
    });

    // Drag & drop on the message container
    DOM_CORE.messageContainer.addEventListener('dragover', (e: DragEvent) => {
        e.preventDefault();
        DOM_CORE.messageContainer.classList.add('border-2', 'border-dashed', 'border-blue-500', 'bg-blue-50', 'dark:bg-blue-900/10');
    });

    DOM_CORE.messageContainer.addEventListener('dragleave', (e: DragEvent) => {
        if (!DOM_CORE.messageContainer.contains(e.relatedTarget as Node)) {
            DOM_CORE.messageContainer.classList.remove('border-2', 'border-dashed', 'border-blue-500', 'bg-blue-50', 'dark:bg-blue-900/10');
        }
    });

    DOM_CORE.messageContainer.addEventListener('drop', (e: DragEvent) => {
        e.preventDefault();
        DOM_CORE.messageContainer.classList.remove('border-2', 'border-dashed', 'border-blue-500', 'bg-blue-50', 'dark:bg-blue-900/10');
        const file = e.dataTransfer?.files?.[0];
        if (file && file.type.startsWith('image/')) {
            stageImageForCompose(file);
        }
    });

    // Image modal — close on button, backdrop click, or Escape
    DOM_CORE.imageModalClose.addEventListener('click', closeImageModal);
    DOM_CORE.imageModal.addEventListener('click', (e: MouseEvent) => {
        if (e.target === DOM_CORE.imageModal) closeImageModal();
    });
    document.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Escape') closeImageModal();
    });

    // Image compose panel — cancel button clears the staged image
    DOM_CORE.imageComposeCancel.addEventListener('click', () => {
        if (pendingImageFile !== null) URL.revokeObjectURL(DOM_CORE.imageComposePreview.src);
        pendingImageFile = null;
        DOM_CORE.imageComposePreview.src = '';
        DOM_CORE.imageComposePanel.classList.add('hidden');
        DOM_CORE.imageComposePanel.classList.remove('flex');
        DOM_CORE.imageComposeCaption.value = '';
        DOM_CORE.chatInputArea.classList.remove('hidden');
    });

    // Image compose panel — send button submits the staged image
    DOM_CORE.imageComposeSend.addEventListener('click', () => {
        DOM_CORE.postForm.requestSubmit();
    });
}

export function cancelSupersedeMode(): void {
    pendingSupersede = null;
    const banner = document.getElementById('supersede-banner');
    if (banner) banner.remove();
    DOM_CORE.postContent.placeholder = 'Type a message…';
}

export function supersedePost(oldPostId: number): void {
    pendingSupersede = oldPostId;
    DOM_CORE.postContent.placeholder = 'Type the updated message…';
    DOM_CORE.postContent.focus();

    // Show a banner above the form
    let banner = document.getElementById('supersede-banner');
    if (!banner) {
        banner = document.createElement('div');
        banner.id = 'supersede-banner';
        banner.className = 'flex items-center gap-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/30 border-t border-amber-200 dark:border-amber-700 text-xs text-amber-700 dark:text-amber-300';
        DOM_CORE.postForm.insertAdjacentElement('beforebegin', banner);
    }
    banner.innerHTML = `
        <span class="shrink-0 mr-2">${ICONS_SVG.pencil ?? '✏️'}</span>
        <span class="flex-1">Posting <strong>update</strong> to original message — the original will be dimmed</span>
        <button type="button" onclick="window.cancelSupersedeMode()" class="ml-auto text-amber-600 dark:text-amber-400 underline">Cancel</button>
    `;
}

// ========== IMAGE UPLOAD ========== //

function stageImageForCompose(file: File): void {
    pendingImageFile = file;
    DOM_CORE.imageComposePreview.src = URL.createObjectURL(file);
    DOM_CORE.chatInputArea.classList.add('hidden');
    DOM_CORE.imageComposePanel.classList.remove('hidden');
    DOM_CORE.imageComposePanel.classList.add('flex');
    DOM_CORE.imageComposeCaption.value = '';
    DOM_CORE.imageComposeCaption.focus();
}

async function uploadImage(file: File, caption = ''): Promise<void> {
    DOM_CORE.uploadOverlay.classList.remove('hidden');
    DOM_CORE.openFilePickerBtn.disabled = true;

    const formData = new FormData();
    formData.append('image', file);
    if (caption) formData.append('caption', caption);

    try {
        const res = await fetch(`/api/upload?tag=${encodeURIComponent(currentTag)}`, {
            method: 'POST',
            body: formData,
        });

        if (!res.ok) {
            const err = await res.json() as { error?: string };
            alert(err.error || 'Upload failed');
        }
        // On success, the server broadcasts NEW_MESSAGE via WS — no need to handle res body
    } catch {
        alert('Network error — image not uploaded');
    } finally {
        DOM_CORE.uploadOverlay.classList.add('hidden');
        DOM_CORE.openFilePickerBtn.disabled = false;
    }
}

function openImageModal(thumbUrl: string, fullUrl: string): void {
    DOM_CORE.imageModalImg.src = fullUrl;
    DOM_CORE.imageModalLink.href = `/image-viewer?src=${encodeURIComponent(fullUrl)}`;
    DOM_CORE.imageModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeImageModal(): void {
    DOM_CORE.imageModal.classList.add('hidden');
    DOM_CORE.imageModalImg.src = '';
    document.body.style.overflow = '';
}

/**
 * Appends the @chat LLM reply to an existing post card in the message list.
 * Called when the server sends a `chatReply` WebSocket event.
 */
function appendChatReply(postId: number, reply: string): void {
    const msgDiv = DOM_CORE.messageContainer.querySelector<HTMLElement>(`[data-post-id="${postId}"]`);
    if (!msgDiv) return;

    // Remove any pending indicator if it exists
    msgDiv.querySelector('.chat-reply-pending')?.remove();

    const replyEl = document.createElement('div');
    replyEl.className = 'chat-reply mt-2 pt-2 border-t border-slate-100 dark:border-vsdark-border flex items-start gap-1.5';
    replyEl.innerHTML = `
        <span class="shrink-0 w-3.5 h-3.5 mt-0.5 text-purple-500 dark:text-purple-400">${ICONS_SVG.sparkle}</span>
        <p class="text-sm text-slate-700 dark:text-vsdark-text leading-snug">${linkify(reply)}</p>
    `;
    msgDiv.appendChild(replyEl);
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
            const newPost = data.post as Post;
            // If it's for the current tag, add to chat
            if (newPost.tagName === currentTag) {
                addMessageToChat(newPost);
            }
            onNewMessage(newPost);
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
        } else if (data.type === 'ONLINE_UPDATE') {
            MEMBERS.updateOnlineUsers(data.userIds as number[]);
        } else if (data.type === 'reactionUpdate') {
            updateReactionCounts(
                data.postId as number,
                data.thumbsUp as number,
                data.thumbsDown as number
            );
        } else if (data.type === 'postSuperseded') {
            applySupersededStyle(data.oldPostId as number);
        } else if (data.type === 'aiSummaryReady') {
            handleAiSummaryUpdate(data.postId as number, data.aiSummary as string);
        } else if (data.type === 'chatReply') {
            appendChatReply(data.postId as number, data.reply as string);
        } else if (data.type === 'NEW_MESSAGE') {
            // Image message broadcast from upload endpoint
            const msg = data.message as Record<string, any>;
            const imgPost: Post = {
                id: msg.id,
                userId: msg.userId,
                userName: msg.sender ?? msg.userName ?? 'Unknown',
                content: msg.content ?? '',
                tagName: msg.tagName,
                timestamp: msg.timestamp,
                type: 'image',
                thumbUrl: msg.thumbUrl,
                fullUrl: msg.fullUrl,
                aiSummary: msg.aiSummary ?? null,
            } as Post;
            if (msg.tagName === currentTag) {
                addMessageToChat(imgPost);
            }
            onNewMessage(imgPost);
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

    const postId = post.id ?? 0;
    const isSuperseded = !!post.supersededBy;

    // Ensure timestamp is treated as UTC if it's a bare SQLite timestamp string
    let timestamp = post.timestamp;
    if (typeof timestamp === 'string' && !timestamp.includes('Z') && !timestamp.includes('+')) {
        timestamp = timestamp.replace(' ', 'T') + 'Z';
    }
    const dateObj = new Date(timestamp);
    const timeString = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateString = dateObj.toLocaleDateString([], { month: '2-digit', day: '2-digit', year: '2-digit' });

    const messageDiv = document.createElement('div');
    const supersededClass = isSuperseded ? ' post-superseded' : '';
    messageDiv.className = `bg-white dark:bg-vsdark-surface p-3 rounded-lg shadow-sm border border-slate-200 dark:border-vsdark-border animate-fade-in-up${supersededClass}`;
    messageDiv.dataset.postId = String(postId);

    // ---- IMAGE POST ----
    if (post.type === 'image' && post.thumbUrl && post.fullUrl) {
        const thumbUrl = post.thumbUrl;
        const fullUrl = post.fullUrl;
        const thumbsUp = post.thumbsUp ?? 0;
        const thumbsDown = post.thumbsDown ?? 0;
        const myReaction = post.myReaction ?? null;
        const upActiveClass = myReaction === 1 ? ' reaction-active-up' : '';
        const downActiveClass = myReaction === -1 ? ' reaction-active-down' : '';

        messageDiv.dataset.myReaction = myReaction !== null ? String(myReaction) : '';

        const hasAiSummary = !!post.aiSummary;
        const aiButtonClass = hasAiSummary
            ? 'text-purple-500 dark:text-purple-400 cursor-pointer hover:text-purple-700'
            : 'text-slate-300 dark:text-slate-600 cursor-wait animate-pulse';
        const aiButtonTitle = hasAiSummary ? 'View AI image summary' : 'AI summary pending…';

        messageDiv.innerHTML = `
            <div class="flex items-center justify-between gap-2 mb-2">
                <p class="text-xs font-bold text-orange-600 dark:text-vsdark-active1">${linkify(post.userName)}</p>
                <div class="flex items-center gap-1.5 shrink-0">
                    <button class="reaction-pill${upActiveClass} flex items-center gap-1 select-none" data-reaction="1">
                        <span class="reaction-icon w-3.5 h-3.5 shrink-0">${ICONS_SVG.thumbsup}</span>
                        <span>Like</span>
                        <span class="reaction-up-count font-bold${thumbsUp > 0 ? ' reaction-count-tap' : ''}">${thumbsUp > 0 ? thumbsUp : ''}</span>
                    </button>
                    <button class="reaction-pill${downActiveClass} flex items-center gap-1 select-none" data-reaction="-1">
                        <span class="reaction-icon w-3.5 h-3.5 shrink-0">${ICONS_SVG.check}</span>
                        <span>Seen</span>
                        <span class="reaction-down-count font-bold${thumbsDown > 0 ? ' reaction-count-tap' : ''}">${thumbsDown > 0 ? thumbsDown : ''}</span>
                    </button>
                </div>
            </div>
            <div class="relative group">
                <img
                    src="${thumbUrl}"
                    alt="Shared image"
                    loading="lazy"
                    class="rounded-lg max-w-full object-cover cursor-pointer transition-opacity group-hover:opacity-90"
                    style="max-height: 240px;"
                >
                <div class="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button class="view-full-btn text-xs bg-black/60 text-white px-2 py-1 rounded-full backdrop-blur-sm">
                        View full size ↗
                    </button>
                </div>
            </div>
            ${post.content ? `<p class="text-sm text-slate-700 dark:text-vsdark-text mt-2">${linkify(post.content)}</p>` : ''}
            <div class="flex items-center justify-between mt-2">
                <p class="text-[10px] text-slate-400 dark:text-vsdark-text-muted">${dateString} ${timeString}</p>
                <button class="ai-summary-btn flex items-center gap-1 text-[10px] ${aiButtonClass} transition-colors"
                    data-ai-btn="${postId}"
                    ${hasAiSummary ? '' : 'disabled'}
                    title="${aiButtonTitle}">
                    <span class="w-3 h-3 shrink-0">${ICONS_SVG.sparkle}</span>
                    <span class="ai-btn-label">${hasAiSummary ? 'AI Summary' : 'Analyzing…'}</span>
                </button>
            </div>
        `;

        // Store the summary text in the dataset after setting innerHTML (avoids HTML injection)
        if (hasAiSummary) {
            messageDiv.querySelector<HTMLButtonElement>('.ai-summary-btn')!.dataset.aiSummary = post.aiSummary!;
        }

        const img = messageDiv.querySelector<HTMLImageElement>('img')!;
        const viewBtn = messageDiv.querySelector<HTMLButtonElement>('.view-full-btn')!;
        const openModal = () => openImageModal(thumbUrl, fullUrl);
        img.addEventListener('click', openModal);
        viewBtn.addEventListener('click', (e) => { e.stopPropagation(); openModal(); });

        const aiBtn = messageDiv.querySelector<HTMLButtonElement>('.ai-summary-btn');
        if (aiBtn) {
            aiBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const summary = aiBtn.dataset.aiSummary;
                if (summary) showAiSummary(summary);
            });
        }

        const [upBtn, downBtn] = Array.from(messageDiv.querySelectorAll<HTMLButtonElement>('.reaction-pill'));
        if (upBtn) upBtn.addEventListener('click', () => react(postId, 1, messageDiv));
        if (downBtn) downBtn.addEventListener('click', () => react(postId, -1, messageDiv));

        const upCount = messageDiv.querySelector<HTMLElement>('.reaction-up-count');
        const downCount = messageDiv.querySelector<HTMLElement>('.reaction-down-count');
        if (upCount) upCount.addEventListener('click', (e) => { e.stopPropagation(); openReactionsSheet(postId, 'agree'); });
        if (downCount) downCount.addEventListener('click', (e) => { e.stopPropagation(); openReactionsSheet(postId, 'seen'); });

        DOM_CORE.messageContainer.appendChild(messageDiv);
        scrollToBottom();
        return;
    }

    // ---- TEXT POST ----
    const thumbsUp = post.thumbsUp ?? 0;
    const thumbsDown = post.thumbsDown ?? 0;
    const myReaction = post.myReaction ?? null;
    const isUpdate = !!post.supersedesId;
    const isOwner = post.userId !== undefined && post.userId === currentUserId;
    const isAdmin = currentUserLevel >= 2;
    const canSupersede = (isOwner || isAdmin) && !isSuperseded;

    messageDiv.dataset.myReaction = myReaction !== null ? String(myReaction) : '';

    const upActiveClass = myReaction === 1 ? ' reaction-active-up' : '';
    const downActiveClass = myReaction === -1 ? ' reaction-active-down' : '';

    // Build optional banners
    const updateBanner = isUpdate
        ? `<div class="text-[10px] text-amber-600 dark:text-amber-400 font-medium mb-1 flex items-center gap-2">
               <span class="w-3 h-3 shrink-0 inline-block">${ICONS_SVG.pencil ?? '✏️'}</span>
               Update to original message
           </div>`
        : '';

    const supersededBanner = isSuperseded
        ? `<div class="text-[10px] text-slate-400 dark:text-vsdark-text-muted font-medium mt-1 flex items-center gap-2">
               <span class="w-3 h-3 shrink-0 inline-block">${ICONS_SVG.arrowUp ?? '↑'}</span>
               Superseded — see update below
           </div>`
        : '';

    const supersedeBtn = canSupersede
        ? `<button class="supersede-btn text-[10px] text-slate-400 dark:text-vsdark-text-muted hover:text-amber-500 dark:hover:text-amber-400 underline ml-1 transition-colors" title="Post a correction/update">Post Update</button>`
        : '';

    // Reaction area — hide on superseded posts (reactions were cleared; re-acknowledgement happens on new post)
    const reactionsHTML = isSuperseded ? '' : `
                <div class="flex items-center gap-1.5 shrink-0">
                    <button class="reaction-pill${upActiveClass} flex items-center gap-1 select-none" data-reaction="1">
                        <span class="reaction-icon w-3.5 h-3.5 shrink-0">${ICONS_SVG.thumbsup}</span>
                        <span>Like</span>
                        <span class="reaction-up-count font-bold${thumbsUp > 0 ? ' reaction-count-tap' : ''}">${thumbsUp > 0 ? thumbsUp : ''}</span>
                    </button>
                    <button class="reaction-pill${downActiveClass} flex items-center gap-1 select-none" data-reaction="-1">
                        <span class="reaction-icon w-3.5 h-3.5 shrink-0">${ICONS_SVG.check}</span>
                        <span>Seen</span>
                        <span class="reaction-down-count font-bold${thumbsDown > 0 ? ' reaction-count-tap' : ''}">${thumbsDown > 0 ? thumbsDown : ''}</span>
                    </button>
                </div>`;

    // Split stored @chat reply from the user's original content (set by server after LLM responds)
    const chatReplySep = '\n\n**@chat:**';
    const sepIdx = post.content.indexOf(chatReplySep);
    const userContent = sepIdx >= 0 ? post.content.slice(0, sepIdx) : post.content;
    const storedReply = sepIdx >= 0 ? post.content.slice(sepIdx + chatReplySep.length).trim() : null;

    const chatReplyBlock = storedReply
        ? `<div class="chat-reply mt-2 pt-2 border-t border-slate-100 dark:border-vsdark-border flex items-start gap-1.5">
               <span class="shrink-0 w-3.5 h-3.5 mt-0.5 text-purple-500 dark:text-purple-400">${ICONS_SVG.sparkle}</span>
               <p class="text-sm text-slate-700 dark:text-vsdark-text leading-snug">${linkify(storedReply)}</p>
           </div>`
        : '';

    messageDiv.innerHTML = `
        ${updateBanner}
        <div class="flex items-center justify-between gap-2 mb-1">
            <p class="text-xs font-bold text-orange-600 dark:text-vsdark-active1">${linkify(post.userName)}${supersedeBtn}</p>
            ${reactionsHTML}
        </div>
        <p class="text-slate-800 dark:text-vsdark-text">${linkify(userContent)}</p>
        ${chatReplyBlock}
        <p class="text-[10px] text-slate-400 dark:text-vsdark-text-muted mt-1">${dateString} ${timeString}</p>
        ${supersededBanner}
    `;

    // Attach supersede button handler
    const sBtn = messageDiv.querySelector<HTMLButtonElement>('.supersede-btn');
    if (sBtn) sBtn.addEventListener('click', () => supersedePost(postId));

    if (!isSuperseded) {
        // Attach click handlers to both reaction buttons
        const [upBtn, downBtn] = Array.from(messageDiv.querySelectorAll<HTMLButtonElement>('.reaction-pill'));
        if (upBtn) upBtn.addEventListener('click', () => react(postId, 1, messageDiv));
        if (downBtn) downBtn.addEventListener('click', () => react(postId, -1, messageDiv));

        // Attach tap handlers on count spans to show who reacted
        const upCount = messageDiv.querySelector<HTMLElement>('.reaction-up-count');
        const downCount = messageDiv.querySelector<HTMLElement>('.reaction-down-count');
        if (upCount) upCount.addEventListener('click', (e) => { e.stopPropagation(); openReactionsSheet(postId, 'agree'); });
        if (downCount) downCount.addEventListener('click', (e) => { e.stopPropagation(); openReactionsSheet(postId, 'seen'); });
    }

    // If the post triggers the AI chat bot and no reply is stored yet, show a pending indicator
    // Triggers: @chat, /chat, !chat, chat (first word), ? or . as first character
    if (/^[?.]|(@chat|!chat|\/chat)\b|^chat\b/i.test(userContent) && !storedReply) {
        const pending = document.createElement('div');
        pending.className = 'chat-reply-pending mt-2 pt-2 border-t border-slate-100 dark:border-vsdark-border flex items-center gap-1.5 text-xs text-slate-400 dark:text-vsdark-text-muted animate-pulse';
        pending.innerHTML = `<span class="shrink-0 w-3 h-3">${ICONS_SVG.sparkle}</span><span>@chat is thinking…</span>`;
        messageDiv.appendChild(pending);
    }

    DOM_CORE.messageContainer.appendChild(messageDiv);
    scrollToBottom();
}

function react(postId: number, reaction: number, msgDiv: HTMLElement): void {
    if (!postId) return;
    const current = msgDiv.dataset.myReaction ? Number(msgDiv.dataset.myReaction) : null;
    // Ignore double-click on the same reaction
    if (current === reaction) return;

    // Optimistically mark the selected button so the UI responds instantly
    msgDiv.dataset.myReaction = String(reaction);
    updateReactionButtonStyles(msgDiv, reaction);

    fetch(`/api/posts/${postId}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reaction }),
    }).catch(() => {
        // Revert optimistic update on network failure
        msgDiv.dataset.myReaction = current !== null ? String(current) : '';
        updateReactionButtonStyles(msgDiv, current);
    });
    // Count updates arrive via the reactionUpdate WebSocket broadcast
}

function applySupersededStyle(postId: number): void {
    const msgDiv = DOM_CORE.messageContainer.querySelector<HTMLElement>(`[data-post-id="${postId}"]`);
    if (!msgDiv) return;
    msgDiv.classList.add('post-superseded');

    // Remove reaction pills — acknowledgement shifts to the new post
    const pillContainer = msgDiv.querySelector('.flex.items-center.gap-1\\.5');
    if (pillContainer) pillContainer.remove();

    // Add superseded banner if not already present
    if (!msgDiv.querySelector('.superseded-banner')) {
        const banner = document.createElement('div');
        banner.className = 'superseded-banner text-[10px] text-slate-400 dark:text-vsdark-text-muted font-medium mt-1 flex items-center gap-1';
        banner.innerHTML = `<span class="w-3 h-3 shrink-0 inline-block mr-2">${ICONS_SVG.arrowUp ?? '↑'}</span>Superseded — see update below`;
        msgDiv.appendChild(banner);
    }
}

function updateReactionCounts(postId: number, thumbsUp: number, thumbsDown: number): void {
    const msgDiv = DOM_CORE.messageContainer.querySelector<HTMLElement>(`[data-post-id="${postId}"]`);
    if (!msgDiv) return;
    const upCount = msgDiv.querySelector<HTMLElement>('.reaction-up-count');
    const downCount = msgDiv.querySelector<HTMLElement>('.reaction-down-count');
    if (upCount) {
        upCount.textContent = thumbsUp > 0 ? String(thumbsUp) : '';
        upCount.classList.toggle('reaction-count-tap', thumbsUp > 0);
    }
    if (downCount) {
        downCount.textContent = thumbsDown > 0 ? String(thumbsDown) : '';
        downCount.classList.toggle('reaction-count-tap', thumbsDown > 0);
    }
}

async function openReactionsSheet(postId: number, type: 'agree' | 'seen'): Promise<void> {
    const sheet = document.getElementById('reactions-sheet');
    const title = document.getElementById('reactions-sheet-title');
    const list = document.getElementById('reactions-sheet-list');
    const empty = document.getElementById('reactions-sheet-empty');
    if (!sheet || !title || !list || !empty) return;

    title.textContent = type === 'agree' ? '👍 Agreed' : '✓ Seen by';
    list.innerHTML = '<li class="text-sm text-slate-400 dark:text-vsdark-text-muted text-center py-4">Loading…</li>';
    empty.classList.add('hidden');
    sheet.classList.remove('hidden');

    try {
        const res = await fetch(`/api/posts/${postId}/reactions`);
        const data = await res.json() as { agree: string[], seen: string[] };
        const names = type === 'agree' ? data.agree : data.seen;

        list.innerHTML = '';
        if (names.length === 0) {
            empty.classList.remove('hidden');
        } else {
            names.forEach(name => {
                const li = document.createElement('li');
                li.className = 'text-sm text-slate-800 dark:text-vsdark-text py-1.5 border-b border-slate-100 dark:border-vsdark-border/40 last:border-0';
                li.textContent = name;
                list.appendChild(li);
            });
        }
    } catch {
        list.innerHTML = '<li class="text-sm text-red-500 text-center py-4">Failed to load.</li>';
    }
}

export function closeReactionsSheet(): void {
    document.getElementById('reactions-sheet')?.classList.add('hidden');
}

function updateReactionButtonStyles(msgDiv: HTMLElement, activeReaction: number | null): void {
    const upBtn = msgDiv.querySelector<HTMLButtonElement>('[data-reaction="1"]');
    const downBtn = msgDiv.querySelector<HTMLButtonElement>('[data-reaction="-1"]');
    if (upBtn) {
        upBtn.classList.toggle('reaction-active-up', activeReaction === 1);
        upBtn.classList.toggle('reaction-inactive', activeReaction !== null && activeReaction !== 1);
    }
    if (downBtn) {
        downBtn.classList.toggle('reaction-active-down', activeReaction === -1);
        downBtn.classList.toggle('reaction-inactive', activeReaction !== null && activeReaction !== -1);
    }
}

function scrollToBottom(): void {
    DOM_CORE.messageContainer.scrollTop = DOM_CORE.messageContainer.scrollHeight;
}

function updateConnectionStatus(isOnline: boolean): void {
    const indicators = [DOM_CORE.connectionStatus, DOM_CORE.homeConnectionStatus].filter(Boolean);

    if (isOnline) {
        indicators.forEach(el => {
            el.classList.remove('bg-red-500');
            el.classList.add('bg-emerald-400', 'animate-pulse');
        });
    } else {
        indicators.forEach(el => {
            el.classList.remove('bg-emerald-400', 'animate-pulse');
            el.classList.add('bg-red-500');
        });
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
