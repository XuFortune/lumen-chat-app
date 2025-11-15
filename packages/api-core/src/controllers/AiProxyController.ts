// packages/api-core/src/controllers/AiProxyController.ts
import { Request, Response } from "express";
import axios, { AxiosError } from "axios";
import { authMiddleware } from "../middleware";
import { success, failure } from "../utils";
import { Json } from "sequelize/types/utils";
import { Conversation, Message } from '../models'


interface Message {
    role: 'user' | 'assistant',
    content: string
}

interface AiStreamRequest {
    conversation_id: string | null
    history: Message[];
    currentMessage: string;
    config: Record<string, any>
    ephemeral?: boolean
}
const allowedRoles = ['user', 'assistant', 'system', 'tool', 'function'];
function parseSseChunk(chunkStr: string): any {
    try {
        // SSE 格式: data: {...}\n\n
        // 我们需要提取 {...} 部分
        const lines = chunkStr.split('\n');
        for (const line of lines) {
            if (line.startsWith('data:')) {
                const dataStr = line.substring(5).trim(); // 去掉 'data:' 前缀
                if (dataStr) {
                    return JSON.parse(dataStr);
                }
            }
        }
    } catch (e) {
        console.error('Failed to parse SSE chunk:', e);
    }
    return null;
}
export const handleAiStreamProxy = async (
    req: Request<{}, {}, AiStreamRequest>,
    res: Response
): Promise<void> => {
    const { conversation_id, history, currentMessage, config, ephemeral } = req.body
    if (!currentMessage || typeof currentMessage !== 'string') {
        res.status(400).json(failure('currentMessage is required and must be a string', 'INVALID_REQUEST'))
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

    if (ephemeral === true) {
        res.setHeader('Content-Type', 'text/event-stream')
        res.setHeader('Cache-Control', 'no-cache')
        res.setHeader('Connection', 'keep-alive')
        res.setHeader('Access-Control-Allow-Origin', '*')

        let fullResponse = ''
        let buffer = ''
        try {
            const aiResponse = await axios.post(
                'http://localhost:4001/v1/ai/stream',
                { history, currentMessage, config },
                {
                    responseType: 'stream',
                    timeout: 30000,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
            res.write(`data: ${JSON.stringify({ event: 'start' })}\n\n`);
            aiResponse.data.on('data', (chunk: Buffer) => {
                const chunkStr = chunk.toString();
                buffer += chunkStr
                let boundaryIndex;
                while ((boundaryIndex = buffer.indexOf('\n\n')) !== -1) {
                    const sseEvent = buffer.substring(0, boundaryIndex + 2)
                    buffer = buffer.substring(boundaryIndex + 2)
                    const parsedData = parseSseChunk(sseEvent)
                    if (parsedData) {
                        if (parsedData.chunk !== undefined) {
                            fullResponse += parsedData.chunk
                            res.write(sseEvent)
                        } else if (parsedData.event === 'end') {
                        } else {
                            res.write(sseEvent)
                        }
                    } else {
                        res.write(sseEvent)
                    }
                }
            })
            aiResponse.data.on('end', async () => {
                if (buffer.trim()) {
                    const parsedData = parseSseChunk(buffer);
                    if (parsedData && parsedData.chunk !== undefined) {
                        fullResponse += parsedData.chunk;
                    }
                    res.write(buffer);
                }
                res.write(`data: ${JSON.stringify({ event: 'end' })}\n\n`);
                res.end()
            })
            aiResponse.data.on('error', (err: Error) => {
                res.write(`data: ${JSON.stringify({ event: 'error', message: 'AI processing error' })}\n\n`);
                res.end();
            });
        } catch (error) {
            res.write(`data: ${JSON.stringify({ event: 'error', message: 'AI service unavailable' })}\n\n`);
            res.end();
        }
        return
    }

    let dbConversationId: string
    let userMessageId: string
    let asMessageId: string
    try {
        if (conversation_id) {
            const existingConv = await Conversation.findOne({
                where: { id: conversation_id, user_id: userId }
            })
            if (!existingConv) {
                res.status(404).json(failure('Conversation not found', 'NOT_FOUND'));
                return;
            }
            dbConversationId = conversation_id
        } else {
            const newConv = await Conversation.create({
                user_id: userId,
                title: currentMessage.substring(0, 20)
            })
            dbConversationId = newConv.id
        }

        const userMessage = await Message.create({
            conversation_id: dbConversationId,
            role: "user",
            content: currentMessage
        })
        userMessageId = userMessage.id

    } catch (dbError) {
        console.error('Database error during setup:', dbError);
        res.status(500).json(failure('Internal server error', 'INTERNAL_ERROR'));
        return;
    }


    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('Access-Control-Allow-Origin', '*')

    let fullResponse = ''
    let buffer = ''
    try {
        const aiResponse = await axios.post(
            'http://localhost:4001/v1/ai/stream',
            { history, currentMessage, config },
            {
                responseType: 'stream',
                timeout: 30000,
                headers: { 'Content-Type': 'application/json' }
            }
        );
        // 在流式开始前发送
        res.write(`data: ${JSON.stringify({
            event: 'start',
            conversation_id: dbConversationId,
            user_message_id: userMessageId
        })}\n\n`);

        aiResponse.data.on('data', (chunk: Buffer) => {
            const chunkStr = chunk.toString();
            buffer += chunkStr
            let boundaryIndex;
            while ((boundaryIndex = buffer.indexOf('\n\n')) !== -1) {
                const sseEvent = buffer.substring(0, boundaryIndex + 2)
                buffer = buffer.substring(boundaryIndex + 2)
                const parsedData = parseSseChunk(sseEvent)
                if (parsedData) {
                    if (parsedData.chunk !== undefined) {
                        fullResponse += parsedData.chunk
                        res.write(sseEvent)
                    } else if (parsedData.event === 'end') {
                        console.log('Intercepted "end" event from AI engine, will send enhanced version later.');
                    } else {
                        res.write(sseEvent)
                    }
                } else {
                    res.write(sseEvent)
                }

            }
        })
        aiResponse.data.on('end', async () => {
            if (buffer.trim()) {
                const parsedData = parseSseChunk(buffer);
                if (parsedData && parsedData.chunk !== undefined) {
                    fullResponse += parsedData.chunk;
                }
                res.write(buffer);
            }
            console.log('AI 流结束')
            console.log(fullResponse)
            try {
                const assistantMessage = await Message.create({
                    conversation_id: dbConversationId,
                    role: 'assistant',
                    content: fullResponse
                })
                await Conversation.update(
                    { updated_at: new Date() },
                    { where: { id: dbConversationId } }
                )
                asMessageId = assistantMessage.id
            } catch (saveError) {
                console.error('Failed to save AI message:', saveError);
            }
            res.write(`data: ${JSON.stringify({ event: 'end', conversation_id: dbConversationId, message_id: asMessageId })}\n\n`);
            res.end()
        })
        aiResponse.data.on('error', (err: Error) => {
            console.error('AI 引擎数据流错误:', err);
            // 流式错误通过 SSE 通道通知
            res.write(`data: ${JSON.stringify({ event: 'error', message: 'AI processing error' })}\n\n`);
            res.end();
        });
    } catch (error) {
        console.error('调用 AI 引擎失败:', (error as any).message);
        // 如果在 axios 调用阶段就失败了（例如 ECONNREFUSED），我们仍然可以通过 SSE 通知
        // 但为了统一，这里也通过 SSE 通道发送错误
        res.write(`data: ${JSON.stringify({ event: 'error', message: 'AI service unavailable' })}\n\n`);
        res.end();
    }
}