// auth.test.ts
import { expect, test, describe } from "bun:test";
import { validateRegistration } from "./auth-logic.ts";

describe("User Registration Validation", () => {

    test("should reject missing email", () => {
        const result = validateRegistration({ physical_address: "123 Maple St" });
        expect(result).toBe(false);
    });

    test("should reject missing address", () => {
        const result = validateRegistration({ email: "doug@example.com", physical_address: "" });
        expect(result).toBe(false);
    });

    test("should reject short addresses", () => {
        const result = validateRegistration({ email: "doug@example.com", physical_address: "123" });
        expect(result).toBe(false);
    });

    test("should accept valid data", () => {
        const result = validateRegistration({
            email: "doug@example.com",
            physical_address: "123 Maple St"
        });
        expect(result).toBe(true);
    });
});