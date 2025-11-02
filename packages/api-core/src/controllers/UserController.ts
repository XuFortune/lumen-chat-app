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
