import React, { useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useWalletStats } from '@/hooks/useWalletStats';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';
import {
    DollarSign,
    Repeat2,
    TrendingUp,
    Activity,
    Plus,
    QrCode,
    Shield,
    Wallet,
    Send as SendIcon,
    Fingerprint,
    ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { useAuth } from '@/AuthContext';
import { useTheme } from '@/ThemeContext';
import AppLayout from '@/components/layout/AppLayout';

interface MetricCardProps {
    title: string;
    value: number;
    unit?: string;
    icon: React.ReactNode;
    description?: string;
    decimals?: number;
}

const RollingDigit = ({ digit, index }: { digit: string; index: number }) => {
    const isNumber = !isNaN(parseInt(digit));
    if (!isNumber) return <span className="w-[0.3em] inline-flex justify-center">{digit}</span>;

    const digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

    return (
        <span className="inline-flex h-[1.1em] w-[0.6em] overflow-hidden leading-none relative">
            <motion.span
                initial={{ y: "-30%" }}
                animate={{ y: `-${parseInt(digit) * 10}%` }}
                transition={{
                    type: "spring",
                    stiffness: 60,
                    damping: 12,
                    mass: 0.5,
                    delay: index * 0.01
                }}
                className="flex flex-col absolute top-0 left-0 w-full"
            >
                {digits.map((d) => (
                    <span key={d} className="h-[1.1em] flex items-center justify-center">
                        {d}
                    </span>
                ))}
            </motion.span>
            <span className="opacity-0 invisible">8</span>
        </span>
    );
};

const AnimatedNumber = ({ value, decimals = 2 }: { value: number; decimals?: number }) => {
    const stringValue = value.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    });

    return (
        <span className="inline-flex items-baseline overflow-hidden">
            {stringValue.split("").map((char, i) => (
                <RollingDigit key={`${stringValue.length - i}-${char}`} digit={char} index={i} />
            ))}
        </span>
    );
};

const MetricCard = ({ title, value, unit = '', icon, description, decimals = 2 }: MetricCardProps) => (
    <div className="p-5 dashboard-card group bg-card/50 border-border/40 hover:border-primary/20 transition-all rounded-xl">
        <div className="flex items-center gap-2.5 mb-3">
            <div className="p-2 rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                {icon}
            </div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</span>
        </div>
        <div>
            <div className="text-[28px] font-bold text-foreground tabular-nums tracking-tight flex items-baseline">
                <span className="text-lg font-medium text-muted-foreground mr-1 opacity-60">{unit}</span>
                <AnimatedNumber value={value} decimals={decimals} />
            </div>
            {description && <p className="text-[10px] text-muted-foreground mt-1.5 font-medium">{description}</p>}
        </div>
    </div>
);

