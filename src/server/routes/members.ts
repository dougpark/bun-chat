import { db } from "../db";
import { requireAuth } from "../middleware/auth";

export async function handleGetMembers(req: Request): Promise<Response> {
    const auth = await requireAuth(req, 1);
    if (auth.error) return auth.error;

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
