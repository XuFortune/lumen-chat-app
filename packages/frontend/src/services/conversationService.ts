import { fetchEventSource } from '@microsoft/fetch-event-source';
import { get, del, patch, post } from './apiClient';
import type { Conversation, Message } from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1'

export interface ChatStreamRequest {
    conversation_id: string | null
    history: Message[];
    currentMessage: string;
    config: {
        model: string;
        apiKey: string;
        baseUrl?: string;
    };
    ephemeral?: boolean;
}

export interface ChatStreamResponse {
    chunk?: string;
    event?: 'start' | 'end' | 'error';
    conversation_id?: string;
    user_message_id?: string;      // ✅ start 事件返回
    message_id?: string;     // ✅ end 事件返回（assistant_message_id）
    message?: string;               // error 事件返回
}
// 回调函数类型
export type OnStartCallback = (data: {
    conversation_id?: string;
    user_message_id?: string
}) => void;

export type OnEndCallback = (data: {
    conversation_id?: string;
    message_id?: string | null
}) => void;

export type OnChunkCallback = (chunk: string) => void;

export type OnErrorCallback = (error: Error) => void;

class FatalError extends Error {
    statusCode?: number;

    constructor(message: string, statusCode?: number) {
        super(message);
        this.name = 'FatalError';
        this.statusCode = statusCode;
    }
}

export const conversationService = {
    async createNewConversation(body: any): Promise<any> {
        return post('/chat/new', body)
    },
    // 获取对话列表
    async getConversations(): Promise<Conversation[]> {
        return get<Conversation[]>('/conversations');
    },
    // 获取对话具体消息
    async getConversationMessages(conversationId: string): Promise<Message[]> {
        return get<Message[]>(`/conversations/${conversationId}/messages`);
    },
    // 删除对话
    async deleteConversation(conversationId: string): Promise<void> {
        return del<void>(`/conversations/${conversationId}`);
    },
    // 重命名对话标题
    async renameConversation(conversationId: string, title: string): Promise<Conversation> {
        return patch<Conversation>(`/conversations/${conversationId}`, { title });
    },
    // 流式
    async postChatStream(
        request: ChatStreamRequest,
        onChunk: OnChunkCallback,
        onStart: OnStartCallback,
        onEnd: OnEndCallback,
        onToolCall: (data: any) => void,
        onToolResult: (data: any) => void,
        onError: OnErrorCallback,
        token: string
    ): Promise<void> {
        await fetchEventSource(`${API_BASE_URL}/ai/stream`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(request),

            onmessage(event) {
                try {
                    const data = JSON.parse(event.data);

                    switch (data.event) {
                        case 'start':
                            onStart({
                                conversation_id: data.conversation_id,
                                user_message_id: data.user_message_id
                            });
                            break;
                        case 'end':
                            onEnd({
                                conversation_id: data.conversation_id,
                                message_id: data.message_id
                            });
                            break;
                        case 'chunk':
                            // explicitly handle chunk event if sent this way
                            if (data.chunk) onChunk(data.chunk);
                            break;
                        // New Agent Events
                        case 'turn_start':
                            // optionally handle turn start
                            break;
                        case 'tool_call':
                            // Handle tool call - likely need a new callback
                            onToolCall?.(data);
                            break;
                        case 'tool_result':
                            // Handle tool result - likely need a new callback
                            onToolResult?.(data);
                            break;
                        default:
                            // Fallback for implicit chunk (original behavior)
                            if (data.chunk) {
                                onChunk(data.chunk);
                            }
                            break;
                    }
                } catch (error) {
                    console.error('Failed to parse SSE data:', error);
                }
            },

            onerror(error) {
                if (error instanceof Error) {
                    if (error.message.includes('401')) {
                        onError(new FatalError('认证失败，请重新登录', 401));
                        throw error;
                    }
                    if (error.message.includes('403')) {
                        onError(new FatalError('API Key无效', 403));
                        throw error;
                    }
                }
                onError(error instanceof Error ? error : new Error('未知错误'));
            },

            onclose() {
                // 连接正常关闭
            }
        });
    }
};
