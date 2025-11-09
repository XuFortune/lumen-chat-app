import { create } from 'zustand';

interface ConversationStore {
    currentConversationId: string | null;
    setCurrentConversationId: (id: string | null) => void;
}

export const useConversationStore = create<ConversationStore>((set) => ({
    currentConversationId: null,
    setCurrentConversationId: (id) => set({ currentConversationId: id }),
}));
