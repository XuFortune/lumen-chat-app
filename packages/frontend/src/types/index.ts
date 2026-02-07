// src/types/index.ts

// ===== LLM 配置相关 =====
export type LLMProvider = 'openai' | 'gemini';

export interface LLMConfig {
    id?: string;
    provider: LLMProvider;
    model: string;
    apiKey: string;
    baseUrl?: string; // OpenAI 兼容需要
    isDefault?: boolean;
    createdAt?: string;
}

// ===== 用户相关 =====
export interface User {
    id: string;
    username: string;
    llm_configs: LLMConfig[] | null;
    created_at: string; // ISO 8601 timestamp
    updated_at: string;
}

// ===== API 请求体 =====
export interface LoginRequest {
    username: string;
    password: string;
}

export interface RegisterRequest {
    username: string;
    password: string;
}

// ===== API 响应结构（关键修改！）=====
// 所有 API 响应都遵循 { success, data, message } 格式
export interface ApiResponse<T = unknown> {
    success: boolean;
    data: T;
    message: string;
}

// 登录成功的 data 结构
export interface LoginResponseData {
    user: User;
    token: string;
}

// 注册成功的 data 结构（通常为空）
export type RegisterResponseData = null;


// 对话相关
export interface Conversation {
    id: string,
    title: string,
    updated_at: string,
    created_at?: string
}

export interface Message {
    conversation_id: string | null,
    id: string;
    role: 'user' | 'assistant';
    content: string;
    created_at?: string;
}

