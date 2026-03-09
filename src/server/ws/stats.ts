import { db } from "../db";

// Track online users: userId -> number of active WebSocket connections
export const onlineConnectionCounts = new Map<number, number>();

export function getOnlineUserIds(): number[] {
    return [...onlineConnectionCounts.keys()];
}

export interface DashboardStats {
    total_online: number;
    recently_ok: number;
    help_alerts: number;
    zone_alerts: number;
    highest_severity: number;
    online_count: number;
}

export function getDashboardStats(): DashboardStats {
    const totalOnline = db.query(`SELECT COUNT(*) as count FROM users`).get() as { count: number } | null;

    const recentlyOk = db.query(`
        SELECT COUNT(*) as count
        FROM checkins
        WHERE status_id = 0
        AND datetime(timestamp) > datetime('now', '-1 hour')
    `).get() as { count: number } | null;

    const activeHelp = db.query(`
        SELECT COUNT(*) as count
        FROM (
            SELECT c.user_id, c.status_id
            FROM checkins c
            INNER JOIN (
                SELECT user_id, MAX(timestamp) as latest_timestamp
                FROM checkins
                GROUP BY user_id
            ) latest ON latest.user_id = c.user_id AND latest.latest_timestamp = c.timestamp
            WHERE c.status_id = 1
        )
    `).get() as { count: number } | null;

    const nonGreenZones = db.query(`
        SELECT COUNT(*) as count
        FROM tags
        WHERE COALESCE(hazard_level_id, 1) > 1
    `).get() as { count: number } | null;

    let highestSeverity = 1;
    if (activeHelp && activeHelp.count > 0) {
        highestSeverity = 4;
    } else {
        const maxZoneLevel = db.query(`
            SELECT MAX(COALESCE(hazard_level_id, 1)) as max_level
            FROM tags
        `).get() as { max_level: number } | null;
        highestSeverity = maxZoneLevel?.max_level ?? 1;
    }

    return {
        total_online: totalOnline?.count ?? 0,
        recently_ok: recentlyOk?.count ?? 0,
        help_alerts: activeHelp?.count ?? 0,
        zone_alerts: nonGreenZones?.count ?? 0,
        highest_severity: highestSeverity,
        online_count: onlineConnectionCounts.size,
    };
}
