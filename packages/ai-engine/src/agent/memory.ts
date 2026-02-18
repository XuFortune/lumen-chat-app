// packages/ai-engine/src/agent/memory.ts
import { AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";

export interface ConsolidationResult {
    memory_update?: string;
    history_entry?: string;
}

export class MemoryManager {
    // 阈值：当历史消息超过 20 条时触发压缩
    private readonly WINDOW_SIZE = 20;

    /**
     * Check if consolidation is needed based on history length
     */
    shouldConsolidate(historyLength: number): boolean {
        return historyLength >= this.WINDOW_SIZE;
    }

    /**
     * Consolidate memory: Summarize old messages and update long-term memory
     */
    async consolidate(
        fullHistory: any[],
        currentLongTermMemory: string,
        llm: any
    ): Promise<ConsolidationResult> {
        // 1. Slice the oldest 10 messages (or half of the window) to summarize
        // We keep the recent messages to ensure continuity
        const messagesToSummarize = fullHistory.slice(0, 10);

        if (messagesToSummarize.length === 0) return {};

        const conversationText = messagesToSummarize
            .map((m) => `[${m.role}]: ${m.content}`)
            .join("\n");

        // 2. Construct the prompt
        // We ask the LLM to do two things:
        // A. Extract key facts to update the User Profile (Long-term memory)
        // B. Write a concise summary of this conversation segment (Archived history)
        const prompt = `
You are a memory consolidation expert.
Your task is to process a segment of conversation history and output a JSON object.

## Current User Profile (Long-term Memory)
${currentLongTermMemory || "(Empty)"}

## Conversation Segment to Process
${conversationText}

## Instructions
1. **User Profile Update**: Extract any new *permanent* facts about the user (e.g., name, preferences, job, core beliefs) from the conversation. specific details of this chat. Merge them with the "Current User Profile". If no new facts, keep it as is.
2. **Conversation Summary**: Write a concise specific summary of this conversation segment. This will be stored as a log.

## Output Format (JSON Only)
{
  "memory_update": "Updated text of the user profile...",
  "history_entry": "Concise summary of this segment...",
}

Respond with ONLY valid JSON. Do not use markdown blocks.
`;

        try {
            // 3. Call LLM
            const response = await llm.invoke([
                new SystemMessage("You are a helpful assistant that outputs JSON."),
                new HumanMessage(prompt),
            ]);

            const content = typeof response.content === "string" ? response.content : "";
            const jsonStr = content.replace(/```json|```/g, "").trim(); // Simple cleanup

            const result = JSON.parse(jsonStr);

            return {
                memory_update: result.memory_update,
                history_entry: result.history_entry,
            };
        } catch (error) {
            console.error("Memory consolidation failed:", error);
            return {}; // Fail gracefully, don't crash
        }
    }
}

export const memoryManager = new MemoryManager();
