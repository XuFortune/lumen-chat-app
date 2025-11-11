// packages/frontend/src/components/conversation/ChatContentArea.tsx
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useConversationStore } from "@/store/useConversationStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useEffect, useState, useCallback } from "react";
import { conversationService } from "@/services/conversationService";
import type { ChatStreamRequest } from "@/services/conversationService";
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';

const ChatContentArea = () => {
    const {
        currentConversationId,
        messages,
        addMessage,
        setStreamingMessage,
        updateStreamingMessage,
        setCurrentConversationId,
        setConversations,
        updateMessageId
    } = useConversationStore();

    const { token, user } = useAuthStore();
    const [input, setInput] = useState("");
    const [isStreaming, setIsStreaming] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 加载当前会话的消息
    useEffect(() => {
        const loadMessages = async () => {
            if (!currentConversationId) {
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

    const handleSendMessage = useCallback(async () => {
        const messageContent = input.trim();
        if (!messageContent || isStreaming || !token) return;

        // 清除之前的错误提示
        setError(null);

        // 获取当前会话的消息历史（用于构建 history）
        const currentMessages = currentConversationId
            ? (messages[currentConversationId] || [])
            : [];

        // 获取用户配置的 LLM 模型（假设使用第一个配置）
        const llmConfig = user?.llm_configs?.[0] || {
            provider: "openai",
            model: "qwen-plus",
            apiKey: "sk-bb1d2c338d104e9aaef4c8a9a9a6c592",
            baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1"
        };
        if (!llmConfig) {
            setError("请先在设置中配置 LLM 模型（如 OpenAI 或 Gemini）");
            return;
        }

        // 构造发送给 AI 引擎的请求体
        const requestBody: ChatStreamRequest = {
            conversation_id: currentConversationId,
            history: currentMessages,
            currentMessage: messageContent,
            config: {
                ...llmConfig
            },
        };
        console.log('body', JSON.stringify(requestBody))
        // ✅ 创建临时 ID（前端乐观更新用）
        const tempUserMessageId = crypto.randomUUID();
        const tempAssistantMessageId = crypto.randomUUID();

        // ✅ 乐观更新：立即在 UI 中显示用户消息和占位 AI 消息
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

        // ✅ 启动流式状态
        setStreamingMessage(tempAssistantMessageId);
        setInput("");
        setIsStreaming(true);

        try {
            // ✅ 调用封装好的服务层，传入回调函数处理不同事件
            await conversationService.postChatStream(
                requestBody,
                // ✅ 2. 收到 'chunk' 事件：逐步追加 AI 回复内容
                (chunk) => {
                    updateStreamingMessage(chunk);
                },
                // ✅ 1. 收到 'start' 事件：更新 user 消息的真实 ID
                (startData) => {
                    if (startData.user_message_id) {
                        updateMessageId(tempUserMessageId, startData.user_message_id);
                    }
                },
                // ✅ 3. 收到 'end' 事件：更新 assistant 消息的真实 ID，并处理新会话
                (endData) => {
                    if (endData.message_id) {
                        updateMessageId(tempAssistantMessageId, endData.message_id);
                    }

                    setStreamingMessage(null);
                    setIsStreaming(false);

                    // ✅ 如果是新建会话（conversation_id 为 null），更新当前会话
                    if (!currentConversationId && endData.conversation_id) {
                        setCurrentConversationId(endData.conversation_id);
                        conversationService.getConversations().then(setConversations);
                    }
                },
                // ✅ 4. 收到错误：显示错误，清理状态
                (error) => {
                    console.error("流式通信错误:", error);

                    setStreamingMessage(null);
                    setIsStreaming(false);

                    // 移除未完成的 AI 消息（避免残留空消息）
                    if (currentConversationId) {
                        const updatedMessages = (messages[currentConversationId] || []).filter(
                            (msg) => msg.id !== tempAssistantMessageId
                        );
                        useConversationStore.getState().setMessages(currentConversationId, updatedMessages);
                    }

                    // 显示友好错误（不依赖第三方 toast）
                    setError(error.message || "发送失败，请检查网络或配置");
                },
                token // ✅ 从 store 获取认证 token
            );
        } catch (err) {
            // ✅ 捕获非流式错误（如网络断开、请求失败）
            console.error("调用 AI 引擎失败:", err);

            setStreamingMessage(null);
            setIsStreaming(false);

            // 清理残留的 AI 消息
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
        setConversations,
        updateMessageId,
        setError,
    ]);


    // 渲染空状态
    const renderEmptyState = () => (
        <div className="flex h-full flex-col items-center justify-center p-6 text-center">
            <div className="text-4xl mb-4">💬</div>
            <h2 className="text-xl font-semibold mb-2">欢迎使用浮光 (Lumen)</h2>
            <p className="text-muted-foreground max-w-md">
                点击左侧的“新聊天”按钮，或选择一个历史会话开始对话。
            </p>
        </div>
    );

    // 渲染错误信息
    const renderError = () => {
        if (!error) return null;
        return (
            <div className="p-4 text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                {error}
            </div>
        );
    };

    // 渲染聊天消息
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
                <div className="shrink-0 p-4 border-t">
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
                            placeholder={isStreaming ? "AI正在输入..." : "请输入消息..."}
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
                </div>
            </>
        );
    };

    return (
        <div className="flex h-full flex-col bg-muted/50">
            {currentConversationId === null ? renderEmptyState() : renderChatMessages()}
        </div>
    );
};

export default ChatContentArea;
