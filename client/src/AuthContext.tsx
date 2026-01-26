import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

interface User {
    id: string;
    email: string;
    full_name: string;
    upi_id?: string;
    balance?: number;
    virtualCard?: {
        cardNumber: string;
        cvv: string;
        expiryMonth: string;
        expiryYear: string;
    };
}

interface AuthContextType {
    user: User | null;
    setUser: (user: User | null) => void;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, fullName: string, phoneNumber: string, purpose: string) => Promise<any>;
    verifyOtp: (email: string, otp: string) => Promise<void>;
    logout: () => void;
    fetchUser: () => Promise<void>;
    token: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = import.meta.env.VITE_API_URL || 'https://payment-gateway-up7l.onrender.com/api';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const storedToken = localStorage.getItem('token');

        // Safety timeout to prevent infinite loading
        const timeout = setTimeout(() => {
            setLoading(false);
        }, 3000);

        if (storedToken) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
            setToken(storedToken);
            fetchUser().finally(() => clearTimeout(timeout));
        } else {
            setLoading(false);
            clearTimeout(timeout);
        }
    }, []);

    const fetchUser = async () => {
        try {
            const res = await axios.get(`${API_URL}/auth/me`);
            setUser(res.data);
        } catch (err) {
            localStorage.removeItem('token');
            delete axios.defaults.headers.common['Authorization'];
        } finally {
            setLoading(false);
        }
    };

    const login = async (email: string, password: string) => {
        try {
            const res = await axios.post(`${API_URL}/auth/login`, { email, password });
            const authToken = res.data.token;
            localStorage.setItem('token', authToken);
            setToken(authToken);
            axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
            setUser(res.data.user);
            toast.success('Logged in successfully');
            navigate('/dashboard');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Login failed');
            throw err;
        }
    };

    const register = async (email: string, password: string, fullName: string, phoneNumber: string, purpose: string) => {
        try {
            const res = await axios.post(`${API_URL}/auth/register`, { email, password, fullName, phoneNumber, purpose });
            toast.success(res.data.message || 'OTP sent to your email');
            return res.data;
        } catch (err) {
            toast.error(err.response?.data?.message || 'Registration failed');
            throw err;
        }
    };

    const verifyOtp = async (email: string, otp: string) => {
        try {
            await axios.post(`${API_URL}/auth/verify-otp`, { email, otp });
            toast.success('Account verified! You can now login.');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Verification failed');
            throw err;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        delete axios.defaults.headers.common['Authorization'];
        setUser(null);
        navigate('/login');
        toast.success('Logged out');
    };

    return (
        <AuthContext.Provider value={{ user, setUser, loading, login, register, verifyOtp, logout, fetchUser, token }}>
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
