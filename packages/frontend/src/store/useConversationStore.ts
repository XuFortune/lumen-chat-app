// packages/frontend/src/store/useConversationStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useAuthStore } from './useAuthStore';
import { conversationService } from '@/services/conversationService';
import type { Message, Conversation } from '@/types';

interface ConversationState {
    // 状态
    currentConversationId: string | null;
    conversations: Conversation[];
    messages: Record<string, Message[]>;
    streamingMessageId: string | null;
    isLoadingConversations: boolean;

    // 核心 Actions
    setCurrentConversationId: (id: string | null) => void;
    setMessages: (convId: string, msgs: Message[]) => void;
    addMessage: (convId: string | null, msg: Message) => void;
    updateMessageId: (oldId: string, newId: string) => void;
    setStreamingMessage: (id: string | null) => void;
    updateStreamingMessage: (chunk: string) => void;
    renameConversation: (convId: string, newTitle: string) => void;

    // 异步 Actions（完整业务封装）
    loadConversations: () => Promise<void>;
    removeConversation: (convId: string) => Promise<void>;
}

export const useConversationStore = create<ConversationState>()(
    persist(
        (set, get) => ({
            // 初始状态
            currentConversationId: null,
            conversations: [],
            messages: {},
            streamingMessageId: null,
            isLoadingConversations: false,

            // 基础状态设置
            setCurrentConversationId: (id) => set({ currentConversationId: id }),

            setMessages: (convId, msgs) =>
                set((state) => ({
                    messages: { ...state.messages, [convId]: msgs },
                })),

            addMessage: (convId, msg) => {
                const targetId = convId || get().currentConversationId;
                if (!targetId) return;

                set((state) => {
                    const existing = state.messages[targetId] || [];
                    return {
                        messages: {
                            ...state.messages,
                            [targetId]: [...existing, msg],
                        },
                    };
                });
            },
            updateMessageId: (oldId, newId) => {
                const { currentConversationId } = get();
                if (!currentConversationId) return;

                set((state) => {
                    const convMessages = state.messages[currentConversationId] || [];
                    return {
                        messages: {
                            ...state.messages,
                            [currentConversationId]: convMessages.map(msg =>
                                msg.id === oldId ? { ...msg, id: newId } : msg
                            )
                        }
                    };
                });
            },
            setStreamingMessage: (id) => set({ streamingMessageId: id }),

            updateStreamingMessage: (chunk) => {
                const { streamingMessageId, currentConversationId } = get();
                if (!streamingMessageId || !currentConversationId) return;

                set((state) => {
                    const convMessages = state.messages[currentConversationId] || [];
                    return {
                        messages: {
                            ...state.messages,
                            [currentConversationId]: convMessages.map((msg) =>
                                msg.id === streamingMessageId
                                    ? { ...msg, content: msg.content + chunk }
                                    : msg
                            ),
                        },
                    };
                });
            },

            renameConversation: (convId, newTitle) =>
                set((state) => ({
                    conversations: state.conversations.map((c) =>
                        c.id === convId ? { ...c, title: newTitle } : c
                    ),
                })),

            // 异步 Action：加载会话列表
            loadConversations: async () => {
                const { token } = useAuthStore.getState();
                if (!token) {
                    set({ isLoadingConversations: false });
                    return;
                }

                set({ isLoadingConversations: true });
                try {
                    const data = await conversationService.getConversations();
                    set({ conversations: data });

                    // 自动选中第一个会话（如果当前没有选中）
                    const { currentConversationId } = get();
                    if (data.length > 0 && !currentConversationId) {
                        set({ currentConversationId: data[0].id });
                    }
                } catch (error) {
                    console.error('Failed to load conversations:', error);
                    // 可以在这里添加 toast 通知
                    throw error;
                } finally {
                    set({ isLoadingConversations: false });
                }
            },

            // 异步 Action：删除会话（完整流程 - 内联状态更新）
            removeConversation: async (convId: string) => {
                try {
                    await conversationService.deleteConversation(convId);

                    // 直接更新状态（不再需要私有方法）
                    set((state) => {
                        const newMessages = { ...state.messages };
                        delete newMessages[convId];
                        const remainingConvs = state.conversations.filter((c) => c.id !== convId);
                        const newCurrentId =
                            state.currentConversationId === convId
                                ? remainingConvs[0]?.id || null
                                : state.currentConversationId;
                        return {
                            conversations: remainingConvs,
                            messages: newMessages,
                            currentConversationId: newCurrentId,
                        };
                    });
                } catch (error) {
                    console.error('删除会话失败:', error);
                    throw error;
                }
            },
        }),
        {
            name: 'lumen-conversation',
            partialize: (state) => ({
                currentConversationId: state.currentConversationId,
                conversations: state.conversations,
                messages: state.messages,
            }),
        }
    )
);
