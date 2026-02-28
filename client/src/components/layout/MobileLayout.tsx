import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    ArrowUpDown,
    Wallet,
    Settings,
    LogOut,
    Code,
    QrCode,
    User as UserIcon,
    Bell,
    Menu,
    X,
    ChevronRight,
    Search
} from 'lucide-react';
import { useAuth } from '@/AuthContext';
import { useTheme } from '@/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';

interface MobileLayoutProps {
    children: React.ReactNode;
    title?: string;
    subtitle?: string;
}

export default function MobileLayout({ children, title, subtitle }: MobileLayoutProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const { logout, user } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const navItems = [
        { icon: <LayoutDashboard size={22} />, label: 'Home', path: '/dashboard' },
        { icon: <Wallet size={22} />, label: 'Wallet', path: '/wallet' },
        { icon: <QrCode size={22} />, label: 'Pay', path: '/scan' },
        { icon: <ArrowUpDown size={22} />, label: 'History', path: '/transactions' },
        { icon: <UserIcon size={22} />, label: 'Profile', path: '/profile' },
    ];

    const menuItems = [
        { icon: <Code size={20} />, label: 'Developer APIs', path: '/developers' },
        { icon: <Settings size={20} />, label: 'Settings', path: '/settings' },
        { icon: <Bell size={20} />, label: 'Notifications', path: '/notifications' },
    ];

    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground font-sans overflow-x-hidden selection:bg-primary/20">
            {/* Top Bar */}
            <header className="fixed top-0 left-0 right-0 h-16 bg-background/60 backdrop-blur-xl z-[60] border-b border-border/10 flex items-center justify-between px-6">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
                        <Wallet size={16} strokeWidth={2.5} />
                    </div>
                    <span className="font-black text-sm uppercase tracking-widest text-foreground">ZenWallet</span>
                </div>

                <div className="flex items-center gap-2">
                    <button className="p-2.5 rounded-full hover:bg-muted/50 transition-colors">
                        <Search size={20} className="text-muted-foreground" />
                    </button>
                    <button
                        onClick={() => setIsMenuOpen(true)}
                        className="p-2.5 rounded-full hover:bg-muted/50 transition-colors"
                    >
                        <Menu size={20} className="text-foreground" />
                    </button>
                </div>
            </header>

            {/* Sidebar Overlay (Mobile Drawer) */}
            <AnimatePresence>
                {isMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMenuOpen(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70]"
                        />
                        <motion.aside
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed top-0 right-0 bottom-0 w-[80%] max-w-[320px] bg-background border-l border-border/10 z-[80] shadow-2xl flex flex-col"
                        >
                            <div className="p-6 flex items-center justify-between">
                                <span className="font-black text-xs uppercase tracking-[0.3em] text-zinc-500">Navigation</span>
                                <button onClick={() => setIsMenuOpen(false)} className="p-2 -mr-2 text-zinc-400">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto px-6 space-y-6">
                                {/* Profile Summary */}
                                <div onClick={() => { navigate('/profile'); setIsMenuOpen(false); }} className="p-5 rounded-3xl bg-muted/30 border border-border/5 flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-lg">
                                        {user?.full_name?.charAt(0).toUpperCase() || 'U'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-foreground truncate">{user?.full_name || 'User'}</p>
                                        <p className="text-[10px] font-black text-primary uppercase tracking-widest">Premium Node</p>
                                    </div>
                                </div>

                                <nav className="space-y-4 pt-4">
                                    {menuItems.map((item) => (
                                        <button
                                            key={item.path}
                                            onClick={() => { navigate(item.path); setIsMenuOpen(false); }}
                                            className="w-full flex items-center justify-between p-4 rounded-2xl bg-muted/20 hover:bg-muted/40 transition-colors"
                                        >
                                            <div className="flex items-center gap-4 text-sm font-bold text-foreground">
                                                <span className="text-primary">{item.icon}</span>
                                                {item.label}
                                            </div>
                                            <ChevronRight size={14} className="text-zinc-600" />
                                        </button>
                                    ))}
                                </nav>
                            </div>

                            <div className="p-8 border-t border-border/10 space-y-6">
                                <button
                                    onClick={() => { logout(); setIsMenuOpen(false); }}
                                    className="w-full h-14 rounded-2xl border border-destructive/20 text-destructive font-bold text-sm flex items-center justify-center gap-3 active:scale-95 transition-all"
                                >
                                    <LogOut size={18} />
                                    Sign Out Account
                                </button>
                                <p className="text-[9px] font-black uppercase tracking-[0.5em] text-center text-zinc-700">ZenWallet Cluster v2.0</p>
                            </div>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <main className="flex-1 pt-20 pb-24 px-5">
                {title && (
                    <div className="mb-8 space-y-1">
                        <motion.h1
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-4xl font-black tracking-tighter text-foreground uppercase italic"
                        >
                            {title}
                        </motion.h1>
                        {subtitle && <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest pl-1">{subtitle}</p>}
                    </div>
                )}
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {children}
                </div>
            </main>

            {/* Bottom Nav Bar */}
            <nav className="fixed bottom-0 left-0 right-0 h-20 bg-background/80 backdrop-blur-2xl z-[50] border-t border-white/5 px-6 flex items-center justify-between safe-area-bottom">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <button
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            className="relative flex flex-col items-center justify-center gap-1 group"
                        >
                            <div className={`p-2 rounded-xl transition-all duration-300 ${isActive ? 'text-primary scale-110' : 'text-zinc-600 hover:text-zinc-400'}`}>
                                {item.icon}
                            </div>
                            {isActive && (
                                <motion.div
                                    layoutId="bottomNavIndicator"
                                    className="absolute -bottom-1 w-1 h-1 bg-primary rounded-full"
                                />
                            )}
                        </button>
                    );
                })}
            </nav>
        </div>
    );
}
