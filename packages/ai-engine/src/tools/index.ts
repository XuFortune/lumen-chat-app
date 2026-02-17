
import { ToolDefinition, ToolResult } from 'shared-types';

export interface ToolExecutor {
    execute: (args: any) => Promise<ToolResult>;
}

export type Tool = ToolDefinition & ToolExecutor;

class ToolRegistry {
    private tools = new Map<string, Tool>();

    register(tool: Tool) {
        if (this.tools.has(tool.name)) {
            console.warn(`Tool ${tool.name} is already registered. Overwriting.`);
        }
        this.tools.set(tool.name, tool);
    }

    get(name: string): Tool | undefined {
        return this.tools.get(name);
    }

    async execute(name: string, args: any): Promise<ToolResult> {
        const tool = this.tools.get(name);
        if (!tool) {
            throw new Error(`Tool not found: ${name}`);
        }
        return tool.execute(args);
    }

    getAllDefinitions(): ToolDefinition[] {
        return Array.from(this.tools.values()).map(t => ({
            name: t.name,
            label: t.label,
            description: t.description,
            parameters: t.parameters
        }));
    }
}

export const toolRegistry = new ToolRegistry();

// Auto-register tools
import { calculatorTool } from './calculator';
import { webSearchTool } from './webSearch';
import { dateTimeTool } from './dateTime';
import { unitConverterTool } from './unitConverter';

toolRegistry.register(calculatorTool);
toolRegistry.register(webSearchTool);
toolRegistry.register(dateTimeTool);
toolRegistry.register(unitConverterTool);
