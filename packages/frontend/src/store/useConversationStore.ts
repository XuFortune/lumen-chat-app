// packages/frontend/src/store/useConversationStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Message, Conversation } from '@/types';

interface ConversationState {
    currentConversationId: string | null;
    conversations: Conversation[];
    messages: Record<string, Message[]>; // 按conversation_id分组存储
    streamingMessageId: string | null;

    // 方法
    setCurrentConversationId: (id: string | null) => void;
    setConversations: (convs: Conversation[]) => void;
    setMessages: (convId: string, msgs: Message[]) => void;
    addMessage: (convId: string | null, msg: Message) => void;
    updateMessageId: (oldId: string, newId: string) => void;
    setStreamingMessage: (id: string | null) => void;
    updateStreamingMessage: (chunk: string) => void;
    deleteConversation: (convId: string) => void;
    renameConversation: (convId: string, newTitle: string) => void;
}

export const useConversationStore = create<ConversationState>()(
    persist(
        (set, get) => ({
            currentConversationId: null,
            conversations: [],
            messages: {},
            streamingMessageId: null,

            setCurrentConversationId: (id) => set({ currentConversationId: id }),

            setConversations: (convs) => set({ conversations: convs }),

            setMessages: (convId, msgs) => set((state) => ({
                messages: { ...state.messages, [convId]: msgs }
            })),

            addMessage: (convId, msg) => {
                const targetId = convId || get().currentConversationId;
                if (!targetId) return; // 没有会话上下文时不添加

                set((state) => {
                    const existing = state.messages[targetId] || [];
                    return {
                        messages: {
                            ...state.messages,
                            [targetId]: [...existing, msg]
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
                            [currentConversationId]: convMessages.map(msg =>
                                msg.id === streamingMessageId
                                    ? { ...msg, content: msg.content + chunk }
                                    : msg
                            )
                        }
                    };
                });
            },

            deleteConversation: (convId) => set((state) => {
                const newMessages = { ...state.messages };
                delete newMessages[convId];

                return {
                    conversations: state.conversations.filter(c => c.id !== convId),
                    messages: newMessages,
                    currentConversationId: state.currentConversationId === convId
                        ? null
                        : state.currentConversationId
                };
            }),

            renameConversation: (convId, newTitle) => set((state) => ({
                conversations: state.conversations.map(c =>
                    c.id === convId ? { ...c, title: newTitle } : c
                )
            })),
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
            }
        }),
        {
            name: 'lumen-conversation',
            partialize: (state) => ({
                currentConversationId: state.currentConversationId,
                conversations: state.conversations,
                messages: state.messages
            })
        }
    )
);
