export interface AiMessage {
    role: 'user' | 'assistant' | 'system' | 'tool';
    content: string;
    tool_call_id?: string;
    name?: string; // for tool messages
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

// Tool Definitions
export interface ToolDefinition {
    name: string;
    label: string;
    description: string;
    parameters: Record<string, any>; // JSON Schema
}

export interface ToolResult {
    content: string;
    display?: string; // For frontend visualization
    isError?: boolean;
}

// SSE Events
export interface AiStreamStartEvent {
    event: 'start';
    conversation_id: string;
    user_message_id: string;
}

export interface AiStreamEndEvent {
    event: 'end';
    conversation_id: string;
    message_id: string;
}

export interface AiStreamChunkEvent {
    chunk: string;
}

export interface AiStreamErrorEvent {
    event: 'error';
    message: string;
}

export interface AiStreamTurnStartEvent {
    event: 'turn_start';
    turn: number;
}

export interface AiStreamToolCallEvent {
    event: 'tool_call';
    tool_name: string;
    tool_args: Record<string, any>;
    tool_call_id: string;
}

export interface AiStreamToolResultEvent {
    event: 'tool_result';
    tool_name: string;
    tool_call_id: string;
    result: string;
    is_error: boolean;
}

export interface AiStreamAgentCompleteEvent {
    event: 'agent_complete';
    total_turns: number;
}

export type AiStreamResponse =
    | AiStreamStartEvent
    | AiStreamEndEvent
    | AiStreamChunkEvent
    | AiStreamErrorEvent
    | AiStreamTurnStartEvent
    | AiStreamToolCallEvent
    | AiStreamToolResultEvent
    | AiStreamAgentCompleteEvent;
