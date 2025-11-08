// src/pages/Register.tsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../../services/authService';
import type { RegisterRequest } from '../../types';
import { AuthLayout } from '../../components/layout/AuthLayout';

export const Register = () => {
    const [formData, setFormData] = useState<RegisterRequest>({
        username: '',
        password: '',
    });
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (error) setError(null);
    };

    const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setConfirmPassword(e.target.value);
        if (error) setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // 前端密码一致性校验
        if (formData.password !== confirmPassword) {
            setError('两次输入的密码不一致');
            return;
        }

        // 简单密码强度校验（可选）
        if (formData.password.length < 6) {
            setError('密码至少需要 6 位字符');
            return;
        }

        setLoading(true);
        try {
            await authService.register(formData);
            // 注册成功后跳转到登录页（更安全）
            navigate('/login', {
                state: { message: '注册成功，请登录' }
            });
        } catch (err: any) {
            setError(err.message || '注册失败');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout title="注册" subtitle="创建您的浮光账号">
            {error && (
                <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-200">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                        用户名
                    </label>
                    <input
                        id="username"
                        name="username"
                        type="text"
                        value={formData.username}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                        minLength={3}
                    />
                </div>

                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                        密码
                    </label>
                    <input
                        id="password"
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                    />
                </div>

                <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                        确认密码
                    </label>
                    <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={handleConfirmPasswordChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                >
                    {loading ? '注册中...' : '注册'}
                </button>
            </form>

            <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                    已有账号？{' '}
                    <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
                        立即登录
                    </Link>
                </p>
            </div>
        </AuthLayout>
    );
};
