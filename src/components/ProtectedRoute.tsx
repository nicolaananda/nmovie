import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

interface ProtectedRouteProps {
    adminOnly?: boolean;
    requireApproval?: boolean;
}

export default function ProtectedRoute({ adminOnly = false, requireApproval = false }: ProtectedRouteProps) {
    const { user, isLoading, isAdmin, isApproved } = useAuth();

    if (isLoading) {
        return <div className="h-screen flex items-center justify-center bg-[#0f0f0f]"><LoadingSpinner size="large" /></div>;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (adminOnly && !isAdmin) {
        return <Navigate to="/" replace />;
    }

    if (requireApproval && !isApproved) {
        return (
            <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white/5 border border-white/10 p-8 rounded-2xl text-center">
                    <h2 className="text-2xl font-bold text-white mb-4">Account Pending Approval</h2>
                    <p className="text-gray-300 mb-6">
                        Thanks for registering! Your account is currently pending approval from an administrator.
                        You can browse the catalog, but streaming features are locked.
                    </p>
                    <div className="text-sm text-gray-500">
                        Status: <span className="text-yellow-500 font-bold uppercase">{user.status}</span>
                    </div>
                </div>
            </div>
        );
    }

    return <Outlet />;
}
