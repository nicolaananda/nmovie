export interface User {
    id: number;
    email: string;
    name: string | null;
    role: 'USER' | 'ADMIN' | 'MODERATOR';
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    token?: string;
    subscriptionEndsAt?: string;
    createdAt?: string;
    lastLoginAt?: string;
}

export interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
}

export interface LoginResponse {
    id: number;
    email: string;
    name: string;
    role: 'USER' | 'ADMIN';
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    token: string;
}
