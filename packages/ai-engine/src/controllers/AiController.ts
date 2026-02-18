import { ChatOpenAI } from "@langchain/openai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { Request, Response } from "express";
import { agentLoop } from "../agent/agentLoop";
import type { AiStreamRequest, AiStreamResponse } from "shared-types";

export const handleAiStream = async (req: Request, res: Response) => {
    try {
        const { history, currentMessage, config, longTermMemory } = req.body as AiStreamRequest;

        console.log('[AiController] Received request:', {
            provider: config.provider,
            model: config.model,
            messageLength: currentMessage.length,
            hasApiKey: !!config.apiKey,
            apiKeyPrefix: config.apiKey ? config.apiKey.substring(0, 3) + '...' : 'none'
        });

        // 1. Initialize LLM
        let llm;
        if (config.provider === 'openai') {
            // OpenAI-compatible providers
            if (!config.baseUrl) {
                return res.status(400).json({ error: "baseUrl is required for OpenAI-compatible providers" });
            }
            llm = new ChatOpenAI({
                model: config.model,
                apiKey: config.apiKey, // Use apiKey directly
                configuration: {
                    baseURL: config.baseUrl,
                    apiKey: config.apiKey // Redundant but safe
                },
                temperature: 0.7,
                streaming: true
            });
        } else if (config.provider === 'google') {
            // Google Gemini
            llm = new ChatGoogleGenerativeAI({
                model: config.model,
                apiKey: config.apiKey,
                temperature: 0.7,
                streaming: true
            });
        } else {
            return res.status(400).json({ error: `Unsupported provider: ${config.provider}` });
        }

        // 2. Setup SSE
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        const writeSse = (data: AiStreamResponse) => {
            res.write(`data: ${JSON.stringify(data)}\n\n`);
        };

        // 3. Run Agent Loop
        await agentLoop(llm, history, currentMessage, writeSse, longTermMemory);

        // 4. End Stream
        // Note: The mock IDs are temporary. Real IDs should come from the request transparency if tracked.
        writeSse({
            event: "end",
            conversation_id: "unknown",
            message_id: "unknown"
        });
        res.end();

    } catch (error: any) {
        console.error('[AiController] Error:', error);

        // If headers not sent, return JSON error
        if (!res.headersSent) {
            if (error?.status === 401 || error?.status === 403) {
                return res.status(401).json({ code: "INVALID_API_KEY", message: "Invalid API key" });
            }
            return res.status(500).json({ error: error.message || "Internal Server Error" });
        } else {
            // If stream started, send error event
            res.write(`data: ${JSON.stringify({ event: "error", message: error.message })}\n\n`);
            res.end();
        }
    }
};
