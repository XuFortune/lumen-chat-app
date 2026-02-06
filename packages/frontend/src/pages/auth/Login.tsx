import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../../services/authService';
import type { LoginRequest } from '../../types';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { useAuthStore } from '../../store/useAuthStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export const Login = () => {
    const [formData, setFormData] = useState<LoginRequest>({
        username: '',
        password: ''
    })
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState<boolean>(false)

    const navigate = useNavigate()

    // 表单收集
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData((prev) => ({ ...prev, [name]: value }))
        if (error) setError(null)
    }

    // 登录提交
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const { token, username } = await authService.login(formData);
            useAuthStore.getState().login(token, username)
            navigate('/app'); // 登录成功跳转主界面
            console.log('登录成功')
        } catch (err: any) {
            setError(err.message || '登录失败，请检查用户名和密码');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout title="Welcome back" subtitle="Enter your credentials to access your account">
            {error && (
                <div className="mb-4 p-3 text-sm text-destructive bg-destructive/10 rounded-lg border border-destructive/20">
                    {error}
                </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <label htmlFor="username" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Username
                    </label>
                    <Input
                        id="username"
                        name="username"
                        type="text"
                        placeholder="name@example.com"
                        value={formData.username}
                        onChange={handleChange}
                        required
                        className="h-11"
                    />
                </div>
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <label htmlFor="password" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Password
                        </label>
                        <Link
                            to="/forgot-password"
                            className="text-sm font-medium text-primary hover:text-primary/80"
                        >
                            Forgot password?
                        </Link>
                    </div>
                    <Input
                        id="password"
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        className="h-11"
                    />
                </div>
                <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11"
                >
                    {loading ? 'Signing in...' : 'Sign in'}
                </Button>
            </form>
            <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                    Don't have an account?{' '}
                    <Link to="/register" className="font-medium text-primary hover:text-primary/80 underline-offset-4 hover:underline">
                        Sign up
                    </Link>
                </p>
            </div>
        </AuthLayout>
    );
}