import { db } from "../db";
import { getCookies, signValue, verifySignature } from "../middleware/auth";

export async function handleRegister(req: Request): Promise<Response> {
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
            $user_level: 3 // Default user level - change to 0 for production
        }) as { id: number };

        const sessionId = crypto.randomUUID();
        const expiresAt = new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000).toISOString();

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

        return new Response(JSON.stringify({ success: true, userId: result.id }), { headers });
    } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}

export async function handleLogin(req: Request): Promise<Response> {
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

        const sessionId = crypto.randomUUID();
        const expiresAt = new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000).toISOString();

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

        return new Response(JSON.stringify({ success: true }), { headers });
    } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}

export function handleLogout(req: Request): Response {
    const cookies = getCookies(req);
    const sessionId = cookies["session_id"];
    if (sessionId) {
        try { db.run("DELETE FROM sessions WHERE id = $id", { $id: sessionId } as any); } catch (_) { }
    }
    const headers = new Headers({ "Content-Type": "application/json" });
    headers.append("Set-Cookie", "session_id=; Path=/; Max-Age=0; HttpOnly; SameSite=Strict");
    headers.append("Set-Cookie", "session_id_sig=; Path=/; Max-Age=0; HttpOnly; SameSite=Strict");
    return new Response(JSON.stringify({ ok: true }), { headers });
}

export async function handleMe(req: Request): Promise<Response> {
    const cookies = getCookies(req);
    const sessionId = cookies["session_id"];
    const sessionSig = cookies["session_id_sig"];

    if (!sessionId || !sessionSig || !(await verifySignature(sessionId, sessionSig))) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const session = db.query("SELECT user_id FROM sessions WHERE id = $id AND expires_at > CURRENT_TIMESTAMP")
        .get({ $id: sessionId }) as { user_id: number } | null;
    if (!session) return new Response(JSON.stringify({ error: "Session expired" }), { status: 401 });

    const user = db.query("SELECT id, full_name, email, phone_number, physical_address, user_level, bio FROM users WHERE id = $id")
        .get({ $id: session.user_id });
    return new Response(JSON.stringify(user), { headers: { "Content-Type": "application/json" } });
}
