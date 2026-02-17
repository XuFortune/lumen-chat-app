
import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight, CheckCircle2, RotateCw, AlertCircle } from 'lucide-react';

interface ToolCallCardProps {
    toolName: string;
    description?: string;
    args: Record<string, any>;
    result?: string;
    isError?: boolean;
    isLoading?: boolean;
}

export const ToolCallCard: React.FC<ToolCallCardProps> = ({
    toolName,
    description,
    args,
    result,
    isError,
    isLoading
}) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="my-2 border rounded-md overflow-hidden bg-gray-50/50 dark:bg-gray-800/30 border-gray-200 dark:border-gray-700 text-sm">
            {/* Header */}
            <div
                className="flex items-center gap-2 p-2 px-3 bg-gray-100/50 dark:bg-gray-800/50 cursor-pointer hover:bg-gray-200/50 dark:hover:bg-gray-700/50 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex-shrink-0 text-gray-500">
                    {isLoading ? (
                        <RotateCw className="w-4 h-4 animate-spin text-blue-500" />
                    ) : isError ? (
                        <AlertCircle className="w-4 h-4 text-red-500" />
                    ) : (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                    )}
                </div>

                <div className="flex-1 font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded text-xs">Tool</span>
                    {toolName}
                </div>

                <div className="text-gray-400">
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </div>
            </div>

            {/* Content */}
            {isExpanded && (
                <div className="p-3 border-t border-gray-200 dark:border-gray-700 space-y-3 font-mono text-xs">
                    {/* Arguments */}
                    <div>
                        <div className="text-gray-500 mb-1 uppercase tracking-wider text-[10px]">Input</div>
                        <div className="bg-white dark:bg-gray-950 p-2 rounded border border-gray-200 dark:border-gray-800 overflow-x-auto">
                            <pre className="text-gray-800 dark:text-gray-200">
                                {JSON.stringify(args, null, 2)}
                            </pre>
                        </div>
                    </div>

                    {/* Result */}
                    {(result || isError) && (
                        <div>
                            <div className="text-gray-500 mb-1 uppercase tracking-wider text-[10px]">Output</div>
                            <div className={cn(
                                "bg-white dark:bg-gray-950 p-2 rounded border overflow-x-auto",
                                isError
                                    ? "border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-300"
                                    : "border-gray-200 dark:border-gray-800 text-gray-800 dark:text-gray-200"
                            )}>
                                <pre className="whitespace-pre-wrap break-words">
                                    {result}
                                </pre>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
