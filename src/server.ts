import { Database } from "bun:sqlite";
import { db } from "./db";
import type { Server } from "bun";
import { password } from "bun";

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
                SELECT s.user_id, u.level as userLevel 
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
                    INSERT INTO users (email, password_hash, full_name, phone_number, physical_address)
                    VALUES ($email, $password_hash, $full_name, $phone_number, $physical_address)
                    RETURNING id
                `).get({
                    $email: email,
                    $password_hash: hashedPassword,
                    $full_name: full_name,
                    $phone_number: phone_number || "",
                    $physical_address: physical_address || ""
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

        if (url.pathname === "/api/me" && req.method === "GET") {
            const cookies = getCookies(req);
            const sessionId = cookies["session_id"];
            const sessionSig = cookies["session_id_sig"];

            if (!sessionId || !sessionSig || !(await verifySignature(sessionId, sessionSig))) {
                return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
            }

            const session = db.query("SELECT user_id FROM sessions WHERE id = $id AND expires_at > CURRENT_TIMESTAMP").get({ $id: sessionId }) as { user_id: number } | null;
            if (!session) return new Response(JSON.stringify({ error: "Session expired" }), { status: 401 });

            const user = db.query("SELECT id, full_name, email, phone_number, physical_address, level FROM users WHERE id = $id").get({ $id: session.user_id });
            return new Response(JSON.stringify(user), { headers: { "Content-Type": "application/json" } });
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
                const { full_name, phone_number, physical_address, email } = body;

                db.run(`
                    UPDATE users 
                    SET full_name = $full_name, phone_number = $phone_number, physical_address = $physical_address, email = $email
                    WHERE id = $id
                `, {
                    $full_name: full_name,
                    $phone_number: phone_number,
                    $physical_address: physical_address,
                    $email: email,
                    $id: session.user_id
                } as any);

                return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
            } catch (e: any) {
                return new Response(JSON.stringify({ error: e.message }), { status: 500 });
            }
        }

        if (url.pathname === "/api/admin/users" && req.method === "GET") {
            const cookies = getCookies(req);
            const sessionId = cookies["session_id"];
            const sessionSig = cookies["session_id_sig"];

            if (!sessionId || !sessionSig || !(await verifySignature(sessionId, sessionSig))) {
                return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
            }

            const session = db.query(`
                SELECT s.user_id, u.level 
                FROM sessions s 
                JOIN users u ON s.user_id = u.id 
                WHERE s.id = $id AND s.expires_at > CURRENT_TIMESTAMP
            `).get({ $id: sessionId }) as { user_id: number, level: number } | null;

            if (!session) return new Response(JSON.stringify({ error: "Session expired" }), { status: 401 });
            if ((session.level || 0) < 3) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });

            const users = db.query("SELECT id, full_name, email, level FROM users ORDER BY id").all();
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
                SELECT s.user_id, u.level 
                FROM sessions s 
                JOIN users u ON s.user_id = u.id 
                WHERE s.id = $id AND s.expires_at > CURRENT_TIMESTAMP
            `).get({ $id: sessionId }) as { user_id: number, level: number } | null;

            if (!session) return new Response(JSON.stringify({ error: "Session expired" }), { status: 401 });
            if ((session.level || 0) < 3) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });

            try {
                const body = await req.json() as any;
                const { userId, newLevel } = body;

                db.run("UPDATE users SET level = $level WHERE id = $id", {
                    $level: newLevel,
                    $id: userId
                } as any);

                return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
            } catch (e: any) {
                return new Response(JSON.stringify({ error: e.message }), { status: 500 });
            }
        }

        return new Response("404 Not Found", { status: 404 });
    },
    websocket: {
        open(ws) {
            console.log(`WebSocket opened from: ${ws.remoteAddress}, UserID: ${ws.data.userId}, Level: ${ws.data.userLevel}`);
            // Join the default channel
            ws.subscribe("#general");

            // Subscribe to level-based system channels
            const userLevel = ws.data.userLevel || 0;
            for (let l = 0; l <= userLevel; l++) {
                ws.subscribe(`system:${l}`);
            }

            // Send initial tags (filtered by level)
            try {
                const tags = db.query("SELECT * FROM tags WHERE level <= $level ORDER BY name").all({ $level: userLevel } as any);
                ws.send(JSON.stringify({ type: "tags", tags }));
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
                    const posts = db.query(`
                        SELECT p.content, p.timestamp, u.full_name as userName 
                        FROM posts p 
                        JOIN users u ON p.user_id = u.id 
                        WHERE p.tag_id = $tagId 
                        ORDER BY p.timestamp DESC 
                        LIMIT 50
                    `).all({ $tagId: tag.id }) as { content: string, timestamp: string, userName: string }[];

                    // Send history back to client
                    ws.send(JSON.stringify({
                        type: "history",
                        posts: posts.reverse(), // Send oldest first
                        tag: newTag
                    }));
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
                    tagName: tagName,
                    userName: user?.full_name || "Unknown",
                    content: content,
                    timestamp: result.created_at,
                };

                // 3. Use the server instance to publish to the tag
                ws.data.server.publish(tagName, JSON.stringify({
                    type: "newPost",
                    post: newPost
                }));
            }
        },
        close(ws, code, message) {
            console.log(`WebSocket closed: ${ws.remoteAddress}`);
        },
    },
});

console.log(`🚀 ECS Server running at http://localhost:${server.port}`);

// Poll for tag changes
let lastTagsHash = "";
setInterval(() => {
    try {
        const allTags = db.query("SELECT * FROM tags ORDER BY name").all() as any[];
        const currentHash = JSON.stringify(allTags);

        if (currentHash !== lastTagsHash) {
            lastTagsHash = currentHash;

            // Broadcast to each level channel
            // Levels: 0, 1, 2, 3 (Admin)
            for (let l = 0; l <= 3; l++) {
                const filteredTags = allTags.filter(t => (t.level || 0) <= l);
                server.publish(`system:${l}`, JSON.stringify({ type: "tags", tags: filteredTags }));
            }
        }
    } catch (error) {
        console.error("Error polling tags:", error);
    }
}, 2000);