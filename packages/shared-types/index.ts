// packages/shared-types/index.ts
export interface AiMessage {
    role: 'user' | 'assistant';
    content: string;
}

export interface AiConfig {
    provider: 'openai' | 'google';
    model: string;
    apiKey: string;
    baseUrl?: string;
}

export interface AiStreamRequest {
    history: AiMessage[];
    currentMessage: string;
    config: AiConfig;
}

export interface AiStreamResponse {
    chunk?: string;
    event?: 'end';
}
