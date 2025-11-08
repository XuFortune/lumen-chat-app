import ChatContentArea from "@/components/conversation/ChatContentArea";
import ConversationListSiderbar from "@/components/conversation/ConversationListSiderbar";

const ChatWorkspace = () => {
    return (
        <div className="flex h-full">
            <ConversationListSiderbar />
            <div className="flex-1">
                <ChatContentArea />
            </div>
        </div>
    );
};

export default ChatWorkspace;
