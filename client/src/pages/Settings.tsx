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
    MessageSquare, RefreshCw, AlertCircle, Fingerprint
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

    const fetchNotifications = async (arg?: unknown) => {
        const isBackground = arg === true;
        if (!isBackground) setNotifLoading(true);
        try {
            const res = await axios.get(`${API_URL}/notifications`);
            setNotifications(res.data);
        } catch (err) {
            console.error('Failed to fetch notifications');
        } finally {
            if (!isBackground) setNotifLoading(false);
        }
    };

    // Initial fetch for badge
    useEffect(() => {
        fetchNotifications(true);
    }, []);



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

    const handleMarkAllRead = async () => {
        try {
            await axios.put(`${API_URL}/notifications/mark-all-read`);
            setNotifications(notifications.map(n => ({ ...n, is_read: true })));
            toast.success('All notifications marked as read');
        } catch (err) {
            toast.error('Failed to mark all as read');
        }
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
            <div className="flex flex-col h-full">
                <div className="border-b border-white/5 sticky top-0 z-20 bg-background/80 backdrop-blur-xl">
                    <div className="w-full py-4">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h1 className="text-2xl font-black text-foreground tracking-tight uppercase">Control Center</h1>
                                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.25em] mt-1.5 opacity-70">Identity & Security Node Configuration</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-8 overflow-x-auto scrollbar-hide">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`relative pb-4 text-[11px] font-black uppercase tracking-[0.2em] transition-all outline-none ${activeTab === tab.id
                                        ? 'text-violet-500'
                                        : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                >
                                    <div className="flex items-center gap-2">
                                        {tab.icon}
                                        {tab.label}
                                        {tab.id === 'notifications' && notifications.some(n => !n.is_read) && (
                                            <div className="h-1.5 w-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)] animate-pulse" />
                                        )}
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
                    <div className="w-full">
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
                                        <h2 className="text-2xl font-black text-foreground tracking-tight">VERIFY IDENTITY</h2>
                                        <p className="text-muted-foreground text-xs font-medium mt-2">Authorization required to update sensitive records.</p>
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
                                    <form onSubmit={handleUpdateProfile} className="space-y-8">
                                        <div className="grid grid-cols-2 gap-8">
                                            <div className="space-y-3">
                                                <label className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.2em] px-1">Network Identity</label>
                                                <Input
                                                    value={fullName}
                                                    onChange={(e) => setFullName(e.target.value)}
                                                    className="bg-muted/40 border-border h-14 rounded-2xl text-[15px] font-bold focus:ring-violet-500/20 shadow-sm"
                                                />
                                            </div>
                                            <div className="space-y-3">
                                                <label className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.2em] px-1">Lifecycle Count</label>
                                                <Input
                                                    type="number"
                                                    value={age}
                                                    onChange={(e) => setAge(e.target.value)}
                                                    className="bg-muted/40 border-border h-14 rounded-2xl text-[15px] font-bold shadow-sm"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <label className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.2em] px-1">Communication Uplink</label>
                                            <Input
                                                type="email"
                                                value={newEmail}
                                                onChange={(e) => setNewEmail(e.target.value)}
                                                leftIcon={<Mail size={18} className="text-muted-foreground/60" />}
                                                className="bg-muted/40 border-border h-14 rounded-2xl text-[15px] font-bold shadow-sm"
                                            />
                                        </div>

                                        {newEmail !== user?.email && (
                                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-3 pt-2">
                                                <label className="text-[11px] font-bold text-amber-500 uppercase tracking-widest px-1">Confirm with Password</label>
                                                <Input
                                                    type="password"
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    className="bg-amber-500/5 border-amber-500/10 h-12 rounded-xl text-sm font-medium"
                                                    placeholder="Enter password to authorize change"
                                                />
                                            </motion.div>
                                        )}

                                        <div className="flex items-center justify-between pt-8 border-t border-border/40">
                                            <p className="text-xs text-muted-foreground font-medium italic">Record updates are propagated globally across all node clusters.</p>
                                            <Button
                                                type="submit"
                                                loading={loading}
                                                disabled={isUpToDate && !savedStatus}
                                                className={`h-14 px-10 rounded-2xl font-black text-xs uppercase tracking-widest transition-all border-none flex items-center gap-3 shadow-xl ${savedStatus
                                                    ? 'bg-emerald-500 text-white'
                                                    : isUpToDate
                                                        ? 'bg-muted text-muted-foreground cursor-not-allowed opacity-50'
                                                        : 'bg-foreground text-background hover:bg-foreground/90'
                                                    }`}
                                            >
                                                {savedStatus ? (
                                                    <><CheckCircle2 size={18} /> Changes Saved</>
                                                ) : isUpToDate ? (
                                                    <><CheckCircle2 size={18} /> Up to date</>
                                                ) : (
                                                    <><Save size={18} /> Save Changes</>
                                                )}
                                            </Button>
                                        </div>
                                    </form>
                                </motion.div>
                            ) : activeTab === 'security' ? (
                                <motion.div key="security" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                                    <header className="space-y-1.5">
                                        <h1 className="text-xl font-black text-foreground tracking-tight uppercase">Security Protocols</h1>
                                        <p className="text-xs text-muted-foreground font-medium italic">Protect your digital identity with multi-layer encryption.</p>
                                    </header>
                                    <div className="grid gap-4">
                                        <div className="p-5 bg-card border border-border/60 rounded-[2rem] flex items-center justify-between group hover:border-violet-500/30 transition-all shadow-sm">
                                            <div className="flex items-center gap-5">
                                                <div className="h-12 w-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500 border border-orange-500/20 shadow-inner">
                                                    <Lock size={20} />
                                                </div>
                                                <div>
                                                    <h4 className="text-[15px] font-black text-foreground uppercase tracking-tight">Identity Key</h4>
                                                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1 opacity-70">Update node access credentials</p>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="sm" onClick={() => navigate('/forgot-password')} className="h-10 px-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-all">
                                                Execute Reset
                                            </Button>
                                        </div>
                                        <div className="p-5 bg-card border border-border/60 rounded-[2rem] flex items-center justify-between group hover:border-emerald-500/30 transition-all shadow-sm">
                                            <div className="flex items-center gap-5">
                                                <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20 shadow-inner">
                                                    <Fingerprint size={20} />
                                                </div>
                                                <div>
                                                    <h4 className="text-[15px] font-black text-foreground uppercase tracking-tight">Payment PIN</h4>
                                                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1 opacity-70">Status: <span className={user?.hasPaymentPin ? "text-emerald-500" : "text-red-500"}>{user?.hasPaymentPin ? "ACTIVE" : "MISSING"}</span></p>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="sm" onClick={() => navigate('/setup-pin')} className="h-10 px-5 text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:bg-emerald-500/10 rounded-xl transition-all">
                                                {user?.hasPaymentPin ? "Configure" : "Enroll Now"}
                                            </Button>
                                        </div>
                                        <div className="p-5 bg-card border border-border/60 rounded-[2rem] flex items-center justify-between group hover:border-sky-500/30 transition-all shadow-sm">
                                            <div className="flex items-center gap-5">
                                                <div className="h-12 w-12 rounded-2xl bg-sky-500/10 flex items-center justify-center text-sky-500 border border-sky-500/20 shadow-inner">
                                                    <Smartphone size={20} />
                                                </div>
                                                <div>
                                                    <h4 className="text-[15px] font-black text-foreground uppercase tracking-tight">Biometric Link</h4>
                                                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1 opacity-70">State: <span className="text-sky-500">Standby (Disabled)</span></p>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="sm" className="h-10 px-5 text-[10px] font-black uppercase tracking-widest text-sky-600 hover:bg-sky-500/10 rounded-xl transition-all">
                                                Authorize
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
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.25em] px-1 opacity-70">Event Stream</h3>
                                            <div className="flex items-center gap-4">
                                                {notifications.some(n => !n.is_read) && (
                                                    <button
                                                        onClick={handleMarkAllRead}
                                                        className="text-[10px] font-bold text-violet-500 hover:text-violet-400 uppercase tracking-wider transition-colors"
                                                    >
                                                        Mark all as read
                                                    </button>
                                                )}
                                                <button onClick={fetchNotifications} className="text-zinc-500 hover:text-violet-400 p-1">
                                                    <RefreshCw size={14} className={notifLoading ? 'animate-spin' : ''} />
                                                </button>
                                            </div>
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
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className={`p-4 border rounded-2xl transition-all cursor-pointer relative overflow-hidden ${expandedNotif === n.id
                                                        ? 'bg-violet-500/5 border-violet-500/30'
                                                        : 'bg-card border-border hover:border-violet-500/20'
                                                        }`}
                                                    onClick={() => {
                                                        setExpandedNotif(expandedNotif === n.id ? null : n.id);
                                                        if (!n.is_read) markAsRead(n.id);
                                                    }}
                                                >
                                                    {!n.is_read && (
                                                        <div className="absolute top-4 right-4 h-2.5 w-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)] animate-pulse z-10" />
                                                    )}
                                                    <div className="flex items-start gap-4">
                                                        <div className={`mt-1 h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${n.type === 'BROADCAST'
                                                            ? 'bg-purple-500/10 text-purple-500'
                                                            : 'bg-violet-500/10 text-violet-500'
                                                            }`}>
                                                            {n.type === 'BROADCAST' ? <MessageSquare size={16} /> : <AlertCircle size={16} />}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center justify-between gap-4">
                                                                <h4 className={`text-[13px] font-black uppercase tracking-tight ${n.is_read ? 'text-muted-foreground/60' : 'text-foreground'}`}>{n.title}</h4>
                                                                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest bg-muted px-2 py-0.5 rounded-md">{new Date(n.created_at).toLocaleDateString()}</span>
                                                            </div>
                                                            <p className="text-[11px] text-muted-foreground font-medium mt-1.5 italic opacity-80">{n.short_message}</p>

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
                                    <div className="space-y-2">
                                        <h2 className="text-2xl font-black text-foreground tracking-tight uppercase">Visual Frequency</h2>
                                        <p className="text-xs text-muted-foreground font-medium italic">Adjust the electromagnetic spectrum of your terminal interface.</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <button
                                            onClick={() => theme !== 'dark' && toggleTheme()}
                                            className={`p-6 rounded-3xl border text-left transition-all ${theme === 'dark'
                                                ? 'bg-violet-500/10 border-violet-500/30'
                                                : 'bg-card border-border hover:border-violet-500/20'
                                                }`}
                                        >
                                            <motion.div
                                                animate={{ scale: theme === 'dark' ? 1.05 : 1, rotate: theme === 'dark' ? 0 : -10 }}
                                                className={`h-10 w-10 rounded-xl flex items-center justify-center mb-4 ${theme === 'dark' ? 'bg-violet-500 text-white' : 'bg-muted text-muted-foreground'
                                                    }`}>
                                                <Moon size={20} />
                                            </motion.div>
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
                                            <motion.div
                                                animate={{ scale: theme === 'light' ? 1.05 : 1, rotate: theme === 'light' ? 0 : 45 }}
                                                className={`h-10 w-10 rounded-xl flex items-center justify-center mb-4 ${theme === 'light' ? 'bg-violet-500 text-white' : 'bg-muted text-muted-foreground'
                                                    }`}>
                                                <Sun size={20} />
                                            </motion.div>
                                            <h3 className="font-bold text-sm text-foreground">Clean Light</h3>
                                            <p className="text-[10px] text-zinc-500 mt-1">High contrast for daylight environments.</p>
                                        </button>
                                    </div>
                                    <div className="p-5 bg-muted/40 border border-border/40 rounded-[2rem] flex items-start gap-4 shadow-sm backdrop-blur-sm">
                                        <Palette size={20} className="text-violet-500 shrink-0 mt-0.5" />
                                        <p className="text-[11px] text-muted-foreground font-medium leading-relaxed italic">
                                            Frequency shifts are applied instantly to this local node. Cloud-based synchronization is currently in technical preview.
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
