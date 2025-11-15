// packages/frontend/src/components/conversation/ChatContentArea.tsx
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useConversationStore } from "@/store/useConversationStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useEffect, useState, useCallback, useRef } from "react";
import { conversationService } from "@/services/conversationService";
import type { ChatStreamRequest } from "@/services/conversationService";
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import InsightPopup from "./InsightPopup";
import ChatInputArea from "./ChatInputArea";

// 视觉高亮层组件
const SelectionHighlight = ({ range }: { range: Range | null }) => {
    if (!range) return null;

    const rect = range.getBoundingClientRect();
    const container = range.commonAncestorContainer.parentElement?.closest('[data-chat-container]');
    if (!container) return null;

    const containerRect = container.getBoundingClientRect();

    return (
        <div
            className="absolute bg-blue-500/20 pointer-events-none z-40 rounded-sm"
            style={{
                left: `${rect.left - containerRect.left}px`,
                top: `${rect.top - containerRect.top}px`,
                width: `${rect.width}px`,
                height: `${rect.height}px`,
            }}
        />
    );
};

const ChatContentArea = () => {
    // 只订阅必要的 store 方法
    const {
        currentConversationId,
        conversations,
        messages,
        addMessage,
        setStreamingMessage,
        updateStreamingMessage,
        setCurrentConversationId,
        updateMessageId,
        loadConversations // 新增：用于刷新会话列表
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

    // 加载当前会话的消息
    useEffect(() => {
        const loadMessages = async () => {
            if (!currentConversationId || currentConversationId === 'temp') {
                setError(null);
                return;
            }

            try {
                setIsLoading(true);
                const data = await conversationService.getConversationMessages(currentConversationId);
                useConversationStore.getState().setMessages(currentConversationId, data);
                setError(null);
            } catch (err) {
                console.error("Failed to load messages:", err);
                setError("加载消息失败，请重试");
            } finally {
                setIsLoading(false);
            }
        };

        loadMessages();
    }, [currentConversationId]);

    // 划词监听逻辑
    const handleMouseUp = useCallback((e: React.MouseEvent) => {
        const selection = window.getSelection();
        if (!selection || !chatContainerRef.current) return;

        const selectedString = selection.toString().trim();
        if (!selectedString) {
            savedRangeRef.current = null;
            setIsPopoverOpen(false);
            return;
        }

        const range = selection.getRangeAt(0);
        const isInsideChat = chatContainerRef.current.contains(range.commonAncestorContainer);
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
            ? (messages[currentConversationId] || [])
            : [];

        const llmConfig = user?.llm_configs?.[0] || {
            provider: "openai",
            model: "deepseek-chat",
            apiKey: "sk-c2ec976a434c469d9949b3889e26f790",
            baseUrl: "https://api.deepseek.com/v1"
        };

        if (!llmConfig) {
            setError("请先在设置中配置 LLM 模型（如 OpenAI 或 Gemini）");
            return;
        }

        const isTemp = currentConversationId === 'temp';
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
            conversation_id: currentConversationId as string
        });

        addMessage(currentConversationId, {
            id: tempAssistantMessageId,
            role: "assistant",
            content: "",
            created_at: new Date().toISOString(),
            conversation_id: currentConversationId as string
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

                    if ((currentConversationId === null || currentConversationId === 'temp') && endData.conversation_id) {
                        setCurrentConversationId(endData.conversation_id);
                        await loadConversations();
                    }
                },
                (error) => {
                    console.error("流式通信错误:", error);
                    setStreamingMessage(null);
                    setIsStreaming(false);
                    if (currentConversationId) {
                        const updatedMessages = (messages[currentConversationId] || []).filter(
                            (msg) => msg.id !== tempAssistantMessageId
                        );
                        useConversationStore.getState().setMessages(currentConversationId, updatedMessages);
                    }
                    setError(error.message || "发送失败，请检查网络或配置");
                },
                token
            );
        } catch (err) {
            console.error("调用 AI 引擎失败:", err);
            setStreamingMessage(null);
            setIsStreaming(false);
            if (currentConversationId) {
                const updatedMessages = (messages[currentConversationId] || []).filter(
                    (msg) => msg.id !== tempAssistantMessageId
                );
                useConversationStore.getState().setMessages(currentConversationId, updatedMessages);
            }
            setError("连接失败，请检查网络或 AI 服务状态");
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
        loadConversations, // 替换了 setConversations
        updateMessageId,
    ]);

    // 渲染函数
    const renderEmptyState = () => (
        <div className="flex h-full flex-col items-center justify-center p-6 text-center">
            <div className="text-4xl mb-4">💬</div>
            <h2 className="text-xl font-semibold mb-2">欢迎使用浮光 (Lumen)</h2>
            <p className="text-muted-foreground max-w-md">
                点击左侧的“新聊天”按钮，或选择一个历史会话开始对话。
            </p>
        </div>
    );

    const renderError = () => {
        if (!error) return null;
        return (
            <div className="p-4 text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                {error}
            </div>
        );
    };

    const renderChatMessages = () => {
        const currentMessages = currentConversationId
            ? (messages[currentConversationId] || [])
            : [];

        return (
            <>
                <ScrollArea className="flex-1 p-4">
                    {isLoading ? (
                        <div className="space-y-4">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="flex justify-start">
                                    <Skeleton className="h-4 w-3/4 rounded" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {renderError()}
                            {currentMessages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                                >
                                    <div
                                        className={`max-w-[80%] rounded-lg px-4 py-2 ${msg.role === "user"
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-background border"
                                            }`}
                                    >
                                        <div className="prose prose-sm max-w-none dark:prose-invert">
                                            <ReactMarkdown
                                                rehypePlugins={[rehypeSanitize]}
                                                components={{
                                                    code({ node, className, children, ...props }) {
                                                        const isInline = !(node?.type === 'element' && node?.tagName === 'pre');
                                                        return isInline ? (
                                                            <code className="bg-muted px-1 rounded" {...props}>
                                                                {children}
                                                            </code>
                                                        ) : (
                                                            <pre className="bg-muted p-4 rounded my-2 overflow-x-auto">
                                                                <code className={className} {...props}>
                                                                    {children}
                                                                </code>
                                                            </pre>
                                                        );
                                                    },
                                                    p({ children }) {
                                                        return <p className="my-2">{children}</p>;
                                                    },
                                                }}
                                            >
                                                {msg.content}
                                            </ReactMarkdown>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {isStreaming && (
                                <div className="flex justify-start">
                                    <div className="bg-background border rounded-lg px-4 py-2">
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </ScrollArea>
                {/* 输入区域 - 限制最大高度为父容器的 50% */}
                <div className="shrink-0 max-h-[50%]">
                    <ChatInputArea
                        value={input}
                        onChange={setInput}
                        onSend={handleSendMessage}
                        isStreaming={isStreaming}
                        isDisabled={isLoading}
                        //   isCreatingNewConversation={isCreatingNewConversation}
                        //   currentModel={currentModel}
                        onModelSelect={() => {/* 打开模型选择器 */ }}
                    />
                </div>
                {/* <div className="shrink-0 p-4 border-t">
                    <div className="relative">
                        <Textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage();
                                }
                            }}
                            disabled={isStreaming || isLoading}
                            placeholder="请输入消息..."
                            className="min-h-[60px] resize-none pr-12"
                        />
                        <Button
                            size="sm"
                            onClick={handleSendMessage}
                            disabled={isStreaming || isLoading || !input.trim()}
                            className="absolute right-2 bottom-2 h-8 w-8 p-0"
                        >
                            {isStreaming ? (
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                            ) : (
                                "↵"
                            )}
                        </Button>
                    </div>
                </div> */}
            </>
        );
    };

    return (
        <div
            className="flex h-full flex-col bg-muted/50 relative"
            ref={chatContainerRef}
            onMouseUp={handleMouseUp}
            data-chat-container
        >
            <SelectionHighlight range={savedRangeRef.current} />

            <Popover
                open={isPopoverOpen}
                onOpenChange={setIsPopoverOpen}
                modal={false}
            >
                <PopoverTrigger asChild>
                    <div style={{ display: 'none' }} />
                </PopoverTrigger>
                <PopoverContent
                    className="w-auto p-2 shadow-lg z-50"
                    style={{
                        position: 'absolute',
                        left: `${popoverPosition.left}px`,
                        top: `${popoverPosition.top}px`,
                        transform: 'translateY(5px)',
                        zIndex: 50,
                    }}
                    align="start"
                    side="bottom"
                    onOpenAutoFocus={(e) => e.preventDefault()}
                >
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleExplain}
                        className="text-xs"
                    >
                        解释
                    </Button>
                </PopoverContent>
            </Popover>

            {isInsightPopupOpen && (
                <InsightPopup
                    initialText={selectedText}
                    onClose={() => setIsInsightPopupOpen(false)}
                />
            )}

            {conversations.length === 0 && currentConversationId === null
                ? renderEmptyState()
                : renderChatMessages()}
        </div>
    );
};

export default ChatContentArea;
