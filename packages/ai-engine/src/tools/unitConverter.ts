
import { ToolResult } from 'shared-types';
import { Tool } from './index';

export const unitConverterTool: Tool = {
    name: "unit_converter",
    label: "单位转换",
    description: "进行常见单位之间的转换。支持长度、重量、温度等。",
    parameters: {
        type: "object",
        properties: {
            value: {
                type: "number",
                description: "需要转换的数值",
            },
            from_unit: {
                type: "string",
                description: "源单位 (e.g., 'km', 'm', 'kg', 'lb', 'celsius', 'fahrenheit')",
            },
            to_unit: {
                type: "string",
                description: "目标单位",
            },
        },
        required: ["value", "from_unit", "to_unit"],
    },
    execute: async (args: { value: number; from_unit: string; to_unit: string }): Promise<ToolResult> => {
        const { value, from_unit, to_unit } = args;
        const from = from_unit.toLowerCase();
        const to = to_unit.toLowerCase();

        let result: number | null = null;

        // Length
        const lengthUnits: Record<string, number> = {
            'km': 1000, 'm': 1, 'cm': 0.01, 'mm': 0.001,
            'mile': 1609.34, 'yard': 0.9144, 'foot': 0.3048, 'inch': 0.0254
        };

        // Weight
        const weightUnits: Record<string, number> = {
            'kg': 1000, 'g': 1, 'mg': 0.001,
            'lb': 453.592, 'oz': 28.3495
        };

        if (lengthUnits[from] && lengthUnits[to]) {
            result = (value * lengthUnits[from]) / lengthUnits[to];
        } else if (weightUnits[from] && weightUnits[to]) {
            result = (value * weightUnits[from]) / weightUnits[to];
        } else if (from === 'celsius' && to === 'fahrenheit') {
            result = (value * 9 / 5) + 32;
        } else if (from === 'fahrenheit' && to === 'celsius') {
            result = (value - 32) * 5 / 9;
        }

        if (result !== null) {
            // Format to max 4 decimal places
            const formattedResult = parseFloat(result.toFixed(4));
            return {
                content: `${value} ${from_unit} = ${formattedResult} ${to_unit}`,
                display: `🔄 ${value} ${from_unit} ➡ ${formattedResult} ${to_unit}`
            };
        } else {
            return {
                content: `无法转换 ${from_unit} 到 ${to_unit}。支持的单位类型需一致（长度/重量/温度）。`,
                isError: true
            };
        }
    },
};
