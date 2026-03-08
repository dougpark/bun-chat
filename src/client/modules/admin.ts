// src/client/modules/admin.ts
import { ZONE_LEVELS, USER_LEVELS, WEATHER_LEVELS } from '../../shared/constants.ts';
import type { User, Tag, Announcement } from '../types/types.ts';
import { displayCurrentAnnouncement, renderAnnouncementsHistory } from './announcements.ts';

// ========== STATE ========== //
export let allUsers: User[] = [];
export let allZones: Tag[] = [];
let currentEditingUserId: number | null = null;
let currentEditingZoneId: number | null = null;

// ========== CONFIG ========== //
let _navigateTo: (view: string) => void;
let _goBack: () => void;

export function initAdmin(config: { navigateTo: (view: string) => void; goBack: () => void }): void {
    _navigateTo = config.navigateTo;
    _goBack = config.goBack;

    const adminUserFilter = document.getElementById('admin-user-filter') as HTMLInputElement;
    const adminZoneFilter = document.getElementById('admin-zone-filter') as HTMLInputElement;
    const userEditForm = document.getElementById('user-edit-form') as HTMLFormElement;
    const zoneEditForm = document.getElementById('zone-edit-form') as HTMLFormElement;

    if (adminUserFilter) {
        adminUserFilter.addEventListener('input', (e: Event): void => {
            const term = (e.target as HTMLInputElement).value.toLowerCase();
            const filtered = allUsers.filter((u: User) =>
                u.full_name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term)
            );
            renderAdminUserList(filtered);
        });
    }

    if (adminZoneFilter) {
        adminZoneFilter.addEventListener('input', (e: Event): void => {
            const term = (e.target as HTMLInputElement).value.toLowerCase();
            const filtered = allZones.filter((z: Tag) =>
                z.name.toLowerCase().includes(term) || (z.description && z.description.toLowerCase().includes(term))
            );
            renderAdminZoneList(filtered);
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

    if (zoneEditForm) {
        zoneEditForm.addEventListener('submit', async (e: Event): Promise<void> => {
            e.preventDefault();

            const zoneEditMessage = document.getElementById('zone-edit-message') as HTMLDivElement;
            zoneEditMessage.classList.add('hidden');

            if (!currentEditingZoneId) {
                alert('No zone selected');
                return;
            }

            const data = {
                name: (document.getElementById('zone-name-input') as HTMLInputElement).value,
                description: (document.getElementById('zone-description-input') as HTMLTextAreaElement).value,
                hazard_level_id: parseInt((document.getElementById('zone-hazard-level-id-input') as HTMLSelectElement).value),
                access_level: parseInt((document.getElementById('zone-level-input') as HTMLSelectElement).value),
                weather_id: parseInt((document.getElementById('zone-weather-id-input') as HTMLSelectElement).value),
                person_in_charge: (document.getElementById('zone-person-in-charge-input') as HTMLInputElement).value
            };

            try {
                const res = await fetch(`/api/admin/tags/${currentEditingZoneId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                if (res.ok) {
                    zoneEditMessage.textContent = 'Zone updated successfully!';
                    zoneEditMessage.className = 'text-center text-sm mt-2 text-green-600 dark:text-green-400';
                    zoneEditMessage.classList.remove('hidden');

                    setTimeout((): void => {
                        window.closeZoneEdit();
                        window.openAdminSection('zones');
                    }, 1500);
                } else {
                    const result = await res.json() as Record<string, string>;
                    zoneEditMessage.textContent = result.error || 'Update failed';
                    zoneEditMessage.className = 'text-center text-sm mt-2 text-red-600 dark:text-red-400';
                    zoneEditMessage.classList.remove('hidden');
                }
            } catch (err) {
                zoneEditMessage.textContent = 'Network error';
                zoneEditMessage.className = 'text-center text-sm mt-2 text-red-600 dark:text-red-400';
                zoneEditMessage.classList.remove('hidden');
            }
        });
    }
}

// ========== NAVIGATION ========== //
export function openAdmin(): void {
    _navigateTo('adminNav');
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
        _navigateTo('admin');
    } else if (section === 'zones') {
        try {
            const res = await fetch('/api/admin/tags');
            if (res.ok) {
                allZones = await res.json() as Tag[];
                renderAdminZoneList(allZones);
            } else {
                alert('Failed to fetch zones');
            }
        } catch (e) {
            console.error('Error fetching zones:', e);
        }
        _navigateTo('adminZones');
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
        _navigateTo('announcements');
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

    _navigateTo('userEdit');
}

export function closeUserEdit(): void {
    _goBack();
}

// ========== ZONE MANAGEMENT ========== //
export function renderAdminZoneList(zones: Tag[]): void {
    const adminZoneList = document.getElementById('admin-zone-list') as HTMLDivElement;
    adminZoneList.innerHTML = '';
    zones.forEach((zone: Tag) => {
        const div = document.createElement('div');
        div.className = 'flex items-center justify-between p-3 bg-slate-50 dark:bg-vsdark-input rounded border border-slate-200 dark:border-vsdark-border-light cursor-pointer hover:bg-slate-100 dark:hover:bg-vsdark-border-light';

        const zoneLevel = ZONE_LEVELS[zone.hazard_level_id as keyof typeof ZONE_LEVELS] || ZONE_LEVELS[1];

        let hazardClass = 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
        if (zoneLevel.color === 'amber') {
            hazardClass = 'bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200';
        } else if (zoneLevel.color === 'orange') {
            hazardClass = 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200';
        } else if (zoneLevel.color === 'red') {
            hazardClass = 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200';
        }

        const weatherName = WEATHER_LEVELS[zone.id as unknown as keyof typeof WEATHER_LEVELS]?.name || 'Unknown';

        div.innerHTML = `
            <div class="flex-1">
                <p class="font-bold text-slate-800 dark:text-vsdark-text">${zone.name}</p>
                <p class="text-xs text-slate-500 dark:text-vsdark-text-secondary">${zone.description || 'No description'}</p>
                <p class="text-xs text-slate-500 dark:text-vsdark-text-secondary">Weather: ${weatherName}</p>
            </div>
            <div class="flex items-center gap-2">
                <span class="px-2 py-1 rounded text-xs font-semibold ${hazardClass}">${zoneLevel.label}</span>
                <button onclick="window.openZoneEdit(${zone.id})" class="px-3 py-1 bg-vsdark-active5 text-white rounded text-xs font-bold hover:bg-vsdark-active1">Edit</button>
            </div>
        `;
        adminZoneList.appendChild(div);
    });
}

export async function openZoneEdit(zoneId: number): Promise<void> {
    currentEditingZoneId = zoneId;
    const zone = allZones.find((z: Tag) => z.id === zoneId);

    if (!zone) {
        alert('Zone not found');
        return;
    }

    (document.getElementById('zone-name-input') as HTMLInputElement).value = zone.name;
    (document.getElementById('zone-description-input') as HTMLTextAreaElement).value = zone.description || '';
    (document.getElementById('zone-hazard-level-id-input') as HTMLSelectElement).value = String(zone.hazard_level_id || 1);
    (document.getElementById('zone-level-input') as HTMLSelectElement).value = String(zone.access_level || '0');
    (document.getElementById('zone-weather-id-input') as HTMLSelectElement).value = String(zone.id || 1);
    (document.getElementById('zone-person-in-charge-input') as HTMLInputElement).value = '';

    _navigateTo('zoneEdit');
}

export function closeZoneEdit(): void {
    _goBack();
}
