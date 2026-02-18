import { Request, Response } from "express";
import { Conversation, Message } from "../models";
import { success, failure } from "../utils";

export const getConversations = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user.id

        const conversations = await Conversation.findAll({
            where: { user_id: userId },
            order: [['updated_at', 'DESC']],
            attributes: ['id', 'title', 'updated_at']
        })
        res.json(success(conversations))

    } catch (error) {
        console.error('Error fetching conversations:', error);
        res.status(500).json(failure('Internal server error', 'INTERNAL_ERROR'));
    }
}

export const getConversationMessages = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user.id
        const { id } = req.params

        const conversation = await Conversation.findOne({
            where: { id, user_id: userId }
        })
        if (!conversation) {
            res.status(404).json(failure('Conversation not found', 'NOT_FOUND'));
            return;
        }

        const messages = await Message.findAll({
            where: { conversation_id: id },
            order: [['created_at', 'ASC']],
            attributes: ['id', 'role', 'content', 'created_at', 'metadata']
        })

        const formattedMessages = messages.map(msg => {
            const plainMsg = msg.toJSON();
            // If metadata has tool_calls, move it to top level
            if (plainMsg.metadata && plainMsg.metadata.tool_calls) {
                return {
                    ...plainMsg,
                    tool_calls: plainMsg.metadata.tool_calls
                };
            }
            return plainMsg;
        });

        res.json(success(formattedMessages))
    } catch (error) {
        console.error('Error fetching conversation messages:', error);
        res.status(500).json(failure('Internal server error', 'INTERNAL_ERROR'));
    }
}

export const updateConversation = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user.id
        const { id } = req.params
        const { title } = req.body

        if (!title || typeof title !== 'string' || title.trim().length === 0) {
            res.status(400).json(failure('Title is required and must be a non-empty string', 'INVALID_REQUEST'));
            return;
        }

        const conversation = await Conversation.findOne({
            where: { id, user_id: userId }
        })
        if (!conversation) {
            res.status(404).json(failure('Conversation not found', 'NOT_FOUND'));
            return;
        }
        await conversation.update({
            title: title.trim()
        });
        res.status(200).json(success({ id: conversation.id, title: conversation.title }));
    } catch (error) {
        console.error('Error updating conversation:', error);
        res.status(500).json(failure('Internal server error', 'INTERNAL_ERROR'));
    }
}

export const deleteConversation = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user.id;
        const { id } = req.params;
        // 验证会话是否存在且属于当前用户
        const conversation = await Conversation.findOne({
            where: { id, user_id: userId }
        });
        if (!conversation) {
            res.status(404).json(failure('Conversation not found', 'NOT_FOUND'));
            return;
        }
        // 执行删除
        // 删除 Conversation 会自动删除所有关联的 Messages，无需手动操作。
        await conversation.destroy();

        res.status(200).json(success({ message: 'Conversation deleted successfully' }));

    } catch (error) {
        console.error('Error deleting conversation:', error);
        res.status(500).json(failure('Internal server error', 'INTERNAL_ERROR'));
    }
}