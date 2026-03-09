import type { Server } from "bun";
import { db } from "../db";
import { requireAuth } from "../middleware/auth";
import { getDashboardStats, onlineConnectionCounts } from "../ws/stats";
import type { WebSocketData } from "../ws/handlers";

export async function handleAdminDashboard(req: Request): Promise<Response> {
    const auth = await requireAuth(req, 2);
    if (auth.error) return auth.error;

    const sysAdminTotal = (db.query("SELECT COUNT(*) as count FROM users WHERE user_level = 3").get() as { count: number }).count;
    const zoneAdminTotal = (db.query("SELECT COUNT(*) as count FROM users WHERE user_level = 2").get() as { count: number }).count;

    const adminIds = db.query("SELECT id, user_level FROM users WHERE user_level IN (2, 3)").all() as { id: number, user_level: number }[];
    let sysAdminOnline = 0;
    let zoneAdminOnline = 0;
    for (const u of adminIds) {
        if (onlineConnectionCounts.has(u.id)) {
            if (u.user_level === 3) sysAdminOnline++;
            else zoneAdminOnline++;
        }
    }

    return new Response(JSON.stringify({
        sys_admin_total: sysAdminTotal,
        sys_admin_online: sysAdminOnline,
        zone_admin_total: zoneAdminTotal,
        zone_admin_online: zoneAdminOnline,
    }), { headers: { "Content-Type": "application/json" } });
}

export async function handleGetAdminUsers(req: Request): Promise<Response> {
    const auth = await requireAuth(req, 2);
    if (auth.error) return auth.error;

    const users = db.query("SELECT id, full_name, email, user_level, phone_number, physical_address FROM users ORDER BY id").all();
    return new Response(JSON.stringify(users), { headers: { "Content-Type": "application/json" } });
}

export async function handleUpdateUserLevel(req: Request): Promise<Response> {
    const auth = await requireAuth(req, 2);
    if (auth.error) return auth.error;

    try {
        const body = await req.json() as any;
        const { userId, newLevel } = body;

        db.run("UPDATE users SET user_level = $user_level WHERE id = $id", {
            $user_level: newLevel,
            $id: userId
        } as any);

        return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
    } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}

export async function handleGetAdminTags(req: Request): Promise<Response> {
    const auth = await requireAuth(req, 2);
    if (auth.error) return auth.error;

    const tags = db.query(`
        SELECT 
            t.*, 
            COALESCE(t.weather_id, 1) as weather_id,
            COALESCE(t.hazard_level_id, 1) as hazard_level_id
        FROM tags t
        ORDER BY t.name
    `).all();
    return new Response(JSON.stringify(tags), { headers: { "Content-Type": "application/json" } });
}

export async function handleUpdateTag(req: Request, server: Server<WebSocketData>): Promise<Response> {
    const auth = await requireAuth(req, 2);
    if (auth.error) return auth.error;

    try {
        const body = await req.json() as any;
        const { id, description, hazard_level_id, access_level } = body;

        db.run("UPDATE tags SET description = $description, hazard_level_id = $hazard_level_id, access_level = $access_level WHERE id = $id", {
            $description: description,
            $hazard_level_id: parseInt(hazard_level_id),
            $access_level: parseInt(access_level),
            $id: id
        } as any);

        try {
            const stats = getDashboardStats();
            server.publish("dashboard", JSON.stringify({ type: "DASHBOARD_UPDATE", ...stats }));
        } catch (error) {
            console.error("Error publishing dashboard stats after zone update:", error);
        }

        return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
    } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}

export async function handleUpdateTagById(req: Request, match: RegExpMatchArray, server: Server<WebSocketData>): Promise<Response> {
    const tagId = parseInt(match[1]!);
    const auth = await requireAuth(req, 2);
    if (auth.error) return auth.error;

    try {
        const body = await req.json() as any;
        const { name, description, hazard_level_id, access_level, weather_id, person_in_charge } = body;

        db.run("UPDATE tags SET name = $name, description = $description, hazard_level_id = $hazard_level_id, access_level = $access_level, weather_id = $weather_id, person_in_charge = $person_in_charge WHERE id = $id", {
            $name: name,
            $description: description,
            $hazard_level_id: parseInt(hazard_level_id),
            $access_level: parseInt(access_level),
            $weather_id: parseInt(weather_id),
            $person_in_charge: person_in_charge,
            $id: tagId
        } as any);

        try {
            const stats = getDashboardStats();
            server.publish("dashboard", JSON.stringify({ type: "DASHBOARD_UPDATE", ...stats }));
        } catch (error) {
            console.error("Error publishing dashboard stats after zone update:", error);
        }

        return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
    } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}

export async function handleUpdateUserById(req: Request, match: RegExpMatchArray): Promise<Response> {
    const userId = parseInt(match[1]!);
    const auth = await requireAuth(req, 2);
    if (auth.error) return auth.error;

    try {
        const body = await req.json() as any;
        const { full_name, email, phone_number, physical_address, user_level } = body;

        db.run("UPDATE users SET full_name = $full_name, email = $email, phone_number = $phone_number, physical_address = $physical_address, user_level = $user_level WHERE id = $id", {
            $full_name: full_name,
            $email: email,
            $phone_number: phone_number,
            $physical_address: physical_address,
            $user_level: user_level,
            $id: userId
        } as any);

        return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
    } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}

export async function handleUpdateAdminCheckin(req: Request, match: RegExpMatchArray): Promise<Response> {
    const checkinId = parseInt(match[1]!);
    const auth = await requireAuth(req, 2);
    if (auth.error) return auth.error;

    try {
        const body = await req.json() as any;
        const { status, status_id } = body;

        const updates: string[] = [];
        const params: Record<string, any> = { $id: checkinId };

        if (status !== undefined) {
            updates.push('status = $status');
            params.$status = status;
        }
        if (status_id !== undefined) {
            updates.push('status_id = $status_id');
            params.$status_id = status_id;
        }

        if (updates.length === 0) {
            return new Response(JSON.stringify({ error: "No updates provided" }), { status: 400 });
        }

        db.run(`UPDATE checkins SET ${updates.join(', ')} WHERE id = $id`, params as any);

        return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
    } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}
