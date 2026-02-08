/**
 * 浮窗智解组件（重构版）
 * 修复：
 * - 边界拖拽限制
 * - 内存泄漏
 * - 位置计算优化
 * - 解释模式切换
 * - 重新生成/重试功能
 */
import {
    Card,
    CardHeader,
    CardContent,
    CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { X, Copy, RotateCcw, MessageSquare } from "lucide-react";
import { useEffect, useState, useRef, useCallback, memo } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useConversationStore } from "@/store/useConversationStore";
import { conversationService } from "@/services/conversationService";
import type { ChatStreamRequest } from "@/services/conversationService";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import { useSelectionContext, PROMPT_TEMPLATES } from "./SelectionManager";
import type { ExplainMode } from "./SelectionManager";
import { clampPosition } from "@/utils/selection";

const POPUP_SIZE = { width: 360, height: 240 };

const InsightPopup = memo(() => {
    const { token, user } = useAuthStore();
    const { setCurrentConversationId, loadConversations } = useConversationStore();
    const {
        isInsightPopupOpen,
        popupPosition: initialPosition,
        selectedText,
        currentExplanation,
        isExplaining,
        explainError,
        explainMode,
        setExplanation,
        setError,
        closeInsightPopup,
        switchExplainMode,
    } = useSelectionContext();

    const [position, setPosition] = useState(initialPosition);
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [currentMode, setCurrentMode] = useState<ExplainMode>(explainMode);
    const popupRef = useRef<HTMLDivElement>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const isMountedRef = useRef(true);

    // 同步位置和模式
    useEffect(() => {
        if (isInsightPopupOpen) {
            // 确保位置在视口内
            const clamped = clampPosition(
                initialPosition.x,
                initialPosition.y,
                POPUP_SIZE
            );
            setPosition(clamped);
        }
    }, [isInsightPopupOpen, initialPosition]);

    useEffect(() => {
        setCurrentMode(explainMode);
    }, [explainMode]);

    // 获取默认 LLM 配置
    const getDefaultLLMConfig = useCallback(() => {
        if (!user?.llm_configs || user.llm_configs.length === 0) {
            return null;
        }
        const defaultConfig = user.llm_configs.find(config => config.isDefault);
        return defaultConfig || user.llm_configs[0];
    }, [user?.llm_configs]);

    // 获取解释
    const fetchExplanation = useCallback(async (mode: ExplainMode) => {
        if (!token || !selectedText) {
            setError("未登录或未选择文本");
            return;
        }

        const llmConfig = getDefaultLLMConfig();
        if (!llmConfig) {
            setError("请先在设置中配置 LLM 模型");
            return;
        }

        // 取消前一个请求
        abortControllerRef.current?.abort();

        const prompt = PROMPT_TEMPLATES[mode].replace("{text}", selectedText);
        const requestBody: ChatStreamRequest = {
            conversation_id: null,
            history: [],
            currentMessage: prompt,
            config: { ...llmConfig },
            ephemeral: true,
        };

        setExplanation("");
        setError(null);

        try {
            await conversationService.postChatStream(
                requestBody,
                (chunk) => {
                    if (isMountedRef.current) {
                        setExplanation((prev) => prev + chunk);
                    }
                },
                () => {},
                () => {
                    if (isMountedRef.current) {
                        // 请求完成
                    }
                },
                (streamError) => {
                    if (isMountedRef.current) {
                        console.error("浮窗智解流式错误:", streamError);
                        setError(streamError.message || "解释失败");
                    }
                },
                token
            );
        } catch (err) {
            if (isMountedRef.current) {
                console.error("浮窗智解请求失败:", err);
                setError("请求失败，请重试");
            }
        }
    }, [selectedText, token, getDefaultLLMConfig, setExplanation, setError]);

    // 初始化或模式切换时请求
    useEffect(() => {
        if (isInsightPopupOpen && selectedText) {
            fetchExplanation(currentMode);
        }

        return () => {
            abortControllerRef.current?.abort();
        };
    }, [isInsightPopupOpen, currentMode, selectedText, fetchExplanation]);

    // 清理
    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
            abortControllerRef.current?.abort();
        };
    }, []);

    // 拖拽逻辑
    const handleMouseDown = (e: React.MouseEvent) => {
        if (!popupRef.current || (e.target as HTMLElement).closest("button")) return;
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
            const newX = e.clientX - dragOffset.x;
            const newY = e.clientY - dragOffset.y;
            const clamped = clampPosition(newX, newY, POPUP_SIZE);
            setPosition(clamped);
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

    // 复制解释
    const handleCopy = async () => {
        if (!currentExplanation) return;
        try {
            await navigator.clipboard.writeText(currentExplanation);
            // 简单提示，可以后续改成 toast
            console.log("已复制到剪贴板");
        } catch (error) {
            console.error("复制失败");
        }
    };

    // 重新生成
    const handleRegenerate = () => {
        fetchExplanation(currentMode);
    };

    // 切换模式
    const handleSwitchMode = (mode: ExplainMode) => {
        if (mode !== currentMode) {
            switchExplainMode(mode);
        }
    };

    // 继续提问
    const handleContinueAsking = async () => {
        if (!currentExplanation) return;

        const body = {
            title: "",
            initialContent: currentExplanation,
        };

        try {
            const { conversation_id } = await conversationService.createNewConversation(body);
            setCurrentConversationId(conversation_id);
            loadConversations();
            closeInsightPopup();
            console.log("已创建新对话");
        } catch (error) {
            console.error("创建对话失败");
        }
    };

    // 键盘快捷键
    useEffect(() => {
        if (!isInsightPopupOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                closeInsightPopup();
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [isInsightPopupOpen, closeInsightPopup]);

    if (!isInsightPopupOpen) return null;

    const modeLabels: Record<ExplainMode, string> = {
        simple: "简短",
        detailed: "详细",
        technical: "技术",
        example: "举例",
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
                width: `${POPUP_SIZE.width}px`,
                animation: isInsightPopupOpen ? "fadeIn 0.2s ease-out" : "none",
            }}
            className="select-none"
            onMouseDown={handleMouseDown}
        >
            <style>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: scale(0.95) translateY(8px);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1) translateY(0);
                    }
                }
            `}</style>
            <Card className="shadow-xl border-0">
                <CardHeader className="flex flex-row items-center justify-between p-3 cursor-move bg-muted/30">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">浮窗智解</span>
                        {explainError && (
                            <Badge variant="destructive" className="text-xs">
                                错误
                            </Badge>
                        )}
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={closeInsightPopup}>
                        <X className="h-4 w-4" />
                    </Button>
                </CardHeader>

                <CardContent className="p-3">
                    <ScrollArea className="h-[150px]">
                        {explainError ? (
                            <div className="text-red-500 text-xs p-2 flex flex-col items-center gap-2">
                                <span>{explainError}</span>
                                <Button size="sm" variant="outline" onClick={handleRegenerate}>
                                    <RotateCcw className="h-3 w-3 mr-1" />
                                    重试
                                </Button>
                            </div>
                        ) : currentExplanation ? (
                            <div className="prose prose-xs max-w-none dark:prose-invert">
                                <ReactMarkdown
                                    rehypePlugins={[rehypeSanitize]}
                                    components={{
                                        p({ children }) {
                                            return <p className="my-1 text-sm leading-relaxed">{children}</p>;
                                        },
                                    }}
                                >
                                    {currentExplanation}
                                </ReactMarkdown>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <Skeleton className="h-3 w-full" />
                                <Skeleton className="h-3 w-5/6" />
                                <Skeleton className="h-3 w-4/6" />
                            </div>
                        )}
                        {isExplaining && !explainError && (
                            <div className="flex justify-center mt-2">
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                            </div>
                        )}
                    </ScrollArea>

                    {/* 解释模式切换 */}
                    <div className="flex gap-1 mt-2 pt-2 border-t">
                        {(Object.keys(PROMPT_TEMPLATES) as ExplainMode[]).map((mode) => (
                            <Badge
                                key={mode}
                                variant={currentMode === mode ? "default" : "outline"}
                                className="cursor-pointer text-xs px-2 py-0"
                                onClick={() => handleSwitchMode(mode)}
                            >
                                {modeLabels[mode]}
                            </Badge>
                        ))}
                    </div>
                </CardContent>

                <CardFooter className="p-3 pt-0 flex gap-2">
                    <Button
                        onClick={handleCopy}
                        size="sm"
                        variant="outline"
                        className="flex-1 text-xs"
                        disabled={!currentExplanation || isExplaining}
                    >
                        <Copy className="h-3 w-3 mr-1" />
                        复制
                    </Button>
                    <Button
                        onClick={handleRegenerate}
                        size="sm"
                        variant="outline"
                        className="flex-1 text-xs"
                        disabled={isExplaining}
                    >
                        <RotateCcw className="h-3 w-3 mr-1" />
                        重新生成
                    </Button>
                    <Button
                        onClick={handleContinueAsking}
                        size="sm"
                        className="flex-1 text-xs"
                        disabled={!currentExplanation || isExplaining}
                    >
                        <MessageSquare className="h-3 w-3 mr-1" />
                        继续提问
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
});

InsightPopup.displayName = "InsightPopup";

export default InsightPopup;
