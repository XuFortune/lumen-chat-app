// packages/frontend/src/components/conversation/ConversationListSidebar.tsx
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useConversationStore } from "@/store/useConversationStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useEffect, useState } from "react";
import { FaTrash } from 'react-icons/fa';
import { Skeleton } from "@/components/ui/skeleton";

const ConversationListSidebar = () => {
    // 只订阅 store，不再维护本地 state
    const {
        conversations,
        currentConversationId,
        setCurrentConversationId,
        isLoadingConversations,
        loadConversations,
        removeConversation
    } = useConversationStore();

    const { token } = useAuthStore();

    // 触发数据加载
    useEffect(() => {
        if (token) {
            loadConversations();
        }
    }, [token, loadConversations]);

    const handleDelete = async (conversationId: string) => {
        try {
            await removeConversation(conversationId);
        } catch (error) {
            // 错误已在 store 中处理，这里可以添加额外的 UI 反馈（如 toast）
            console.error('删除失败:', error);
        }
    };

    const handleNewChat = () => {
        setCurrentConversationId('temp');
    };

    // 悬停状态管理（UI 交互，与数据无关）
    const [hoveredId, setHoveredId] = useState<string | null>(null);

    // 加载态
    if (isLoadingConversations) {
        return (
            <div className="flex h-full w-64 flex-col bg-background p-4">
                <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-4 w-full rounded" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-full w-64 flex-col bg-background">
            <div className="p-4">
                <Button
                    className="w-full justify-center bg-blue-900"
                    onClick={handleNewChat}
                >
                    + 新聊天
                </Button>
            </div>
            <Separator className="my-2" />
            <ScrollArea className="flex-1 px-3">
                <nav className="space-y-1">
                    {conversations.map((conv) => (
                        <div
                            key={conv.id}
                            onMouseEnter={() => setHoveredId(conv.id)}
                            onMouseLeave={() => setHoveredId(null)}
                            onClick={() => setCurrentConversationId(conv.id)}
                            className={`
                group flex w-58 items-center justify-between rounded-md p-2 transition-colors cursor-pointer
                ${currentConversationId === conv.id
                                    ? 'bg-gray-100'
                                    : 'hover:bg-accent'
                                }
              `}
                        >
                            <span className="truncate">{conv.title}</span>
                            {hoveredId === conv.id && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-4 w-6 p-0 text-muted-foreground hover:text-red-500 bg-transparent"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(conv.id);
                                    }}
                                >
                                    <FaTrash size={14} />
                                </Button>
                            )}
                        </div>
                    ))}
                </nav>
            </ScrollArea>
        </div>
    );
};

export default ConversationListSidebar;
