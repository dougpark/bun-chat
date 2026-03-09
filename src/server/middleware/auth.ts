import { db } from "../db";

const SESSION_SECRET = process.env.SESSION_SECRET || "super-secret-key-change-me";

export async function signValue(value: string): Promise<string> {
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

export async function verifySignature(value: string, signature: string): Promise<boolean> {
    const expectedSig = await signValue(value);
    return expectedSig === signature;
}

export function getCookies(req: Request): Record<string, string> {
    const cookieHeader = req.headers.get("Cookie");
    if (!cookieHeader) return {};
    const cookies: Record<string, string> = {};
    cookieHeader.split(";").forEach(c => {
        const [key, ...v] = c.split("=");
        if (key) cookies[key.trim()] = v.join("=").trim();
    });
    return cookies;
}

export interface AuthSession {
    user_id: number;
    user_level: number;
    full_name?: string;
}

/**
 * Validates the session cookie and returns the session row on success.
 * Returns null (and optionally sets a 401 response) if auth fails.
 * Pass minLevel to also enforce a minimum user_level.
 */
export async function requireAuth(
    req: Request,
    minLevel = 0
): Promise<{ session: AuthSession; error?: never } | { session?: never; error: Response }> {
    const cookies = getCookies(req);
    const sessionId = cookies["session_id"];
    const sessionSig = cookies["session_id_sig"];

    if (!sessionId || !sessionSig || !(await verifySignature(sessionId, sessionSig))) {
        return { error: new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } }) };
    }

    const session = db.query(`
        SELECT s.user_id, u.user_level, u.full_name
        FROM sessions s
        JOIN users u ON s.user_id = u.id
        WHERE s.id = $id AND s.expires_at > CURRENT_TIMESTAMP
    `).get({ $id: sessionId }) as AuthSession | null;

    if (!session) {
        return { error: new Response(JSON.stringify({ error: "Session expired" }), { status: 401, headers: { "Content-Type": "application/json" } }) };
    }

    if ((session.user_level ?? 0) < minLevel) {
        return { error: new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { "Content-Type": "application/json" } }) };
    }

    return { session };
}
