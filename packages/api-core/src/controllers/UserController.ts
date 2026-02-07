// src/controllers/UserController.ts
import { Request, Response } from 'express';
import { success } from '../utils';

// 获取当前用户资料（需登录）
export const getProfile = async (req: Request, res: Response): Promise<void> => {
    // req.user 由 authMiddleware 注入
    const user = (req as any).user;
    const { password: _, ...safeUser } = user.get({ plain: true });

    res.json(success(safeUser, 'Profile fetched'));
};

// 更新 LLM 配置
export const updateLLMConfigs = async (req: Request, res: Response): Promise<void> => {
    const user = (req as any).user;
    const { llm_configs } = req.body;

    // 验证 llm_configs 是数组
    if (!Array.isArray(llm_configs)) {
        res.status(400).json({ success: false, message: 'llm_configs must be an array' });
        return;
    }

    // 更新用户的 llm_configs
    user.llm_configs = llm_configs;
    await user.save();

    const { password: _, ...safeUser } = user.get({ plain: true });
    res.json(success(safeUser, 'LLM configs updated'));
};
