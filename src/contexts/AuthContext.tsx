import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { User, LoginResponse } from '../types/auth';

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string) => Promise<void>;
    updateProfile: (name: string) => Promise<void>;
    logout: () => void;
    isAdmin: boolean;
    isApproved: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Configure axios defaults
axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:7001/api'; // Backend runs on port 7001

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Check for token on mount
    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                try {
                    const { data } = await axios.get<User>('/auth/me');
                    setUser({ ...data, token });
                } catch (error) {
                    console.error('Auth verification failed', error);
                    localStorage.removeItem('token');
                    delete axios.defaults.headers.common['Authorization'];
                }
            }
            setIsLoading(false);
        };

        checkAuth();
    }, []);

    const login = async (email: string, password: string) => {
        try {
            const { data } = await axios.post<LoginResponse>('/auth/login', { email, password });
            localStorage.setItem('token', data.token);
            axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
            setUser(data);
        } catch (error) {
            // Propagate error to component
            throw error;
        }
    };

    const register = async (name: string, email: string, password: string) => {
        try {
            const { data } = await axios.post<LoginResponse>('/auth/register', { name, email, password });
            localStorage.setItem('token', data.token);
            axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
            setUser(data);
        } catch (error) {
            throw error;
        }
    };

    const updateProfile = async (name: string) => {
        try {
            const { data } = await axios.put<User>('/auth/me', { name });
            setUser(prev => prev ? { ...prev, ...data } : null);
        } catch (error) {
            throw error;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
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
