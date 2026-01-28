import { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { API_URL } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../AuthContext';
import { useTheme } from '../ThemeContext';
import {
    User, Mail, Shield, Smartphone, Lock, CheckCircle2,
    Save, Bell, Palette, Sun, Moon, Send,
    MessageSquare, RefreshCw, AlertCircle
} from 'lucide-react';

export default function Settings() {
    const { user, fetchUser } = useAuth();
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();

    const [loading, setLoading] = useState(false);
    const [savedStatus, setSavedStatus] = useState(false);
    const [activeTab, setActiveTab] = useState('profile');

    // Profile State
    const [fullName, setFullName] = useState(user?.full_name || '');
    const [age, setAge] = useState(user?.age || '');
    const [newEmail, setNewEmail] = useState(user?.email || '');
    const [password, setPassword] = useState('');

    // OTP State
    const [showOtpScreen, setShowOtpScreen] = useState(false);
    const [otp, setOtp] = useState('');
    const [otpLoading, setOtpLoading] = useState(false);

    // Notifications State
    const [notifications, setNotifications] = useState<any[]>([]);
    const [notifLoading, setNotifLoading] = useState(false);
    const [expandedNotif, setExpandedNotif] = useState<string | null>(null);

    // Broadcast State (Admin only)
    const [broadcastTitle, setBroadcastTitle] = useState('');
    const [broadcastShort, setBroadcastShort] = useState('');
    const [broadcastFull, setBroadcastFull] = useState('');
    const [broadcastLoading, setBroadcastLoading] = useState(false);

    useEffect(() => {
        if (user) {
            setFullName(user.full_name);
            setAge(user.age || '');
            setNewEmail(user.email);
        }
    }, [user]);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await axios.post(`${API_URL}/auth/update-profile`, {
                fullName,
                age: age ? parseInt(age.toString()) : undefined,
                newEmail: newEmail !== user?.email ? newEmail : undefined,
                currentPassword: newEmail !== user?.email ? password : undefined
            });

            if (response.data.emailChangePending) {
                setShowOtpScreen(true);
                toast.success('Verification OTP sent');
            } else {
                setSavedStatus(true);
                toast.success('Settings updated');
                fetchUser();
                setTimeout(() => setSavedStatus(false), 3000);
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Update failed');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        setOtpLoading(true);
        try {
            await axios.post(`${API_URL}/auth/verify-email-change`, { otp });
            toast.success('Email updated');
            setShowOtpScreen(false);
            setOtp('');
            setPassword('');
            fetchUser();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Verification failed');
        } finally {
            setOtpLoading(false);
        }
    };

    const fetchNotifications = async () => {
        setNotifLoading(true);
        try {
            const res = await axios.get(`${API_URL}/notifications`);
            setNotifications(res.data);
        } catch (err) {
            console.error('Failed to fetch notifications');
        } finally {
            setNotifLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'notifications') {
            fetchNotifications();
        }
    }, [activeTab]);

    const handleBroadcast = async (e: React.FormEvent) => {
        e.preventDefault();
        setBroadcastLoading(true);
        try {
            await axios.post(`${API_URL}/notifications/broadcast`, {
                title: broadcastTitle,
                shortMessage: broadcastShort,
                fullMessage: broadcastFull
            });
            toast.success('Broadcast sent globally');
            setBroadcastTitle('');
            setBroadcastShort('');
            setBroadcastFull('');
            fetchNotifications();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Broadcast failed');
        } finally {
            setBroadcastLoading(false);
        }
    };

    const markAsRead = async (id: string) => {
        try {
            await axios.put(`${API_URL}/notifications/${id}/read`);
            setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
        } catch (err) { /* silent */ }
    };

    const tabs = [
        { id: 'profile', label: 'Profile', icon: <User size={16} /> },
        { id: 'security', label: 'Security', icon: <Lock size={16} /> },
        { id: 'notifications', label: 'Notifications', icon: <Bell size={16} /> },
        { id: 'appearance', label: 'Appearance', icon: <Palette size={16} /> },
    ];

    const isUpToDate =
        fullName === user?.full_name &&
        (age === '' ? (user?.age === null || user?.age === undefined) : parseInt(age.toString()) === user?.age) &&
        newEmail === user?.email;

    return (
        <AppLayout>
            <div className="flex flex-col">
                <div className="border-b border-white/5 sticky top-0 z-20 bg-background/80 backdrop-blur-xl">
                    <div className="max-w-5xl py-4">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h1 className="text-xl font-bold text-foreground tracking-tight">Settings</h1>
                                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em] mt-1">Manage your identity & security</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-8 overflow-x-auto scrollbar-hide">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`relative pb-4 text-[11px] font-bold uppercase tracking-widest transition-all outline-none ${activeTab === tab.id
                                        ? 'text-violet-400'
                                        : 'text-zinc-500 hover:text-zinc-300'
                                        }`}
                                >
                                    <div className="flex items-center gap-2">
                                        {tab.icon}
                                        {tab.label}
                                    </div>
                                    {activeTab === tab.id && (
                                        <motion.div
                                            layoutId="activeTabBadge"
                                            className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-500 shadow-[0_0_10px_rgba(139,92,246,0.3)]"
                                        />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto pt-8">
                    <div className="max-w-5xl">
                        <AnimatePresence mode="wait">
                            {showOtpScreen ? (
                                <motion.div
                                    key="otp"
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.98 }}
                                    className="bg-card border border-border rounded-[32px] p-8 text-center space-y-6"
                                >
                                    <div className="h-16 w-16 rounded-2xl bg-violet-600/10 flex items-center justify-center text-violet-500 mx-auto border border-violet-500/20">
                                        <CheckCircle2 size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-foreground">Verify New Email</h2>
                                        <p className="text-zinc-500 text-xs mt-1">Check your inbox for the 6-digit code</p>
                                    </div>
                                    <form onSubmit={handleVerifyEmail} className="space-y-4">
                                        <Input
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value)}
                                            className="bg-background/40 border-border h-14 rounded-2xl text-center text-xl font-bold tracking-[0.4em] text-foreground"
                                            placeholder="••••••"
                                            maxLength={6}
                                        />
                                        <Button loading={otpLoading} className="w-full h-12 rounded-2xl bg-violet-600 hover:bg-violet-500 text-sm font-bold border-none">
                                            Confirm
                                        </Button>
                                    </form>
                                </motion.div>
                            ) : activeTab === 'profile' ? (
                                <motion.div key="profile" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                                    <form onSubmit={handleUpdateProfile} className="space-y-6">
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">Full Legal Name</label>
                                                <Input
                                                    value={fullName}
                                                    onChange={(e) => setFullName(e.target.value)}
                                                    className="bg-card border-border h-11 rounded-xl text-sm font-medium focus:ring-1 focus:ring-violet-500/20"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">Age</label>
                                                <Input
                                                    type="number"
                                                    value={age}
                                                    onChange={(e) => setAge(e.target.value)}
                                                    className="bg-card border-border h-11 rounded-xl text-sm font-medium"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">Email Address</label>
                                            <Input
                                                type="email"
                                                value={newEmail}
                                                onChange={(e) => setNewEmail(e.target.value)}
                                                leftIcon={<Mail size={14} className="text-zinc-600" />}
                                                className="bg-card border-border h-11 rounded-xl text-sm font-medium"
                                            />
                                        </div>

                                        {newEmail !== user?.email && (
                                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-2 pt-2">
                                                <label className="text-[10px] font-bold text-amber-500 uppercase tracking-widest px-1">Confirm with Password</label>
                                                <Input
                                                    type="password"
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    className="bg-amber-500/5 border-amber-500/10 h-11 rounded-xl text-sm font-medium"
                                                    placeholder="Enter password to authorize change"
                                                />
                                            </motion.div>
                                        )}

                                        <div className="flex items-center justify-between pt-4 border-t border-border">
                                            <p className="text-[11px] text-zinc-500 font-medium italic">Changes are saved globally across your account.</p>
                                            <Button
                                                type="submit"
                                                loading={loading}
                                                disabled={isUpToDate && !savedStatus}
                                                className={`h-11 px-6 rounded-xl font-bold text-xs transition-all border-none flex items-center gap-2 ${savedStatus
                                                    ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                                    : isUpToDate
                                                        ? 'bg-zinc-800/50 text-zinc-500 cursor-not-allowed border border-border'
                                                        : 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-600/20'
                                                    }`}
                                            >
                                                {savedStatus ? (
                                                    <><CheckCircle2 size={16} /> Changes Saved</>
                                                ) : isUpToDate ? (
                                                    <><CheckCircle2 size={16} /> Up to date</>
                                                ) : (
                                                    <><Save size={16} /> Save Changes</>
                                                )}
                                            </Button>
                                        </div>
                                    </form>
                                </motion.div>
                            ) : activeTab === 'security' ? (
                                <motion.div key="security" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                                    <header className="space-y-1">
                                        <h1 className="text-2xl font-bold text-foreground">Security</h1>
                                        <p className="text-sm text-zinc-500 font-medium">Protect your account with advanced security features.</p>
                                    </header>
                                    <div className="grid gap-4">
                                        <div className="p-4 bg-card border border-border rounded-2xl flex items-center justify-between group hover:border-violet-500/20 transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 border border-orange-500/20">
                                                    <Lock size={18} />
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-bold text-foreground">Password</h4>
                                                    <p className="text-[11px] text-zinc-500 mt-0.5">Change your secret password</p>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="sm" onClick={() => navigate('/forgot-password')} className="h-8 text-[11px] font-bold text-zinc-400 hover:text-foreground">
                                                Reset Now
                                            </Button>
                                        </div>
                                        <div className="p-4 bg-card border border-border rounded-2xl flex items-center justify-between group hover:border-violet-500/20 transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-500 border border-sky-500/20">
                                                    <Smartphone size={18} />
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-bold text-foreground">Two-Factor Authentication</h4>
                                                    <p className="text-[11px] text-zinc-500 mt-0.5">Currently: Disabled</p>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="sm" className="h-8 text-[11px] font-bold text-sky-500 hover:bg-sky-500/10">
                                                Enable
                                            </Button>
                                        </div>
                                    </div>
                                </motion.div>
                            ) : activeTab === 'notifications' ? (
                                <motion.div key="notifications" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                                    {user?.email === 'ramzendrum@gmail.com' && (
                                        <div className="p-6 bg-violet-500/5 border border-violet-500/10 rounded-2xl space-y-4">
                                            <div className="flex items-center gap-2 text-violet-500">
                                                <Send size={18} />
                                                <h3 className="text-sm font-bold uppercase tracking-widest">Global Broadcast</h3>
                                            </div>
                                            <form onSubmit={handleBroadcast} className="space-y-4">
                                                <Input
                                                    placeholder="Broadcast Title"
                                                    value={broadcastTitle}
                                                    onChange={(e) => setBroadcastTitle(e.target.value)}
                                                    className="bg-background border-border"
                                                    required
                                                />
                                                <Input
                                                    placeholder="Short summary message"
                                                    value={broadcastShort}
                                                    onChange={(e) => setBroadcastShort(e.target.value)}
                                                    className="bg-background border-border"
                                                    required
                                                />
                                                <textarea
                                                    placeholder="Full detailed message (Markdown supported)"
                                                    value={broadcastFull}
                                                    onChange={(e) => setBroadcastFull(e.target.value)}
                                                    className="w-full min-h-[100px] p-4 bg-transparent border border-border rounded-2xl text-sm focus:outline-none focus:ring-1 focus:ring-violet-500/20 text-foreground"
                                                />
                                                <Button loading={broadcastLoading} className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold h-11 rounded-xl border-none">
                                                    Broadcast to All Users
                                                </Button>
                                            </form>
                                        </div>
                                    )}

                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-1">Activity Stream</h3>
                                            <button onClick={fetchNotifications} className="text-zinc-500 hover:text-violet-400 p-1">
                                                <RefreshCw size={14} className={notifLoading ? 'animate-spin' : ''} />
                                            </button>
                                        </div>

                                        {notifications.length === 0 ? (
                                            <div className="py-20 text-center space-y-3 opacity-30">
                                                <Bell size={40} className="mx-auto" />
                                                <p className="text-sm font-medium">No alerts found</p>
                                            </div>
                                        ) : (
                                            notifications.map((n) => (
                                                <motion.div
                                                    key={n.id}
                                                    layout
                                                    className={`p-4 border rounded-2xl transition-all cursor-pointer ${expandedNotif === n.id
                                                        ? 'bg-violet-500/5 border-violet-500/30'
                                                        : 'bg-card border-border hover:border-violet-500/20'
                                                        }`}
                                                    onClick={() => {
                                                        setExpandedNotif(expandedNotif === n.id ? null : n.id);
                                                        if (!n.is_read) markAsRead(n.id);
                                                    }}
                                                >
                                                    <div className="flex items-start gap-4">
                                                        <div className={`mt-1 h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${n.type === 'BROADCAST'
                                                            ? 'bg-purple-500/10 text-purple-500'
                                                            : 'bg-violet-500/10 text-violet-500'
                                                            }`}>
                                                            {n.type === 'BROADCAST' ? <MessageSquare size={16} /> : <AlertCircle size={16} />}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center justify-between gap-4">
                                                                <h4 className={`text-sm font-bold ${n.is_read ? 'text-zinc-500' : 'text-foreground'}`}>{n.title}</h4>
                                                                <span className="text-[10px] text-zinc-500 font-medium">{new Date(n.created_at).toLocaleDateString()}</span>
                                                            </div>
                                                            <p className="text-xs text-zinc-500 mt-1">{n.short_message}</p>

                                                            <AnimatePresence>
                                                                {expandedNotif === n.id && n.full_message && (
                                                                    <motion.div
                                                                        initial={{ opacity: 0, height: 0 }}
                                                                        animate={{ opacity: 1, height: 'auto' }}
                                                                        exit={{ opacity: 0, height: 0 }}
                                                                        className="mt-4 pt-4 border-t border-border text-xs text-zinc-400 leading-relaxed overflow-hidden"
                                                                    >
                                                                        {n.full_message}
                                                                    </motion.div>
                                                                )}
                                                            </AnimatePresence>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))
                                        )}
                                    </div>
                                </motion.div>
                            ) : activeTab === 'appearance' ? (
                                <motion.div key="appearance" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                                    <div className="space-y-1">
                                        <h2 className="text-xl font-bold text-foreground">Theme & Interface</h2>
                                        <p className="text-sm text-zinc-500 font-medium">Personalize the visual density and mode of your workspace.</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <button
                                            onClick={() => theme !== 'dark' && toggleTheme()}
                                            className={`p-6 rounded-3xl border text-left transition-all ${theme === 'dark'
                                                ? 'bg-violet-500/10 border-violet-500/30'
                                                : 'bg-card border-border hover:border-violet-500/20'
                                                }`}
                                        >
                                            <div className={`h-10 w-10 rounded-xl flex items-center justify-center mb-4 ${theme === 'dark' ? 'bg-violet-500 text-white' : 'bg-zinc-800 text-zinc-500'
                                                }`}>
                                                <Moon size={20} />
                                            </div>
                                            <h3 className="font-bold text-sm text-foreground">Midnight Dark</h3>
                                            <p className="text-[10px] text-zinc-500 mt-1">Optimal for focused late-night sessions.</p>
                                        </button>
                                        <button
                                            onClick={() => theme !== 'light' && toggleTheme()}
                                            className={`p-6 rounded-3xl border text-left transition-all ${theme === 'light'
                                                ? 'bg-violet-600/10 border-violet-600/30'
                                                : 'bg-card border-border hover:border-violet-500/20'
                                                }`}
                                        >
                                            <div className={`h-10 w-10 rounded-xl flex items-center justify-center mb-4 ${theme === 'light' ? 'bg-violet-500 text-white' : 'bg-zinc-200 text-zinc-400'
                                                }`}>
                                                <Sun size={20} />
                                            </div>
                                            <h3 className="font-bold text-sm text-foreground">Clean Light</h3>
                                            <p className="text-[10px] text-zinc-500 mt-1">High contrast for daylight environments.</p>
                                        </button>
                                    </div>
                                    <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex items-start gap-3">
                                        <Palette size={18} className="text-amber-500 shrink-0 mt-0.5" />
                                        <p className="text-[11px] text-zinc-500 font-medium leading-relaxed">
                                            Theme settings are applied instantly to your local system. Cloud sync for appearance is currently in experimental phase.
                                        </p>
                                    </div>
                                </motion.div>
                            ) : null}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
