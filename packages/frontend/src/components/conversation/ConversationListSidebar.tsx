import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useConversationStore } from "@/store/useConversationStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useEffect, useMemo, useState } from "react";
import { Trash2, Plus, MoreHorizontal } from 'lucide-react';
import { conversationService } from "@/services/conversationService";
import { cn } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ConversationListSidebar = () => {
    const {
        conversations,
        currentConversationId,
        setCurrentConversationId,
        isLoadingConversations,
        loadConversations,
        removeConversation,
    } = useConversationStore();

    const { token } = useAuthStore();
    const [hoveredId, setHoveredId] = useState<string | null>(null);

    useEffect(() => {
        if (token) {
            loadConversations();
        }
    }, [token, loadConversations]);

    const handleDelete = async (conversationId: string) => {
        try {
            await removeConversation(conversationId);
        } catch (error) {
            console.error('Failed to delete:', error);
        }
    };

    const handleNewChat = async () => {
        // 检查当前对话是否为空
        const currentMessages = currentConversationId
            ? useConversationStore.getState().messages[currentConversationId]
            : [];

        // 如果当前对话为空，不创建新对话
        if (currentMessages && currentMessages.length === 0) {
            return;
        }

        try {
            const { conversation_id } = await conversationService.createNewConversation({})
            setCurrentConversationId(conversation_id)
            loadConversations()
        } catch (err) {
            console.error(err)
        }
    };

    // Group conversations by time
    const groupedConversations = useMemo(() => {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const lastWeek = new Date(today);
        lastWeek.setDate(lastWeek.getDate() - 7);

        const groups: Record<string, typeof conversations> = {
            'Today': [],
            'Yesterday': [],
            'Previous 7 Days': [],
            'Older': []
        };

        conversations.forEach(conv => {
            const date = new Date(conv.created_at || Date.now()); // Fallback if no created_at

            if (date.toDateString() === today.toDateString()) {
                groups['Today'].push(conv);
            } else if (date.toDateString() === yesterday.toDateString()) {
                groups['Yesterday'].push(conv);
            } else if (date > lastWeek) {
                groups['Previous 7 Days'].push(conv);
            } else {
                groups['Older'].push(conv);
            }
        });

        // Filter out empty groups
        return Object.entries(groups).filter(([_, items]) => items.length > 0);
    }, [conversations]);

    return (
        <div className="flex h-full w-72 flex-col bg-sidebar/30 backdrop-blur-md border-r border-sidebar-border/50">
            <div className="p-4 pt-6">
                <Button
                    onClick={handleNewChat}
                    className="w-full justify-start gap-2 bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary shadow-none border-0"
                    variant="outline"
                >
                    <Plus size={18} />
                    New Chat
                </Button>
            </div>

            <ScrollArea className="flex-1 px-3">
                <div className="space-y-6 pb-4">
                    {isLoadingConversations ? (
                        <div className="space-y-3 px-2">
                            {[1, 2, 3].map(i => <div key={i} className="h-8 bg-muted/50 rounded-lg animate-pulse" />)}
                        </div>
                    ) : (
                        groupedConversations.map(([label, items]) => (
                            <div key={label}>
                                <h3 className="mb-2 px-2 text-xs font-medium text-muted-foreground/70 uppercase tracking-wider">{label}</h3>
                                <div className="space-y-1">
                                    {items.map((conv) => (
                                        <div
                                            key={conv.id}
                                            onMouseEnter={() => setHoveredId(conv.id)}
                                            onMouseLeave={() => setHoveredId(null)}
                                            onClick={() => setCurrentConversationId(conv.id)}
                                            className={cn(
                                                "group flex items-center justify-between rounded-lg px-2 py-2 text-sm transition-all cursor-pointer",
                                                currentConversationId === conv.id
                                                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                                                    : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground"
                                            )}
                                        >
                                            <span className="truncate max-w-[180px]">{conv.title || "Untitled Chat"}</span>

                                            {/* Action Menu (Visible on hover or active) */}
                                            <div className={cn(
                                                "opacity-0 transition-opacity flex items-center gap-1",
                                                (hoveredId === conv.id || currentConversationId === conv.id) && "opacity-100"
                                            )}>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-6 w-6 p-0 hover:bg-background/20">
                                                            <MoreHorizontal size={14} />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem
                                                            className="text-destructive focus:text-destructive"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDelete(conv.id);
                                                            }}
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </ScrollArea>
        </div>
    );
};

export default ConversationListSidebar;
