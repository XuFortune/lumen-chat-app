import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || '1sdf2'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

// src/types/jwt.ts
export interface JwtPayload {
    id: string; // 或 number，看你 User.id 类型
    username: string;
    iat: number; // issued at (自动添加)
    exp: number; // expiration (自动添加)
}

export const generateToken = (payload: object): string => {
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN
    } as jwt.SignOptions)
}

export const verifyToken = (token: string) => {
    return jwt.verify(token, JWT_SECRET) as JwtPayload
}