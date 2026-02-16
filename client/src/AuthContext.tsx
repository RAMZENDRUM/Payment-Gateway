import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { API_URL } from './lib/api';
import { io } from 'socket.io-client';
import { Bell } from 'lucide-react';


interface User {
    id: string;
    email: string;
    full_name: string;
    age?: number;
    upi_id?: string;
    balance?: number;
    hasPaymentPin?: boolean;
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

        socket.on('new-broadcast', (data: any) => {
            toast.custom((t) => (
                <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-violet-600 shadow-2xl shadow-violet-500/20 rounded-2xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 overflow-hidden`}>
                    <div className="flex-1 w-0 p-4">
                        <div className="flex items-start">
                            <div className="flex-shrink-0 pt-0.5">
                                <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center text-white border border-white/20">
                                    <Bell size={20} />
                                </div>
                            </div>
                            <div className="ml-3 flex-1">
                                <p className="text-sm font-bold text-white uppercase tracking-wider">
                                    Official Updates from Ram

                                </p>
                                <p className="mt-1 text-xs font-medium text-violet-100">
                                    {data.title}: {data.short_message}
                                </p>
                                <div onClick={() => navigate('/settings')} className="mt-2 pt-2 border-t border-white/10 text-[10px] font-bold text-white/60 uppercase tracking-widest cursor-pointer hover:text-white transition-colors">
                                    Click to view details ➔
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ), { duration: 10000 });
            fetchUser();
        });

        socket.on('payment-received', (data: any) => {

            toast.custom((t) => (
                <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-[#0c0c0e]/90 backdrop-blur-xl border border-emerald-500/20 shadow-2xl shadow-emerald-500/10 rounded-2xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 overflow-hidden`}>
                    <div className="flex-1 w-0 p-4">
                        <div className="flex items-start">
                            <div className="flex-shrink-0 pt-0.5">
                                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                                    <span className="text-xl">₹</span>
                                </div>
                            </div>
                            <div className="ml-3 flex-1">
                                <p className="text-sm font-bold text-white uppercase tracking-wider">
                                    Payment Received
                                </p>
                                <p className="mt-1 text-xs font-semibold text-emerald-400">
                                    +₹{data.amount} from {data.sender_name}
                                </p>
                                <div className="mt-2 pt-2 border-t border-white/5 flex justify-between items-center text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">
                                    <span>Available Balance</span>
                                    <span className="text-white">₹{data.newBalance?.toLocaleString() || '---'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ), { duration: 6000 });
            fetchUser(); // Full sync
        });

        socket.on('payment-sent', (data: any) => {
            toast.custom((t) => (
                <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-[#0c0c0e]/90 backdrop-blur-xl border border-red-500/20 shadow-2xl shadow-red-500/10 rounded-2xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 overflow-hidden`}>
                    <div className="flex-1 w-0 p-4">
                        <div className="flex items-start">
                            <div className="flex-shrink-0 pt-0.5">
                                <div className="h-10 w-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500 border border-red-500/20">
                                    <span className="text-xl">💸</span>
                                </div>
                            </div>
                            <div className="ml-3 flex-1">
                                <p className="text-sm font-bold text-white uppercase tracking-wider">
                                    Payment Successful
                                </p>
                                <p className="mt-1 text-xs font-bold text-red-500">
                                    -₹{data.amount} to {data.receiver_name}
                                </p>
                                <div className="mt-2 pt-2 border-t border-white/5 flex justify-between items-center text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">
                                    <span>Remaining Balance</span>
                                    <span className="text-white font-bold">₹{data.newBalance?.toLocaleString() || '---'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ), { duration: 6000 });
            fetchUser(); // Full sync
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
