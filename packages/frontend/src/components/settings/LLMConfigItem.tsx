import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Edit, Trash2, Check, Key, Globe } from "lucide-react";
import type { LLMConfig, LLMProvider } from "@/types";

interface LLMConfigItemProps {
    config: LLMConfig;
    providerOptions: { value: LLMProvider; label: string }[];
    onEdit: (config: LLMConfig) => void;
    onDelete: (configId: string) => void;
    onSetDefault: (configId: string) => void;
}

// 隐藏 API Key（显示前4位和后4位）
const maskApiKey = (key: string) => {
    if (key.length <= 8) return key;
    return `${key.slice(0, 4)}${"*".repeat(Math.min(key.length - 8, 20))}${key.slice(-4)}`;
};

export const LLMConfigItem = ({
    config,
    providerOptions,
    onEdit,
    onDelete,
    onSetDefault,
}: LLMConfigItemProps) => {
    const providerLabel = providerOptions.find((p) => p.value === config.provider)?.label || config.provider;

    return (
        <div
            className={cn(
                "p-4 rounded-lg border transition-all",
                config.isDefault
                    ? "bg-primary/5 border-primary/30"
                    : "bg-card/50 border-border hover:border-border/80"
            )}
        >
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                        <span className="font-medium">{providerLabel}</span>
                        <span className="text-muted-foreground">/</span>
                        <span className="font-mono text-sm">{config.model}</span>
                        {config.isDefault && (
                            <span className="px-2 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
                                默认
                            </span>
                        )}
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <Key className="h-3.5 w-3.5" />
                            <code className="text-xs">{maskApiKey(config.apiKey)}</code>
                        </div>
                        {config.baseUrl && (
                            <div className="flex items-center gap-2">
                                <Globe className="h-3.5 w-3.5" />
                                <span className="text-xs truncate">{config.baseUrl}</span>
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    {!config.isDefault && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onSetDefault(config.id!)}
                            title="设为默认"
                        >
                            <Check className="h-4 w-4" />
                        </Button>
                    )}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(config)}
                        title="编辑"
                    >
                        <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(config.id!)}
                        title="删除"
                        className="text-destructive hover:text-destructive"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
};
