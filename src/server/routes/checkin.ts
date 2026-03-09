import type { Server } from "bun";
import { db } from "../db";
import { requireAuth } from "../middleware/auth";
import { getDashboardStats } from "../ws/stats";
import type { WebSocketData } from "../ws/handlers";

export async function handleCheckin(req: Request, server: Server<WebSocketData>): Promise<Response> {
    const auth = await requireAuth(req);
    if (auth.error) return auth.error;
    const { session } = auth;

    try {
        const body = await req.json() as any;
        const { status_id, status } = body;

        db.run("INSERT INTO checkins (user_id, status_id, status) VALUES ($user_id, $status_id, $status)", {
            $user_id: session.user_id,
            $status_id: status_id,
            $status: status
        } as any);

        try {
            const stats = getDashboardStats();
            server.publish("dashboard", JSON.stringify({ type: "DASHBOARD_UPDATE", ...stats }));
        } catch (error) {
            console.error("Error publishing dashboard stats after check-in:", error);
        }

        return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
    } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}

export async function handleGetUserCheckins(req: Request, url: URL): Promise<Response> {
    const auth = await requireAuth(req, 1);
    if (auth.error) return auth.error;

    const userIdStr = url.pathname.split('/')[3];
    if (!userIdStr) {
        return new Response(JSON.stringify({ error: "Invalid user ID" }), { status: 400 });
    }
    const userId = parseInt(userIdStr);
    const checkins = db.query(`
        SELECT id, status_id, status, timestamp
        FROM checkins
        WHERE user_id = $userId
        ORDER BY timestamp DESC
    `).all({ $userId: userId });

    return new Response(JSON.stringify(checkins), { headers: { "Content-Type": "application/json" } });
}
