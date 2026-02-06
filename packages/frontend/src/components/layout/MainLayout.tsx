import { Outlet } from 'react-router-dom';
import { GlobalSidebar } from './GlobalSidebar';

/**
 * Main application shell.
 * Includes the glass-morphic global sidebar and the main workspace area.
 */
const MainLayout = () => {
    return (
        <div className="flex h-screen w-full overflow-hidden bg-background text-foreground bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-indigo-100/20 via-background to-background dark:from-indigo-950/20 dark:via-background dark:to-background">
            {/* Global Navigation Shell */}
            <GlobalSidebar />

            {/* Main Workspace */}
            <main className="flex-1 overflow-hidden relative flex flex-col">
                <Outlet />
            </main>
        </div>
    );
};

export default MainLayout;
