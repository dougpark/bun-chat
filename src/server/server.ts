import type { Server } from "bun";
import { db } from "./db";
import { ZONE_LEVELS, USER_LEVELS, WEATHER_LEVELS } from "../shared/constants.ts";
import { getCookies, verifySignature } from "./middleware/auth";
import { websocket, type WebSocketData } from "./ws/handlers";

// routes
import { handleRegister, handleLogin, handleLogout, handleMe } from "./routes/auth";
import { handleGetMembers } from "./routes/members";
import { handleUpdateProfile } from "./routes/profile";
import { handleCheckin, handleGetUserCheckins } from "./routes/checkin";
import {
    handleAdminDashboard,
    handleGetAdminUsers,
    handleUpdateUserLevel,
    handleGetAdminTags,
    handleUpdateTag,
    handleUpdateTagById,
    handleUpdateUserById,
    handleUpdateAdminCheckin,
} from "./routes/admin";
import {
    handleGetAnnouncements,
    handleGetAdminAnnouncements,
    handlePostAnnouncement,
    handleClearAnnouncement,
} from "./routes/announcements";
import { handleReact, handleGetReactions, handleSupersede, handleGetAiSummary } from "./routes/posts";
import { handleUpload, handleDownload } from "./routes/upload";

const PORT = process.env.PORT || 3010;

