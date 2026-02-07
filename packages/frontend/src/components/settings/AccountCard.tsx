import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import type { User } from "@/types";

interface AccountCardProps {
    user: User | null;
}

export const AccountCard = ({ user }: AccountCardProps) => {
    return (
        <Card className="backdrop-blur-sm bg-card/50">
            <CardHeader>
                <CardTitle>账户</CardTitle>
                <CardDescription>查看你的账户信息</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label>用户名</Label>
                    <div className="text-sm">{user?.username}</div>
                </div>
                <div className="space-y-2">
                    <Label>账户 ID</Label>
                    <div className="text-sm font-mono text-muted-foreground">
                        {user?.id}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
