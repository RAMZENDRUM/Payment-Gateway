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
    const { user } = useAuth();

    const navItems = [
        { icon: <LayoutDashboard size={24} />, label: 'Home', path: '/dashboard' },
        { icon: <QrCode size={24} />, label: 'Scan', path: '/scan' },
        { icon: <ArrowUpDown size={24} />, label: 'History', path: '/transactions' },
        { icon: <Wallet size={24} />, label: 'Wallet', path: '/wallet' },
        { icon: <UserIcon size={24} />, label: 'Profile', path: '/profile' },
    ];

    return (
        <div className="flex flex-col min-h-screen bg-[#050505] text-[#f5f7f8] font-sans overflow-x-hidden selection:bg-primary/20">
            {/* Top Bar - Compact Header */}
            <header className="fixed top-0 left-0 right-0 h-14 bg-[#050505]/80 backdrop-blur-xl z-[60] border-b border-white/5 flex items-center justify-between px-6">
                <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
                        <Wallet size={14} strokeWidth={3} />
                    </div>
                    <span className="font-black text-xs uppercase tracking-[0.2em] text-foreground">ZenWallet</span>
                </div>

                <button
                    onClick={() => navigate('/profile')}
                    className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden active:scale-90 transition-transform"
                >
                    <div className="text-[10px] font-black text-primary">{user?.full_name?.charAt(0).toUpperCase() || 'U'}</div>
                </button>
            </header>

            {/* Main Content */}
            <main className="flex-1 pt-20 pb-28 px-5">
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {children}
                </div>
            </main>

            {/* Bottom Nav Bar - Fixed Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 h-[72px] bg-[#0a0a0a]/90 backdrop-blur-2xl z-[50] border-t border-white/5 flex items-center justify-around px-2 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <button
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            className="relative flex flex-col items-center justify-center gap-1.5 w-16 group"
                        >
                            <div className={`transition-all duration-300 ${isActive ? 'text-primary scale-110' : 'text-zinc-500'}`}>
                                {item.icon}
                            </div>
                            <span className={`text-[9px] font-black uppercase tracking-widest ${isActive ? 'text-primary' : 'text-zinc-500'}`}>
                                {item.label}
                            </span>
                            {isActive && (
                                <motion.div
                                    layoutId="bottomNavIndicator"
                                    className="absolute -top-3 w-8 h-[2px] bg-primary rounded-full shadow-[0_0_10px_rgba(51,150,255,0.5)]"
                                />
                            )}
                        </button>
                    );
                })}
            </nav>
        </div>
    );
}
