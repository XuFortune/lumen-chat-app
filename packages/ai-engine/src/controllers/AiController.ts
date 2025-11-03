// packages/ai-engine/src/controllers/AiController.ts
import type { Request, Response } from 'express';
import { Readable } from 'stream';

/**
 * 将字符串拆分成单个字符的异步生成器，用于模拟 token 流。
 * @param text 要流式传输的文本
 * @param delayMs 每个字符之间的延迟（毫秒）
 */
async function* generateCharacterStream(text: string, delayMs: number = 50) {
    for (const char of text) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
        yield char;
    }
}

/**
 * 创建一个 Node.js Readable 流，用于流式传输文本。
 */
function createTextStream(text: string, delayMs: number = 50): Readable {
    return Readable.from(generateCharacterStream(text, delayMs));
}

/**
 * 控制器：处理 /v1/chat/stream 请求。
 * 接收历史记录和当前消息，返回一个模拟的 AI 响应流。
 */
export const handleChatStream = async (req: Request, res: Response) => {
    try {
        // 1. 验证请求体 (简化版)
        const { current_message: userMessage } = req.body;
        if (!userMessage || typeof userMessage !== 'string') {
            return res.status(400).json({ error: 'Missing or invalid "current_message"' });
        }

        // 2. 【模拟】根据用户消息生成一个固定的 AI 响应
        // 在真实场景中，这里会调用 LangChain.js 和外部 LLM
        const simulatedAiResponse = `I received your message: "${userMessage}". This is a simulated streaming response from the AI engine. It demonstrates the streaming capability without calling a real LLM.`;

        // 3. 设置响应头，表明这是一个流
        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        // 4. 创建并发送流
        const stream = createTextStream(simulatedAiResponse, 30); // 30ms 延迟，模拟快速打字
        stream.pipe(res);

        // 5. 处理流结束和错误
        stream.on('end', () => {
            console.log('✅ AI Engine stream completed.');
        });

        stream.on('error', (err) => {
            console.error('❌ Error in AI Engine stream:', err);
            if (!res.headersSent) {
                res.status(500).json({ error: 'Internal Server Error in AI Engine' });
            }
        });

    } catch (error) {
        console.error('❌ Error in handleChatStream:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
};
