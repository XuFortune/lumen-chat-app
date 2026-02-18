// packages/frontend/src/services/userMemory.service.ts
import { get, put } from './apiClient';

export interface UserMemoryData {
    content: string;
    last_consolidated_at: string | null;
}

export const userMemoryService = {
    getMemory: async (): Promise<UserMemoryData> => {
        return await get<UserMemoryData>('/user-memory');
    },

    updateMemory: async (content: string): Promise<UserMemoryData> => {
        return await put<UserMemoryData>('/user-memory', { content });
    }
};
