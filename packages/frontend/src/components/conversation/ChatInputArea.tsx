// packages/frontend/src/components/conversation/ChatInputArea.tsx
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
    Paperclip,
    Smile,
    Zap,
    ArrowUp,
    Square
} from 'lucide-react';
import { useState, useRef, useLayoutEffect } from "react";
import { cn } from "@/lib/utils";

interface ChatInputAreaProps {
    value: string;
    onChange: (value: string) => void;
    onSend: () => void;
    isStreaming?: boolean;
    isDisabled?: boolean;
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
    currentModel,
    onModelSelect,
}: ChatInputAreaProps) => {
    const [inputHeight, setInputHeight] = useState(60);
    const [isFocused, setIsFocused] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Height calculation
    const calculateHeight = () => {
        if (!textareaRef.current) return;
        textareaRef.current.style.height = 'auto';
        const newHeight = Math.min(
            Math.max(60, textareaRef.current.scrollHeight),
            200
        );
        setInputHeight(newHeight);
    };

    useLayoutEffect(() => {
        calculateHeight();
    }, [value]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSend();
        }
    };

    return (
        <div className={cn(
            "relative rounded-3xl border transition-all duration-200 ease-in-out bg-background/80 backdrop-blur-xl shadow-lg",
            isFocused ? "border-primary/50 shadow-primary/5 ring-4 ring-primary/10" : "border-border/50"
        )}>
            {/* Input Field */}
            <div className="px-4 py-2">
                <Textarea
                    ref={textareaRef}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    style={{ height: inputHeight }}
                    className="min-h-[50px] max-h-[200px] w-full resize-none border-0 bg-transparent p-2 focus-visible:ring-0 text-base"
                    placeholder="Ask anything..."
                    disabled={isDisabled}
                />
            </div>

            {/* Actions Bar */}
            <div className="flex items-center justify-between px-3 pb-3">
                <div className="flex gap-1 text-muted-foreground">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-muted" disabled={isDisabled}>
                        <Paperclip size={18} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-muted" disabled={isDisabled}>
                        <Zap size={18} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-muted" disabled={isDisabled}>
                        <Smile size={18} />
                    </Button>
                </div>

                <div className="flex items-center gap-2">
                    {currentModel && (
                        <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full cursor-pointer hover:bg-muted/80" onClick={onModelSelect}>
                            {currentModel.name}
                        </div>
                    )}
                    <Button
                        size="icon"
                        onClick={onSend}
                        disabled={isDisabled || (!value.trim() && !isStreaming)}
                        className={cn(
                            "h-9 w-9 rounded-full transition-all duration-200",
                            isStreaming ? "bg-red-500 hover:bg-red-600" : "bg-primary hover:bg-primary/90"
                        )}
                    >
                        {isStreaming ? (
                            <Square size={14} fill="currentColor" />
                        ) : (
                            <ArrowUp size={18} />
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ChatInputArea;
