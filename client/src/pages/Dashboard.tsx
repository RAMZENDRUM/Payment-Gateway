import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
    Send as SendIcon
} from 'lucide-react';
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
    <div className="p-6 dashboard-card group bg-card/50 border-border/40 hover:border-primary/20 transition-all rounded-[2rem]">
        <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                {icon}
            </div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</span>
        </div>
        <div>
            <div className="text-3xl font-bold text-foreground tabular-nums tracking-tight flex items-baseline">
                <span className="text-xl font-medium text-muted-foreground mr-1.5 opacity-60">{unit}</span>
                <AnimatedNumber value={value} decimals={decimals} />
            </div>
            {description && <p className="text-xs text-muted-foreground mt-2 font-medium">{description}</p>}
        </div>
    </div>
);

const MoneyFlowChart = React.memo(({ data }: { data: any[] }) => {
    const { theme } = useTheme();
    const chartData = useMemo(() => data || [], [data]);
    const isDark = theme === 'dark';

    return (
        <div className="flex-1 bg-card/30 rounded-[2rem] border border-border/40 overflow-hidden backdrop-blur-sm">
            <div className="px-8 pt-8 pb-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider opacity-60">Flow Analysis</h3>
                <p className="text-lg font-bold text-foreground mt-1">Capital Velocity</p>
            </div>
            <div className="p-8">
                <div style={{ width: '100%', height: '260px' }}>
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
            <div className="px-8 pt-8 pb-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider opacity-60">Transaction Volume</h3>
                <p className="text-lg font-bold text-foreground mt-1">Activity Intensity</p>
            </div>
            <div className="p-8">
                <div style={{ width: '100%', height: '260px' }}>
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

export default function Dashboard() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { totalRevenue, salesCount, averageSale, moneyFlowData, transactionQualityData, latestPayments } = useWalletStats();

    return (
        <AppLayout title="Overview" subtitle={`Welcome back, ${user?.full_name?.split(' ')[0] || 'User'}`}>
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-700">
                {/* Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <MetricCard title="Settlement Balance" value={totalRevenue || 0} unit="₹" icon={<DollarSign size={16} />} description="Liquid in ZenWallet" />
                    <MetricCard title="Total Transactions" value={salesCount || 0} decimals={0} icon={<Repeat2 size={16} />} description="Lifetime activity" />
                    <MetricCard title="Avg Transaction" value={averageSale || 0} unit="₹" icon={<TrendingUp size={16} />} description="Per transaction avg" />
                    <div className="p-6 bg-card/50 border-border/40 rounded-[2rem] group hover:border-emerald-500/20 transition-all">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                                <Activity size={16} />
                            </div>
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">System Status</span>
                        </div>
                        <div className="flex items-center gap-2.5 text-3xl font-bold text-foreground tracking-tight">
                            Operational
                        </div>
                        <p className="text-xs text-muted-foreground mt-2 font-medium">Linked & Verified</p>
                    </div>
                </div>

                {/* Profile Link Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-8 bg-card/30 border border-border/40 rounded-[2.5rem] relative group cursor-pointer hover:bg-card/50 transition-all" onClick={() => navigate('/profile')}>
                        <h3 className="text-foreground text-lg font-bold flex items-center gap-3 mb-2">
                            <Shield className="text-primary" size={20} />
                            Security & Profile
                        </h3>
                        <p className="text-muted-foreground text-sm font-medium leading-relaxed opacity-80">Configure security settings and biometric methods.</p>
                        <div className="mt-6 flex items-center gap-2 text-xs text-primary font-bold uppercase tracking-wider group-hover:translate-x-2 transition-transform">
                            Manage Security <Plus size={12} />
                        </div>
                    </div>

                    <div className="p-8 bg-card/30 border border-border/40 rounded-[2.5rem] relative group cursor-pointer hover:bg-card/50 transition-all" onClick={() => navigate('/wallet')}>
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

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <MoneyFlowChart data={moneyFlowData} />
                    <TransactionQualityChart data={transactionQualityData} />
                </div>

                {/* Table */}
                <div className="pt-8">
                    <div className="flex items-center justify-between mb-6 px-1">
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
            </div>

            {/* Float Actions */}
            {/* Float Actions */}
            <div className="fixed bottom-12 right-12 flex flex-col gap-4 z-50">
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
        </AppLayout>
    );
}
