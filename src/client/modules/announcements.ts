// src/client/modules/announcements.ts
import { ZONE_LEVELS } from '../../shared/constants.ts';
import type { Announcement } from '../types/types.ts';

// ========== STATE ========== //
let currentAnnouncementId: number | null = null;

// Announcements longer than this threshold are clamped in the banner; a "Read more" button reveals the full text in a modal.
const READMORE_THRESHOLD = 120;

// Escapes HTML special characters to prevent injection, then wraps http/https URLs in
// clickable <a> tags. Must escape BEFORE linkifying so injected angle brackets can't
// smuggle tags through a crafted URL like "https://x.com/<script>alert(1)</script>".
function linkify(text: string): string {
    const escaped = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    return escaped.replace(
        /https?:\/\/[^\s<>"']+/g,
        url => `<a href="${url}" target="_blank" rel="noopener noreferrer" class="underline underline-offset-2 break-all">${url}</a>`
    );
}

// ========== HOME VIEW BANNER ========== //
export function displayAnnouncement(announcement: Announcement | null): void {
    const announcementContainer = document.getElementById('announcement-container') as HTMLDivElement;
    const announcementDisplay = document.getElementById('announcement-display') as HTMLDivElement;
    const announcementText = document.getElementById('announcement-text') as HTMLParagraphElement;
    const announcementMeta = document.getElementById('announcement-meta') as HTMLParagraphElement;
    const readMoreBtn = document.getElementById('announcement-readmore') as HTMLButtonElement;
    const modalText = document.getElementById('announcement-modal-text') as HTMLParagraphElement;
    const modalMeta = document.getElementById('announcement-modal-meta') as HTMLParagraphElement;

    if (!announcement || !announcement.is_active) {
        announcementContainer.classList.add('hidden');
        return;
    }

    // Show announcement
    announcementContainer.classList.remove('hidden');
    // Use innerHTML so URLs render as clickable links (linkify escapes HTML first).
    announcementText.innerHTML = linkify(announcement.announcement_text);

    // Get hazard level styling
    const hazardLevel = ZONE_LEVELS[announcement.hazard_level_id as keyof typeof ZONE_LEVELS] || ZONE_LEVELS[1];
    const borderColor = hazardLevel.hex;
    const bgColor = hazardLevel.hex;

    // Update display styling
    announcementDisplay.style.borderColor = borderColor;
    announcementDisplay.style.backgroundColor = bgColor + '20'; // Add transparency

    // Format metadata
    let timestamp = announcement.created_at;
    if (typeof timestamp === 'string' && !timestamp.includes('Z') && !timestamp.includes('+')) {
        timestamp = timestamp.replace(' ', 'T') + 'Z';
    }
    const date = new Date(timestamp);
    const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const metaText = `Posted by ${announcement.created_by_user_name} on ${dateStr} at ${timeStr}`;
    announcementMeta.textContent = metaText;

    // For long announcements: clamp the banner text to 3 lines and show a "Read more" button.
    // The modal always receives the full text so it's ready to open instantly.
    const isLong = announcement.announcement_text.length > READMORE_THRESHOLD;
    announcementText.classList.toggle('line-clamp-3', isLong);
    if (readMoreBtn) readMoreBtn.classList.toggle('hidden', !isLong);
    if (modalText) modalText.innerHTML = linkify(announcement.announcement_text);
    if (modalMeta) modalMeta.textContent = metaText;
}

export async function fetchAndDisplayAnnouncement(): Promise<void> {
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

// ========== ANNOUNCEMENT MODAL ========== //
export function openAnnouncementModal(): void {
    const modal = document.getElementById('announcement-modal') as HTMLDivElement;
    if (modal) modal.classList.remove('hidden');
}

export function closeAnnouncementModal(): void {
    const modal = document.getElementById('announcement-modal') as HTMLDivElement;
    if (modal) modal.classList.add('hidden');
}

// ========== ADMIN VIEW ========== //
export function displayCurrentAnnouncement(announcement: Announcement | null): void {
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

export function renderAnnouncementsHistory(announcements: Announcement[]): void {
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

export async function clearCurrentAnnouncement(): Promise<void> {
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
            displayCurrentAnnouncement(null);

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
}

export function initAnnouncementsForm(): void {
    const announcementForm = document.getElementById('announcement-form') as HTMLFormElement;
    if (!announcementForm) return;

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

                announcementForm.reset();

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
