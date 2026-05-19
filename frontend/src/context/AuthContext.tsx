import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api';

interface CurrentUser {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    companyName?: string | null;
    bio?: string | null;
    phoneNumber?: string | null;
    role: string;
    isBlocked: boolean;
}

interface DemoAccount {
    label: string;
    email: string;
    password: string;
}

interface LoginPayload {
    email: string;
    password: string;
}

interface RegisterPayload {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    companyName?: string;
    bio?: string;
    phoneNumber?: string;
    role?: 'Client' | 'Provider';
}

interface AuthContextType {
    isAuthenticated: boolean;
    isLoading: boolean;
    currentUser: CurrentUser | null;
    demoAccounts: DemoAccount[];
    login: (payload: LoginPayload) => Promise<void>;
    register: (payload: RegisterPayload) => Promise<void>;
    logout: () => void;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [demoAccounts, setDemoAccounts] = useState<DemoAccount[]>([]);

    const fetchDemoAccounts = async () => {
        try {
            const response = await api.get('/demo/accounts');
            setDemoAccounts(response.data);
        } catch {
            setDemoAccounts([]);
        }
    };

    const refreshUser = async () => {
        const token = sessionStorage.getItem('token');
        if (!token) {
            setCurrentUser(null);
            return;
        }

        const response = await api.get('/auth/me');
        // If the server returns 401 (blocked), the interceptor will throw.
        // On success, update user state (isBlocked always false here since backend
        // returns 401 for blocked accounts).
        setCurrentUser(response.data);
    };

    useEffect(() => {
        const bootstrap = async () => {
            setIsLoading(true);
            await fetchDemoAccounts();

            try {
                await refreshUser();
            } catch {
                sessionStorage.removeItem('token');
                setCurrentUser(null);
            } finally {
                setIsLoading(false);
            }
        };

        void bootstrap();
    }, []);

    const login = async (payload: LoginPayload) => {
        const response = await api.post('/auth/login', payload);
        sessionStorage.setItem('token', response.data.token);
        setCurrentUser(response.data.user);
    };

    const register = async (payload: RegisterPayload) => {
        await api.post('/auth/register', payload);
    };

    const logout = () => {
        sessionStorage.removeItem('token');
        setCurrentUser(null);
    };

    const value = useMemo(
        () => ({
            isAuthenticated: !!currentUser,
            isLoading,
            currentUser,
            demoAccounts,
            login,
            register,
            logout,
            refreshUser
        }),
        [currentUser, isLoading, demoAccounts]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};
