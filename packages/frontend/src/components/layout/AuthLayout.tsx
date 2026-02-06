import type { ReactNode } from "react";

interface AuthLayoutProps {
    children: ReactNode,
    title: string,
    subtitle: string
}

export const AuthLayout = ({ children, title, subtitle }: AuthLayoutProps) => {
    return (
        <div className="min-h-screen w-full lg:grid lg:grid-cols-2 overflow-hidden">
            {/* Left: Branding Area */}
            <div className="hidden lg:flex flex-col items-center justify-center relative bg-muted text-white overflow-hidden">
                <div className="absolute inset-0 bg-primary/20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-500/40 via-purple-500/20 to-background/0 animate-pulse-glow" style={{ animationDuration: '4s' }}></div>
                <div className="absolute top-0 -left-4 w-96 h-96 bg-primary/30 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                <div className="absolute top-0 -right-4 w-96 h-96 bg-fuchsia-500/30 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

                <div className="relative z-20 flex flex-col items-center text-center p-8 backdrop-blur-sm bg-white/5 rounded-2xl border border-white/10 shadow-2xl">
                    <div className="h-16 w-16 bg-gradient-to-tr from-primary to-fuchsia-600 rounded-2xl flex items-center justify-center shadow-lg mb-6">
                        <span className="text-3xl font-bold text-white">L</span>
                    </div>
                    <h1 className="text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-primary-foreground to-white">
                        Lumen
                    </h1>
                    <p className="text-lg text-primary-foreground/80 max-w-sm mt-4">
                        Experience the fluid future of AI communication.
                    </p>
                </div>
            </div>

            {/* Right: Form Area */}
            <div className="flex items-center justify-center p-8 bg-background">
                <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[380px]">
                    <div className="flex flex-col space-y-2 text-center">
                        <h1 className="text-2xl font-semibold tracking-tight">
                            {title}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {subtitle}
                        </p>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    )
}