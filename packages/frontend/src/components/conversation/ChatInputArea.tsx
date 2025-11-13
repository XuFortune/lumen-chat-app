// packages/frontend/src/components/conversation/ChatInputArea.tsx
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
    Paperclip,
    Smile,
    FileText,
    AtSign,
    Zap,
    Send,
    Loader2
} from 'lucide-react';
import { useState, useRef, useLayoutEffect, useCallback } from "react";

interface ChatInputAreaProps {
    value: string;
    onChange: (value: string) => void;
    onSend: () => void;
    isStreaming?: boolean;
    isDisabled?: boolean;
    isCreatingNewConversation?: boolean;
    currentModel?: {
        name: string;
        provider: string;
    };
    onModelSelect?: () => void;
    placeholder?: string;
}

const ChatInputArea = ({
    value,
    onChange,
    onSend,
    isStreaming = false,
    isDisabled = false,
    isCreatingNewConversation = false,
    currentModel,
    onModelSelect,
    placeholder = "请输入消息..."
}: ChatInputAreaProps) => {
    const [inputHeight, setInputHeight] = useState(60);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // 高度自适应计算
    const calculateHeight = useCallback(() => {
        if (!textareaRef.current) return;

        // 重置高度获取准确 scrollHeight
        textareaRef.current.style.height = 'auto';
        const newHeight = Math.min(
            Math.max(60, textareaRef.current.scrollHeight + 2),
            200 // 最大高度 200px
        );
        setInputHeight(newHeight);
    }, []);

    useLayoutEffect(() => {
        calculateHeight();
    }, [value, calculateHeight]);

    // 键盘处理
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSend();
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            onSend();
        }
    };

    // 左侧功能图标
    const leftIcons = [
        { icon: <Paperclip size={16} />, key: 'attach' },
        { icon: <Smile size={16} />, key: 'emoji' },
        { icon: <FileText size={16} />, key: 'file' },
        { icon: <AtSign size={16} />, key: 'mention' },
        { icon: <Zap size={16} />, key: 'quick' }
    ];

    return (
        <div className="rounded-lg bg-muted/50 border border-border m-3">
            {/* 输入区域 */}
            <div className="px-4 py-3">
                <Textarea
                    ref={textareaRef}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    style={{
                        height: inputHeight,
                        minHeight: 60,
                        maxHeight: 200,
                        lineHeight: '1.5'
                    }}
                    // className="resize-none border-0 bg-transparent p-0"
                    placeholder={isCreatingNewConversation ? "开始新对话..." : placeholder}
                    disabled={isDisabled}
                />
            </div>

            {/* 功能按钮区 */}
            <div className="flex items-center justify-between px-4 py-2 ">
                {/* 左侧功能图标 */}
                <div className="flex gap-1">
                    {leftIcons.map(({ icon, key }) => (
                        <Button
                            key={key}
                            variant="ghost"
                            size="sm"
                            disabled={isDisabled}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                        >
                            {icon}
                        </Button>
                    ))}
                </div>

                {/* 右侧模型信息 + 发送按钮 */}
                <div className="flex items-center gap-2">
                    {currentModel && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onModelSelect}
                            disabled={isDisabled}
                            className="text-xs px-2 h-6"
                        >
                            {currentModel.name}
                        </Button>
                    )}
                    <Button
                        size="sm"
                        onClick={onSend}
                        disabled={isDisabled || !value.trim()}
                        className="h-8"
                    >
                        {isStreaming ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Send className="h-4 w-4" />
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ChatInputArea;
