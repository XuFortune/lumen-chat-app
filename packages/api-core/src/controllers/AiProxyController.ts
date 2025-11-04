// packages/api-core/src/controllers/AiProxyController.ts
import { Request, Response } from "express";
import axios, { AxiosError } from "axios";
import { authMiddleware } from "../middleware";
import { success, failure } from "../utils";
import { Json } from "sequelize/types/utils";

interface Message {
    role: 'user' | 'assistant',
    content: string
}

interface AiStreamRequest {
    history: Message[];
    current_message: string;
    config: Record<string, any>
}
const allowedRoles = ['user', 'assistant', 'system', 'tool', 'function'];
export const handleAiStreamProxy = async (
    req: Request<{}, {}, AiStreamRequest>,
    res: Response
): Promise<void> => {
    const { history, current_message, config } = req.body
    if (!current_message || typeof current_message !== 'string') {
        res.status(400).json(failure('current_message is required and must be a string', 'INVALID_REQUEST'))
        return
    }
    if (!Array.isArray(history)) {
        res.status(400).json(failure('history must be an array', 'INVALID_REQUEST'))
        return
    }
    for (const msg of history) {
        if (!msg.role || !msg.content || !allowedRoles.includes(msg.role)) {
            res.status(400).json(failure('Invalid message format in history', 'INVALID_REQUEST'))
            return
        }
    }

    const userId = (req as any).user?.id
    if (!userId) {
        res.status(401).json(failure('Unauthorized', 'AUTH_REQUIRED'))
        return
    }

    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('Access-Control-Allow-Origin', '*')
    let fullResponse = ''
    try {
        const aiResponse = await axios.post(
            'http://localhost:4001/v1/ai/stream',
            { history, current_message, config },
            {
                responseType: 'stream',
                timeout: 30000,
                headers: { 'Content-Type': 'application/json' }
            }
        );
        aiResponse.data.on('data', (chunk: Buffer) => {
            const chunkStr = chunk.toString();
            fullResponse += chunkStr
            res.write(`data:${JSON.stringify({ chunk: chunkStr })}\n\n`)
        })
        aiResponse.data.on('end', () => {
            console.log('AI 流结束')
            res.write(`data:${JSON.stringify({ event: 'end' })}\n\n`)
            res.end()
        })
        aiResponse.data.on('error', (err: Error) => {
            console.error('AI 引擎数据流错误:', err);
            // 流式错误通过 SSE 通道通知
            res.write(`data: ${JSON.stringify({ event: 'error', message: 'AI processing error' })}\n\n`);
            res.end();
        });
    } catch (error) {
        console.error('调用 AI 引擎失败:', error.message);
        // 如果在 axios 调用阶段就失败了（例如 ECONNREFUSED），我们仍然可以通过 SSE 通知
        // 但为了统一，这里也通过 SSE 通道发送错误
        res.write(`data: ${JSON.stringify({ event: 'error', message: 'AI service unavailable' })}\n\n`);
        res.end();
    }
}