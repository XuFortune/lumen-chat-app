// src/services/apiClient.ts
import { useAuthStore } from "../store/useAuthStore";
import type { ApiResponse } from "../types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1'

const apiClient = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = useAuthStore.getState().token;

    const headers = {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
    };
    const config: RequestInit = { ...options, headers };
    try {
        const response = await fetch(url, config);
        const result: ApiResponse = await response.json();
        if (!response.ok) {
            throw new Error(result.message || `HTTP ${response.status}`);
        }
        if (!result.success) {
            throw new Error(result.message);
        }
        return result.data as T; // 类型断言
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
};
// 2. 让导出的方法也支持泛型
export const get = <T>(endpoint: string): Promise<T> =>
    apiClient<T>(endpoint, { method: 'GET' });
export const post = <T>(endpoint: string, data?: any): Promise<T> =>
    apiClient<T>(endpoint, { method: 'POST', body: JSON.stringify(data) });
export const put = <T>(endpoint: string, data?: any): Promise<T> =>
    apiClient<T>(endpoint, { method: 'PUT', body: JSON.stringify(data) });
export const del = <T>(endpoint: string): Promise<T> =>
    apiClient<T>(endpoint, { method: 'DELETE' });
export const patch = <T>(endpoint: string, data?: any): Promise<T> =>
    apiClient<T>(endpoint, { method: 'PATCH', body: JSON.stringify(data) });