// packages/frontend/src/routes/ProtectedRoute.tsx
import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";


const ProtectedRoute = () => {
    const { token } = useAuthStore()
    if (!token) {
        return <Navigate to='/login' replace></Navigate>
    }
    return <Outlet></Outlet>
}

export default ProtectedRoute