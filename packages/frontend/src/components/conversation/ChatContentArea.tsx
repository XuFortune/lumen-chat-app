// packages/frontend/src/components/conversation/ChatContentArea.tsx
import { ScrollArea } from "@/components/ui/scroll-area";
import { useConversationStore } from "@/store/useConversationStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useEffect, useState, useCallback, useRef } from "react";
import { conversationService } from "@/services/conversationService";
import type { ChatStreamRequest } from "@/services/conversationService";
import ChatInputArea from "./ChatInputArea";
import { MessageBubble } from "./MessageBubble";
import { Sparkles } from 'lucide-react';
import { SelectionProvider, useSelectionContext } from "./SelectionManager";
import { useTextSelection } from "@/hooks/useTextSelection";
import { SelectionToolbar } from "./SelectionToolbar";
import InsightPopup from "./InsightPopup";

const ChatContentAreaInner = () => {
    const {
        currentConversationId,
        conversations,
        messages,
        addMessage,
        setStreamingMessage,
        updateStreamingMessage,
        updateMessageId,
        updateMessageConversationId,
        loadConversations,
    } = useConversationStore();

    // 划词状态管理
    const { selectText } = useSelectionContext();

    const { token, user } = useAuthStore();
    const [input, setInput] = useState("");
    const [isStreaming, setIsStreaming] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isLanding, setIsLanding] = useState(false);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    // 划词监听
    useTextSelection({
        enabled: true,
        minLength: 2,
        maxLength: 500,
        delay: 150,
        excludeSelectors: ["input", "textarea", "[contenteditable]"],
        toolbarSize: { width: 150, height: 36 },
        onSelectionChange: (info) => {
            if (info) {
                selectText(info);
            }
        },
    });

    // 滚动到底部的函数
    const scrollToBottom = useCallback(() => {
        const viewport = scrollAreaRef.current?.querySelector(
            '[data-radix-scroll-area-viewport]'
        ) as HTMLElement;
        if (viewport) {
            viewport.scrollTo({
                top: viewport.scrollHeight,
                behavior: 'auto'
            });
        }
    }, []);

    // 加载当前会话的消息
    useEffect(() => {
        const loadMessages = async () => {
            if (!currentConversationId || currentConversationId === "temp") {
                setError(null);
                return;
            }

            try {
                setIsLoading(true);
                const data = await conversationService.getConversationMessages(
                    currentConversationId
                );
                useConversationStore
                    .getState()
                    .setMessages(currentConversationId, data);
                setError(null);

                if (data.length > 0) {
                    setIsLanding(true);
                    requestAnimationFrame(() => {
                        scrollToBottom();
                        setTimeout(() => {
                            setIsLanding(false);
                        }, 100);
                    });
                }
            } catch (err) {
                console.error("Failed to load messages:", err);
                setError("Failed to load messages");
            } finally {
                setIsLoading(false);
            }
        };

        loadMessages();
    }, [currentConversationId, scrollToBottom]);

    // 获取默认 LLM 配置
    const getDefaultLLMConfig = useCallback(() => {
        if (!user?.llm_configs || user.llm_configs.length === 0) {
            return null;
        }
        const defaultConfig = user.llm_configs.find(config => config.isDefault);
        return defaultConfig || user.llm_configs[0];
    }, [user?.llm_configs]);

    // 发送消息
    const handleSendMessage = useCallback(async () => {
        const messageContent = input.trim();
        if (!messageContent || isStreaming || !token) return;

        setError(null);

        const currentMessages = currentConversationId
            ? messages[currentConversationId] || []
            : [];

        const llmConfig = getDefaultLLMConfig();

        if (!llmConfig) {
            setError("请先在设置中配置 LLM 模型");
            return;
        }

        const isTemp = currentConversationId === "temp";
        const requestBody: ChatStreamRequest = {
            conversation_id: isTemp ? null : currentConversationId,
            history: currentMessages,
            currentMessage: messageContent,
            config: { ...llmConfig },
        };

        const tempUserMessageId = crypto.randomUUID();
        const tempAssistantMessageId = crypto.randomUUID();

        addMessage(currentConversationId, {
            id: tempUserMessageId,
            role: "user",
            content: messageContent,
            created_at: new Date().toISOString(),
            conversation_id: currentConversationId as string,
        });

        addMessage(currentConversationId, {
            id: tempAssistantMessageId,
            role: "assistant",
            content: "",
            created_at: new Date().toISOString(),
            conversation_id: currentConversationId as string,
        });

        setStreamingMessage(tempAssistantMessageId);
        setInput("");
        setIsStreaming(true);

        try {
            await conversationService.postChatStream(
                requestBody,
                (chunk) => updateStreamingMessage(chunk),
                (startData) => {
                    if (startData.user_message_id) {
                        updateMessageId(tempUserMessageId, startData.user_message_id);
                    }
                },
                async (endData) => {
                    if (endData.message_id) {
                        updateMessageId(tempAssistantMessageId, endData.message_id);
                    }
                    setStreamingMessage(null);
                    setIsStreaming(false);

                    if (
                        (currentConversationId === null ||
                            currentConversationId === "temp") &&
                        endData.conversation_id
                    ) {
                        updateMessageConversationId("temp", endData.conversation_id);
                        await loadConversations();
                    }
                },
                (toolCall) => {
                    // onToolCall
                    useConversationStore.getState().addToolCall(currentConversationId, {
                        id: toolCall.tool_call_id,
                        name: toolCall.tool_name,
                        args: toolCall.tool_args
                    });
                    // Insert placeholder for inline rendering
                    useConversationStore.getState().updateStreamingMessage(`\n:::tool_call:${toolCall.tool_call_id}:::\n`);
                },
                (toolResult) => {
                    // onToolResult
                    useConversationStore.getState().updateToolResult(
                        currentConversationId,
                        toolResult.tool_call_id,
                        toolResult.result,
                        toolResult.is_error
                    );
                },
                (error) => {
                    console.error("Stream error:", error);
                    setStreamingMessage(null);
                    setIsStreaming(false);
                    if (currentConversationId) {
                        const updatedMessages = (
                            messages[currentConversationId] || []
                        ).filter((msg) => msg.id !== tempAssistantMessageId);
                        useConversationStore
                            .getState()
                            .setMessages(currentConversationId, updatedMessages);
                    }
                    setError(error.message || "Failed to send message");
                },
                token
            );
        } catch (err: any) {
            console.error("AI Engine Error:", err);
            setStreamingMessage(null);
            setIsStreaming(false);
            if (currentConversationId) {
                const updatedMessages = (messages[currentConversationId] || []).filter(
                    (msg) => msg.id !== tempAssistantMessageId
                );
                useConversationStore
                    .getState()
                    .setMessages(currentConversationId, updatedMessages);
            }
            setError("Connection failed");
        }
    }, [
        input,
        isStreaming,
        token,
        currentConversationId,
        messages,
        getDefaultLLMConfig,
        addMessage,
        setStreamingMessage,
        updateStreamingMessage,
        updateMessageConversationId,
        loadConversations,
        updateMessageId,
    ]);

    // 渲染函数
    const renderEmptyState = () => (
        <div className="flex h-full flex-col items-center justify-center p-6 text-center animate-fade-in-up">
            <div className="h-12 w-12 bg-muted rounded-xl flex items-center justify-center mb-6">
                <Sparkles className="h-6 w-6 text-foreground/50" />
            </div>
            <h2 className="text-2xl font-semibold text-foreground mb-2">
                Good afternoon, User
            </h2>
            <p className="text-muted-foreground max-w-md">
                How can I help you today?
            </p>
        </div>
    );

    const renderError = () => {
        if (!error) return null;
        return (
            <div className="p-4 mx-auto max-w-3xl text-sm text-destructive bg-destructive/10 rounded-lg border border-destructive/20 mb-4">
                {error}
            </div>
        );
    };

    const renderChatMessages = () => {
        const currentMessages = currentConversationId
            ? messages[currentConversationId] || []
            : [];

        return (
            <ScrollArea className="flex-1 px-4 py-6" ref={scrollAreaRef}>
                <div className="mx-auto max-w-5xl space-y-6 pb-4">
                    {renderError()}
                    {currentMessages.map((msg, index) => {
                        const isLast = index === currentMessages.length - 1;
                        const isStreamingThis = isStreaming && isLast && msg.role === 'assistant';
                        return (
                            <MessageBubble
                                key={msg.id}
                                role={msg.role}
                                content={msg.content}
                                isStreaming={isStreamingThis}
                                toolCalls={msg.tool_calls}
                            />
                        );
                    })}
                </div>
            </ScrollArea>
        );
    };

    return (
        <div
            className="flex h-full flex-col relative bg-transparent"
            ref={chatContainerRef}
            data-chat-container
        >
            {/* 划词工具栏 */}
            <SelectionToolbar onCopy={() => console.log("已复制")} />

            {/* 浮窗智解 */}
            <InsightPopup />

            {/* Landing 遮罩 */}
            {isLanding && (
                <div className="absolute inset-0 bg-background z-50 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
                            <Sparkles className="h-4 w-4 text-primary" />
                        </div>
                        <p className="text-sm text-muted-foreground animate-pulse">
                            Loading conversation...
                        </p>
                    </div>
                </div>
            )}

            {conversations.length === 0 && currentConversationId === null
                ? renderEmptyState()
                : renderChatMessages()}

            {/* Floating Input Area */}
            <div className="shrink-0 p-4 relative z-10 w-full max-w-5xl mx-auto">
                <ChatInputArea
                    value={input}
                    onChange={setInput}
                    onSend={handleSendMessage}
                    isStreaming={isStreaming}
                    isDisabled={isLoading}
                    onModelSelect={() => { }}
                />
                <div className="text-center mt-2">
                    <span className="text-[10px] text-muted-foreground/50">
                        Lumen AI can make mistakes. Please check important information.
                    </span>
                </div>
            </div>
        </div>
    );
};

// 用 SelectionProvider 包裹
const ChatContentArea = () => {
    return (
        <SelectionProvider>
            <ChatContentAreaInner />
        </SelectionProvider>
    );
};

export default ChatContentArea;
