import { useAuthStore } from "../store/useAuthStore";
import type { ApiResponse } from "../types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1'

// src/services/apiClient.ts (修改 apiClient 函数)

const apiClient = async (endpoint: string, options: RequestInit = {}) => {
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

        // 1. 先解析 JSON（不管成功失败）
        const result: ApiResponse = await response.json();

        // 2. 检查 HTTP 状态码（网络层错误）
        if (!response.ok) {
            // 例如 5xx 服务器错误
            throw new Error(result.message || `HTTP ${response.status}`);
        }

        // 3. 检查业务逻辑成功标志（PRD 要求的统一格式）
        if (!result.success) {
            // 例如 400 用户名已存在, 401 密码错误
            throw new Error(result.message);
        }

        // 4. 返回真正的 data（剥离外层包装）
        return result.data;

    } catch (error) {
        console.error('API Error:', error);
        throw error; // 保持抛出 Error 对象
    }
};


export const get = (endpoint: string) => apiClient(endpoint, { method: 'GET' },)
export const post = (endpoint: string, data: any) => apiClient(endpoint, { method: 'POST', body: JSON.stringify(data) })
export const del = (endpoint: string) => apiClient(endpoint, { method: 'DELETE' },)