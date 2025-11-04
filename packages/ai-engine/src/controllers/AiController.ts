// packages/ai-engine/src/controllers/AiController.ts
import type { Request, Response } from 'express';

// 模拟一个简单的异步延迟函数
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const handleChatStream = async (req: Request, res: Response) => {
    console.log('⚙️ handleChatStream called');

    // 设置超时
    const timeoutId = setTimeout(() => {
        console.error('❌ Request timeout for /chat/stream');
        if (!res.headersSent) {
            res.status(504).json({ error: 'Gateway Timeout' });
        }
        res.end();
    }, 30000);

    try {
        const { current_message: userMessage } = req.body;
        console.log('📝 Received message:', userMessage);

        if (!userMessage || typeof userMessage !== 'string') {
            clearTimeout(timeoutId);
            return res.status(400).json({ error: 'Missing or invalid "current_message"' });
        }

        const simulatedAiResponse = `Echo: "${userMessage}". This is a simulated streaming response.`;
        console.log('🤖 Starting to send simulated response...');

        // 【关键修改】直接设置响应头并开始写入
        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders(); // 立即发送响应头

        // 【关键修改】逐字写入响应
        for (const char of simulatedAiResponse) {
            // 检查客户端是否已断开
            if (res.destroyed) {
                console.log('🔌 Client disconnected during streaming');
                break;
            }
            res.write(char);
            await sleep(30); // 30ms delay
        }

        console.log('✅ Streaming completed');
        clearTimeout(timeoutId); // 清除超时
        res.end(); // 正式结束响应

    } catch (error: any) {
        clearTimeout(timeoutId);
        console.error('💥 Unhandled error in handleChatStream:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Internal Server Error' });
        } else if (!res.destroyed) {
            // 如果已经发送了头，尝试发送一个错误 chunk (但这对于 octet-stream 不标准)
            // 最好直接结束
            res.end();
        }
    }
};
