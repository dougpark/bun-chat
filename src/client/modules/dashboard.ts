// src/client/modules/dashboard.ts
import { ZONE_LEVELS } from '../../shared/constants.ts';
import type { DashboardData } from '../types/types.ts';
import * as ANNOUNCEMENTS from './announcements.ts';

export function updateDashboard(data: DashboardData): void {
    const dash = document.getElementById('dashboard') as HTMLDivElement;
    if (!dash) return;

    const totalOnline = Number(data.total_online ?? data.members_count ?? 0);
    const recentlyOk = Number(data.recently_ok ?? 0);
    const helpAlerts = Number(data.help_alerts ?? data.help_count ?? 0);
    const zoneAlerts = Number(data.zone_alerts ?? data.non_green_count ?? 0);

    const statOkEl = document.getElementById('stat-ok') as HTMLDivElement;
    const membersEl = document.getElementById('stat-members') as HTMLDivElement;
    const helpEl = document.getElementById('stat-help') as HTMLDivElement;
    const alertsEl = document.getElementById('stat-alerts') as HTMLDivElement;

    // Update numbers
    if (statOkEl) {
        statOkEl.textContent = String(recentlyOk);
        // If recently_ok is less than 20% of total_online, change color to amber (stale data warning)
        if (totalOnline > 0 && recentlyOk < totalOnline * 0.2) {
            statOkEl.className = 'text-lg font-black text-vsdark-active5 dark:vsdark-active5';
        } else {
            statOkEl.className = 'text-lg font-black text-green-600 dark:text-green-400';
        }
    }
    statOkEl.className = 'text-lg font-black text-slate-100 dark:text-vsdark-text';
    if (membersEl) membersEl.textContent = String(totalOnline);
    if (helpEl) helpEl.textContent = String(helpAlerts);
    if (alertsEl) alertsEl.textContent = String(zoneAlerts);

    const onlineEl = document.getElementById('stat-online') as HTMLSpanElement;
    if (onlineEl) onlineEl.textContent = String(data.online_count ?? 0);

    // Visual State Escalation based on highest severity from server
    // Get highest severity from server data, default to 1 (Clear)
    const highestSeverity = Number(data.highest_severity ?? 1);
    const zoneLevel = ZONE_LEVELS[highestSeverity] || ZONE_LEVELS[1];
    const borderHex = zoneLevel.hex;

    // Remove all possible state classes first for clean state transitions
    const stateClasses = [
        'bg-emerald-50/50', 'bg-amber-50/50', 'bg-red-50/80',
        'border-emerald-500', 'border-amber-500', 'border-red-600',
        'dark:bg-emerald-950/20', 'dark:bg-amber-950/20', 'dark:bg-red-900/30',
        'dark:border-emerald-500', 'dark:border-amber-500', 'dark:border-red-500'
    ];
    stateClasses.forEach(cls => dash.classList.remove(cls));
    dash.classList.remove('animate-pulse');

    // Apply border color using hex code from ZONE_LEVELS
    dash.style.borderColor = borderHex;

    // Apply appropriate background based on severity
    if (highestSeverity === 4) {
        // Danger: Red background
        dash.classList.add('bg-red-50/80', 'dark:bg-red-900/30');
        if (helpAlerts > 0) {
            dash.classList.add('animate-pulse'); // Pulse animation for active help alerts
        }
    } else if (highestSeverity === 3) {
        // Warning: Orange/Amber background
        dash.classList.add('bg-amber-50/50', 'dark:bg-amber-950/20');
    } else if (highestSeverity === 2) {
        // Caution: Yellow/Amber background
        dash.classList.add('bg-amber-50/50', 'dark:bg-amber-950/20');
    } else {
        // Clear: Green background
        dash.classList.add('bg-emerald-50/50', 'dark:bg-emerald-950/20');
    }

    // Handle announcement if present in data
    if (data.announcement !== undefined) {
        ANNOUNCEMENTS.displayAnnouncement(data.announcement);
    }
}