const server = Bun.serve<WebSocketData>({
    port: PORT,
    async fetch(req, server) {
        const url = new URL(req.url);
        const pathname = url.pathname;
        const method = req.method;

        // Static assets
        if (pathname === "/") return new Response(Bun.file("./public/index.html"), { headers: { "Content-Type": "text/html" } });
        if (pathname.startsWith("/static/") || pathname.endsWith(".css")) return new Response(Bun.file(`./public${pathname}`));
        if (pathname.startsWith("/fav/")) return new Response(Bun.file(`./public${pathname}`));
        if (pathname.startsWith("/vendor/")) return new Response(Bun.file(`./public${pathname}`));

        // Image viewer wrapper page (PWA-friendly — includes a back button)
        if (pathname === "/image-viewer" && method === "GET") {
            const src = new URL(req.url).searchParams.get("src") ?? "";
            // Only allow our own download URLs
            if (!src.startsWith("/api/download/")) return new Response("Bad Request", { status: 400 });
            const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Image</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 100%; height: 100%; background: #000; }
  body { display: flex; align-items: center; justify-content: center; }
  img { max-width: 100%; max-height: 100vh; object-fit: contain; display: block; }
  .back {
    position: fixed;
    top: max(1rem, env(safe-area-inset-top));
    left: max(1rem, env(safe-area-inset-left));
    display: flex; align-items: center; gap: 0.35rem;
    padding: 0.4rem 0.85rem 0.4rem 0.6rem;
    background: rgba(0,0,0,0.55); backdrop-filter: blur(6px);
    color: #fff; font-family: system-ui, sans-serif; font-size: 0.95rem;
    border-radius: 999px; text-decoration: none; border: none; cursor: pointer;
  }
  .back:active { background: rgba(0,0,0,0.8); }
  .back svg { width: 1.1rem; height: 1.1rem; stroke: currentColor; fill: none;
              stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round; }
</style>
</head>
<body>
<button class="back" onclick="history.back()">
  <svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
  Back
</button>
<img src="${src.replace(/"/g, '&quot;')}" alt="Full size image">
</body>
</html>`;
            return new Response(html, { headers: { "Content-Type": "text/html" } });
        }

        // WebSocket upgrade
        if (pathname === "/ws") {
            const cookies = getCookies(req);
            const sessionId = cookies["session_id"];
            const sessionSig = cookies["session_id_sig"];

            if (!sessionId || !sessionSig) return new Response("Unauthorized", { status: 401 });
            if (!(await verifySignature(sessionId, sessionSig))) return new Response("Invalid Session", { status: 401 });

            const session = db.query(`
                SELECT s.user_id, u.user_level as userLevel
                FROM sessions s
                JOIN users u ON s.user_id = u.id
                WHERE s.id = $id AND s.expires_at > CURRENT_TIMESTAMP
            `).get({ $id: sessionId }) as { user_id: number, userLevel: number } | null;

            if (!session) return new Response("Session Expired", { status: 401 });

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

        // Auth routes
        if (pathname === "/api/register" && method === "POST") return handleRegister(req);
        if (pathname === "/api/login" && method === "POST") return handleLogin(req);
        if (pathname === "/api/logout" && method === "POST") return handleLogout(req);
        if (pathname === "/api/me" && method === "GET") return handleMe(req);

        // Members and profile
        if (pathname === "/api/members" && method === "GET") return handleGetMembers(req);
        if (pathname === "/api/profile" && method === "PUT") return handleUpdateProfile(req);

        // Check-in
        if (pathname === "/api/checkin" && method === "POST") return handleCheckin(req, server);
        if (pathname.match(/^\/api\/user\/\d+\/checkins$/) && method === "GET") return handleGetUserCheckins(req, url);

        // Announcements
        if (pathname === "/api/announcements" && method === "GET") return handleGetAnnouncements();
        if (pathname === "/api/admin/announcements" && method === "GET") return handleGetAdminAnnouncements(req);
        if (pathname === "/api/admin/announcements" && method === "POST") return handlePostAnnouncement(req, server);
        const clearAnnouncementMatch = pathname.match(/^\/api\/admin\/announcements\/(\d+)\/clear$/);
        if (clearAnnouncementMatch && method === "PUT") return handleClearAnnouncement(req, clearAnnouncementMatch, server);

        // Admin
        if (pathname === "/api/admin/dashboard" && method === "GET") return handleAdminDashboard(req);
        if (pathname === "/api/admin/users" && method === "GET") return handleGetAdminUsers(req);
        if (pathname === "/api/admin/update-level" && method === "POST") return handleUpdateUserLevel(req);
        if (pathname === "/api/admin/tags" && method === "GET") return handleGetAdminTags(req);
        if (pathname === "/api/admin/tag/update" && method === "POST") return handleUpdateTag(req, server);
        const tagsMatch = pathname.match(/^\/api\/admin\/tags\/(\d+)$/);
        if (tagsMatch && method === "PUT") return handleUpdateTagById(req, tagsMatch, server);
        const usersMatch = pathname.match(/^\/api\/admin\/users\/(\d+)$/);
        if (usersMatch && method === "PUT") return handleUpdateUserById(req, usersMatch);
        const adminCheckinsMatch = pathname.match(/^\/api\/admin\/checkins\/(\d+)$/);
        if (adminCheckinsMatch && method === "PUT") return handleUpdateAdminCheckin(req, adminCheckinsMatch);

        // Posts
        const postReactMatch = pathname.match(/^\/api\/posts\/(\d+)\/react$/);
        if (postReactMatch && method === "POST") return handleReact(req, postReactMatch, server);
        const postReactionsMatch = pathname.match(/^\/api\/posts\/(\d+)\/reactions$/);
        if (postReactionsMatch && method === "GET") return handleGetReactions(req, postReactionsMatch);
        const postSupersedeMatch = pathname.match(/^\/api\/posts\/(\d+)\/supersede$/);
        if (postSupersedeMatch && method === "POST") return handleSupersede(req, postSupersedeMatch, server);
        const postAiSummaryMatch = pathname.match(/^\/api\/posts\/(\d+)\/ai-summary$/);
        if (postAiSummaryMatch && method === "GET") return handleGetAiSummary(req, postAiSummaryMatch);

        // Upload and download
        if (pathname === "/api/upload" && method === "POST") return handleUpload(req, server);
        const downloadMatch = pathname.match(/^\/api\/download\/(originals|thumbs)\/([a-f0-9\-]+\.(jpg|png|gif|webp))$/);
        if (downloadMatch && method === "GET") return handleDownload(req, downloadMatch);

        return new Response("404 Not Found", { status: 404 });
    },
    websocket,
});

console.log(`🚀 ECS Server running at http://localhost:${server.port}`);
