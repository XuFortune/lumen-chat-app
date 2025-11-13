import { FaComment, FaCog, FaUser } from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';
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

export const GlobalSiderbar = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // 判断当前是否是激活状态
    const isActive = (path: string) => {
        return location.pathname === path;
    };

    return (
        <aside className="w-16 bg-gray-800 flex flex-col items-center py-4 space-y-8 h-full">
            {/* 用户头像占位符 */}
            <DropdownMenu>
                <DropdownMenuTrigger>
                    <Avatar>
                        <AvatarImage src="https://github.com/shadcn.png" />
                        {/* <AvatarFallback>用户</AvatarFallback> */}
                    </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuLabel>我的账户</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/app/settings')}>
                        个人资料
                    </DropdownMenuItem>
                    <DropdownMenuItem>账单</DropdownMenuItem>
                    <DropdownMenuItem>团队</DropdownMenuItem>
                    <DropdownMenuItem>订阅</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* 导航项 */}
            <nav className="flex-1 h-full flex flex-col items-center space-y-6">
                <Button
                    className={`bg-transparent hover:bg-gray-700 ${isActive('/app/chat') || isActive('/app') ? 'bg-gray-700 text-white' : 'text-gray-400'
                        }`}
                    onClick={() => navigate('/app/chat')}
                    title="聊天"
                >
                    <FaComment />
                </Button>

                <Button
                    className="bg-transparent text-gray-500 opacity-50 hover:bg-gray-700 cursor-not-allowed"
                    disabled
                    title="翻译功能敬请期待"
                >
                    <FaUser />
                </Button>
            </nav>

            <Button
                className={`bg-transparent hover:bg-gray-700 ${isActive('/app/settings') ? 'bg-gray-700 text-white' : 'text-gray-400'
                    }`}
                onClick={() => navigate('/app/settings')}
                title="设置"
            >
                <FaCog />
            </Button>
        </aside>
    )
}
