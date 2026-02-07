import { post, put } from "./apiClient";
import { useAuthStore } from "../store/useAuthStore";
import type { LoginRequest, RegisterRequest, LoginResponseData, User } from "../types";

export const authService = {
    async login(credentials: LoginRequest): Promise<LoginResponseData> {
        const data = await post<LoginResponseData>('/auth/login', credentials)
        useAuthStore.getState().login(data.token, data.user)
        return data
    },
    async register(credentials: RegisterRequest): Promise<void> {
        await post('/auth/register', credentials)
    },
    logout(): void {
        useAuthStore.getState().logout()
    },
    async updateLLMConfigs(llmConfigs: any[]): Promise<User> {
        const data = await put<User>('/user/llm-configs', { llm_configs: llmConfigs })
        // 更新 store 中的用户信息
        const token = useAuthStore.getState().token
        if (token) {
            useAuthStore.getState().login(token, data)
        }
        return data
    }
}