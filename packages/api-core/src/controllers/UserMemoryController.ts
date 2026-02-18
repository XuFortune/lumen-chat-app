// packages/api-core/src/controllers/UserMemoryController.ts
import { Request, Response } from 'express';
import { UserMemory } from '../models';
import { success, failure } from '../utils';

// 获取当前用户的长期记忆
export const getUserMemory = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        if (!userId) {
            return res.status(401).json(failure('Unauthorized', 'AUTH_REQUIRED'));
        }

        let memory = await UserMemory.findOne({ where: { user_id: userId } });

        // 如果没有记忆，返回空字符串或默认值
        if (!memory) {
            return res.status(200).json(success({
                content: '',
                last_consolidated_at: null
            }));
        }

        return res.status(200).json(success({
            content: memory.content,
            last_consolidated_at: memory.last_consolidated_at
        }));
    } catch (error: any) {
        console.error('Failed to get user memory:', error);
        return res.status(500).json(failure('Internal Server Error', 'INTERNAL_ERROR'));
    }
};

// 更新当前用户的长期记忆
export const updateUserMemory = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        const { content } = req.body;

        if (!userId) {
            return res.status(401).json(failure('Unauthorized', 'AUTH_REQUIRED'));
        }

        if (typeof content !== 'string') {
            return res.status(400).json(failure('Content must be a string', 'INVALID_REQUEST'));
        }

        const [memory, created] = await UserMemory.findOrCreate({
            where: { user_id: userId },
            defaults: {
                user_id: userId,
                content: content
            }
        });

        if (!created) {
            await memory.update({ content: content });
        }

        return res.status(200).json(success({
            content: memory.content,
            last_consolidated_at: memory.last_consolidated_at
        }));
    } catch (error: any) {
        console.error('Failed to update user memory:', error);
        return res.status(500).json(failure('Internal Server Error', 'INTERNAL_ERROR'));
    }
};
