// src/client/modules/admin-zones.ts
import { ZONE_LEVELS, WEATHER_LEVELS } from '../../shared/constants.ts';
import type { Tag } from '../types/types.ts';

// ========== STATE ========== //
let allZones: Tag[] = [];
let currentEditingZoneId: number | null = null;

export async function loadZones(): Promise<void> {
    const res = await fetch('/api/admin/tags');
    if (res.ok) {
        allZones = await res.json() as Tag[];
        renderAdminZoneList(allZones);
    } else {
        alert('Failed to fetch zones');
    }
}

// ========== CONFIG ========== //
let _navigateTo: (view: string) => void;
let _goBack: () => void;

export function initAdminZones(config: { navigateTo: (view: string) => void; goBack: () => void }): void {
    _navigateTo = config.navigateTo;
    _goBack = config.goBack;

    const adminZoneFilter = document.getElementById('admin-zone-filter') as HTMLInputElement;
    const zoneEditForm = document.getElementById('zone-edit-form') as HTMLFormElement;

    if (adminZoneFilter) {
        adminZoneFilter.addEventListener('input', (e: Event): void => {
            const term = (e.target as HTMLInputElement).value.toLowerCase();
            const filtered = allZones.filter((z: Tag) =>
                z.name.toLowerCase().includes(term) || (z.description && z.description.toLowerCase().includes(term))
            );
            renderAdminZoneList(filtered);
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

// ========== ZONE LIST ========== //
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

// ========== ZONE EDIT ========== //
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
