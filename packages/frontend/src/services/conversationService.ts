import { del, get } from "./apiClient";
import type { Conversation, Message } from "@/types";

// 获取对话列表
export const getConversations = async (): Promise<Conversation[]> => {
    const data = await get('/conversations')
    return data as Conversation[]
}

// 获取指定对话的所有消息历史
export const getConversationMessages = async (conversationId: string): Promise<Message[]> => {
    const data = await get(`/conversations/${conversationId}/messages`)
    return data as Message[]
}

export const deleteConversation = async (conversationId: string) => {
    const data = await del(`/conversations/${conversationId}`)
    return data
}