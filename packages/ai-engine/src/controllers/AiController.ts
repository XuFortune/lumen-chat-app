// packages/ai-engine/src/controllers/AiController.ts

import { ChatOpenAI } from "@langchain/openai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { Request, Response } from "express";
import { Readable } from 'stream';
export interface AiMessage {
    role: 'user' | 'assistant';
    content: string;
}
export interface AiConfig {
    provider: 'openai' | 'google';
    model: string;
    apiKey: string;
    baseUrl?: string;
}
export interface AiStreamRequest {
    history: AiMessage[];
    currentMessage: string;
    config: AiConfig;
}
export interface AiStreamResponse {
    chunk?: string;
    event?: 'end';
}
export const handleAiStream = async (req: Request, res: Response) => {
    try {
        const { history, currentMessage, config } = req.body as AiStreamRequest;
        console.log('history', history)
        console.log('currentMessage', currentMessage)
        console.log('config ', config)
        // 1. 构造消息历史
        const langChainMessages = history.map(msg =>
            msg.role === 'user' ? new HumanMessage(msg.content) : new AIMessage(msg.content)
        );
        langChainMessages.push(new HumanMessage(currentMessage));

        // 2. 根据 provider 选择 LLM（关键改进！）
        let llm;

        if (config.provider === 'openai') {
            // 所有 OpenAI 兼容服务（包括 OpenAI、Groq、TogetherAI、Ollama 等）
            if (!config.baseUrl) {
                return res.status(400).json({
                    error: "baseUrl is required for OpenAI-compatible providers"
                });
            }

            llm = new ChatOpenAI({
                model: config.model,
                apiKey: config.apiKey,
                configuration: {
                    baseURL: config.baseUrl
                }
            });
        }
        else if (config.provider === 'google') {
            // Google Gemini
            llm = new ChatGoogleGenerativeAI({
                model: config.model,
                apiKey: config.apiKey,
            });
        }
        else {
            return res.status(400).json({
                error: `Unsupported provider: ${config.provider}`
            });
        }

        // 3. 流式处理
        const stream = await llm.stream(langChainMessages);

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        for await (const chunk of stream) {
            if (chunk.content) {
                // 注意：需要转义 JSON 字符串中的特殊字符
                const safeContent = JSON.stringify(chunk.content);
                res.write(`data: {"chunk": ${safeContent}}\n\n`);
            }
        }

        res.write(`data: {"event": "end"}\n\n`);
        res.end();

    } catch (error: any) {
        console.error('AI Engine Error:', error);

        // 根据错误类型返回不同的响应
        if (error.status === 401 || error.status === 403) {
            return res.status(400).json({
                code: "INVALID_API_KEY",
                message: "Invalid API key provided"
            });
        }
        if (error.name === 'TimeoutError' || error.code === 'ECONNABORTED') {
            return res.status(504).json({
                code: "LLM_TIMEOUT",
                message: "LLM service timeout"
            });
        }
        return res.status(502).json({
            code: "LLM_SERVICE_ERROR",
            message: error.message || "LLM service error"
        });
    }

};
