// packages/frontend/src/store/useConversationStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useAuthStore } from "./useAuthStore";
import { conversationService } from "@/services/conversationService";
import type { Message, Conversation } from "@/types";

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
  updateMessageConversationId: (oldConvId: string, newConvId: string) => void;
  setStreamingMessage: (id: string | null) => void;
  updateStreamingMessage: (chunk: string) => void;
  renameConversation: (convId: string, newTitle: string) => void;
  addNewConversation: (initialMessages?: Message[]) => void;
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
              [currentConversationId]: convMessages.map((msg) =>
                msg.id === oldId ? { ...msg, id: newId } : msg
              ),
            },
          };
        });
      },
      updateMessageConversationId: (oldConvId, newConvId) =>
        set((state) => {
          // 遍历 messages 对象的每个会话
          const updatedMessages = { ...state.messages };
          if (!updatedMessages[oldConvId]) return state;

          // 找到 oldConvId 下的所有消息，更新它们的 conversation_id
          updatedMessages[newConvId] = (updatedMessages[oldConvId] || []).map(
            (msg) => ({
              ...msg,
              conversation_id: newConvId,
            })
          );

          // 删除旧的 temp 会话（可选）
        //   delete updatedMessages[oldConvId];

          return {
            messages: updatedMessages,
            currentConversationId: newConvId, // 自动切换到新会话
          };
        }),

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
      addNewConversation: (initialMessages = []) => {
        const tempId = "temp"; // 也可以用 crypto.randomUUID()，但保持 'temp' 便于调试
        const now = new Date().toISOString();
        // 创建一个空的对话元信息（用于侧边栏显示）
        const newConversation: Conversation = {
          id: tempId,
          title: "新对话",
          updated_at: now,
        };
        // 设置当前会话
        set({ currentConversationId: tempId });
        // 更新会话列表（本地）
        set((state) => ({
          conversations: [newConversation, ...state.conversations],
        }));
        // 初始化消息
        set((state) => ({
          messages: {
            ...state.messages,
            [tempId]: initialMessages.map((msg) => ({
              ...msg,
              conversation_id: tempId, // 强制绑定到新会话
              created_at: msg.created_at || now,
            })),
          },
        }));
      },
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
          console.error("Failed to load conversations:", error);
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
            const remainingConvs = state.conversations.filter(
              (c) => c.id !== convId
            );
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
          console.error("删除会话失败:", error);
          throw error;
        }
      },
    }),
    {
      name: "lumen-conversation",
      partialize: (state) => ({
        currentConversationId: state.currentConversationId,
        conversations: state.conversations,
        messages: state.messages,
      }),
    }
  )
);
