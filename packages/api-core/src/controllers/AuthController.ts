import { Request, Response } from "express";
import { success, failure } from "../utils";
import bcrypt from 'bcrypt';
import { User } from "../models";

export const createUser = async (req: Request, res: Response) => {
    try {
        const { username, password, llm_configs } = req.body

        const hashedPassword = await bcrypt.hash(password, 10)
        const user = await User.create({
            username,
            password: hashedPassword,
            llm_configs: llm_configs || null
        })
        return res.status(201).json(success(user, '用户创建成功'))
    } catch (error: any) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json(
                failure('用户名已存在', 'USERNAME_EXISTS')
            );
        }
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json(
                failure('请求参数无效', 'VALIDATION_ERROR', error.errors)
            );
        }
        // 通用错误
        console.error('创建用户失败:', error);
        return res.status(500).json(
            failure('服务器内部错误', 'INTERNAL_SERVER_ERROR')
        );
    }
}