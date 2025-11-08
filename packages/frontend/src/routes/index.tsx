// src/routes/index.tsx
import { createBrowserRouter, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';

import { Login } from '../pages/auth/Login';
import { Register } from '../pages/auth/Register';
import MainLayout from '@/components/layout/MainLayout';
import ChatWorkspace from '../pages/chat/ChatWorkspace';
import SettingsPage from '../pages/settings/SettingsPage';

const router = createBrowserRouter([
    { path: '/login', element: <Login /> },
    { path: '/register', element: <Register /> },
    {
        element: <ProtectedRoute></ProtectedRoute>,
        children: [
            {
                path: '/app',
                element: <MainLayout></MainLayout>,
                children: [
                    { index: true, element: <Navigate to='chat' replace></Navigate> },
                    { path: 'chat', element: <ChatWorkspace></ChatWorkspace> },
                    { path: 'settings', element: <SettingsPage></SettingsPage> }
                ]
            }
        ]
    },
    { path: '*', element: <Navigate to='/login' replace></Navigate> }, // 默认重定向到登录
]);

export default router