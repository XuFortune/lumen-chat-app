import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { LLMConfig, LLMProvider } from "@/types";

interface LLMConfigDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editingConfig: LLMConfig | null;
    formData: {
        provider: LLMProvider;
        model: string;
        apiKey: string;
        baseUrl: string;
    };
    onFormDataChange: (data: { provider: LLMProvider; model: string; apiKey: string; baseUrl: string }) => void;
    onSave: () => void;
}

const providerOptions: { value: LLMProvider; label: string }[] = [
    { value: "openai", label: "OpenAI" },
    { value: "gemini", label: "Google Gemini" },
];


export const LLMConfigDialog = ({
    open,
    onOpenChange,
    editingConfig,
    formData,
    onFormDataChange,
    onSave,
}: LLMConfigDialogProps) => {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>
                        {editingConfig ? "编辑配置" : "添加配置"}
                    </DialogTitle>
                    <DialogDescription>
                        配置你的 AI 提供商信息
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    {/* Provider 选择 */}
                    <div className="space-y-2">
                        <Label htmlFor="provider">提供商</Label>
                        <div className="grid grid-cols-2 gap-2">
                            {providerOptions.map((option) => (
                                <Button
                                    key={option.value}
                                    type="button"
                                    variant={
                                        formData.provider === option.value
                                            ? "default"
                                            : "outline"
                                    }
                                    onClick={() =>
                                        onFormDataChange({ ...formData, provider: option.value })
                                    }
                                >
                                    <span className="text-sm">{option.label}</span>
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* 模型名称 */}
                    <div className="space-y-2">
                        <Label htmlFor="model">模型名称</Label>
                        <Input
                            id="model"
                            value={formData.model}
                            onChange={(e) =>
                                onFormDataChange({ ...formData, model: e.target.value })
                            }
                            placeholder="请输入模型名称"
                            className="font-mono"
                        />

                    </div>

                    {/* API Key */}
                    <div className="space-y-2">
                        <Label htmlFor="apiKey">API Key</Label>
                        <Input
                            id="apiKey"
                            type="password"
                            value={formData.apiKey}
                            onChange={(e) =>
                                onFormDataChange({ ...formData, apiKey: e.target.value })
                            }
                            placeholder="sk-..."
                            className="font-mono"
                        />
                    </div>

                    {/* Base URL (选填) - Google Gemini 不显示 */}
                    {formData.provider !== "gemini" && (
                        <div className="space-y-2">
                            <Label htmlFor="baseUrl">Base URL（选填）</Label>
                            <Input
                                id="baseUrl"
                                value={formData.baseUrl}
                                onChange={(e) =>
                                    onFormDataChange({ ...formData, baseUrl: e.target.value })
                                }
                                placeholder="https://api.openai.com/v1"
                                className="font-mono"
                            />
                            <p className="text-xs text-muted-foreground">
                                OpenAI 兼容接口的 Base URL，不填则使用默认地址
                            </p>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        取消
                    </Button>
                    <Button onClick={onSave}>
                        {editingConfig ? "保存" : "添加"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
