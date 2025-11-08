import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const ChatContentArea = () => {
    // TODO: Replace with real data from API
    const messages = [
        { id: "1", role: "user", content: "你好！" },
        { id: "2", role: "assistant", content: "你好！有什么可以帮你的吗？" },
        { id: "3", role: "user", content: "请解释一下 BERT 模型。" },
        { id: "4", role: "assistant", content: "BERT (Bidirectional Encoder Representations from Transformers) 是一种预训练的深度学习模型..." },
    ];

    return (
        <div className="flex h-full flex-col bg-muted/50">
            <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                            <div
                                className={`max-w-[80%] rounded-lg px-4 py-2 ${msg.role === "user"
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-background"
                                    }`}
                            >
                                {msg.content}
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>
            <div className="shrink-0 p-4">
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
        </div>
    );
};

export default ChatContentArea;
