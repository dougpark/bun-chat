import type { Server } from "bun";
import { db } from "../db";
import { requireAuth } from "../middleware/auth";
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import type { WebSocketData } from "../ws/handlers";

const PROJECT_ROOT = join(import.meta.dir, "../../../");
export const UPLOADS_ORIGINALS = join(PROJECT_ROOT, "data/uploads/originals");
export const UPLOADS_THUMBS = join(PROJECT_ROOT, "data/uploads/thumbs");

// Ensure upload directories exist at module load time
await mkdir(UPLOADS_ORIGINALS, { recursive: true });
await mkdir(UPLOADS_THUMBS, { recursive: true });

export async function handleUpload(req: Request, server: Server<WebSocketData>): Promise<Response> {
    const url = new URL(req.url);
    const auth = await requireAuth(req);
    if (auth.error) return auth.error;
    const { session } = auth;

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

        const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/heic"];
        if (!allowedTypes.includes(uploadedFile.type)) {
            return new Response(JSON.stringify({ error: "Unsupported image type" }), { status: 400, headers: { "Content-Type": "application/json" } });
        }

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

        await Bun.write(originalPath, buffer);

        // .rotate() reads EXIF orientation and physically rotates pixels — fixes sideways iPhone photos
        await sharp(buffer)
            .rotate()
            .resize({ width: 400, withoutEnlargement: true })
            .webp({ quality: 80 })
            .toFile(thumbPath);

        const caption = (formData.get("caption") as string | null)?.trim() ?? "";

        const newPost = db.query(`
            INSERT INTO posts (tag_id, user_id, content, type, file_path, thumb_path)
            VALUES ($tag_id, $user_id, $content, 'image', $file_path, $thumb_path)
            RETURNING id, timestamp
        `).get({
            $tag_id: tag.id,
            $user_id: session.user_id,
            $content: caption,
            $file_path: originalPath,
            $thumb_path: thumbPath,
        }) as { id: number, timestamp: string };

        const message = {
            id: newPost.id,
            type: "image",
            content: caption,
            thumbUrl: `/api/download/thumbs/${thumbName}`,
            fullUrl: `/api/download/originals/${originalName}`,
            sender: session.full_name,
            userId: session.user_id,
            userName: session.full_name,
            tagName: zoneTag,
            timestamp: newPost.timestamp,
        };

        server.publish(zoneTag, JSON.stringify({ type: "NEW_MESSAGE", zoneId: tag.id, message }));

        return new Response(JSON.stringify({ success: true, message }), {
            headers: { "Content-Type": "application/json" },
        });
    } catch (e: any) {
        console.error("Upload error:", e);
        return new Response(JSON.stringify({ error: "Upload failed" }), { status: 500, headers: { "Content-Type": "application/json" } });
    }
}

export async function handleDownload(req: Request, match: RegExpMatchArray): Promise<Response> {
    const auth = await requireAuth(req);
    if (auth.error) return new Response("Unauthorized", { status: 401 });

    const typeDir = match[1]!;
    const filename = match[2]!;
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
