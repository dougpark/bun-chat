import { db } from "../db";
import { requireAuth } from "../middleware/auth";

export async function handleUpdateProfile(req: Request): Promise<Response> {
    const auth = await requireAuth(req);
    if (auth.error) return auth.error;
    const { session } = auth;

    try {
        const body = await req.json() as any;
        const { full_name, phone_number, physical_address, email, bio } = body;

        db.run(`
            UPDATE users 
            SET full_name = $full_name, phone_number = $phone_number, physical_address = $physical_address, email = $email, bio = $bio
            WHERE id = $id
        `, {
            $full_name: full_name,
            $phone_number: phone_number,
            $physical_address: physical_address,
            $email: email,
            $bio: bio || null,
            $id: session.user_id
        } as any);

        return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
    } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}
