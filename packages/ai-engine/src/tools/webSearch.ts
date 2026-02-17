
import { ToolResult } from 'shared-types';
import { Tool } from './index';

export const webSearchTool: Tool = {
    name: "web_search",
    label: "网络搜索",
    description:
        "搜索互联网获取最新信息。当用户询问实时资讯、最新新闻或你不确定的信息时使用",
    parameters: {
        type: "object",
        properties: {
            query: {
                type: "string",
                description: "搜索关键词",
            },
        },
        required: ["query"],
    },
    execute: async (args: { query: string }): Promise<ToolResult> => {
        // 方案 A：接入 Tavily API（推荐，专为 AI Agent 设计的搜索 API）
        // const response = await fetch('https://api.tavily.com/search', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({
        //     api_key: process.env.TAVILY_API_KEY,
        //     query: args.query,
        //     max_results: 5,
        //   }),
        // });
        // const data = await response.json();
        // return { content: data.results.map(r => `${r.title}: ${r.content}`).join('\n') };

        // 方案 B：MVP 阶段用模拟数据
        console.log(`[Mock Search] Searching for: ${args.query}`);

        // 模拟延迟
        await new Promise(resolve => setTimeout(resolve, 1000));

        return {
            content: `[搜索结果] 关于"${args.query}"的搜索结果：\n1. "${args.query}" 的定义 - 维基百科\n2. "${args.query}" 相关新闻 - 新浪网\n3. "${args.query}" 在 Github 上的讨论\n(这是模拟结果，展示搜索功能已调用)`,
            display: `🔍 已搜索 "${args.query}"，找到 3 条相关结果`
        };
    },
};
