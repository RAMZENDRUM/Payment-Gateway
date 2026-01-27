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
    User as UserIcon
} from 'lucide-react';
import { useAuth } from '@/AuthContext';

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
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/10'
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
        <div className="flex h-screen w-screen bg-[#08090b] overflow-hidden font-sans selection:bg-blue-500/30 selection:text-white">
            {/* Background flares for global depth */}
            <div className="fixed top-[-10%] right-[-5%] w-[40%] h-[50%] bg-blue-600/[0.03] blur-[150px] rounded-full pointer-events-none z-0" />
            <div className="fixed bottom-[-10%] left-[-5%] w-[30%] h-[40%] bg-indigo-600/[0.02] blur-[120px] rounded-full pointer-events-none z-0" />

            {/* Left Sidebar */}
            <aside className="w-64 flex-shrink-0 bg-transparent flex flex-col z-20 transition-all">
                {/* Logo/Brand */}
                <div className="px-8 py-10">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-white text-black rounded-xl flex items-center justify-center shadow-2xl">
                            <Wallet size={16} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-white tracking-tight">ZenWallet</h2>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 space-y-1 mt-4">
                    <div className="px-4 mb-6">
                        <span className="text-[11px] font-medium text-zinc-600 tracking-widest">Navigation</span>
                    </div>
                    {navItems.map((item) => (
                        <button
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            className={`
                                w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[14px] font-medium transition-all
                                ${location.pathname === item.path
                                    ? 'bg-blue-600/10 text-blue-500 shadow-sm'
                                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.02]'
                                }
                            `}
                        >
                            <span>{item.icon}</span>
                            <span>{item.label}</span>
                        </button>
                    ))}
                </nav>

                {/* User Section */}
                <div className="p-6">
                    <div
                        onClick={() => navigate('/profile')}
                        className="p-4 rounded-2xl flex items-center gap-3 hover:bg-white/[0.02] transition-colors cursor-pointer group"
                    >
                        <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center border border-white/5 text-zinc-400 group-hover:text-white transition-colors">
                            {user?.full_name?.charAt(0).toUpperCase() || 'A'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-zinc-400 group-hover:text-white truncate transition-colors">{user?.full_name?.split(' ')[0] || 'Administrator'}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <div className="h-1 w-1 bg-emerald-500 rounded-full" />
                                <p className="text-[10px] font-medium text-zinc-600">Secure Node Connected</p>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={logout}
                        className="w-full flex items-center gap-3 mt-4 px-4 py-3 text-zinc-600 hover:text-red-400 rounded-2xl text-xs font-medium transition-all"
                    >
                        <LogOut size={14} />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-auto bg-transparent flex flex-col relative custom-scrollbar z-10">
                {title && (
                    <header className="px-10 pt-6 pb-4 sticky top-0 bg-[#08090b]/60 backdrop-blur-xl z-20">
                        <div className="flex flex-col gap-0.5">
                            <h2 className="text-2xl font-bold text-white tracking-tight">{title}</h2>
                            {subtitle && <p className="text-sm font-medium text-zinc-500 mt-1">{subtitle}</p>}
                        </div>
                    </header>
                )}

                <div className="flex-1 px-10 py-2">
                    <div className="max-w-7xl">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}
