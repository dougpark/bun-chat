// src/client/modules/members.ts
import { USER_LEVELS } from '../../shared/constants.ts';
import type { Member } from '../types/types.ts';
import * as NAV from './navigation.ts';
import { linkify } from './linkify.ts';

// ========== STATE ========== //
let allMembers: Member[] = [];
let showOnlyHelpNeeded = false;
let showOnlyOnline = false;
let onlineUserIds: Set<number> = new Set();

export function initMembers(): void {
    const membersFilter = document.getElementById('members-filter') as HTMLInputElement;
    if (membersFilter) {
        membersFilter.addEventListener('input', (): void => applyMembersFilters());
    }
}

// ========== NAVIGATION ========== //
export async function openMembers(): Promise<void> {
    NAV.navigateTo('members', {
        onNavigate: async (): Promise<void> => {
            try {
                const res = await fetch('/api/members');
                if (res.ok) {
                    allMembers = await res.json() as Member[];
                    applyMembersFilters();
                } else {
                    alert('Failed to fetch members');
                }
            } catch (e) {
                console.error('Error fetching members:', e);
            }
        }
    });
}

// ========== FILTER ========== //
export function toggleHelpFilter(): void {
    showOnlyHelpNeeded = !showOnlyHelpNeeded;

    const membersFilterHelpBtn = document.getElementById('members-filter-help') as HTMLButtonElement;
    if (membersFilterHelpBtn) {
        membersFilterHelpBtn.classList.toggle('bg-red-100');
        membersFilterHelpBtn.classList.toggle('dark:bg-red-800');
    }

    applyMembersFilters();
}

export function toggleOnlineFilter(): void {
    showOnlyOnline = !showOnlyOnline;

    const btn = document.getElementById('members-filter-online') as HTMLButtonElement;
    if (btn) {
        btn.classList.toggle('bg-green-100');
        btn.classList.toggle('dark:bg-green-800');
    }

    applyMembersFilters();
}

export function updateOnlineUsers(ids: number[]): void {
    onlineUserIds = new Set(ids);
    if (allMembers.length > 0) applyMembersFilters();
}

function applyMembersFilters(): void {
    const membersFilter = document.getElementById('members-filter') as HTMLInputElement;
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
        const matchesOnline = !showOnlyOnline || onlineUserIds.has(m.id);
        return matchesSearch && matchesHelpStatus && matchesOnline;
    });

    renderMembersList(filtered);
}

// ========== RENDER ========== //
function renderMembersList(members: Member[]): void {
    const membersList = document.getElementById('members-list') as HTMLDivElement;
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

            const now = new Date();
            const diffMs = (now as any) - (checkinDate as any);
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMs / 3600000);
            const relativeTime = diffHours > 0
                ? `${diffHours}h ${diffMins % 60}m ago`
                : `${diffMins}m ago`;

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

        const isOnline = onlineUserIds.has(member.id);
        div.innerHTML = `
            <div class="flex justify-between items-start mb-2">
                <div class="flex items-center gap-1.5">
                    ${isOnline ? '<span class="inline-block w-2 h-2 bg-green-400 rounded-full flex-shrink-0 mt-0.5"></span>' : '<span class="inline-block w-2 h-2 rounded-full flex-shrink-0"></span>'}
                    <p class="font-bold text-slate-800 dark:text-vsdark-text">${member.full_name}</p>
                </div>
                <span class="px-2 py-1 rounded text-xs font-semibold bg-slate-200 dark:bg-vsdark-input text-slate-800 dark:text-vsdark-text">${memberLevel}</span>
            </div>
            <p class="text-xs text-slate-500 dark:text-vsdark-text-secondary mb-1">${member.email}</p>
            <p class="text-xs text-slate-500 dark:text-vsdark-text-secondary">${member.phone_number || 'N/A'}</p>
            <p class="text-xs text-slate-500 dark:text-vsdark-text-secondary mt-1">${member.physical_address || 'N/A'}</p>
            ${member.bio ? `<p class="text-xs text-slate-600 dark:text-vsdark-text-dim mt-2">${linkify(member.bio)}</p>` : ''}
            ${checkinHTML}
        `;
        membersList.appendChild(div);
    });
}
