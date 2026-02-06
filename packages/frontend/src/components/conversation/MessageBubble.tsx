
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import { Copy, Check } from 'lucide-react';
import { useState } from "react";
import { Button } from "../ui/button";

interface MessageBubbleProps {
    role: "user" | "assistant";
    content: string;
    isStreaming?: boolean;
}

export const MessageBubble = ({ role, content, isStreaming }: MessageBubbleProps) => {
    const isUser = role === "user";
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className={cn(
            "flex w-full mb-6 animate-fade-in-up group",
            isUser ? "justify-end" : "justify-start"
        )}>
            {/* Avatar for Assistant - REMOVED per user request */}

            {/* Content Bubble */}
            <div className={cn(
                "relative max-w-[95%] lg:max-w-[90%] px-5 py-2",
                isUser
                    ? "bg-secondary text-secondary-foreground rounded-2xl rounded-tr-sm shadow-sm ml-auto"
                    : "bg-transparent text-foreground p-0" // No bubble for AI
            )}>
                <div className={cn("prose prose-base max-w-none dark:prose-invert break-words leading-relaxed",
                    isUser ? "prose-p:text-secondary-foreground" : ""
                )}>
                    {content ? (
                        <ReactMarkdown
                            rehypePlugins={[rehypeSanitize]}
                            components={{
                                code({ node, className, children, ...props }) {
                                    const match = /language-(\w+)/.exec(className || "");
                                    const isInline = !match && !String(children).includes('\n');
                                    return isInline ? (
                                        <code
                                            className={cn("px-1.5 py-0.5 rounded font-mono text-sm", isUser ? "bg-background/20" : "bg-muted text-muted-foreground")}
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
                                                <code className={cn("font-mono text-sm block", className)} {...props}>
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
                            {content}
                        </ReactMarkdown>
                    ) : (
                        <span className="animate-pulse text-muted-foreground">...</span>
                    )}
                </div>

                {/* Actions (Copy, etc) - Only for Assistant for now */}
                {!isUser && !isStreaming && (
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

            {/* Avatar for User (Optional, visually better without usually, effectively "me") */}
        </div>
    );
};
