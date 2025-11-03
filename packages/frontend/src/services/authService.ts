import { post } from "./apiClient";
import { useAuthStore } from "../store/useAuthStore";
import type { LoginRequest, RegisterRequest, AuthResponse } from "../types";

export const authService = {
    async login(credentials: LoginRequest): Promise<AuthResponse> {
        const data = await post('/auth/login', credentials)
        useAuthStore.getState().login(data.token, data.user)
        return data
    },
    async register(credentials: RegisterRequest): Promise<void> {
        await post('/auth/register', credentials)
    },
    logout(): void {
        useAuthStore.getState().logout()
    }
}