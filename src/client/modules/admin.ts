// src/client/modules/admin.ts
import { USER_LEVELS } from '../../shared/constants.ts';
import type { User, Announcement } from '../types/types.ts';
import { displayCurrentAnnouncement, renderAnnouncementsHistory } from './announcements.ts';
import * as ZONES from './admin-zones.ts';
import * as NAV from './navigation.ts';

// Re-export zone functions so script.ts needs no changes
export { openZoneEdit, closeZoneEdit, renderAdminZoneList, loadZones } from './admin-zones.ts';

// ========== STATE ========== //
export let allUsers: User[] = [];
let currentEditingUserId: number | null = null;

export function initAdmin(): void {
    ZONES.initAdminZones();

    const adminUserFilter = document.getElementById('admin-user-filter') as HTMLInputElement;
    const userEditForm = document.getElementById('user-edit-form') as HTMLFormElement;

    if (adminUserFilter) {
        adminUserFilter.addEventListener('input', (e: Event): void => {
            const term = (e.target as HTMLInputElement).value.toLowerCase();
            const filtered = allUsers.filter((u: User) =>
                u.full_name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term)
            );
            renderAdminUserList(filtered);
        });
    }

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

}

// ========== NAVIGATION ========== //
export function openAdmin(): void {
    NAV.navigateTo('adminNav');
    loadAdminDashboard();
}

async function loadAdminDashboard(): Promise<void> {
    try {
        const res = await fetch('/api/admin/dashboard');
        if (!res.ok) return;
        const data = await res.json() as {
            sys_admin_total: number;
            sys_admin_online: number;
            zone_admin_total: number;
            zone_admin_online: number;
        };
        (document.getElementById('admin-dash-sys-total') as HTMLElement).textContent = String(data.sys_admin_total);
        (document.getElementById('admin-dash-sys-online') as HTMLElement).textContent = String(data.sys_admin_online);
        (document.getElementById('admin-dash-zone-total') as HTMLElement).textContent = String(data.zone_admin_total);
        (document.getElementById('admin-dash-zone-online') as HTMLElement).textContent = String(data.zone_admin_online);
    } catch (e) {
        console.error('Error loading admin dashboard:', e);
    }
}

export async function openAdminSection(section: string): Promise<void> {
    if (section === 'users') {
        try {
            const res = await fetch('/api/admin/users');
            if (res.ok) {
                allUsers = await res.json() as User[];
                renderAdminUserList(allUsers);
            } else {
                alert('Failed to fetch users');
            }
        } catch (e) {
            console.error('Error fetching users:', e);
        }
        NAV.navigateTo('admin');

    } else if (section === 'zones') {
        try {
            await ZONES.loadZones();
        } catch (e) {
            console.error('Error fetching zones:', e);
        }
        NAV.navigateTo('adminZones');

    } else if (section === 'announcements') {
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
        NAV.navigateTo('announcements');
    }
}

// ========== USER MANAGEMENT ========== //
export function renderAdminUserList(users: User[]): void {
    const adminUserList = document.getElementById('admin-user-list') as HTMLDivElement;
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

export async function updateUserLevel(userId: number, newLevel: string | number): Promise<void> {
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
}

export async function openUserEdit(userId: number): Promise<void> {
    currentEditingUserId = userId;
    const user = allUsers.find((u: User) => u.id === userId);

    if (!user) {
        alert('User not found');
        return;
    }

    (document.getElementById('user-fullname-input') as HTMLInputElement).value = user.full_name || '';
    (document.getElementById('user-email-input') as HTMLInputElement).value = user.email || '';
    (document.getElementById('user-phone-input') as HTMLInputElement).value = user.phone_number || '';
    (document.getElementById('user-address-input') as HTMLInputElement).value = user.physical_address || '';
    (document.getElementById('user-level-input') as HTMLSelectElement).value = String(user.user_level || '0');

    NAV.navigateTo('userEdit');
}

export function closeUserEdit(): void {
    NAV.goBack();
}
