import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useConversationStore } from "@/store/useConversationStore";
import { useEffect, useState } from "react";
import type { Message } from "@/types";
import { getConversationMessages } from "@/services/conversationService";
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';

const ChatContentArea = () => {
    const { currentConversationId } = useConversationStore();
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    useEffect(() => {
        const loadMessages = async () => {
            if (!currentConversationId) {
                setMessages([]);
                return;
            }
            try {
                setIsLoading(true);
                const data = await getConversationMessages(currentConversationId);
                setMessages(data);
            } catch (error) {
                console.error("Failed to load messages:", error);
                setMessages([]);
            } finally {
                setIsLoading(false);
            }
        };
        loadMessages();
    }, [currentConversationId]);
    const renderEmptyState = () => (
        <div className="flex h-full flex-col items-center justify-center p-4 text-center">
            <div className="text-4xl mb-4">💬</div>
            <h2 className="text-xl font-semibold mb-2">欢迎使用浮光 (Lumen)</h2>
            <p className="text-muted-foreground max-w-md">
                点击左侧的“新聊天”按钮，或选择一个历史会话开始对话。
            </p>
        </div>
    );
    const renderChatMessages = () => (
        <>
            <ScrollArea className="flex-1 p-4">
                {isLoading ? (
                    <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="flex justify-start">
                                <div className="h-4 bg-muted rounded w-3/4 animate-pulse"></div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {messages.map((msg) => (
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
                                                    // 通过 node 结构判断是否为行内代码
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
                    </div>
                )}
            </ScrollArea>
            <div className="shrink-0 p-4 border-t">
                <div className="relative">
                    <Textarea
                        placeholder="请输入消息..."
                        className="min-h-[60px] resize-none pr-12"
                    />
                    <Button
                        size="sm"
                        className="absolute right-2 bottom-2 h-8 w-8 p-0"
                    >
                        ↵
                    </Button>
                </div>
            </div>
        </>
    );
    return (
        <div className="flex h-full flex-col bg-muted/50">
            {currentConversationId === null ? renderEmptyState() : renderChatMessages()}
        </div>
    );
};
export default ChatContentArea;
