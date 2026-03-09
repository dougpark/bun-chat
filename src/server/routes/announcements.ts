import type { Server } from "bun";
import { db } from "../db";
import { requireAuth } from "../middleware/auth";
import { getDashboardStats } from "../ws/stats";
import type { WebSocketData } from "../ws/handlers";

export function handleGetAnnouncements(): Response {
    try {
        const announcement = db.query(`
            SELECT * FROM announcements 
            WHERE is_active = 1 
            ORDER BY created_at DESC 
            LIMIT 1
        `).get();
        return new Response(JSON.stringify(announcement || null), { headers: { "Content-Type": "application/json" } });
    } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}

export async function handleGetAdminAnnouncements(req: Request): Promise<Response> {
    const auth = await requireAuth(req, 2);
    if (auth.error) return auth.error;

    try {
        const announcements = db.query(`SELECT * FROM announcements ORDER BY created_at DESC`).all();
        return new Response(JSON.stringify(announcements), { headers: { "Content-Type": "application/json" } });
    } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}

export async function handlePostAnnouncement(req: Request, server: Server<WebSocketData>): Promise<Response> {
    const auth = await requireAuth(req, 2);
    if (auth.error) return auth.error;
    const { session } = auth;

    try {
        const body = await req.json() as any;
        const { announcement_text, hazard_level_id } = body;

        if (!announcement_text || !announcement_text.trim()) {
            return new Response(JSON.stringify({ error: "Announcement text is required" }), { status: 400 });
        }

        db.run("UPDATE announcements SET is_active = 0 WHERE is_active = 1");

        const result = db.query(`
            INSERT INTO announcements (
                announcement_text, 
                hazard_level_id, 
                created_by_user_id, 
                created_by_user_name
            ) VALUES ($text, $level, $user_id, $user_name)
            RETURNING id
        `).get({
            $text: announcement_text,
            $level: parseInt(hazard_level_id) || 1,
            $user_id: session.user_id,
            $user_name: session.full_name
        }) as { id: number };

        try {
            const stats = getDashboardStats();
            const announcement = db.query("SELECT * FROM announcements WHERE id = $id").get({ $id: result.id });
            server.publish("dashboard", JSON.stringify({ type: "DASHBOARD_UPDATE", ...stats, announcement }));
        } catch (error) {
            console.error("Error publishing announcement:", error);
        }

        return new Response(JSON.stringify({ success: true, id: result.id }), { headers: { "Content-Type": "application/json" } });
    } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}

export async function handleClearAnnouncement(req: Request, match: RegExpMatchArray, server: Server<WebSocketData>): Promise<Response> {
    const announcementId = parseInt(match[1]!);
    const auth = await requireAuth(req, 2);
    if (auth.error) return auth.error;
    const { session } = auth;

    try {
        db.run(`
            UPDATE announcements 
            SET is_active = 0, 
                cleared_at = CURRENT_TIMESTAMP, 
                cleared_by_user_id = $user_id, 
                cleared_by_user_name = $user_name 
            WHERE id = $id
        `, {
            $id: announcementId,
            $user_id: session.user_id,
            $user_name: session.full_name
        } as any);

        try {
            const stats = getDashboardStats();
            server.publish("dashboard", JSON.stringify({ type: "DASHBOARD_UPDATE", ...stats, announcement: null }));
        } catch (error) {
            console.error("Error publishing clear announcement:", error);
        }

        return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
    } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}
