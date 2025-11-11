import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useConversationStore } from "@/store/useConversationStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useState, useEffect } from "react";
import { FaTrash } from 'react-icons/fa';
import { conversationService } from "@/services/conversationService";
import type { Conversation } from "@/types";

const ConversationListSidebar = () => {
    // 1. 从 Store 中获取当前会话 ID 和设置函数
    const { currentConversationId, setCurrentConversationId } = useConversationStore();
    const { token } = useAuthStore()

    const [conversations, setConversations] = useState<Conversation[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const loadConversation = async () => {
            console.log('qq')
            if (!token) {
                setIsLoading(false)
                return
            }
            try {
                setIsLoading(true)
                const data = await conversationService.getConversations()
                setConversations(data)
                setCurrentConversationId(data[0].id)
            } catch (error) {
                console.error("Failed to load conversations:", error);
            } finally {
                setIsLoading(false)
            }
        }
        loadConversation()
    }, [token])

    const handleDelete = async (conversationId: string) => {
        try {
            await conversationService.deleteConversation(conversationId)
            setConversations(conversations.filter(item => item.id !== conversationId))
            if (conversationId === currentConversationId) {
                setCurrentConversationId(null)
            }
        } catch (error) {
            console.error('删除失败:', error);
        }


    }

    // 3. 为每个会话项管理悬停状态
    const [hoveredId, setHoveredId] = useState<string | null>(null);

    if (isLoading) {
        return (
            <div className="flex h-full w-64 flex-col bg-background p-4">
                <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-4 bg-muted rounded animate-pulse"></div>
                    ))}
                </div>
            </div>
        );
    }
    return (
        <div className="flex h-full w-64 flex-col bg-background">
            <div className="p-4">
                <Button
                    className="w-full justify-start"
                    onClick={() => setCurrentConversationId(null)}
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
                    group flex w-full items-center justify-between rounded-md p-2  transition-colors cursor-pointer
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
                                        handleDelete(conv.id)
                                    }}
                                >
                                    <FaTrash size={14}></FaTrash>
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