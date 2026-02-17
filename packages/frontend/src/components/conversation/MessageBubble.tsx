import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import { Copy, Check } from 'lucide-react';
import { useState } from "react";
import { Button } from "../ui/button";
import { ToolCallCard } from "../chat/ToolCallCard";

interface MessageBubbleProps {
    role: "user" | "assistant" | "tool";
    content: string;
    isStreaming?: boolean;
    toolCalls?: {
        id: string;
        name: string;
        args: any;
        result?: string;
        is_error?: boolean;
    }[];
}

export const MessageBubble = ({ role, content, isStreaming, toolCalls }: MessageBubbleProps) => {
    const isUser = role === "user";
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className={cn(
            "flex w-full mb-6 animate-fade-in-up group flex-col",
            isUser ? "items-end" : "items-start"
        )}>
            {/* Content Bubble */}
            <div className={cn(
                "relative max-w-[95%] lg:max-w-[90%] px-5 py-2",
                isUser
                    ? "bg-secondary text-secondary-foreground rounded-2xl rounded-tr-sm shadow-sm"
                    : "bg-transparent text-foreground p-0" // No bubble for AI
            )}>
                <div className={cn("prose prose-base max-w-none dark:prose-invert break-words leading-relaxed",
                    isUser ? "prose-p:text-secondary-foreground" : ""
                )}>
                    {content || (toolCalls && toolCalls.length > 0) ? (
                        (() => {
                            // Split content by tool call placeholder
                            const parts = (content || "").split(/:::tool_call:(.+?):::/g);
                            const renderedToolCallIds: Set<string> = new Set();

                            return (
                                <>
                                    {parts.map((part, index) => {
                                        // Check if this part is a tool call ID (odd indices from split with regex group)
                                        if (index % 2 === 1) {
                                            const toolCallId = part;
                                            const toolCall = toolCalls?.find(tc => tc.id === toolCallId);

                                            if (toolCall) {
                                                renderedToolCallIds.add(toolCallId);
                                                return (
                                                    <div key={`tool-${toolCallId}`} className="my-2 not-prose">
                                                        <ToolCallCard
                                                            toolName={toolCall.name}
                                                            args={toolCall.args}
                                                            result={toolCall.result}
                                                            isError={toolCall.is_error}
                                                            isLoading={!toolCall.result && !toolCall.is_error}
                                                        />
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }

                                        // Regular text content
                                        if (!part.trim()) return null;

                                        return (
                                            <ReactMarkdown
                                                key={`text-${index}`}
                                                rehypePlugins={[rehypeSanitize]}
                                                components={{
                                                    code({ node, className, children, ...props }) {
                                                        const match = /language-(\w+)/.exec(className || "");
                                                        const isInline = !match && !String(children).includes('\n');
                                                        return isInline ? (
                                                            <code
                                                                className={cn("px-2 py-0.5 rounded font-mono text-sm", isUser ? "bg-background/20" : "bg-muted text-muted-foreground")}
                                                                {...props}
                                                            >
                                                                {children}
                                                            </code>
                                                        ) : (
                                                            <div className="relative group/code my-4 overflow-hidden rounded-lg border border-border/50 bg-muted/30">
                                                                <div className="absolute right-2 top-2 opacity-0 group-hover/code:opacity-100 transition-opacity">
                                                                    {/* Copy button could go here */}
                                                                </div>
                                                                <pre className="p-4 overflow-x-auto bg-transparent">
                                                                    <code className={cn("font-mono text-sm block", className)} {...props} >
                                                                        {children}
                                                                    </code>
                                                                </pre>
                                                            </div>
                                                        );
                                                    },
                                                    p: ({ children }) => <p className="mb-4 last:mb-0 leading-7">{children}</p>,
                                                    ul: ({ children }) => <ul className="list-disc pl-4 mb-4 space-y-1">{children}</ul>,
                                                    ol: ({ children }) => <ol className="list-decimal pl-4 mb-4 space-y-1">{children}</ol>,
                                                }}
                                            >
                                                {part}
                                            </ReactMarkdown>
                                        );
                                    })}

                                    {/* Render remaining tool calls (backward compatibility or missing placeholders) */}
                                    {toolCalls && toolCalls.length > 0 && (
                                        <div className="w-full mt-2 space-y-2 not-prose">
                                            {toolCalls
                                                .filter(tc => !renderedToolCallIds.has(tc.id))
                                                .map((toolCall) => (
                                                    <ToolCallCard
                                                        key={toolCall.id}
                                                        toolName={toolCall.name}
                                                        args={toolCall.args}
                                                        result={toolCall.result}
                                                        isError={toolCall.is_error}
                                                        isLoading={!toolCall.result && !toolCall.is_error}
                                                    />
                                                ))}
                                        </div>
                                    )}
                                </>
                            );
                        })()
                    ) : (
                        <span className="animate-pulse text-muted-foreground">Thinking...</span>
                    )}
                </div>

                {/* Actions (Copy, etc) - Only for Assistant for now */}
                {!isUser && !isStreaming && content && (
                    <div className="mt-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-foreground"
                            onClick={handleCopy}
                        >
                            {copied ? <Check size={12} /> : <Copy size={12} />}
                        </Button>
                    </div>
                )}
            </div>

            {/* Remove original tool call block since we handle it inside content now */}
        </div>
    );
};