const MoneyFlowChart = React.memo(({ data }: { data: any[] }) => {
    const { theme } = useTheme();
    const chartData = useMemo(() => data || [], [data]);
    const isDark = theme === 'dark';

    return (
        <div className="flex-1 bg-card/30 rounded-[2rem] border border-border/40 overflow-hidden backdrop-blur-sm">
            <div className="px-6 pt-6 pb-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider opacity-60">Flow Analysis</h3>
                <p className="text-lg font-bold text-foreground mt-1">Capital Velocity</p>
            </div>
            <div className="p-6">
                <div style={{ width: '100%', height: '200px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#27272a" : "#e4e4e7"} vertical={false} />
                            <XAxis dataKey="time" stroke={isDark ? "#52525b" : "#a1a1aa"} fontSize={10} tickLine={false} axisLine={false} dy={10} />
                            <YAxis stroke={isDark ? "#52525b" : "#a1a1aa"} fontSize={10} tickLine={false} axisLine={false} dx={-4} />
                            <RechartsTooltip
                                contentStyle={{
                                    backgroundColor: isDark ? '#18181b' : '#ffffff',
                                    borderColor: isDark ? '#27272a' : '#e4e4e7',
                                    borderRadius: '16px',
                                    fontSize: '11px',
                                    fontWeight: 'bold',
                                    color: isDark ? '#fff' : '#000',
                                    padding: '12px',
                                    borderWidth: '1px',
                                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
                                }}
                            />
                            <Line type="monotone" dataKey="moneyIn" stroke="#10b981" strokeWidth={3} dot={false} name="Incoming" />
                            <Line type="monotone" dataKey="moneyOut" stroke="#ef4444" strokeWidth={3} dot={false} name="Outgoing" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
});

const TransactionQualityChart = React.memo(({ data }: { data: any[] }) => {
    const { theme } = useTheme();
    const chartData = useMemo(() => data || [], [data]);
    const isDark = theme === 'dark';

    return (
        <div className="flex-1 bg-card/30 rounded-[2rem] border border-border/40 overflow-hidden backdrop-blur-sm">
            <div className="px-6 pt-6 pb-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider opacity-60">Transaction Volume</h3>
                <p className="text-lg font-bold text-foreground mt-1">Activity Intensity</p>
            </div>
            <div className="p-6">
                <div style={{ width: '100%', height: '200px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#27272a" : "#e4e4e7"} vertical={false} />
                            <XAxis dataKey="time" stroke={isDark ? "#52525b" : "#a1a1aa"} fontSize={10} tickLine={false} axisLine={false} dy={10} />
                            <YAxis stroke={isDark ? "#52525b" : "#a1a1aa"} fontSize={10} tickLine={false} axisLine={false} dx={-4} />
                            <RechartsTooltip
                                contentStyle={{
                                    backgroundColor: isDark ? '#18181b' : '#ffffff',
                                    borderColor: isDark ? '#27272a' : '#e4e4e7',
                                    borderRadius: '16px',
                                    fontSize: '11px',
                                    fontWeight: 'bold',
                                    color: isDark ? '#fff' : '#000',
                                    padding: '12px',
                                    borderWidth: '1px',
                                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
                                }}
                            />
                            <Line type="step" dataKey="avgValue" stroke="#8b5cf6" strokeWidth={3} dot={false} name="Avg Value" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
});

import PageLoader from '@/components/ui/page-loader';

export default function Dashboard() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { totalRevenue, salesCount, averageSale, moneyFlowData, transactionQualityData, latestPayments, loading } = useWalletStats();

    if (loading) {
        return (
            <AppLayout title="Overview" subtitle="Connecting to Financial Nodes...">
                <PageLoader />
            </AppLayout>
        );
    }

    return (
        <AppLayout title="Overview" subtitle={`Welcome back, ${user?.full_name?.split(' ')[0] || 'User'}`}>
            {/* Desktop View (Unchanged) */}
            <div className="desktop-only flex-col space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-700">
                {/* PIN Setup Alert */}
                {user && !user.hasPaymentPin && (
                    <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-[2rem] flex flex-col lg:flex-row items-center justify-between gap-6 shadow-2xl shadow-emerald-500/5">
                        <div className="flex items-center gap-5">
                            <div className="w-14 h-14 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-500 shrink-0">
                                <Fingerprint size={28} />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-sm font-black uppercase tracking-tight">Financial Security Required</h3>
                                <p className="text-xs text-zinc-500 font-medium italic">You must establish a Payment PIN to authorize transfers, withdrawals, and merchant payments.</p>
                            </div>
                        </div>
                        <Link
                            to="/setup-pin"
                            className="px-10 h-12 bg-emerald-500 hover:bg-emerald-400 text-black font-black rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xl shadow-emerald-500/10 uppercase tracking-tight text-sm"
                        >
                            Setup PIN Now <ArrowRight size={16} />
                        </Link>
                    </div>
                )}

                {/* Metrics */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <MetricCard title="Settlement Balance" value={totalRevenue || 0} unit="₹" icon={<DollarSign size={16} />} description="Liquid in ZenWallet" />
                    <MetricCard title="Total Transactions" value={salesCount || 0} decimals={0} icon={<Repeat2 size={16} />} description="Lifetime activity" />
                    <MetricCard title="Avg Transaction" value={averageSale || 0} unit="₹" icon={<TrendingUp size={16} />} description="Per transaction avg" />
                    <div className="p-5 bg-card/50 border-border/40 rounded-xl group hover:border-emerald-500/20 transition-all">
                        <div className="flex items-center gap-2.5 mb-3">
                            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                                <Activity size={16} />
                            </div>
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">System Status</span>
                        </div>
                        <div className="flex items-center gap-2.5 text-[28px] font-bold text-foreground tracking-tight">
                            Operational
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1.5 font-medium">Linked & Verified</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="p-6 bg-card/30 border border-border/40 rounded-[2rem] relative group cursor-pointer hover:bg-card/50 transition-all" onClick={() => navigate('/profile')}>
                        <h3 className="text-foreground text-lg font-bold flex items-center gap-3 mb-2">
                            <Shield className="text-primary" size={20} />
                            Security & Profile
                        </h3>
                        <p className="text-muted-foreground text-sm font-medium leading-relaxed opacity-80">Configure security settings and biometric methods.</p>
                        <div className="mt-6 flex items-center gap-2 text-xs text-primary font-bold uppercase tracking-wider group-hover:translate-x-2 transition-transform">
                            Manage Security <Plus size={12} />
                        </div>
                    </div>

                    <div className="p-6 bg-card/30 border border-border/40 rounded-[2rem] relative group cursor-pointer hover:bg-card/50 transition-all" onClick={() => navigate('/wallet')}>
                        <h3 className="text-foreground text-lg font-bold flex items-center gap-3 mb-2">
                            <Wallet className="text-primary" size={20} />
                            Wallet & Assets
                        </h3>
                        <p className="text-muted-foreground text-sm font-medium leading-relaxed opacity-80">Real-time ledger access with instant transfers.</p>
                        <div className="mt-6 flex items-center gap-2 text-xs text-primary font-bold uppercase tracking-wider group-hover:translate-x-2 transition-transform">
                            Manage Wallet <Plus size={12} />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <MoneyFlowChart data={moneyFlowData} />
                    <TransactionQualityChart data={transactionQualityData} />
                </div>

                <div className="pt-6">
                    <div className="flex items-center justify-between mb-4 px-1">
                        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-60">Recent Transactions</h3>
                    </div>

                    <div className="bg-card/30 border border-border/40 rounded-[2.5rem] overflow-hidden backdrop-blur-sm">
                        <div className="divide-y divide-border/20">
                            {!latestPayments || latestPayments.length === 0 ? (
                                <div className="py-20 text-center text-muted-foreground font-bold text-xs uppercase tracking-widest opacity-30">No transmissions detected</div>
                            ) : (
                                <>
                                    {latestPayments.slice(0, 8).map((p) => (
                                        <div key={p.id} className="group flex items-center justify-between py-6 hover:bg-primary/5 px-8 transition-all">
                                            <div className="flex items-center gap-5">
                                                <div className="h-11 w-11 bg-muted border border-border/40 rounded-2xl flex items-center justify-center text-muted-foreground font-black text-xs shadow-sm group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                                    {p.product.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-foreground tracking-tight">{p.product}</p>
                                                    <p className="text-xs text-muted-foreground font-mono mt-0.5 opacity-70">ID: {p.id.slice(0, 16).toUpperCase()}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-foreground tabular-nums tracking-tight">₹{p.amount.toLocaleString()}</p>
                                                <p className="text-xs text-muted-foreground mt-0.5 font-medium opacity-60 uppercase">{p.time}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {latestPayments.length > 5 && (
                                        <button
                                            onClick={() => navigate('/transactions')}
                                            className="w-full py-5 text-xs font-bold text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all flex items-center justify-center border-t border-border/20 uppercase tracking-widest opacity-60"
                                        >
                                            View All Transactions
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Desktop Float Actions */}
                <div className="fixed bottom-8 right-8 flex flex-col gap-3 z-50">
                    <button
                        onClick={() => navigate('/send')}
                        className="h-16 w-16 bg-primary text-primary-foreground rounded-[2rem] flex items-center justify-center shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all group relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
                        <SendIcon size={26} className="relative z-10 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform stroke-[2.5px]" />
                    </button>
                    <button
                        onClick={() => navigate('/receive')}
                        className="h-16 w-16 bg-card/80 backdrop-blur-xl text-foreground rounded-[2rem] border border-white/10 flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all group"
                    >
                        <QrCode size={26} className="text-primary group-hover:rotate-12 transition-transform stroke-[2.5px]" />
                    </button>
                </div>
            </div>

            {/* Mobile View (Completely Redesigned) */}
            <div className="mobile-only flex-col space-y-6 pb-20">
                {/* 1. Header (Already in MobileLayout) */}

                {/* 2. Hero Section - Primary Balance Card */}
                <div className="relative group">
                    <div className="absolute inset-0 bg-primary/20 blur-[50px] rounded-full opacity-30 pointer-events-none" />
                    <div className="relative overflow-hidden bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border border-white/10 rounded-[2rem] p-8 shadow-2xl">
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">Available Balance</span>
                            <div className="flex items-baseline gap-1 text-[#f5f7f8]">
                                <span className="text-2xl font-bold opacity-40">₹</span>
                                <div className="text-5xl font-black tracking-tighter">
                                    <AnimatedNumber value={totalRevenue || 0} decimals={2} />
                                </div>
                            </div>
                            <span className="text-[10px] font-bold text-primary uppercase tracking-widest mt-2">Liquid in ZenWallet</span>
                        </div>
                        <div className="absolute -bottom-8 -right-8 opacity-[0.03] scale-150 rotate-12">
                            <Wallet size={120} />
                        </div>
                    </div>
                </div>

                {/* 3. Quick Actions Section */}
                <div className="grid grid-cols-2 gap-4">
                    <button
                        onClick={() => navigate('/send')}
                        className="h-16 bg-primary text-primary-foreground rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-lg shadow-primary/20"
                    >
                        <SendIcon size={18} strokeWidth={3} />
                        Send
                    </button>
                    <button
                        onClick={() => navigate('/scan')}
                        className="h-16 bg-white/5 border border-white/10 text-foreground rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 active:scale-95 transition-transform"
                    >
                        <QrCode size={18} strokeWidth={3} className="text-primary" />
                        Scan
                    </button>
                </div>

                {/* PIN Alert for Mobile */}
                {user && !user.hasPaymentPin && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-4"
                    >
                        <div className="size-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-500 shrink-0">
                            <Fingerprint size={24} />
                        </div>
                        <div className="flex-1">
                            <h4 className="text-[10px] font-black uppercase tracking-tight text-emerald-500">Security Warning</h4>
                            <p className="text-[11px] font-medium text-zinc-400 leading-tight mt-0.5">Setup Payment PIN to enable transfers.</p>
                        </div>
                        <Link to="/setup-pin" className="p-2 text-emerald-500">
                            <ArrowRight size={20} />
                        </Link>
                    </motion.div>
                )}

                {/* 4. Stats Section (Vertical Stack) */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">Insights</span>
                    </div>

                    <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-5 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="size-10 rounded-xl bg-violet-500/10 text-violet-500 flex items-center justify-center">
                                <Repeat2 size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Total Volume</p>
                                <p className="text-base font-bold text-[#f5f7f8]">{salesCount || 0}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-tighter">Lifetime Activity</p>
                        </div>
                    </div>

                    <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-5 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="size-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                                <TrendingUp size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Efficiency</p>
                                <p className="text-base font-bold text-[#f5f7f8]">₹{(averageSale || 0).toLocaleString()}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-tighter">Average Per Move</p>
                        </div>
                    </div>

                    {/* Recent Stream for Mobile */}
                    <div className="pt-2">
                        <div className="flex items-center justify-between px-2 mb-4">
                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">Recent Stream</span>
                            <button onClick={() => navigate('/transactions')} className="text-[9px] font-black text-primary uppercase tracking-widest">View All</button>
                        </div>
                        <div className="space-y-3">
                            {latestPayments?.slice(0, 4).map((p) => (
                                <div key={p.id} className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-between active:bg-white/[0.05] transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="size-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 font-bold text-xs">
                                            {p.product.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-foreground">{p.product}</p>
                                            <p className="text-[9px] text-zinc-600 font-medium uppercase mt-0.5">{p.time}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-black text-foreground">₹{p.amount.toLocaleString()}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
