import ChatContentArea from "@/components/conversation/ChatContentArea";
import ConversationListSidebar from "@/components/conversation/ConversationListSidebar";

const ChatWorkspace = () => {
    return (
        <div className="flex h-full">
            <ConversationListSidebar />
            <div className="flex-1">
                <ChatContentArea />
            </div>
        </div>
    );
};

export default ChatWorkspace;
