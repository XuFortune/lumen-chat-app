import { Outlet } from 'react-router-dom';
import { GlobalSiderbar } from './GlobalSiderbar';
/**
 * 主应用布局组件。
 * 包含全局侧边栏和主工作区。
 */
const MainLayout = () => {
    return (
        <div className="flex h-screen bg-gray-50">
            {/* 全局主侧边栏 */}
            <GlobalSiderbar></GlobalSiderbar>

            {/* 主工作区 */}
            <main className="flex-1 overflow-hidden">
                <Outlet />
            </main>
        </div>
    );
};

export default MainLayout;
