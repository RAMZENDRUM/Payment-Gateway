import React from 'react';
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
    Zap
} from 'lucide-react';
import { useAuth } from '@/AuthContext';
import { useTheme } from '@/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';

interface NavItemProps {
    icon: React.ReactNode;
    label: string;
    path: string;
    isActive: boolean;
    onClick: () => void;
}

const NavItem = ({ icon, label, path, isActive, onClick }: NavItemProps) => (
    <button
        onClick={onClick}
        className={`
            w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all
            ${isActive
                ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/10'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
            }
        `}
    >
        {icon}
        <span>{label}</span>
    </button>
);

interface AppLayoutProps {
    children: React.ReactNode;
    title?: string;
    subtitle?: string;
}

export default function AppLayout({ children, title, subtitle }: AppLayoutProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const { logout, user } = useAuth();
    const { isTransitioning, theme } = useTheme();

    const navItems = [
        { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/dashboard' },
        { icon: <QrCode size={20} />, label: 'Scan to Pay', path: '/scan' },
        { icon: <ArrowUpDown size={20} />, label: 'History', path: '/transactions' },
        { icon: <Wallet size={20} />, label: 'Wallet', path: '/wallet' },
        { icon: <UserIcon size={20} />, label: 'Profile', path: '/profile' },
        { icon: <Code size={20} />, label: 'APIs', path: '/developers' },
        { icon: <Settings size={20} />, label: 'Settings', path: '/settings' },
    ];

    return (
        <div className="flex h-screen w-screen bg-background text-foreground overflow-hidden font-sans transition-colors duration-500">
            {/* Background flares */}
            <div className="fixed top-[-10%] right-[-5%] w-[40%] h-[50%] bg-violet-600/[0.03] blur-[150px] rounded-full pointer-events-none z-0" />
            <div className="fixed bottom-[-10%] left-[-5%] w-[30%] h-[40%] bg-purple-600/[0.02] blur-[120px] rounded-full pointer-events-none z-0" />

            {/* Digital Shutter Transition */}
            <AnimatePresence>
                {isTransitioning && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[9999] flex flex-col pointer-events-none"
                    >
                        {/* Upper Shutter */}
                        <motion.div
                            initial={{ y: '-100%' }}
                            animate={{ y: '0%' }}
                            exit={{ y: '-100%' }}
                            transition={{ duration: 0.4, ease: "circIn" }}
                            className="h-1/2 w-full bg-foreground flex items-end justify-center pb-8"
                        >
                            <motion.div
                                animate={{ opacity: [0, 1, 0] }}
                                transition={{ duration: 0.8, repeat: Infinity }}
                                className="h-[2px] w-48 bg-background/20 rounded-full"
                            />
                        </motion.div>

                        {/* Shutter Mid-line Flash */}
                        <motion.div
                            initial={{ scaleX: 0, opacity: 0 }}
                            animate={{ scaleX: 1, opacity: 1 }}
                            exit={{ scaleX: 0, opacity: 0 }}
                            transition={{ duration: 0.2, delay: 0.3 }}
                            className="h-[1px] w-full bg-primary shadow-[0_0_20px_rgba(139,92,246,0.5)] z-10"
                        />

                        {/* Lower Shutter */}
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: '0%' }}
                            exit={{ y: '100%' }}
                            transition={{ duration: 0.4, ease: "circIn" }}
                            className="h-1/2 w-full bg-foreground flex items-start justify-center pt-8"
                        >
                            <div className="flex items-center gap-2 text-background/40 font-black text-[10px] uppercase tracking-[0.5em]">
                                <Zap size={12} className="fill-current" />
                                Frequency Shift
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Left Sidebar */}
            <aside className="w-56 flex-shrink-0 bg-transparent flex flex-col z-20 transition-all border-r border-border/10">
                <div className="px-5 py-6">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-foreground text-background rounded-xl flex items-center justify-center shadow-2xl transition-all">
                            <Wallet size={16} strokeWidth={2.5} />
                        </div>
                        <h2 className="text-base font-bold text-foreground tracking-tight">ZenWallet</h2>
                    </div>
                </div>

                <nav className="flex-1 px-3 space-y-1 mt-3">
                    {navItems.map((item) => (
                        <button
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            className={`
                                w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-[13px] font-medium transition-all
                                ${location.pathname === item.path
                                    ? 'bg-primary/10 text-primary shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                                }
                            `}
                        >
                            <span>{item.icon}</span>
                            <span>{item.label}</span>
                        </button>
                    ))}
                </nav>

                <div className="p-6">
                    <div onClick={() => navigate('/profile')} className="p-4 rounded-2xl flex items-center gap-3 hover:bg-muted/30 transition-colors cursor-pointer group">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center border border-border/10 text-muted-foreground group-hover:text-foreground">
                            {user?.full_name?.charAt(0).toUpperCase() || 'A'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground group-hover:text-primary truncate">{user?.full_name?.split(' ')[0] || 'Admin'}</p>
                            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-tight">Secure Node</p>
                        </div>
                    </div>
                    <button onClick={logout} className="w-full flex items-center gap-3 mt-4 px-4 py-3 text-muted-foreground hover:text-destructive rounded-2xl text-xs font-medium transition-all">
                        <LogOut size={14} />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-auto bg-transparent flex flex-col relative custom-scrollbar z-10">
                {title && (
                    <header className="px-5 pt-4 pb-3 sticky top-0 bg-background/60 backdrop-blur-md z-20 transition-all border-b border-border/50">
                        <div className="flex flex-col gap-0.5">
                            <h2 className="text-xl font-bold text-foreground tracking-tight uppercase">{title}</h2>
                            {subtitle && <p className="text-sm font-medium text-muted-foreground mt-1 italic">{subtitle}</p>}
                        </div>
                    </header>
                )}
                <div className="flex-1 px-4 md:px-8 py-6 h-full">
                    <div className="w-full h-full animate-in fade-in duration-500">

                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}
