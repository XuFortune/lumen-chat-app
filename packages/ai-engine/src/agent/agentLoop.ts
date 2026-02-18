
import {
    HumanMessage,
    AIMessage,
    SystemMessage,
    ToolMessage,
    BaseMessage
} from "@langchain/core/messages";
import { toolRegistry } from "../tools";
import type { AiStreamResponse } from "shared-types";

// Maximum number of reasoning turns to prevent infinite loops
const MAX_TURNS = 10;

// System prompt injected at the beginning
const BASE_SYSTEM_PROMPT = `你是 Lumen AI Assistant，一个具备自主工具调用能力的智能助手。
当用户的问题需要外部信息、数学计算或特定功能时，你应该主动使用工具获取信息，然后基于工具返回的结果给出准确回答。
如果不需要工具，直接回答即可。
**请用中文回答用户的问题。**`;

import { memoryManager } from "./memory";

type SSEWriter = (data: AiStreamResponse) => void;

/**
 * Converts simple message history to LangChain BaseMessage array
 */
function convertHistory(history: Array<{ role: string; content: string }>): BaseMessage[] {
    return history.map(msg => {
        if (msg.role === 'user') return new HumanMessage(msg.content);
        if (msg.role === 'assistant') return new AIMessage(msg.content);
        if (msg.role === 'system') return new SystemMessage(msg.content);
        return new HumanMessage(msg.content); // Fallback
    });
}

/**
 * The Agent Loop
 * Executes the reasoning loop: Model -> Tool -> Model -> ... -> Final Answer
 */
export async function agentLoop(
    llm: any, // Typed as any to support bindTools flexibility across providers
    history: Array<{ role: string; content: string }>,
    currentMessage: string,
    writeSse: SSEWriter,
    longTermMemory?: string // [NEW] Accept long-term memory
): Promise<string> {

    // 1. Prepare initial messages
    // Inject long-term memory into System Prompt if available
    let systemPrompt = BASE_SYSTEM_PROMPT;
    if (longTermMemory) {
        systemPrompt += `\n\n## Long-term Memory\n${longTermMemory}`;
    }

    const messages: BaseMessage[] = [new SystemMessage(systemPrompt)];
    messages.push(...convertHistory(history));
    messages.push(new HumanMessage(currentMessage));

    // 2. Bind tools to LLM
    const tools = toolRegistry.getAllDefinitions().map(t => ({
        type: "function" as const,
        function: {
            name: t.name,
            description: t.description,
            parameters: t.parameters,
        },
    }));

    const llmWithTools = tools.length > 0 ? llm.bindTools(tools) : llm;
    let fullResponse = "";

    console.log(`[AgentLoop] Starting loop with ${tools.length} tools available.`);

    // 3. Main Loop
    for (let turn = 0; turn < MAX_TURNS; turn++) {
        writeSse({ event: "turn_start", turn: turn + 1 });
        console.log(`[AgentLoop] Turn ${turn + 1} started.`);

        // 3a. Invoke LLM (Streaming)
        const stream = await llmWithTools.stream(messages);
        let responseChunk: any = null;

        for await (const chunk of stream) {
            responseChunk = responseChunk ? responseChunk.concat(chunk) : chunk;

            // Stream text content immediately if present
            const textDelta = typeof chunk.content === "string" ? chunk.content : "";
            if (textDelta) {
                fullResponse += textDelta;
                writeSse({ chunk: textDelta });
            }
        }

        const response = responseChunk;
        messages.push(response);

        // 3b. Check for tool calls
        const toolCalls = response.tool_calls || [];

        // Handle text content (already streamed, but ensure completeness if needed)
        // const textContent = typeof response.content === "string" ? response.content : "";

        // If no tool calls, we are done
        if (toolCalls.length === 0) {
            console.log(`[AgentLoop] No tool calls. Finishing.`);
            writeSse({ event: "agent_complete", total_turns: turn + 1 });
            break;
        }

        console.log(`[AgentLoop] Tool calls detected: ${toolCalls.length}`);

        // 3c. Execute tools
        for (const call of toolCalls) {
            // Notify frontend about tool call
            writeSse({
                event: "tool_call",
                tool_name: call.name,
                tool_args: call.args,
                tool_call_id: call.id!,
            });

            let result = "";
            let isError = false;

            try {
                const toolOutput = await toolRegistry.execute(call.name, call.args);
                result = toolOutput.content;
                isError = !!toolOutput.isError;
            } catch (err: any) {
                result = `Error executing tool ${call.name}: ${err.message}`;
                isError = true;
            }

            // Notify frontend about tool result
            writeSse({
                event: "tool_result",
                tool_name: call.name,
                tool_call_id: call.id!,
                result: result,
                is_error: isError,
            });

            // Add tool result to history
            messages.push(new ToolMessage({
                tool_call_id: call.id!,
                content: result,
                name: call.name
            }));
        }

        // 3d. Reflection / Continuation
        // Injects a hidden prompt to encourage the model to process the tool output
        // messages.push(new HumanMessage("Reflect on the results above and decide the next step or provide the final answer."));
    }

    // [NEW] 4. Memory Consolidation Check
    // We check if the history length (before this turn) + new exchanges exceeds the window
    // For simplicity, we pass the raw history + current interactions
    // Note: 'history' here is the past conversation. 'messages' contains recent context.
    const totalHistoryLength = history.length + 1; // +1 for current user message

    if (memoryManager.shouldConsolidate(totalHistoryLength)) {
        console.log(`[AgentLoop] Triggering memory consolidation (Length: ${totalHistoryLength})`);

        // Per "Fire-and-Forget" strategy, we perform this concurrently or emit an event
        // But here we need to use the LLM to generate the summary.
        // To avoid blocking the response (which is already sent via SSE),
        // we normally would do this in background.
        // HOWEVER, since 'agentLoop' is async and the caller awaits it, 
        // we should try not to delay the 'end' event too much, OR the controller sends 'end' first?
        // Actually, the controller awaits agentLoop then sends 'end'.
        // So we will emit the consolidation event BEFORE the loop returns.

        // Construct the full conversation for the manager to process
        // We combine the input 'history' plus the 'currentMessage' and the 'fullResponse'
        const conversationToConsolidate = [
            ...history,
            { role: 'user', content: currentMessage },
            { role: 'assistant', content: fullResponse }
        ];

        // Perform consolidation
        // Note: We use the same 'llm' instance.
        memoryManager.consolidate(conversationToConsolidate, longTermMemory || "", llm)
            .then(result => {
                if (result.memory_update || result.history_entry) {
                    console.log('[AgentLoop] Consolidation successful, emitting event.');
                    writeSse({
                        event: 'memory_consolidation',
                        payload: result
                    });
                }
            })
            .catch(err => {
                console.error('[AgentLoop] Consolidation error:', err);
            });
    }

    return fullResponse;
}
