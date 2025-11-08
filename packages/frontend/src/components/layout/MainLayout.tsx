import { Outlet } from 'react-router-dom';
import { FaComment, FaCog, FaUser } from 'react-icons/fa';
/**
 * 主应用布局组件。
 * 包含全局侧边栏和主工作区。
 */
const MainLayout = () => {
    return (
        <div className="flex h-screen bg-gray-50">
            {/* 全局主侧边栏 */}
            <aside className="w-16 bg-gray-800 flex flex-col items-center py-4 space-y-8">
                {/* 用户头像占位符 */}
                <div className="w-8 h-8 rounded-full bg-gray-200 cursor-pointer" title="用户菜单" />

                {/* 导航项 */}
                <nav className="flex-1">
                    <ul className="space-y-6">
                        {/* 这里暂时硬编码，后续可重构为数据驱动 */}
                        <li>
                            <a
                                href="/app/chat"
                                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white bg-blue-600 text-white"
                            // 注意：实际项目中应使用 NavLink，此处因简化占位而用 a 标签
                            >
                                <FaComment />
                            </a>
                        </li>
                        <li>
                            <div className="w-8 h-8 text-gray-500 opacity-50" title="翻译功能敬请期待">
                                <FaUser /> {/* 临时用 FaUser 代替翻译图标 */}
                            </div>
                        </li>
                        <li>
                            <a
                                href="/app/settings"
                                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white"
                            >
                                <FaCog />
                            </a>
                        </li>
                    </ul>
                </nav>
            </aside>

            {/* 主工作区 */}
            <main className="flex-1 overflow-hidden">
                <Outlet />
            </main>
        </div>
    );
};

export default MainLayout;
