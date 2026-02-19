import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const AboutCard = () => {
    return (
        <Card className="backdrop-blur-sm bg-card/50">
            <CardHeader>
                <CardTitle>关于</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>Lumen Chat App</p>
                <p>一个具有浮窗智解的 AI agent 应用</p>
                <div className="pt-2">
                    <a
                        href="https://github.com/XuFortune/lumen-chat-app"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                    >
                        GitHub 仓库
                    </a>
                </div>
            </CardContent>
        </Card>
    );
};
