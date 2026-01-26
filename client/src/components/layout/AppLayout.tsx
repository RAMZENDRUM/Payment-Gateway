import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    ArrowUpDown,
    Wallet,
    Settings,
    LogOut,
    Code
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
            w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all
            ${isActive
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }
        `}
    >
        {icon}
        <span>{label}</span>
    </button>
);

interface AppLayoutProps {
    children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const { logout, user } = useAuth();

    const navItems = [
        { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/dashboard' },
        { icon: <ArrowUpDown size={20} />, label: 'Transactions', path: '/transactions' },
        { icon: <Wallet size={20} />, label: 'Wallet', path: '/wallet' },
        { icon: <Code size={20} />, label: 'Developers', path: '/developers' },
        { icon: <Settings size={20} />, label: 'Settings', path: '/settings' },
    ];

    return (
        <div className="flex h-screen w-screen bg-black overflow-hidden">
            {/* Left Sidebar */}
            <aside className="w-64 flex-shrink-0 bg-black border-r border-zinc-900 flex flex-col">
                {/* Logo/Brand */}
                <div className="px-6 py-8 border-b border-zinc-900">
                    <h1 className="text-2xl font-bold text-white tracking-tight">ZenWallet</h1>
                    <p className="text-xs text-zinc-600 mt-1">Payment Gateway</p>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 py-6 space-y-2">
                    {navItems.map((item) => (
                        <NavItem
                            key={item.path}
                            icon={item.icon}
                            label={item.label}
                            path={item.path}
                            isActive={location.pathname === item.path}
                            onClick={() => navigate(item.path)}
                        />
                    ))}
                </nav>

                {/* User Section */}
                <div className="px-4 py-6 border-t border-zinc-900">
                    <div className="px-3 py-3 mb-3 bg-zinc-950 rounded-xl border border-zinc-900">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                                {user?.full_name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-white truncate">{user?.full_name || 'User'}</p>
                                <p className="text-xs text-zinc-600 truncate">ID: {user?.id?.slice(0, 8) || '---'}</p>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-lg text-sm font-medium transition-colors"
                    >
                        <LogOut size={16} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-auto bg-black">
                {children}
            </main>
        </div>
    );
}
