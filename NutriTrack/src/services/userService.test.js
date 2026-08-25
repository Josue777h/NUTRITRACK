import { describe, expect, it, vi, beforeEach } from "vitest";
import { userService } from "./userService";

// Mock de Supabase
const { mockSupabase } = vi.hoisted(() => ({
    mockSupabase: {
        auth: {
            signInWithPassword: vi.fn(),
            signUp: vi.fn(),
            signOut: vi.fn(),
            updateUser: vi.fn(),
            resetPasswordForEmail: vi.fn()
        },
        from: vi.fn()
    }
}));

vi.mock("./supabaseClient", () => ({
    supabase: mockSupabase,
    isSupabaseConfigured: true
}));

describe("userService", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("getProfile", () => {
        it("debería obtener el perfil de usuario correctamente", async () => {
            const mockProfile = { id: "123", role: "nutriologo", full_name: "Dr. Test" };
            mockSupabase.from.mockReturnValue({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        single: vi.fn().mockResolvedValue({ data: mockProfile, error: null })
                    })
                })
            });

            const result = await userService.getProfile("123");
            expect(result).toEqual(mockProfile);
        });

        it("debería lanzar error cuando falla la obtención del perfil", async () => {
            const mockError = new Error("Profile not found");
            mockSupabase.from.mockReturnValue({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        single: vi.fn().mockResolvedValue({ data: null, error: mockError })
                    })
                })
            });

            await expect(userService.getProfile("123")).rejects.toThrow("Profile not found");
        });
    });

    describe("updateProfile", () => {
        it("debería actualizar el perfil correctamente", async () => {
            const mockProfile = { full_name: "Dr. Updated", phone: "123456" };
            mockSupabase.from.mockReturnValue({
                update: vi.fn().mockReturnValue({
                    eq: vi.fn().mockResolvedValue({ data: mockProfile, error: null })
                })
            });

            const result = await userService.updateProfile("123", mockProfile);
            expect(result).toEqual(mockProfile);
        });
    });

    describe("signIn", () => {
        it("debería iniciar sesión correctamente", async () => {
            const mockData = { user: { id: "123", email: "test@example.com" } };
            mockSupabase.auth.signInWithPassword.mockResolvedValue({ data: mockData, error: null });

            const result = await userService.signIn("test@example.com", "password");
            expect(result).toEqual(mockData);
            expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
                email: "test@example.com",
                password: "password"
            });
        });

        it("debería lanzar error cuando falla el inicio de sesión", async () => {
            const mockError = new Error("Invalid credentials");
            mockSupabase.auth.signInWithPassword.mockResolvedValue({ data: null, error: mockError });

            await expect(userService.signIn("test@example.com", "wrong")).rejects.toThrow("Invalid credentials");
        });
    });

    describe("signUp", () => {
        it("debería registrar usuario correctamente", async () => {
            const mockData = { user: { id: "123", email: "new@example.com" } };
            mockSupabase.auth.signUp.mockResolvedValue({ data: mockData, error: null });

            const result = await userService.signUp("new@example.com", "password", "usuario", "New User");
            expect(result).toEqual(mockData);
            expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
                email: "new@example.com",
                password: "password",
                options: {
                    data: {
                        role: "usuario",
                        full_name: "New User"
                    }
                }
            });
        });
    });

    describe("signOut", () => {
        it("debería cerrar sesión correctamente", async () => {
            mockSupabase.auth.signOut.mockResolvedValue({ error: null });

            await expect(userService.signOut()).resolves.not.toThrow();
            expect(mockSupabase.auth.signOut).toHaveBeenCalled();
        });
    });

    describe("updatePassword", () => {
        it("debería actualizar contraseña correctamente", async () => {
            const mockData = { user: { id: "123" } };
            mockSupabase.auth.updateUser.mockResolvedValue({ data: mockData, error: null });

            const result = await userService.updatePassword("newpassword");
            expect(result).toEqual(mockData);
            expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({ password: "newpassword" });
        });
    });

    describe("resetPassword", () => {
        it("debería enviar email de reset correctamente", async () => {
            const mockData = { success: true };
            mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({ data: mockData, error: null });

            const result = await userService.resetPassword("test@example.com");
            expect(result).toEqual(mockData);
            expect(mockSupabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
                "test@example.com",
                expect.objectContaining({
                    redirectTo: expect.stringContaining("/perfil")
                })
            );
        });
    });
});