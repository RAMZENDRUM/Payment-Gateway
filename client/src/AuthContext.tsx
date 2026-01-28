import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { API_URL } from './lib/api';
import { io } from 'socket.io-client';

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

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();



    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
            setToken(storedToken);
            fetchUser();
        } else {
            setLoading(false);
        }
    }, [token]);

    // Socket.io for live notifications
    useEffect(() => {
        if (!user?.id) return;

        const socketUrl = API_URL.replace('/api', '');
        const socket = io(socketUrl);

        socket.on('connect', () => {
            console.log('📡 Notification socket connected');
            socket.emit('join-user', user.id);
        });

        socket.on('payment-received', (data: any) => {
            toast.success(`Received ₹${data.amount} from ${data.sender_name}`, {
                icon: '💰',
                duration: 6000,
                style: {
                    borderRadius: '16px',
                    background: '#0c0c0e',
                    color: '#fff',
                    border: '1px solid rgba(255,255,255,0.1)',
                },
            });
            fetchUser(); // Refresh balance
        });

        socket.on('payment-sent', (data: any) => {
            toast.success(`Sent ₹${data.amount} to ${data.receiver_name}`, {
                icon: '💸',
                style: {
                    borderRadius: '16px',
                    background: '#0c0c0e',
                    color: '#fff',
                    border: '1px solid rgba(255,255,255,0.1)',
                },
            });
            fetchUser(); // Refresh balance
        });

        return () => {
            socket.disconnect();
        };
    }, [user?.id]);


    const fetchUser = async () => {
        try {
            console.log("Fetching user from:", `${API_URL}/auth/me`);
            const res = await axios.get(`${API_URL}/auth/me`);
            setUser(res.data);
        } catch (err: any) {
            console.error("Error fetching user:", err);
            // Only logout if unauthorized or forbidden (token invalid/expired)
            if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                console.warn("Auth token invalid, logging out.");
                localStorage.removeItem('token');
                delete axios.defaults.headers.common['Authorization'];
                setToken(null);
                setUser(null);
            }
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
            // Navigation handled by the component calling login
            // navigate('/dashboard');
        } catch (err: any) {
            console.error('Login error details:', err);
            toast.error(err.response?.data?.message || 'Login failed');
            throw err;
        }
    };

    const register = async (email: string, password: string, fullName: string, phoneNumber: string, purpose: string) => {
        try {
            const res = await axios.post(`${API_URL}/auth/register`, { email, password, fullName, phoneNumber, purpose });
            toast.success(res.data.message || 'OTP sent to your email');
            return res.data;
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Registration failed');
            throw err;
        }
    };

    const verifyOtp = async (email: string, otp: string) => {
        try {
            await axios.post(`${API_URL}/auth/verify-otp`, { email, otp });
            toast.success('Account verified! You can now login.');
        } catch (err: any) {
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
