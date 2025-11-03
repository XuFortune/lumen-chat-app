// src/routes/index.tsx
import { createBrowserRouter } from 'react-router-dom';
import { Login } from '../pages/Login';
import { Register } from '../pages/Register';
// import { App } from '../pages/App'; // 主聊天界面（稍后实现）
// import { ProtectedRoute } from './ProtectedRoute';

export const router = createBrowserRouter([
    { path: '/login', element: <Login /> },
    { path: '/register', element: <Register /> },
    //   {
    //     path: '/app',
    //     element: (
    //       <ProtectedRoute>
    //         <App />
    //       </ProtectedRoute>
    //     ),
    //   },
    //   { path: '*', redirect: '/login' }, // 默认重定向到登录
]);
