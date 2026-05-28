import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../services/apiClient';
import { User, LoginResponse } from '../types/auth';

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string) => Promise<User>;
    updateProfile: (name: string) => Promise<void>;
    logout: () => void;
    isAdmin: boolean;
    isApproved: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Check for token on mount. The apiClient interceptor reads the token
    // from localStorage on every request, so we no longer need to mutate
    // axios.defaults here.
    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const { data } = await apiClient.get<User>('/auth/me');
                    setUser({ ...data, token });
                } catch (error: unknown) {
                    const status = (error as { response?: { status?: number } })?.response?.status;
                    if (status === 401 || status === 403) {
                        // Token is invalid/expired — clear it
                        localStorage.removeItem('token');
                    } else {
                        // Network error, rate limit, server error — keep token
                        console.warn('Auth check failed (non-auth error), keeping session:', status);
                    }
                }
            }
            setIsLoading(false);
        };

        checkAuth();
    }, []);

    const login = async (email: string, password: string) => {
        const { data } = await apiClient.post<LoginResponse>('/auth/login', { email, password });
        localStorage.setItem('token', data.token);
        setUser(data);
    };

    const register = async (name: string, email: string, password: string) => {
        const { data } = await apiClient.post<LoginResponse>('/auth/register', { name, email, password });
        localStorage.setItem('token', data.token);
        setUser(data);
        // Return the user data to caller so the UI can react to status (PENDING/APPROVED)
        return data as unknown as User;
    };

    const updateProfile = async (name: string) => {
        const { data } = await apiClient.put<User>('/auth/me', { name });
        setUser(prev => prev ? { ...prev, ...data } : null);
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    const isAdmin = user?.role === 'ADMIN';
    const isApproved = user?.status === 'APPROVED' || user?.role === 'ADMIN';

    return (
        <AuthContext.Provider value={{ user, isLoading, login, register, updateProfile, logout, isAdmin, isApproved }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
