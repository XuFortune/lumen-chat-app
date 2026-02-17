
import { ToolResult } from 'shared-types';
import { Tool } from './index';

export const calculatorTool: Tool = {
    name: "calculator",
    label: "计算器",
    description: "执行数学计算，支持基本运算（加减乘除、幂运算等）",
    parameters: {
        type: "object",
        properties: {
            expression: {
                type: "string",
                description:
                    "数学表达式，例如：2 + 3 * 4、Math.sqrt(16)、Math.pow(2, 10)",
            },
        },
        required: ["expression"],
    },
    execute: async (args: { expression: string }): Promise<ToolResult> => {
        try {
            // 安全的数学表达式求值（仅允许数学运算）
            const sanitized = args.expression.replace(
                /[^0-9+\-*/().,%\s]|Math\.\w+/g,
                (match) => {
                    if (/^Math\.\w+$/.test(match)) return match; // 允许 Math 方法
                    return "";
                },
            );
            // eslint-disable-next-lineno-new-func
            const result = new Function(
                `"use strict"; return (${sanitized})`,
            )();
            return { content: `计算结果：${args.expression} = ${result}` };
        } catch {
            return { content: `无法计算表达式：${args.expression}`, isError: true };
        }
    },
};
