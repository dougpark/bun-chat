import { Database } from "bun:sqlite";
import { db } from "./db";
import type { Server } from "bun";
import { password } from "bun";
import { ZONE_LEVELS, USER_LEVELS, WEATHER_LEVELS } from "../shared/constants.ts";
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";

// Resolve upload dirs relative to the project root (two levels up from src/server/)
const PROJECT_ROOT = join(import.meta.dir, "../../");
const UPLOADS_ORIGINALS = join(PROJECT_ROOT, "data/uploads/originals");
const UPLOADS_THUMBS = join(PROJECT_ROOT, "data/uploads/thumbs");

// Ensure upload directories exist at startup
await mkdir(UPLOADS_ORIGINALS, { recursive: true });
await mkdir(UPLOADS_THUMBS, { recursive: true });

const PORT = process.env.PORT || 3010;
const SESSION_SECRET = process.env.SESSION_SECRET || "super-secret-key-change-me";

// 1. Define the shape of your WebSocket data
interface WebSocketData {
    createdAt: number;
    subscribeTags: string[];
    server: Server<WebSocketData>;
    userId: number;
    userLevel: number;
}

// Helper: Sign a value
async function signValue(value: string) {
    const signature = await Bun.password.hash(value + SESSION_SECRET, { algorithm: "bcrypt", cost: 4 });
    // Simplify signature for cookie (base64 or hex) - bcrypt produces a string we can use directly but it's long.
    // Let's use HMAC-SHA256 for a standard signature
    const key = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(SESSION_SECRET),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
    );
    const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
    return Buffer.from(sig).toString("base64");
}

// Helper: Verify signature
async function verifySignature(value: string, signature: string) {
    const expectedSig = await signValue(value);
    return expectedSig === signature;
}

// Track online users: userId -> number of active WebSocket connections
const onlineConnectionCounts = new Map<number, number>();

function getOnlineUserIds(): number[] {
    return [...onlineConnectionCounts.keys()];
}

interface DashboardStats {
    total_online: number;
    recently_ok: number;
    help_alerts: number;
    zone_alerts: number;
    highest_severity: number;
    online_count: number;
}

