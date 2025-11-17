// packages/api-core/src/controllers/NewChatController.ts
import { Request, Response } from "express";
import { Conversation, Message } from '../models'
import { success, failure } from "../utils";

interface StartNewChatRequest {
    initialContent?: string|null;
    title?: string;
    // 可选扩展：model, tags, preset, config 等
}

export const startNewChat = async (
    req: Request<{}, {}, StartNewChatRequest>,
    res: Response
): Promise<void> => {
    const { initialContent, title } = req.body;
    const userId = (req as any).user?.id

    if (!userId) {
        res.status(401).json(failure('Unauthorized', 'AUTH_REQUIRED'));
        return;
    }

    try {
        // 创建会话
        const convTitle = title || (initialContent ? initialContent.substring(0, 20) : "新对话");
        const newConv = await Conversation.create({
            user_id: userId,
            title: convTitle,
        });


        // 如果有初始内容，插入 assistant 消息
        if (initialContent) {
            await Message.create({
                conversation_id: newConv.id,
                role: 'assistant',
                content: initialContent,
            });
        }

        res.status(200).json(success({
            conversation_id: newConv.id,
        }));

    } catch (error) {
        console.error('Failed to start new chat:', error);
        res.status(500).json(failure('Internal server error', 'INTERNAL_ERROR'));
    }
};
