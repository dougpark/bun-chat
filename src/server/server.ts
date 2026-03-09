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
import { handleReact, handleGetReactions, handleSupersede } from "./routes/posts";
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

        // Upload and download
        if (pathname === "/api/upload" && method === "POST") return handleUpload(req, server);
        const downloadMatch = pathname.match(/^\/api\/download\/(originals|thumbs)\/([a-f0-9\-]+\.(jpg|png|gif|webp))$/);
        if (downloadMatch && method === "GET") return handleDownload(req, downloadMatch);

        return new Response("404 Not Found", { status: 404 });
    },
    websocket,
});

console.log(`🚀 ECS Server running at http://localhost:${server.port}`);