function getDashboardStats(): DashboardStats {
    // Total registered users (or online users if you track connections)
    const totalOnline = db.query(`SELECT COUNT(*) as count FROM users`).get() as { count: number } | null;

    // Users who checked in as 'ok' (status_id = 0) within the last 60 minutes
    const recentlyOk = db.query(`
        SELECT COUNT(*) as count
        FROM checkins
        WHERE status_id = 0
        AND datetime(timestamp) > datetime('now', '-1 hour')
    `).get() as { count: number } | null;

    // Active help requests: users whose latest check-in is status_id = 1 (help)
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

    // Zones with non-clear status (hazard_level_id > 1)
    const nonGreenZones = db.query(`
        SELECT COUNT(*) as count
        FROM tags
        WHERE COALESCE(hazard_level_id, 1) > 1
    `).get() as { count: number } | null;

    // Calculate highest severity: 4 if help alerts, otherwise max hazard_level_id from zones
    let highestSeverity = 1; // Default to Clear
    if (activeHelp && activeHelp.count > 0) {
        highestSeverity = 4; // Help alerts are most urgent
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

const server = Bun.serve<WebSocketData>({
    port: PORT,
    async fetch(req, server) {
        const url = new URL(req.url);

        // Serve static files
        if (url.pathname === "/") {
            return new Response(Bun.file("./public/index.html"), {
                headers: { "Content-Type": "text/html" }
            });
        }

        // Match your earlier Tailwind setup for local serving
        if (url.pathname.startsWith("/static/") || url.pathname.endsWith(".css")) {
            const filePath = `./public${url.pathname}`;
            return new Response(Bun.file(filePath));
        }

        if (url.pathname.startsWith("/fav/")) {
            const filePath = `./public${url.pathname}`;
            return new Response(Bun.file(filePath));
        }

        if (url.pathname.startsWith("/vendor/")) {
            const filePath = `./public${url.pathname}`;
            return new Response(Bun.file(filePath));
        }

        // Helper to get cookies
        const getCookies = (req: Request) => {
            const cookieHeader = req.headers.get("Cookie");
            if (!cookieHeader) return {};
            const cookies: Record<string, string> = {};
            cookieHeader.split(";").forEach(c => {
                const [key, ...v] = c.split("=");
                if (key) cookies[key.trim()] = v.join("=").trim();
            });
            return cookies;
        };

        // 2. WebSocket upgrade with data initialization
        if (url.pathname === "/ws") {
            const cookies = getCookies(req);
            const sessionId = cookies["session_id"];
            const sessionSig = cookies["session_id_sig"];

            if (!sessionId || !sessionSig) {
                return new Response("Unauthorized", { status: 401 });
            }

            if (!(await verifySignature(sessionId, sessionSig))) {
                return new Response("Invalid Session", { status: 401 });
            }

            // Verify session in DB
            const session = db.query(`
                SELECT s.user_id, u.user_level as userLevel 
                FROM sessions s 
                JOIN users u ON s.user_id = u.id 
                WHERE s.id = $id AND s.expires_at > CURRENT_TIMESTAMP
            `).get({ $id: sessionId }) as { user_id: number, userLevel: number } | null;

            if (!session) {
                return new Response("Session Expired", { status: 401 });
            }

            const success = server.upgrade(req, {
                data: {
                    createdAt: Date.now(),
                    subscribeTags: ["#general"],
                    server,
                    userId: session.user_id,
                    userLevel: session.userLevel || 0,
                },
            });
            return success ? undefined : new Response("WebSocket upgrade failed", { status: 400 });
        }

        // API Endpoints
        if (url.pathname === "/api/register" && req.method === "POST") {
            try {
                const body = await req.json() as any;
                const { email, password, full_name, phone_number, physical_address } = body;

                if (!email || !password || !full_name) {
                    return new Response(JSON.stringify({ error: "Missing fields" }), { status: 400 });
                }

                const hashedPassword = await Bun.password.hash(password);

                const result = db.query(`
                    INSERT INTO users (email, password_hash, full_name, phone_number, physical_address, user_level)
                    VALUES ($email, $password_hash, $full_name, $phone_number, $physical_address, $user_level)
                    RETURNING id
                `).get({
                    $email: email,
                    $password_hash: hashedPassword,
                    $full_name: full_name,
                    $phone_number: phone_number || "",
                    $physical_address: physical_address || "",
                    $user_level: 3 // Default user level - change to 0 for production Todo
                }) as { id: number };

                // Create Session
                const sessionId = crypto.randomUUID();
                const expiresAt = new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000).toISOString(); // 10 years

                db.run("INSERT INTO sessions (id, user_id, expires_at) VALUES ($id, $userId, $expiresAt)", {
                    $id: sessionId,
                    $userId: result.id,
                    $expiresAt: expiresAt
                } as any);

                const sig = await signValue(sessionId);

                const headers = new Headers();
                headers.append("Set-Cookie", `session_id=${sessionId}; Path=/; Max-Age=315360000; HttpOnly; SameSite=Strict`);
                headers.append("Set-Cookie", `session_id_sig=${sig}; Path=/; Max-Age=315360000; HttpOnly; SameSite=Strict`);
                headers.set("Content-Type", "application/json");

                return new Response(JSON.stringify({ success: true, userId: result.id }), {
                    headers
                });

            } catch (e: any) {
                return new Response(JSON.stringify({ error: e.message }), { status: 500 });
            }
        }

        if (url.pathname === "/api/login" && req.method === "POST") {
            try {
                const body = await req.json() as any;
                const { email, password } = body;

                const user = db.query("SELECT * FROM users WHERE email = $email").get({ $email: email }) as any;

                if (!user || !user.password_hash) {
                    return new Response(JSON.stringify({ error: "Invalid credentials" }), { status: 401 });
                }

                const isValid = await Bun.password.verify(password, user.password_hash);
                if (!isValid) {
                    return new Response(JSON.stringify({ error: "Invalid credentials" }), { status: 401 });
                }

                // Create Session
                const sessionId = crypto.randomUUID();
                const expiresAt = new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000).toISOString(); // 10 years

                db.run("INSERT INTO sessions (id, user_id, expires_at) VALUES ($id, $userId, $expiresAt)", {
                    $id: sessionId,
                    $userId: user.id,
                    $expiresAt: expiresAt
                } as any);

                const sig = await signValue(sessionId);

                const headers = new Headers();
                headers.append("Set-Cookie", `session_id=${sessionId}; Path=/; Max-Age=315360000; HttpOnly; SameSite=Strict`);
                headers.append("Set-Cookie", `session_id_sig=${sig}; Path=/; Max-Age=315360000; HttpOnly; SameSite=Strict`);
                headers.set("Content-Type", "application/json");

                return new Response(JSON.stringify({ success: true }), {
                    headers
                });
            } catch (e: any) {
                return new Response(JSON.stringify({ error: e.message }), { status: 500 });
            }
        }

        if (url.pathname === "/api/logout" && req.method === "POST") {
            const cookies = getCookies(req);
            const sessionId = cookies["session_id"];
            // Delete the session from DB (best-effort — ignore if already gone)
            if (sessionId) {
                try { db.run("DELETE FROM sessions WHERE id = $id", { $id: sessionId } as any); } catch (_) { }
            }
            const headers = new Headers({ "Content-Type": "application/json" });
            // Expire both cookies via server-issued Set-Cookie headers (the only way to clear HttpOnly cookies)
            headers.append("Set-Cookie", "session_id=; Path=/; Max-Age=0; HttpOnly; SameSite=Strict");
            headers.append("Set-Cookie", "session_id_sig=; Path=/; Max-Age=0; HttpOnly; SameSite=Strict");
            return new Response(JSON.stringify({ ok: true }), { headers });
        }

        if (url.pathname === "/api/me" && req.method === "GET") {
            const cookies = getCookies(req);
            const sessionId = cookies["session_id"];
            const sessionSig = cookies["session_id_sig"];

            if (!sessionId || !sessionSig || !(await verifySignature(sessionId, sessionSig))) {
                return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
            }

            const session = db.query("SELECT user_id FROM sessions WHERE id = $id AND expires_at > CURRENT_TIMESTAMP").get({ $id: sessionId }) as { user_id: number } | null;
            if (!session) return new Response(JSON.stringify({ error: "Session expired" }), { status: 401 });

            const user = db.query("SELECT id, full_name, email, phone_number, physical_address, user_level, bio FROM users WHERE id = $id").get({ $id: session.user_id });
            return new Response(JSON.stringify(user), { headers: { "Content-Type": "application/json" } });
        }

        if (url.pathname === "/api/members" && req.method === "GET") {
            const cookies = getCookies(req);
            const sessionId = cookies["session_id"];
            const sessionSig = cookies["session_id_sig"];

            if (!sessionId || !sessionSig || !(await verifySignature(sessionId, sessionSig))) {
                return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
            }

            const session = db.query(`
                SELECT s.user_id, u.user_level 
                FROM sessions s 
                JOIN users u ON s.user_id = u.id 
                WHERE s.id = $id AND s.expires_at > CURRENT_TIMESTAMP
            `).get({ $id: sessionId }) as { user_id: number, user_level: number } | null;

            if (!session) return new Response(JSON.stringify({ error: "Session expired" }), { status: 401 });
            if ((session.user_level || 0) < 1) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });

            const members = db.query(`
                SELECT 
                    u.id,
                    u.full_name, 
                    u.user_level, 
                    u.physical_address, 
                    u.email, 
                    u.phone_number,
                    u.bio,
                    c.status_id,
                    c.status,
                    c.timestamp
                FROM users u
                LEFT JOIN checkins c ON u.id = c.user_id AND c.timestamp = (
                    SELECT MAX(timestamp) FROM checkins WHERE user_id = u.id
                )
                ORDER BY u.full_name
            `).all();
            return new Response(JSON.stringify(members), { headers: { "Content-Type": "application/json" } });
        }

        if (url.pathname === "/api/profile" && req.method === "PUT") {
            const cookies = getCookies(req);
            const sessionId = cookies["session_id"];
            const sessionSig = cookies["session_id_sig"];

            if (!sessionId || !sessionSig || !(await verifySignature(sessionId, sessionSig))) {
                return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
            }

            const session = db.query("SELECT user_id FROM sessions WHERE id = $id AND expires_at > CURRENT_TIMESTAMP").get({ $id: sessionId }) as { user_id: number } | null;
            if (!session) return new Response(JSON.stringify({ error: "Session expired" }), { status: 401 });

            try {
                const body = await req.json() as any;
                const { full_name, phone_number, physical_address, email, bio } = body;

                db.run(`
                    UPDATE users 
                    SET full_name = $full_name, phone_number = $phone_number, physical_address = $physical_address, email = $email, bio = $bio
                    WHERE id = $id
                `, {
                    $full_name: full_name,
                    $phone_number: phone_number,
                    $physical_address: physical_address,
                    $email: email,
                    $bio: bio || null,
                    $id: session.user_id
                } as any);

                return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
            } catch (e: any) {
                return new Response(JSON.stringify({ error: e.message }), { status: 500 });
            }
        }

        if (url.pathname === "/api/admin/dashboard" && req.method === "GET") {
            const cookies = getCookies(req);
            const sessionId = cookies["session_id"];
            const sessionSig = cookies["session_id_sig"];

            if (!sessionId || !sessionSig || !(await verifySignature(sessionId, sessionSig))) {
                return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
            }

            const session = db.query(`
                SELECT s.user_id, u.user_level 
                FROM sessions s 
                JOIN users u ON s.user_id = u.id 
                WHERE s.id = $id AND s.expires_at > CURRENT_TIMESTAMP
            `).get({ $id: sessionId }) as { user_id: number, user_level: number } | null;

            if (!session) return new Response(JSON.stringify({ error: "Session expired" }), { status: 401 });
            if ((session.user_level || 0) < 2) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });

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

        if (url.pathname === "/api/admin/users" && req.method === "GET") {
            const cookies = getCookies(req);
            const sessionId = cookies["session_id"];
            const sessionSig = cookies["session_id_sig"];

            if (!sessionId || !sessionSig || !(await verifySignature(sessionId, sessionSig))) {
                return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
            }

            const session = db.query(`
                SELECT s.user_id, u.user_level 
                FROM sessions s 
                JOIN users u ON s.user_id = u.id 
                WHERE s.id = $id AND s.expires_at > CURRENT_TIMESTAMP
            `).get({ $id: sessionId }) as { user_id: number, user_level: number } | null;

            if (!session) return new Response(JSON.stringify({ error: "Session expired" }), { status: 401 });
            if ((session.user_level || 0) < 2) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });

            const users = db.query("SELECT id, full_name, email, user_level, phone_number, physical_address FROM users ORDER BY id").all();
            return new Response(JSON.stringify(users), { headers: { "Content-Type": "application/json" } });
        }

        if (url.pathname === "/api/admin/update-level" && req.method === "POST") {
            const cookies = getCookies(req);
            const sessionId = cookies["session_id"];
            const sessionSig = cookies["session_id_sig"];

            if (!sessionId || !sessionSig || !(await verifySignature(sessionId, sessionSig))) {
                return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
            }

            const session = db.query(`
                SELECT s.user_id, u.user_level 
                FROM sessions s 
                JOIN users u ON s.user_id = u.id 
                WHERE s.id = $id AND s.expires_at > CURRENT_TIMESTAMP
            `).get({ $id: sessionId }) as { user_id: number, user_level: number } | null;

            if (!session) return new Response(JSON.stringify({ error: "Session expired" }), { status: 401 });
            if ((session.user_level || 0) < 2) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });

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

        if (url.pathname === "/api/admin/tags" && req.method === "GET") {
            const cookies = getCookies(req);
            const sessionId = cookies["session_id"];
            const sessionSig = cookies["session_id_sig"];

            if (!sessionId || !sessionSig || !(await verifySignature(sessionId, sessionSig))) {
                return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
            }

            const session = db.query(`
                SELECT s.user_id, u.user_level 
                FROM sessions s 
                JOIN users u ON s.user_id = u.id 
                WHERE s.id = $id AND s.expires_at > CURRENT_TIMESTAMP
            `).get({ $id: sessionId }) as { user_id: number, user_level: number } | null;

            if (!session) return new Response(JSON.stringify({ error: "Session expired" }), { status: 401 });
            if ((session.user_level || 0) < 2) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });

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

        if (url.pathname === "/api/admin/tag/update" && req.method === "POST") {
            const cookies = getCookies(req);
            const sessionId = cookies["session_id"];
            const sessionSig = cookies["session_id_sig"];

            if (!sessionId || !sessionSig || !(await verifySignature(sessionId, sessionSig))) {
                return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
            }

            const session = db.query(`
                SELECT s.user_id, u.user_level 
                FROM sessions s 
                JOIN users u ON s.user_id = u.id 
                WHERE s.id = $id AND s.expires_at > CURRENT_TIMESTAMP
            `).get({ $id: sessionId }) as { user_id: number, user_level: number } | null;

            if (!session) return new Response(JSON.stringify({ error: "Session expired" }), { status: 401 });
            if ((session.user_level || 0) < 2) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });

            try {
                const body = await req.json() as any;
                const { id, description, hazard_level_id, access_level } = body;

                db.run("UPDATE tags SET description = $description, hazard_level_id = $hazard_level_id, access_level = $access_level WHERE id = $id", {
                    $description: description,
                    $hazard_level_id: parseInt(hazard_level_id),
                    $access_level: parseInt(access_level),
                    $id: id
                } as any);

                return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
            } catch (e: any) {
                return new Response(JSON.stringify({ error: e.message }), { status: 500 });
            }
        }

        // Handle PUT /api/admin/tags/:id
        const tagsMatch = url.pathname.match(/^\/api\/admin\/tags\/(\d+)$/);
        if (tagsMatch && req.method === "PUT") {
            const tagId = parseInt(tagsMatch[1]!);
            const cookies = getCookies(req);
            const sessionId = cookies["session_id"];
            const sessionSig = cookies["session_id_sig"];

            if (!sessionId || !sessionSig || !(await verifySignature(sessionId, sessionSig))) {
                return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
            }

            const session = db.query(`
                SELECT s.user_id, u.user_level 
                FROM sessions s 
                JOIN users u ON s.user_id = u.id 
                WHERE s.id = $id AND s.expires_at > CURRENT_TIMESTAMP
            `).get({ $id: sessionId }) as { user_id: number, user_level: number } | null;

            if (!session) return new Response(JSON.stringify({ error: "Session expired" }), { status: 401 });
            if ((session.user_level || 0) < 2) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });

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

                // Publish dashboard update after zone status change
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

        // Handle PUT /api/admin/users/:id
        const usersMatch = url.pathname.match(/^\/api\/admin\/users\/(\d+)$/);
        if (usersMatch && req.method === "PUT") {
            const userId = parseInt(usersMatch[1]!);
            const cookies = getCookies(req);
            const sessionId = cookies["session_id"];
            const sessionSig = cookies["session_id_sig"];

            if (!sessionId || !sessionSig || !(await verifySignature(sessionId, sessionSig))) {
                return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
            }

            const session = db.query(`
                SELECT s.user_id, u.user_level 
                FROM sessions s 
                JOIN users u ON s.user_id = u.id 
                WHERE s.id = $id AND s.expires_at > CURRENT_TIMESTAMP
            `).get({ $id: sessionId }) as { user_id: number, user_level: number } | null;

            if (!session) return new Response(JSON.stringify({ error: "Session expired" }), { status: 401 });
            if ((session.user_level || 0) < 2) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });

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

        // Handle GET /api/user/:userId/checkins
        if (url.pathname.match(/^\/api\/user\/\d+\/checkins$/) && req.method === "GET") {
            const cookies = getCookies(req);
            const sessionId = cookies["session_id"];
            const sessionSig = cookies["session_id_sig"];

            if (!sessionId || !sessionSig || !(await verifySignature(sessionId, sessionSig))) {
                return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
            }

            const session = db.query(`
                SELECT s.user_id, u.user_level 
                FROM sessions s 
                JOIN users u ON s.user_id = u.id 
                WHERE s.id = $id AND s.expires_at > CURRENT_TIMESTAMP
            `).get({ $id: sessionId }) as { user_id: number, user_level: number } | null;

            if (!session) return new Response(JSON.stringify({ error: "Session expired" }), { status: 401 });
            if ((session.user_level || 0) < 1) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });

            const userIdStr = url.pathname.split('/')[3];
            if (!userIdStr) {
                return new Response(JSON.stringify({ error: "Invalid user ID" }), { status: 400 });
            }
            const userId = parseInt(userIdStr);
            const checkins = db.query(`
                SELECT 
                    id,
                    status_id,
                    status,
                    timestamp
                FROM checkins
                WHERE user_id = $userId
                ORDER BY timestamp DESC
            `).all({ $userId: userId });

            return new Response(JSON.stringify(checkins), { headers: { "Content-Type": "application/json" } });
        }

        // Handle PUT /api/admin/checkins/:id - Update checkin status/feedback (Admin only)
        const adminCheckinsMatch = url.pathname.match(/^\/api\/admin\/checkins\/(\d+)$/);
        if (adminCheckinsMatch && req.method === "PUT") {
            const checkinId = parseInt(adminCheckinsMatch[1]!);
            const cookies = getCookies(req);
            const sessionId = cookies["session_id"];
            const sessionSig = cookies["session_id_sig"];

            if (!sessionId || !sessionSig || !(await verifySignature(sessionId, sessionSig))) {
                return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
            }

            const session = db.query(`
                SELECT s.user_id, u.user_level 
                FROM sessions s 
                JOIN users u ON s.user_id = u.id 
                WHERE s.id = $id AND s.expires_at > CURRENT_TIMESTAMP
            `).get({ $id: sessionId }) as { user_id: number, user_level: number } | null;

            if (!session) return new Response(JSON.stringify({ error: "Session expired" }), { status: 401 });
            if ((session.user_level || 0) < 2) return new Response(JSON.stringify({ error: "Forbidden - Requires Zone Admin level" }), { status: 403 });

            try {
                const body = await req.json() as any;
                const { status, status_id } = body;

                // Update the checkin status and/or message
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
        if (url.pathname === "/api/checkin" && req.method === "POST") {
            const cookies = getCookies(req);
            const sessionId = cookies["session_id"];
            const sessionSig = cookies["session_id_sig"];

            if (!sessionId || !sessionSig || !(await verifySignature(sessionId, sessionSig))) {
                return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
            }

            const session = db.query(`
                SELECT s.user_id
                FROM sessions s 
                WHERE s.id = $id AND s.expires_at > CURRENT_TIMESTAMP
            `).get({ $id: sessionId }) as { user_id: number } | null;

            if (!session) return new Response(JSON.stringify({ error: "Session expired" }), { status: 401 });

            try {
                const body = await req.json() as any;
                const { status_id, status } = body;

                db.run("INSERT INTO checkins (user_id, status_id, status) VALUES ($user_id, $status_id, $status)", {
                    $user_id: session.user_id,
                    $status_id: status_id,
                    $status: status
                } as any);

                // Publish dashboard update after check-in
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

        // Get current active announcement (public endpoint)
        if (url.pathname === "/api/announcements" && req.method === "GET") {
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

        // Get announcements history (admin only)
        if (url.pathname === "/api/admin/announcements" && req.method === "GET") {
            const cookies = getCookies(req);
            const sessionId = cookies["session_id"];
            const sessionSig = cookies["session_id_sig"];

            if (!sessionId || !sessionSig || !(await verifySignature(sessionId, sessionSig))) {
                return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
            }

            const session = db.query(`
                SELECT s.user_id, u.user_level 
                FROM sessions s 
                JOIN users u ON s.user_id = u.id 
                WHERE s.id = $id AND s.expires_at > CURRENT_TIMESTAMP
            `).get({ $id: sessionId }) as { user_id: number, user_level: number } | null;

            if (!session) return new Response(JSON.stringify({ error: "Session expired" }), { status: 401 });
            if ((session.user_level || 0) < 2) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });

            try {
                const announcements = db.query(`
                    SELECT * FROM announcements 
                    ORDER BY created_at DESC
                `).all();
                return new Response(JSON.stringify(announcements), { headers: { "Content-Type": "application/json" } });
            } catch (e: any) {
                return new Response(JSON.stringify({ error: e.message }), { status: 500 });
            }
        }

        // Publish new announcement (admin only)
        if (url.pathname === "/api/admin/announcements" && req.method === "POST") {
            const cookies = getCookies(req);
            const sessionId = cookies["session_id"];
            const sessionSig = cookies["session_id_sig"];

            if (!sessionId || !sessionSig || !(await verifySignature(sessionId, sessionSig))) {
                return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
            }

            const session = db.query(`
                SELECT s.user_id, u.user_level, u.full_name 
                FROM sessions s 
                JOIN users u ON s.user_id = u.id 
                WHERE s.id = $id AND s.expires_at > CURRENT_TIMESTAMP
            `).get({ $id: sessionId }) as { user_id: number, user_level: number, full_name: string } | null;

            if (!session) return new Response(JSON.stringify({ error: "Session expired" }), { status: 401 });
            if ((session.user_level || 0) < 2) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });

            try {
                const body = await req.json() as any;
                const { announcement_text, hazard_level_id } = body;

                if (!announcement_text || !announcement_text.trim()) {
                    return new Response(JSON.stringify({ error: "Announcement text is required" }), { status: 400 });
                }

                // Clear any existing active announcements
                db.run("UPDATE announcements SET is_active = 0 WHERE is_active = 1");

                // Insert new announcement
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

                // Publish update to all clients
                try {
                    const stats = getDashboardStats();
                    const announcement = db.query("SELECT * FROM announcements WHERE id = $id").get({ $id: result.id });
                    server.publish("dashboard", JSON.stringify({
                        type: "DASHBOARD_UPDATE",
                        ...stats,
                        announcement: announcement
                    }));
                } catch (error) {
                    console.error("Error publishing announcement:", error);
                }

                return new Response(JSON.stringify({ success: true, id: result.id }), { headers: { "Content-Type": "application/json" } });
            } catch (e: any) {
                return new Response(JSON.stringify({ error: e.message }), { status: 500 });
            }
        }

        // Clear announcement (admin only)
        const clearAnnouncementMatch = url.pathname.match(/^\/api\/admin\/announcements\/(\d+)\/clear$/);
        if (clearAnnouncementMatch && req.method === "PUT") {
            const announcementId = parseInt(clearAnnouncementMatch[1]!);
            const cookies = getCookies(req);
            const sessionId = cookies["session_id"];
            const sessionSig = cookies["session_id_sig"];

            if (!sessionId || !sessionSig || !(await verifySignature(sessionId, sessionSig))) {
                return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
            }

            const session = db.query(`
                SELECT s.user_id, u.user_level, u.full_name 
                FROM sessions s 
                JOIN users u ON s.user_id = u.id 
                WHERE s.id = $id AND s.expires_at > CURRENT_TIMESTAMP
            `).get({ $id: sessionId }) as { user_id: number, user_level: number, full_name: string } | null;

            if (!session) return new Response(JSON.stringify({ error: "Session expired" }), { status: 401 });
            if ((session.user_level || 0) < 2) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });

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

                // Publish update to all clients
                try {
                    const stats = getDashboardStats();
                    server.publish("dashboard", JSON.stringify({
                        type: "DASHBOARD_UPDATE",
                        ...stats,
                        announcement: null
                    }));
                } catch (error) {
                    console.error("Error publishing clear announcement:", error);
                }

                return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
            } catch (e: any) {
                return new Response(JSON.stringify({ error: e.message }), { status: 500 });
            }
        }

        // Handle POST /api/posts/:id/supersede — mark a post superseded by a new one
        // Only the original poster or an admin may do this
        const postSupersedeMatch = url.pathname.match(/^\/api\/posts\/(\d+)\/supersede$/);
        if (postSupersedeMatch && req.method === "POST") {
            const oldPostId = parseInt(postSupersedeMatch[1]!);
            const cookies = getCookies(req);
            const sessionId = cookies["session_id"];
            const sessionSig = cookies["session_id_sig"];

            if (!sessionId || !sessionSig || !(await verifySignature(sessionId, sessionSig))) {
                return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
            }

            const session = db.query(`
                SELECT s.user_id, u.user_level
                FROM sessions s JOIN users u ON s.user_id = u.id
                WHERE s.id = $id AND s.expires_at > CURRENT_TIMESTAMP
            `).get({ $id: sessionId }) as { user_id: number, user_level: number } | null;
            if (!session) return new Response(JSON.stringify({ error: "Session expired" }), { status: 401 });

            // Verify caller owns the post or is an admin (level >= 2)
            const originalPost = db.query(`
                SELECT p.user_id, t.name as tagName
                FROM posts p JOIN tags t ON p.tag_id = t.id
                WHERE p.id = $id
            `).get({ $id: oldPostId }) as { user_id: number, tagName: string } | null;

            if (!originalPost) return new Response(JSON.stringify({ error: "Post not found" }), { status: 404 });
            if (originalPost.user_id !== session.user_id && (session.user_level ?? 0) < 2) {
                return new Response(JSON.stringify({ error: "Forbidden: only the poster or an admin can supersede" }), { status: 403 });
            }

            try {
                const body = await req.json() as any;
                const { content } = body;
                if (!content?.trim()) return new Response(JSON.stringify({ error: "Content required" }), { status: 400 });

                // Insert the new update post in the same tag
                const tag = db.query("SELECT id FROM tags WHERE name = $name")
                    .get({ $name: originalPost.tagName }) as { id: number };

                const newResult = db.query(`
                    INSERT INTO posts (tag_id, user_id, content)
                    VALUES ($tagId, $userId, $content)
                    RETURNING id, timestamp as created_at
                `).get({ $tagId: tag.id, $userId: session.user_id, $content: content.trim() }) as { id: number, created_at: string };

                // Mark the old post as superseded by the new one
                db.run("UPDATE posts SET superseded_by = $newId WHERE id = $oldId",
                    { $newId: newResult.id, $oldId: oldPostId } as any);

                // Clear all reactions on the old post so re-acknowledgement is required
                db.run("DELETE FROM post_reactions WHERE post_id = $id", { $id: oldPostId } as any);

                const user = db.query("SELECT full_name FROM users WHERE id = $id")
                    .get({ $id: session.user_id }) as { full_name: string };

                const newPost = {
                    id: newResult.id,
                    tagName: originalPost.tagName,
                    userName: user?.full_name || "Unknown",
                    content: content.trim(),
                    timestamp: newResult.created_at,
                    thumbsUp: 0,
                    thumbsDown: 0,
                    supersedesId: oldPostId,
                };

                // Broadcast the new post to tag subscribers
                server.publish(originalPost.tagName, JSON.stringify({ type: "newPost", post: newPost }));

                // Broadcast that the old post is now superseded (reactions cleared, dimmed)
                server.publish(originalPost.tagName, JSON.stringify({
                    type: "postSuperseded",
                    oldPostId,
                    newPostId: newResult.id,
                }));

                server.publish("postUpdate", JSON.stringify({ type: "postUpdate", tag: originalPost.tagName }));

                return new Response(JSON.stringify({ success: true, newPostId: newResult.id }), {
                    headers: { "Content-Type": "application/json" }
                });
            } catch (e: any) {
                return new Response(JSON.stringify({ error: e.message }), { status: 500 });
            }
        }

        // Handle POST /api/posts/:id/react
        const postReactMatch = url.pathname.match(/^\/api\/posts\/(\d+)\/react$/);
        if (postReactMatch && req.method === "POST") {
            const postId = parseInt(postReactMatch[1]!);
            const cookies = getCookies(req);
            const sessionId = cookies["session_id"];
            const sessionSig = cookies["session_id_sig"];

            if (!sessionId || !sessionSig || !(await verifySignature(sessionId, sessionSig))) {
                return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
            }

            const session = db.query("SELECT user_id FROM sessions WHERE id = $id AND expires_at > CURRENT_TIMESTAMP")
                .get({ $id: sessionId }) as { user_id: number } | null;
            if (!session) return new Response(JSON.stringify({ error: "Session expired" }), { status: 401 });

            try {
                const body = await req.json() as any;
                const reaction = body.reaction;

                if (reaction !== 1 && reaction !== -1) {
                    return new Response(JSON.stringify({ error: "Invalid reaction value" }), { status: 400 });
                }

                // Upsert: INSERT OR REPLACE handles both new reactions and changing an existing one
                db.run(
                    `INSERT OR REPLACE INTO post_reactions (post_id, user_id, reaction) VALUES ($postId, $userId, $reaction)`,
                    { $postId: postId, $userId: session.user_id, $reaction: reaction } as any
                );

                // Aggregate current counts for this post
                const counts = db.query(`
                    SELECT
                        COALESCE(SUM(CASE WHEN reaction = 1 THEN 1 ELSE 0 END), 0) as thumbsUp,
                        COALESCE(SUM(CASE WHEN reaction = -1 THEN 1 ELSE 0 END), 0) as thumbsDown
                    FROM post_reactions
                    WHERE post_id = $postId
                `).get({ $postId: postId }) as { thumbsUp: number, thumbsDown: number };

                // Resolve which tag channel to publish to
                const postRow = db.query(`
                    SELECT t.name as tagName
                    FROM posts p
                    JOIN tags t ON p.tag_id = t.id
                    WHERE p.id = $postId
                `).get({ $postId: postId }) as { tagName: string } | null;

                if (postRow) {
                    server.publish(postRow.tagName, JSON.stringify({
                        type: "reactionUpdate",
                        postId,
                        thumbsUp: counts.thumbsUp,
                        thumbsDown: counts.thumbsDown,
                    }));
                }

                return new Response(JSON.stringify({ success: true, ...counts }), {
                    headers: { "Content-Type": "application/json" }
                });
            } catch (e: any) {
                return new Response(JSON.stringify({ error: e.message }), { status: 500 });
            }
        }

        // Handle GET /api/posts/:id/reactions — returns names grouped by reaction type
        const postReactionsMatch = url.pathname.match(/^\/api\/posts\/(\d+)\/reactions$/);
        if (postReactionsMatch && req.method === "GET") {
            const postId = parseInt(postReactionsMatch[1]!);
            const cookies = getCookies(req);
            const sessionId = cookies["session_id"];
            const sessionSig = cookies["session_id_sig"];

            if (!sessionId || !sessionSig || !(await verifySignature(sessionId, sessionSig))) {
                return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
            }

            const session = db.query("SELECT user_id FROM sessions WHERE id = $id AND expires_at > CURRENT_TIMESTAMP")
                .get({ $id: sessionId }) as { user_id: number } | null;
            if (!session) return new Response(JSON.stringify({ error: "Session expired" }), { status: 401 });

            const rows = db.query(`
                SELECT u.full_name, r.reaction
                FROM post_reactions r
                JOIN users u ON r.user_id = u.id
                WHERE r.post_id = $postId
                ORDER BY r.reaction DESC, u.full_name ASC
            `).all({ $postId: postId }) as { full_name: string, reaction: number }[];

            const agree = rows.filter(r => r.reaction === 1).map(r => r.full_name);
            const seen = rows.filter(r => r.reaction === -1).map(r => r.full_name);

            return new Response(JSON.stringify({ agree, seen }), {
                headers: { "Content-Type": "application/json" }
            });
        }

        // POST /api/upload — authenticated multipart image upload
        if (url.pathname === "/api/upload" && req.method === "POST") {
            const cookies = getCookies(req);
            const sessionId = cookies["session_id"];
            const sessionSig = cookies["session_id_sig"];

            if (!sessionId || !sessionSig || !(await verifySignature(sessionId, sessionSig))) {
                return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
            }

            const session = db.query(`
                SELECT s.user_id, u.full_name, u.user_level
                FROM sessions s JOIN users u ON s.user_id = u.id
                WHERE s.id = $id AND s.expires_at > CURRENT_TIMESTAMP
            `).get({ $id: sessionId }) as { user_id: number, full_name: string, user_level: number } | null;

            if (!session) {
                return new Response(JSON.stringify({ error: "Session expired" }), { status: 401, headers: { "Content-Type": "application/json" } });
            }

            const zoneTag = url.searchParams.get("tag") || "#general";
            const tag = db.query("SELECT id FROM tags WHERE name = $name").get({ $name: zoneTag }) as { id: number } | null;
            if (!tag) {
                return new Response(JSON.stringify({ error: "Zone not found" }), { status: 400, headers: { "Content-Type": "application/json" } });
            }

            try {
                const formData = await req.formData();
                const uploadedFile = formData.get("image");

                if (!uploadedFile || typeof uploadedFile === "string") {
                    return new Response(JSON.stringify({ error: "No image provided" }), { status: 400, headers: { "Content-Type": "application/json" } });
                }

                // Validate MIME type against allowlist
                const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/heic"];
                if (!allowedTypes.includes(uploadedFile.type)) {
                    return new Response(JSON.stringify({ error: "Unsupported image type" }), { status: 400, headers: { "Content-Type": "application/json" } });
                }

                // Limit file size to 20MB
                const MAX_BYTES = 20 * 1024 * 1024;
                const arrayBuf = await uploadedFile.arrayBuffer();
                if (arrayBuf.byteLength > MAX_BYTES) {
                    return new Response(JSON.stringify({ error: "File too large (max 20MB)" }), { status: 413, headers: { "Content-Type": "application/json" } });
                }

                const ext = uploadedFile.type === "image/png" ? "png"
                    : uploadedFile.type === "image/gif" ? "gif"
                        : uploadedFile.type === "image/webp" ? "webp"
                            : "jpg";
                const uuid = crypto.randomUUID();
                const originalName = `${uuid}.${ext}`;
                const thumbName = `${uuid}.webp`;
                const originalPath = `${UPLOADS_ORIGINALS}/${originalName}`;
                const thumbPath = `${UPLOADS_THUMBS}/${thumbName}`;

                const buffer = Buffer.from(arrayBuf);

                // Save original
                await Bun.write(originalPath, buffer);

                // Generate WebP thumbnail (max 400px wide, quality 80)
                await sharp(buffer)
                    .resize({ width: 400, withoutEnlargement: true })
                    .webp({ quality: 80 })
                    .toFile(thumbPath);

                // Insert image post record
                const newPost = db.query(`
                    INSERT INTO posts (tag_id, user_id, content, type, file_path, thumb_path)
                    VALUES ($tag_id, $user_id, '', 'image', $file_path, $thumb_path)
                    RETURNING id, timestamp
                `).get({
                    $tag_id: tag.id,
                    $user_id: session.user_id,
                    $file_path: originalPath,
                    $thumb_path: thumbPath,
                }) as { id: number, timestamp: string };

                const message = {
                    id: newPost.id,
                    type: "image",
                    thumbUrl: `/api/download/thumbs/${thumbName}`,
                    fullUrl: `/api/download/originals/${originalName}`,
                    sender: session.full_name,
                    userId: session.user_id,
                    userName: session.full_name,
                    tagName: zoneTag,
                    timestamp: newPost.timestamp,
                };

                // Broadcast NEW_MESSAGE to the zone's WebSocket channel
                server.publish(zoneTag, JSON.stringify({
                    type: "NEW_MESSAGE",
                    zoneId: tag.id,
                    message,
                }));

                return new Response(JSON.stringify({ success: true, message }), {
                    headers: { "Content-Type": "application/json" },
                });
            } catch (e: any) {
                console.error("Upload error:", e);
                return new Response(JSON.stringify({ error: "Upload failed" }), { status: 500, headers: { "Content-Type": "application/json" } });
            }
        }

        // GET /api/download/:type/:filename — authenticated image serving
        const downloadMatch = url.pathname.match(/^\/api\/download\/(originals|thumbs)\/([a-f0-9\-]+\.(jpg|png|gif|webp))$/);
        if (downloadMatch && req.method === "GET") {
            const cookies = getCookies(req);
            const sessionId = cookies["session_id"];
            const sessionSig = cookies["session_id_sig"];

            if (!sessionId || !sessionSig || !(await verifySignature(sessionId, sessionSig))) {
                return new Response("Unauthorized", { status: 401 });
            }

            const session = db.query("SELECT user_id FROM sessions WHERE id = $id AND expires_at > CURRENT_TIMESTAMP")
                .get({ $id: sessionId });
            if (!session) return new Response("Unauthorized", { status: 401 });

            const typeDir = downloadMatch[1]!;
            const filename = downloadMatch[2]!;
            const basePath = typeDir === "originals" ? UPLOADS_ORIGINALS : UPLOADS_THUMBS;
            const filePath = `${basePath}/${filename}`;
            const bunFile = Bun.file(filePath);

            if (!(await bunFile.exists())) {
                return new Response("Not Found", { status: 404 });
            }

            return new Response(bunFile, {
                headers: { "Cache-Control": "private, max-age=31536000, immutable" },
            });
        }

        return new Response("404 Not Found", { status: 404 });
    },
    websocket: {
        open(ws) {
            console.log(`WebSocket opened from: ${ws.remoteAddress}, UserID: ${ws.data.userId}, Level: ${ws.data.userLevel}`);
            // Join the default channel
            ws.subscribe("#general");
            ws.subscribe("dashboard");

            // Subscribe to level-based system channels
            const userLevel = ws.data.userLevel || 0;
            for (let l = 0; l <= userLevel; l++) {
                ws.subscribe(`system:${l}`);
            }

            // Subscribe to post updates channel to refresh tags when new posts arrive
            ws.subscribe("postUpdate");

            // Track this user as online and notify all connected clients
            onlineConnectionCounts.set(ws.data.userId, (onlineConnectionCounts.get(ws.data.userId) ?? 0) + 1);
            ws.data.server.publish("dashboard", JSON.stringify({ type: "ONLINE_UPDATE", userIds: getOnlineUserIds() }));

            // Send initial tags (filtered by level) with unread counts
            try {
                const userId = ws.data.userId || 1;

                // Initialize user_tag_presence for any tags not yet visited by this user
                // Set last_viewed_at to the latest post timestamp in each tag, so unread count starts at 0
                db.run(`
                    INSERT OR IGNORE INTO user_tag_presence (user_id, tag_id, last_viewed_at)
                    SELECT ?, t.id, COALESCE((
                        SELECT MAX(p.timestamp) 
                        FROM posts p 
                        WHERE p.tag_id = t.id
                    ), CURRENT_TIMESTAMP)
                    FROM tags t
                    WHERE t.access_level <= ?
                `, [userId, userLevel]);

                const tags = db.query(`
                    SELECT 
                        t.*,
                        COALESCE((
                            SELECT COUNT(*) 
                            FROM posts p 
                            WHERE p.tag_id = t.id 
                            AND DATETIME(p.timestamp) > DATETIME(COALESCE((
                                SELECT last_viewed_at 
                                FROM user_tag_presence 
                                WHERE user_id = ? AND tag_id = t.id
                            ), '1970-01-01 00:00:00'))
                        ), 0) as unread_count
                    FROM tags t
                    WHERE t.access_level <= ?
                    ORDER BY t.name
                `).all(userId, userLevel) as any;
                ws.send(JSON.stringify({ type: "tags", tags }));

                const stats = getDashboardStats();
                ws.send(JSON.stringify({ type: "DASHBOARD_UPDATE", ...stats }));
            } catch (error) {
                console.error("Error sending initial tags:", error);
            }
        },
        async message(ws, message) {
            // console.log(`Received: ${message}`);

            let msg;
            try {
                msg = JSON.parse(message.toString());
            } catch (e) {
                return;
            }

            if (msg.type === "subscribe") {
                const newTag = msg.tag;
                if (!newTag) return;

                // Unsubscribe from previous tags
                ws.data.subscribeTags.forEach((tag) => ws.unsubscribe(tag));
                ws.data.subscribeTags = [newTag];
                ws.subscribe(newTag);

                // specific logic to fetch history
                const tag = db.query("SELECT id FROM tags WHERE name = $name").get({ $name: newTag }) as { id: number } | null;

                if (tag) {
                    const histUserId = ws.data.userId;
                    const posts = db.query(`
                        SELECT
                            p.id,
                            p.user_id as userId,
                            p.content,
                            p.timestamp,
                            p.superseded_by as supersededBy,
                            (SELECT id FROM posts WHERE superseded_by = p.id LIMIT 1) as supersedesId,
                            COALESCE(p.type, 'text') as type,
                            p.file_path as filePath,
                            p.thumb_path as thumbPath,
                            u.full_name as userName,
                            COALESCE((SELECT COUNT(*) FROM post_reactions WHERE post_id = p.id AND reaction = 1), 0) as thumbsUp,
                            COALESCE((SELECT COUNT(*) FROM post_reactions WHERE post_id = p.id AND reaction = -1), 0) as thumbsDown,
                            (SELECT reaction FROM post_reactions WHERE post_id = p.id AND user_id = $userId) as myReaction
                        FROM posts p
                        JOIN users u ON p.user_id = u.id
                        WHERE p.tag_id = $tagId
                        ORDER BY p.timestamp DESC
                        LIMIT 50
                    `).all({ $tagId: tag.id, $userId: histUserId }) as any[];

                    // Map file paths to URLs for image posts
                    const postsWithUrls = posts.reverse().map((p: any) => {
                        if (p.type === 'image' && p.filePath && p.thumbPath) {
                            const originalName = p.filePath.split('/').pop() as string;
                            const thumbName = p.thumbPath.split('/').pop() as string;
                            return {
                                ...p,
                                fullUrl: `/api/download/originals/${originalName}`,
                                thumbUrl: `/api/download/thumbs/${thumbName}`,
                            };
                        }
                        return p;
                    });

                    // Send history back to client
                    ws.send(JSON.stringify({
                        type: "history",
                        posts: postsWithUrls,
                        tag: newTag
                    }));
                }
            }

            if (msg.type === "openTag") {
                const userId = ws.data.userId;
                const tagName = msg.tag;
                if (!tagName || !userId) return;

                // Get tag ID
                const tag = db.query("SELECT id FROM tags WHERE name = $name").get({ $name: tagName }) as { id: number } | null;
                if (!tag) return;

                // Upsert the last_viewed_at timestamp
                db.run(`
                    INSERT INTO user_tag_presence (user_id, tag_id, last_viewed_at)
                    VALUES (?, ?, CURRENT_TIMESTAMP)
                    ON CONFLICT(user_id, tag_id)
                    DO UPDATE SET last_viewed_at = CURRENT_TIMESTAMP
                `, [userId, tag.id]);
            }

            if (msg.type === "requestTags") {
                // Send fresh tags with current unread counts
                try {
                    const userId = ws.data.userId;
                    const userLevel = ws.data.userLevel || 0;

                    // Initialize user_tag_presence for any tags not yet visited by this user
                    // Set last_viewed_at to the latest post timestamp in each tag, so unread count starts at 0
                    db.run(`
                        INSERT OR IGNORE INTO user_tag_presence (user_id, tag_id, last_viewed_at)
                        SELECT ?, t.id, COALESCE((
                            SELECT MAX(p.timestamp) 
                            FROM posts p 
                            WHERE p.tag_id = t.id
                        ), CURRENT_TIMESTAMP)
                        FROM tags t
                        WHERE t.access_level <= ?
                    `, [userId, userLevel]);

                    const tags = db.query(`
                        SELECT 
                            t.*,
                            COALESCE((
                                SELECT COUNT(*) 
                                FROM posts p 
                                WHERE p.tag_id = t.id 
                                AND DATETIME(p.timestamp) > DATETIME(COALESCE((
                                    SELECT last_viewed_at 
                                    FROM user_tag_presence 
                                    WHERE user_id = ? AND tag_id = t.id
                                ), '1970-01-01 00:00:00'))
                            ), 0) as unread_count
                        FROM tags t
                        WHERE t.access_level <= ?
                        ORDER BY t.name
                    `).all(userId, userLevel) as any;
                    ws.send(JSON.stringify({ type: "tags", tags }));
                } catch (error) {
                    console.error("Error sending tags:", error);
                }
            }

            if (msg.type === "post") {
                const userId = ws.data.userId;
                const userLevel = ws.data.userLevel;
                const tagName = msg.tag || "#general";
                const content = msg.content;

                if (userLevel === 0) {
                    ws.send(JSON.stringify({ type: "error", message: "You do not have permission to post (Level 0)." }));
                    return;
                }

                // Query Tag
                const tag = db.query("SELECT id FROM tags WHERE name = $name")
                    .get({ $name: tagName }) as { id: number } | null;

                if (!tag) {
                    ws.send(JSON.stringify({ type: "error", message: "Tag not found" }));
                    return;
                }

                // Insert Post
                const result = db.query(`
                    INSERT INTO posts (tag_id, user_id, content) 
                    VALUES ($tagId, $userId, $content) 
                    RETURNING id, timestamp as created_at
                `).get({
                    $tagId: tag.id,
                    $userId: userId,
                    $content: content
                }) as { id: number, created_at: string };

                // Get User Info
                const user = db.query("SELECT full_name FROM users WHERE id = $id")
                    .get({ $id: userId }) as { full_name: string } | null;

                const newPost = {
                    id: result.id,
                    userId: userId,
                    tagName: tagName,
                    userName: user?.full_name || "Unknown",
                    content: content,
                    timestamp: result.created_at,
                    thumbsUp: 0,
                    thumbsDown: 0,
                };

                // 3. Use the server instance to publish to the tag
                ws.data.server.publish(tagName, JSON.stringify({
                    type: "newPost",
                    post: newPost
                }));

                // 4. Notify all connected clients that a new post arrived (even those not subscribed to this tag)
                // This allows them to refresh their unread counts
                ws.data.server.publish("postUpdate", JSON.stringify({
                    type: "postUpdate",
                    tag: tagName
                }));
            }

            try {
                const stats = getDashboardStats();
                ws.data.server.publish("dashboard", JSON.stringify({ type: "DASHBOARD_UPDATE", ...stats }));
            } catch (error) {
                console.error("Error publishing dashboard stats:", error);
            }
        },
        close(ws, code, message) {
            console.log(`WebSocket closed: ${ws.remoteAddress}`);
            const prev = onlineConnectionCounts.get(ws.data.userId) ?? 1;
            if (prev <= 1) onlineConnectionCounts.delete(ws.data.userId);
            else onlineConnectionCounts.set(ws.data.userId, prev - 1);
            ws.data.server.publish("dashboard", JSON.stringify({ type: "ONLINE_UPDATE", userIds: getOnlineUserIds() }));
        },
    },
});

console.log(`🚀 ECS Server running at http://localhost:${server.port}`);

