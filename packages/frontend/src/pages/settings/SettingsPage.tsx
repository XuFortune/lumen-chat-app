import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { authService } from "@/services/authService";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { LLMConfig, LLMProvider } from "@/types";
import {
    LLMConfigCard,
    LLMConfigDialog,
    AccountCard,
    AboutCard
} from "@/components/settings";

const SettingsPage = () => {
    const { user } = useAuthStore();
    const [configs, setConfigs] = useState<LLMConfig[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Dialog state
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingConfig, setEditingConfig] = useState<LLMConfig | null>(null);
    const [formData, setFormData] = useState({
        provider: "openai" as LLMProvider,
        model: "",
        apiKey: "",
        baseUrl: "",
    });

    // 加载配置
    useEffect(() => {
        if (user?.llm_configs) {
            setConfigs(user.llm_configs);
        }
    }, [user]);

    // Provider 选项
    const providerOptions: { value: LLMProvider; label: string }[] = [
        { value: "openai", label: "OpenAI" },
        { value: "gemini", label: "Google Gemini" },
    ];

    // 打开添加对话框
    const handleAdd = () => {
        setEditingConfig(null);
        setFormData({
            provider: "openai",
            model: "",
            apiKey: "",
            baseUrl: "",
        });
        setIsDialogOpen(true);
        setError(null);
    };

    // 打开编辑对话框
    const handleEdit = (config: LLMConfig) => {
        setEditingConfig(config);
        setFormData({
            provider: config.provider,
            model: config.model,
            apiKey: config.apiKey,
            baseUrl: config.baseUrl || "",
        });
        setIsDialogOpen(true);
        setError(null);
    };

    // 删除配置
    const handleDelete = (configId: string) => {
        if (configs.length === 1) {
            setError("至少需要保留一个配置");
            return;
        }
        const newConfigs = configs.filter((c) => c.id !== configId);
        // 如果删除的是默认配置，设置第一个为默认
        if (configs.find((c) => c.id === configId)?.isDefault && newConfigs.length > 0) {
            newConfigs[0].isDefault = true;
        }
        updateConfigs(newConfigs);
    };

    // 设为默认
    const handleSetDefault = (configId: string) => {
        const newConfigs = configs.map((c) => ({
            ...c,
            isDefault: c.id === configId,
        }));
        updateConfigs(newConfigs);
        setSuccess("已设置为默认配置");
        setTimeout(() => setSuccess(null), 2000);
    };

    // 保存配置
    const handleSave = () => {
        // 验证
        if (!formData.model.trim()) {
            setError("请输入模型名称");
            return;
        }
        if (!formData.apiKey.trim()) {
            setError("请输入 API Key");
            return;
        }

        let newConfigs: LLMConfig[];

        if (editingConfig) {
            // 编辑现有配置
            newConfigs = configs.map((c) =>
                c.id === editingConfig.id
                    ? {
                        ...c,
                        provider: formData.provider,
                        model: formData.model.trim(),
                        apiKey: formData.apiKey.trim(),
                        baseUrl: formData.baseUrl.trim() || undefined,
                    }
                    : c
            );
        } else {
            // 添加新配置
            const newConfig: LLMConfig = {
                id: crypto.randomUUID(),
                provider: formData.provider,
                model: formData.model.trim(),
                apiKey: formData.apiKey.trim(),
                baseUrl: formData.baseUrl.trim() || undefined,
                isDefault: configs.length === 0,
                createdAt: new Date().toISOString(),
            };
            newConfigs = [...configs, newConfig];
        }

        updateConfigs(newConfigs);
        setIsDialogOpen(false);
        setSuccess(editingConfig ? "配置已更新" : "配置已添加");
        setTimeout(() => setSuccess(null), 2000);
    };

    // 更新配置（保存到后端）
    const updateConfigs = async (newConfigs: LLMConfig[]) => {
        try {
            setConfigs(newConfigs);
            await authService.updateLLMConfigs(newConfigs);
        } catch (err: any) {
            console.error("Failed to update configs:", err);
            setError(err.message || "保存失败");
            // 回滚本地状态
            setConfigs(configs);
        }
    };

    return (
        <div className="h-full overflow-auto">
            <ScrollArea className="h-full">
                <div className="max-w-4xl mx-auto p-8 space-y-6">
                    {/* 页面标题 */}
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold tracking-tight">设置</h1>
                        <p className="text-muted-foreground">
                            管理你的 AI 模型配置和账户设置
                        </p>
                    </div>

                    {/* 成功/错误提示 */}
                    {success && (
                        <div className="p-4 text-sm text-green-700 bg-green-100 dark:bg-green-900/20 dark:text-green-400 rounded-lg border border-green-200 dark:border-green-800">
                            {success}
                        </div>
                    )}
                    {error && (
                        <div className="p-4 text-sm text-destructive bg-destructive/10 rounded-lg border border-destructive/20">
                            {error}
                        </div>
                    )}

                    {/* LLM 配置卡片 */}
                    <LLMConfigCard
                        configs={configs}
                        providerOptions={providerOptions}
                        onAdd={handleAdd}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onSetDefault={handleSetDefault}
                    />

                    {/* 账户信息卡片 */}
                    <AccountCard user={user} />

                    {/* 关于卡片 */}
                    <AboutCard />
                </div>
            </ScrollArea>

            {/* 添加/编辑配置对话框 */}
            <LLMConfigDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                editingConfig={editingConfig}
                formData={formData}
                onFormDataChange={setFormData}
                onSave={handleSave}
            />
        </div>
    );
};

export default SettingsPage;
