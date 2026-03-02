// auth-logic.ts
export function validateRegistration(data: any) {
    if (!data.email || !data.email.includes('@')) return false;
    if (!data.physical_address || data.physical_address.length < 5) return false;
    return true;
}