// src/client/modules/checkin.ts
import type { CheckIn } from '../types/types.ts';
import * as AUTH from './auth.ts';
import * as NAV from './navigation.ts';

// ========== STATE ========== //
let currentViewingUserLatestCheckin: CheckIn | null = null;

export function initCheckIn(): void {
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
                        status_id: currentViewingUserLatestCheckin.status_id
                    })
                });

                if (res.ok) {
                    feedbackMessage.classList.remove('hidden');
                    feedbackMessage.textContent = 'Feedback submitted successfully';
                    feedbackMessage.className = 'text-center text-sm mt-2 text-green-600 dark:text-green-400';
                    prependAdminFeedbackEntry(feedbackText, currentViewingUserLatestCheckin.status_id);
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
                    prependAdminFeedbackEntry(feedbackText, 0);
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
}

// ========== CHECK-IN HISTORY ========== //
export async function viewCheckInHistory(userId: number, memberName: string): Promise<void> {
    currentViewingUserLatestCheckin = null;

    (document.getElementById('checkin-history-name') as HTMLElement).textContent = memberName;

    const feedbackPanel = document.getElementById('admin-feedback-panel') as HTMLDivElement;
    const feedbackText = document.getElementById('admin-feedback-text') as HTMLTextAreaElement;
    const feedbackMessage = document.getElementById('feedback-message') as HTMLDivElement;

    if (feedbackPanel) {
        if (AUTH.currentUserLevel >= 2) {
            feedbackPanel.classList.remove('hidden');
            feedbackText.value = '';
            feedbackMessage.classList.add('hidden');
        } else {
            feedbackPanel.classList.add('hidden');
        }
    }

    try {
        const res = await fetch(`/api/user/${userId}/checkins`);
        if (res.ok) {
            const checkins: CheckIn[] = await res.json();
            if (checkins.length > 0) {
                currentViewingUserLatestCheckin = checkins[0];
            }
            renderCheckInHistory(checkins);
        } else {
            (document.getElementById('checkin-history-list') as HTMLDivElement).innerHTML =
                '<p class="text-red-600 dark:text-red-400">Failed to load check-in history</p>';
        }
    } catch (err) {
        console.error('Error fetching check-in history:', err);
        (document.getElementById('checkin-history-list') as HTMLDivElement).innerHTML =
            '<p class="text-red-600 dark:text-red-400">Error loading check-in history</p>';
    }

    NAV.navigateTo('checkinHistory');
}

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
    const now = new Date();
    const fakeCheckin: CheckIn = {
        id: 'admin-' + Date.now(),
        status_id: statusId,
        timestamp: now.toISOString(),
        status: `[${AUTH.currentUserName}] ${feedbackText}`
    };
    const div = createCheckInHistoryEntry(fakeCheckin);
    historyList.insertBefore(div, historyList.firstChild);
}

// ========== CHECK-IN FORM ========== //
export function openCheckIn(): void {
    NAV.navigateTo('checkin');

    const checkinStatus = document.getElementById('checkin-status') as HTMLTextAreaElement;
    checkinStatus.value = '';
    const messageDiv = document.getElementById('checkin-message') as HTMLDivElement;
    messageDiv.textContent = '';
    messageDiv.className = 'text-center text-sm font-medium p-3 rounded hidden';
}

export async function submitCheckIn(statusType: string): Promise<void> {
    const checkinStatus = document.getElementById('checkin-status') as HTMLTextAreaElement;
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
            const previousText = statusType === 'ok' ? 'OK' : 'Help';
            const messageDiv = document.getElementById('checkin-message') as HTMLDivElement;
            messageDiv.textContent = `Check-in submitted: ${previousText}`;
            messageDiv.className = 'text-center text-sm font-medium p-3 rounded bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
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
}
