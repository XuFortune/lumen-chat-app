// packages/frontend/src/components/conversation/ChatContentArea.tsx
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { useConversationStore } from "@/store/useConversationStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useEffect, useState, useCallback, useRef } from "react";
import { conversationService } from "@/services/conversationService";
import type { ChatStreamRequest } from "@/services/conversationService";
import InsightPopup from "./InsightPopup";
import ChatInputArea from "./ChatInputArea";
import { MessageBubble } from "./MessageBubble";
import { Sparkles } from 'lucide-react';

const ChatContentArea = () => {

    const {
        currentConversationId,
        conversations,
        messages,
        addMessage,
        setStreamingMessage,
        updateStreamingMessage,
        setCurrentConversationId,
        updateMessageId,
        updateMessageConversationId,
        loadConversations,
    } = useConversationStore();

    const { token, user } = useAuthStore();
    const [input, setInput] = useState("");
    const [isStreaming, setIsStreaming] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 浮窗智解相关状态
    const [selectedText, setSelectedText] = useState("");
    const [popoverPosition, setPopoverPosition] = useState({ left: 0, top: 0 });
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);
    const [isInsightPopupOpen, setIsInsightPopupOpen] = useState(false);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const savedRangeRef = useRef<Range | null>(null);
    const scrollAreaRef = useRef<HTMLDivElement>(null);

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
            } catch (err) {
                console.error("Failed to load messages:", err);
                setError("Failed to load messages");
            } finally {
                setIsLoading(false);
            }
        };

        loadMessages();
    }, [currentConversationId]);

    // 划词监听逻辑
    const handleMouseUp = useCallback(() => {
        const selection = window.getSelection();
        if (!selection || !chatContainerRef.current) return;

        const selectedString = selection.toString().trim();
        if (!selectedString) {
            savedRangeRef.current = null;
            setIsPopoverOpen(false);
            return;
        }

        const range = selection.getRangeAt(0);
        const isInsideChat = chatContainerRef.current.contains(
            range.commonAncestorContainer
        );
        if (!isInsideChat) {
            savedRangeRef.current = null;
            setIsPopoverOpen(false);
            return;
        }

        savedRangeRef.current = range.cloneRange();
        setSelectedText(selectedString);

        const rect = range.getBoundingClientRect();
        setPopoverPosition({ left: rect.right, top: rect.bottom });

        setIsPopoverOpen(true);
    }, []);

    // 处理“解释”点击
    const handleExplain = useCallback(() => {
        setIsPopoverOpen(false);
        setIsInsightPopupOpen(true);
    }, []);

    // 发送消息
    const handleSendMessage = useCallback(async () => {
        const messageContent = input.trim();
        if (!messageContent || isStreaming || !token) return;

        setError(null);

        const currentMessages = currentConversationId
            ? messages[currentConversationId] || []
            : [];
        // 目前从env中获取llmconfig
        const provider = import.meta.env.VITE_LLM_CONFIG_PROVIDER
        const model = import.meta.env.VITE_LLM_COMFIG_MODEL;
        const apiKey = import.meta.env.VITE_LLM_CONFIG_API_KEY;
        const baseUrl = import.meta.env.VITE_LLM_CONFIG_BASE_URL;

        const llmConfig = user?.llm_configs?.[0] || {
            provider,
            model,
            apiKey,
            baseUrl,
        };

        if (!llmConfig) {
            setError("Please configure LLM settings first");
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
        } catch (err) {
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
        user?.llm_configs,
        addMessage,
        setStreamingMessage,
        updateStreamingMessage,
        setCurrentConversationId,
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

        // Check if the last message is from assistant and currently streaming
        // We can pass a flag to the last message if needed, but the store handles 'isStreaming' state generally
        // However, we need to know WHICH message is streaming to show the animation.
        // For simplicity, we assume if isStreaming is true, the last assistant message is the one.

        return (
            <ScrollArea className="flex-1 px-4 py-6" ref={scrollAreaRef}>
                <div className="mx-auto max-w-5xl space-y-6 pb-4">
                    {isLoading ? (
                        <div className="space-y-8 pt-8">
                            <div className="flex items-start gap-4">
                                <Skeleton className="h-8 w-8 rounded-full" />
                                <div className="space-y-2 flex-1">
                                    <Skeleton className="h-4 w-3/4" />
                                    <Skeleton className="h-4 w-1/2" />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
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
                                    />
                                );
                            })}
                        </>
                    )}
                </div>
            </ScrollArea>
        );
    };

    return (
        <div
            className="flex h-full flex-col relative bg-transparent"
            ref={chatContainerRef}
            onMouseUp={handleMouseUp}
            data-chat-container
        >
            <Popover
                open={isPopoverOpen}
                onOpenChange={setIsPopoverOpen}
                modal={false}
            >
                <PopoverTrigger asChild>
                    <div style={{ display: "none" }} />
                </PopoverTrigger>
                <PopoverContent
                    className="w-auto p-1 shadow-2xl z-50 rounded-lg"
                    style={{
                        position: "absolute",
                        left: `${popoverPosition.left}px`,
                        top: `${popoverPosition.top}px`,
                    }}
                    align="start"
                    side="top"
                    onOpenAutoFocus={(e) => e.preventDefault()}
                >
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleExplain}
                        className="text-xs h-7"
                    >
                        <Sparkles className="mr-1 h-3 w-3 text-primary" />
                        Explain
                    </Button>
                </PopoverContent>
            </Popover>

            {isInsightPopupOpen && (
                <InsightPopup
                    initialText={selectedText}
                    initiaPosition={{
                        x: `${popoverPosition.left}`,
                        y: `${popoverPosition.top}`,
                    }}
                    onClose={() => setIsInsightPopupOpen(false)}
                />
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

export default ChatContentArea;
