import { Database } from "bun:sqlite";
import { db } from "./db";

// 1. Define the shape of your WebSocket data
interface WebSocketData {
    createdAt: number;
    subscribeTags: string[];
}

const server = Bun.serve<WebSocketData>({
    port: 3000,
    fetch(req, server) {
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

        // 2. WebSocket upgrade with data initialization
        if (url.pathname === "/ws") {
            const success = server.upgrade(req, {
                data: {
                    createdAt: Date.now(),
                    subscribeTags: ["#general"],
                },
            });
            return success ? undefined : new Response("WebSocket upgrade failed", { status: 400 });
        }

        // API Endpoints
        if (url.pathname === "/register" && req.method === "POST") {
            return new Response("Register endpoint");
        }

        return new Response("404 Not Found", { status: 404 });
    },
    websocket: {
        open(ws) {
            console.log(`WebSocket opened from: ${ws.remoteAddress}`);
            // Join the default channel
            ws.subscribe("#general");
        },
        async message(ws, message) {
            console.log(`Received: ${message}`);

            let msg;
            try {
                msg = JSON.parse(message.toString());
            } catch (e) {
                return;
            }

            if (msg.type === "post") {
                const userId = 1; // Placeholder for now
                const tagName = msg.tag || "#general";
                const content = msg.content;

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
                server.publish(tagName, JSON.stringify({
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