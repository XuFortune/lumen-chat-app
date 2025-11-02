import { Request, Response, NextFunction } from "express";
import { User } from "../models";
import { failure, verifyToken } from "../utils";
export const authMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization
        if (!authHeader || !authHeader.startsWith('Bearer')) {
            res.status(401).json(failure('需要TOKEN', 'UNAUTHORIZED'))
            return
        }
        const token = authHeader.split(' ')[1]
        console.log(authHeader)
        const decoded = verifyToken(token)
        if (!decoded.id) {
            res.status(401).json(
                failure('无效Token', 'INVALID_TOKEN')
            );
            return;
        }
        // 3. 查用户（可选：防止用户被删除后仍能用旧 token）
        const user = await User.findByPk(decoded.id);
        if (!user) {
            res.status(401).json(
                failure('用户不存在', 'USER_DELETED')
            );
            return;
        }
        (req as any).user = user
        next()
    } catch (error: any) {
        if (error.name === 'JsonWebTokenError') {
            res.status(401).json(failure('Invalid token', 'INVALID_TOKEN'));
        } else if (error.name === 'TokenExpiredError') {
            res.status(401).json(failure('Token expired', 'TOKEN_EXPIRED'));
        } else {
            console.error('Auth middleware error:', error);
            res.status(500).json(failure('Authentication failed', 'AUTH_FAILED'));
        }
    }
}