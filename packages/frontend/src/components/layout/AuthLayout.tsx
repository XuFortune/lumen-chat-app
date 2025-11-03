import type { ReactNode } from "react";
interface AuthLayoutProps {
    children: ReactNode,
    title: string,
    subtitle: string
}

export const AuthLayout = ({ children, title, subtitle }: AuthLayoutProps) => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-blue-50 p-4">
            <div className="w-full max-w-md bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
                <div className="p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-bold text-gray-900">浮光 Lumen</h1>
                        <p className="mt-2 text-sm text-gray-500">{subtitle}</p>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    )
}