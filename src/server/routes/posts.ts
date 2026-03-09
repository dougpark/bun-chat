import type { Server } from "bun";
import { db } from "../db";
import { requireAuth } from "../middleware/auth";
import type { WebSocketData } from "../ws/handlers";

export async function handleReact(req: Request, match: RegExpMatchArray, server: Server<WebSocketData>): Promise<Response> {
    const postId = parseInt(match[1]!);
    const auth = await requireAuth(req);
    if (auth.error) return auth.error;
    const { session } = auth;

    try {
        const body = await req.json() as any;
        const reaction = body.reaction;

        if (reaction !== 1 && reaction !== -1) {
            return new Response(JSON.stringify({ error: "Invalid reaction value" }), { status: 400 });
        }

        db.run(
            `INSERT OR REPLACE INTO post_reactions (post_id, user_id, reaction) VALUES ($postId, $userId, $reaction)`,
            { $postId: postId, $userId: session.user_id, $reaction: reaction } as any
        );

        const counts = db.query(`
            SELECT
                COALESCE(SUM(CASE WHEN reaction = 1 THEN 1 ELSE 0 END), 0) as thumbsUp,
                COALESCE(SUM(CASE WHEN reaction = -1 THEN 1 ELSE 0 END), 0) as thumbsDown
            FROM post_reactions
            WHERE post_id = $postId
        `).get({ $postId: postId }) as { thumbsUp: number, thumbsDown: number };

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

export async function handleGetReactions(req: Request, match: RegExpMatchArray): Promise<Response> {
    const postId = parseInt(match[1]!);
    const auth = await requireAuth(req);
    if (auth.error) return auth.error;

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

export async function handleSupersede(req: Request, match: RegExpMatchArray, server: Server<WebSocketData>): Promise<Response> {
    const oldPostId = parseInt(match[1]!);
    const auth = await requireAuth(req);
    if (auth.error) return auth.error;
    const { session } = auth;

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

        const tag = db.query("SELECT id FROM tags WHERE name = $name")
            .get({ $name: originalPost.tagName }) as { id: number };

        const newResult = db.query(`
            INSERT INTO posts (tag_id, user_id, content)
            VALUES ($tagId, $userId, $content)
            RETURNING id, timestamp as created_at
        `).get({ $tagId: tag.id, $userId: session.user_id, $content: content.trim() }) as { id: number, created_at: string };

        db.run("UPDATE posts SET superseded_by = $newId WHERE id = $oldId",
            { $newId: newResult.id, $oldId: oldPostId } as any);

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

        server.publish(originalPost.tagName, JSON.stringify({ type: "newPost", post: newPost }));
        server.publish(originalPost.tagName, JSON.stringify({ type: "postSuperseded", oldPostId, newPostId: newResult.id }));
        server.publish("postUpdate", JSON.stringify({ type: "postUpdate", tag: originalPost.tagName }));

        return new Response(JSON.stringify({ success: true, newPostId: newResult.id }), {
            headers: { "Content-Type": "application/json" }
        });
    } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}
