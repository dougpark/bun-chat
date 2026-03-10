import type { ServerWebSocket } from "bun";
import { db } from "../db";
import { onlineConnectionCounts, getOnlineUserIds, getDashboardStats } from "./stats";
import { enqueueChatReply } from "../chat-queue";

export interface WebSocketData {
    createdAt: number;
    subscribeTags: string[];
    server: any; // Server<WebSocketData> — typed as any to avoid circular reference
    userId: number;
    userLevel: number;
}

export const websocket = {
    open(ws: ServerWebSocket<WebSocketData>) {
        console.log(`WebSocket opened from: ${ws.remoteAddress}, UserID: ${ws.data.userId}, Level: ${ws.data.userLevel}`);
        ws.subscribe("#general");
        ws.subscribe("dashboard");

        const userLevel = ws.data.userLevel || 0;
        for (let l = 0; l <= userLevel; l++) {
            ws.subscribe(`system:${l}`);
        }

        ws.subscribe("postUpdate");

        onlineConnectionCounts.set(ws.data.userId, (onlineConnectionCounts.get(ws.data.userId) ?? 0) + 1);
        ws.data.server.publish("dashboard", JSON.stringify({ type: "ONLINE_UPDATE", userIds: getOnlineUserIds() }));

        try {
            const userId = ws.data.userId || 1;

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

    async message(ws: ServerWebSocket<WebSocketData>, message: string | Buffer) {
        let msg: any;
        try {
            msg = JSON.parse(message.toString());
        } catch (e) {
            return;
        }

        if (msg.type === "subscribe") {
            const newTag = msg.tag;
            if (!newTag) return;

            ws.data.subscribeTags.forEach((tag) => ws.unsubscribe(tag));
            ws.data.subscribeTags = [newTag];
            ws.subscribe(newTag);

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
                        p.ai_summary as aiSummary,
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

                ws.send(JSON.stringify({ type: "history", posts: postsWithUrls, tag: newTag }));
            }
        }

        if (msg.type === "openTag") {
            const userId = ws.data.userId;
            const tagName = msg.tag;
            if (!tagName || !userId) return;

            const tag = db.query("SELECT id FROM tags WHERE name = $name").get({ $name: tagName }) as { id: number } | null;
            if (!tag) return;

            db.run(`
                INSERT INTO user_tag_presence (user_id, tag_id, last_viewed_at)
                VALUES (?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(user_id, tag_id)
                DO UPDATE SET last_viewed_at = CURRENT_TIMESTAMP
            `, [userId, tag.id]);
        }

        if (msg.type === "requestTags") {
            try {
                const userId = ws.data.userId;
                const userLevel = ws.data.userLevel || 0;

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

            const tag = db.query("SELECT id FROM tags WHERE name = $name")
                .get({ $name: tagName }) as { id: number } | null;

            if (!tag) {
                ws.send(JSON.stringify({ type: "error", message: "Tag not found" }));
                return;
            }

            const result = db.query(`
                INSERT INTO posts (tag_id, user_id, content) 
                VALUES ($tagId, $userId, $content) 
                RETURNING id, timestamp as created_at
            `).get({ $tagId: tag.id, $userId: userId, $content: content }) as { id: number, created_at: string };

            const user = db.query("SELECT full_name FROM users WHERE id = $id")
                .get({ $id: userId }) as { full_name: string } | null;

            const newPost = {
                id: result.id,
                userId,
                tagName,
                userName: user?.full_name || "Unknown",
                content,
                timestamp: result.created_at,
                thumbsUp: 0,
                thumbsDown: 0,
            };

            ws.data.server.publish(tagName, JSON.stringify({ type: "newPost", post: newPost }));
            ws.data.server.publish("postUpdate", JSON.stringify({ type: "postUpdate", tag: tagName }));

            // If the message uses an AI chat trigger, queue an LLM reply
            // Triggers: @chat, /chat, !chat, chat (first word), ? or . as first character
            if (/^[?.]|(@chat|!chat|\/chat)\b|^chat\b/i.test(content)) {
                enqueueChatReply({
                    postId: result.id,
                    userMessage: content,
                    tagName,
                    server: ws.data.server,
                });
            }
        }

        try {
            const stats = getDashboardStats();
            ws.data.server.publish("dashboard", JSON.stringify({ type: "DASHBOARD_UPDATE", ...stats }));
        } catch (error) {
            console.error("Error publishing dashboard stats:", error);
        }
    },

    close(ws: ServerWebSocket<WebSocketData>, code: number, message: string | Buffer) {
        console.log(`WebSocket closed: ${ws.remoteAddress}`);
        const prev = onlineConnectionCounts.get(ws.data.userId) ?? 1;
        if (prev <= 1) onlineConnectionCounts.delete(ws.data.userId);
        else onlineConnectionCounts.set(ws.data.userId, prev - 1);
        ws.data.server.publish("dashboard", JSON.stringify({ type: "ONLINE_UPDATE", userIds: getOnlineUserIds() }));
    },
};
