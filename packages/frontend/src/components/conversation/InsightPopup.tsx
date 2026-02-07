// packages/frontend/src/components/conversation/InsightPopup.tsx
import {
    Card,
    CardHeader,
    CardContent,
    CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { X } from "lucide-react";
import { useEffect, useState, useRef, useCallback } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useConversationStore } from "@/store/useConversationStore";
import { conversationService } from "@/services/conversationService";
import type { ChatStreamRequest } from "@/services/conversationService";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";

interface InsightPopupProps {
    initialText: string;
    onClose: () => void;
    initiaPosition: { x: string; y: string };
}

const InsightPopup = ({
    initialText,
    onClose,
    initiaPosition,
}: InsightPopupProps) => {
    const { token, user } = useAuthStore();
    const { setCurrentConversationId, loadConversations } =
        useConversationStore();

    const [position, setPosition] = useState({
        x: parseInt(initiaPosition.x, 10),
        y: parseInt(initiaPosition.y, 10),
    }); // 默认位置
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [isStreaming, setIsStreaming] = useState(false);
    const [messages, setMessages] = useState<
        Array<{ id: string; role: string; content: string }>
    >([]);
    const [error, setError] = useState<string | null>(null);
    const popupRef = useRef<HTMLDivElement>(null);

    // 获取默认 LLM 配置
    const getDefaultLLMConfig = useCallback(() => {
        if (!user?.llm_configs || user.llm_configs.length === 0) {
            return null;
        }
        const defaultConfig = user.llm_configs.find(config => config.isDefault);
        return defaultConfig || user.llm_configs[0];
    }, [user?.llm_configs]);

    // 初始化请求
    useEffect(() => {
        const fetchInsight = async () => {
            if (!token) {
                setError("未登录");
                return;
            }

            const llmConfig = getDefaultLLMConfig();
            if (!llmConfig) {
                setError("请先在设置中配置 LLM 模型");
                return;
            }

            const prompt = `请用不超过80字，向初学者解释以下概念：'${initialText}'`;
            const requestBody: ChatStreamRequest = {
                conversation_id: null,
                history: [],
                currentMessage: prompt,
                config: { ...llmConfig },
                ephemeral: true,
            };

            const tempAssistantMessageId = crypto.randomUUID();
            setMessages([
                { id: tempAssistantMessageId, role: "assistant", content: "" },
            ]);
            setIsStreaming(true);
            setError(null);

            try {
                await conversationService.postChatStream(
                    requestBody,
                    (chunk) => {
                        setMessages((prev) =>
                            prev.map((msg) =>
                                msg.id === tempAssistantMessageId
                                    ? { ...msg, content: msg.content + chunk }
                                    : msg
                            )
                        );
                    },
                    () => { },
                    () => {
                        setIsStreaming(false);
                    },
                    (streamError) => {
                        console.error("浮窗智解流式错误:", streamError);
                        setError(streamError.message || "解释失败");
                        setIsStreaming(false);
                    },
                    token
                );
            } catch (err) {
                console.error("浮窗智解请求失败:", err);
                setError("请求失败，请重试");
                setIsStreaming(false);
            }
        };

        fetchInsight();
    }, [initialText, token, getDefaultLLMConfig]);

    // 拖拽逻辑
    const handleMouseDown = (e: React.MouseEvent) => {
        if (!popupRef.current) return;
        const rect = popupRef.current.getBoundingClientRect();
        setDragOffset({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        });
        setIsDragging(true);
    };

    useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e: MouseEvent) => {
            setPosition({
                x: e.clientX - dragOffset.x,
                y: e.clientY - dragOffset.y,
            });
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [isDragging, dragOffset]);

    // “继续提问”逻辑
    const handleContinueAsking = async () => {
        const content = messages[0]?.content || "";
        if (!content) return;

        const body = {
            title: "",
            initialContent: content,
        };
        const { conversation_id } = await conversationService.createNewConversation(
            body
        );
        setCurrentConversationId(conversation_id);
        loadConversations();
        onClose();
    };

    return (
        <div
            ref={popupRef}
            style={{
                position: "fixed",
                left: `${position.x}px`,
                top: `${position.y}px`,
                zIndex: 60,
                cursor: isDragging ? "grabbing" : "grab",
                maxWidth: "320px",
                width: "100%",
            }}
            className="select-none"
        >
            <Card className="shadow-xl border-0">
                <CardHeader
                    className="flex flex-row items-center justify-between p-3 cursor-move"
                    onMouseDown={handleMouseDown}
                >
                    <span className="text-sm font-medium">浮窗智解</span>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </Button>
                </CardHeader>
                <CardContent className="p-3">
                    <ScrollArea className="h-[120px]">
                        {error ? (
                            <div className="text-red-500 text-xs p-1">{error}</div>
                        ) : messages.length > 0 ? (
                            <div className="prose prose-xs max-w-none dark:prose-invert">
                                <ReactMarkdown
                                    rehypePlugins={[rehypeSanitize]}
                                    components={{
                                        p({ children }) {
                                            return <p className="my-1 text-sm">{children}</p>;
                                        },
                                    }}
                                >
                                    {messages[0].content}
                                </ReactMarkdown>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <Skeleton className="h-3 w-full" />
                                <Skeleton className="h-3 w-5/6" />
                            </div>
                        )}
                        {isStreaming && (
                            <div className="flex justify-center mt-2">
                                <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                            </div>
                        )}
                    </ScrollArea>
                </CardContent>
                <CardFooter className="p-3 pt-0">
                    <Button
                        onClick={handleContinueAsking}
                        size="sm"
                        className="w-full text-xs"
                        disabled={isStreaming}
                    >
                        继续提问
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
};

export default InsightPopup;
