import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import { Separator } from "../ui/separator";

const ConversationListSiderbar = () => {
    const conversations = [
        { id: "1", title: "如何学习 React？" },
        { id: "2", title: "解释一下 Tailwind CSS" },
        { id: "3", title: "今天的天气怎么样？" },
    ];

    return (
        <div className="flex h-full w-64 flex-col bg-background border-r-1 border-r-gray-500">
            <div className="p-4">
                <Button className="w-full justify-start">
                    +新聊天
                </Button>
            </div>
            <Separator className="my-2"></Separator>
            <ScrollArea className="flex-1 px-2">
                <nav className="space-y-1">
                    {conversations.map((conv) => (
                        <button key={conv.id} className="flex w-full items-center justify-between rounded-md p-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground">
                            <span className="truncate">{conv.title}</span>
                            <div className="flex space-x-1 opacity-0 group-hover:opacity-100">
                                <span className="text-muted-foreground">✏️</span>
                                <span className="text-muted-foreground">🗑️</span>
                            </div>
                        </button>
                    ))}
                </nav>
            </ScrollArea>
        </div>
    )
}

export default ConversationListSiderbar