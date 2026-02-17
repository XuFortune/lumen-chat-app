
import { ToolResult } from 'shared-types';
import { Tool } from './index';

export const dateTimeTool: Tool = {
    name: "get_current_time",
    label: "当前时间",
    description: "获取当前日期和时间。当用户询问现在几点、今天是几号时使用。",
    parameters: {
        type: "object",
        properties: {
            format: {
                type: "string",
                description: "可选。指定时间格式，如 'ISO', 'date', 'time', 'full'。默认为 'full'。",
                enum: ["ISO", "date", "time", "full"]
            },
        },
        required: [],
    },
    execute: async (args: { format?: string }): Promise<ToolResult> => {
        const now = new Date();
        const format = args.format || 'full';

        let content = "";

        switch (format) {
            case 'ISO':
                content = now.toISOString();
                break;
            case 'date':
                content = now.toLocaleDateString('zh-CN', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
                break;
            case 'time':
                content = now.toLocaleTimeString('zh-CN', { hour12: false });
                break;
            case 'full':
            default:
                content = now.toLocaleString('zh-CN', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false
                });
                break;
        }

        return {
            content: `当前时间 (${format}): ${content}`,
            display: `🕒 ${content}`
        };
    },
};
