import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Key } from "lucide-react";
import type { LLMConfig, LLMProvider } from "@/types";
import { LLMConfigItem } from "./LLMConfigItem";

interface LLMConfigCardProps {
    configs: LLMConfig[];
    providerOptions: { value: LLMProvider; label: string }[];
    onAdd: () => void;
    onEdit: (config: LLMConfig) => void;
    onDelete: (configId: string) => void;
    onSetDefault: (configId: string) => void;
}

export const LLMConfigCard = ({
    configs,
    providerOptions,
    onAdd,
    onEdit,
    onDelete,
    onSetDefault,
}: LLMConfigCardProps) => {
    return (
        <Card className="backdrop-blur-sm bg-card/50">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>LLM 配置</CardTitle>
                        <CardDescription>
                            配置你的 AI 提供商，用于聊天和浮窗智解功能
                        </CardDescription>
                    </div>
                    <Button onClick={onAdd} size="sm" className="gap-2">
                        <Plus className="h-4 w-4" />
                        添加配置
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {configs.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <Key className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium mb-2">还没有配置</p>
                        <p className="text-sm mb-4">添加你的第一个 AI 模型配置</p>
                        <Button onClick={onAdd} variant="outline" className="gap-2">
                            <Plus className="h-4 w-4" />
                            添加配置
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {configs.map((config) => (
                            <LLMConfigItem
                                key={config.id}
                                config={config}
                                providerOptions={providerOptions}
                                onEdit={onEdit}
                                onDelete={onDelete}
                                onSetDefault={onSetDefault}
                            />
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
