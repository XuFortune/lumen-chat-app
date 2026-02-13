import {
    MessageSquare,
    Settings,
    Languages,
    LogOut,
    Plus
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";

export const GlobalSidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { logout } = useAuthStore();

    const isActive = (path: string) => {
        return location.pathname.startsWith(path);
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <aside className="
            group flex flex-col items-center py-6 w-18 h-full
            bg-sidebar/60 backdrop-blur-xl border-r border-sidebar-border
            transition-all duration-300 ease-in-out z-50
        ">
            {/* Logo / Brand Area */}
            <div className="mb-8">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-primary to-fuchsia-500 flex items-center justify-center shadow-lg shadow-primary/20">
                    <span className="text-white font-bold text-xl">L</span>
                </div>
            </div>

            {/* Navigation Items */}
            <nav className="flex-1 flex flex-col items-center gap-4 w-full px-2">

                <NavButton
                    icon={<MessageSquare size={20} />}
                    label="Chats"
                    active={isActive('/app/chat')}
                    onClick={() => navigate('/app/chat')}
                />

                <NavButton
                    icon={<Languages size={20} />}
                    label="Translate"
                    active={isActive('/app/translate')}
                    onClick={() => toast.info('敬请期待')}
                />
            </nav>

            {/* Bottom Actions */}
            <div className="mt-auto flex flex-col items-center gap-4 px-2 mb-4">
                <NavButton
                    icon={<Settings size={20} />}
                    label="Settings"
                    active={isActive('/app/settings')}
                    onClick={() => navigate('/app/settings')}
                />

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-10 w-10 rounded-full p-0 hover:ring-2 ring-primary/50 transition-all">
                            <Avatar className="h-9 w-9 border-2 border-background">
                                <AvatarImage src="https://github.com/shadcn.png" />
                                <AvatarFallback>CN</AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="right" align="end" className="w-56 ml-2 glass-panel">
                        <DropdownMenuLabel>My Account</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => navigate('/app/settings')}>
                            <Settings className="mr-2 h-4 w-4" />
                            <span>Settings</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={handleLogout}>
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Log out</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </aside>
    )
}

interface NavButtonProps {
    icon: React.ReactNode;
    label: string;
    active?: boolean;
    onClick?: () => void;
    disabled?: boolean;
    className?: string;
}

const NavButton = ({ icon, label, active, onClick, disabled, className }: NavButtonProps) => {
    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={onClick}
            disabled={disabled}
            className={cn(
                "h-10 w-10 rounded-xl transition-all duration-200 relative",
                active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md shadow-primary/20"
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                disabled && "opacity-40 cursor-not-allowed",
                className
            )}
            title={label}
        >
            {icon}
        </Button>
    )
}
